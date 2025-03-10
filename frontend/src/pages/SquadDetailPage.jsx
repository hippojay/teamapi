import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Database, GitBranch, Bell, ChevronRight, Globe, Server, Smartphone, Code, Plus, Edit, Trash2, X } from 'lucide-react';
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import TeamTypeEditor from '../components/TeamTypeEditor';
import TeamTypeLabel from '../components/TeamTypeLabel';
import DescriptionEditor from '../components/DescriptionEditor';
import ServiceEditor from '../components/ServiceEditor';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const SquadDetailPage = () => {
  const { id } = useParams();
  const [squad, setSquad] = useState(null);
  const [services, setServices] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [onCall, setOnCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tribe, setTribe] = useState(null);
  const [area, setArea] = useState(null);

  const [updatingTeamType, setUpdatingTeamType] = useState(false);
  const [editingTeamType, setEditingTeamType] = useState(false);

  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const [editingService, setEditingService] = useState(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [filteredServices, setFilteredServices] = useState([]);
  // Initialize filters from sessionStorage or default to empty
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem('squadDetailServiceSearchTerm') || '';
  });
  const [serviceTypeFilter, setServiceTypeFilter] = useState(() => {
    return sessionStorage.getItem('squadDetailServiceTypeFilter') || '';
  });
  
  // Helper function to get color based on capacity
  const getCapacityColor = (capacity) => {
    if (darkMode) {
      if (capacity > 1.0) {
        return "text-red-400"; // Over capacity (red)
      } else if (capacity >= 0.8) {
        return "text-green-400"; // Good capacity (green)
      } else if (capacity >= 0.5) {
        return "text-yellow-400"; // Medium capacity (yellow/amber)
      } else {
        return "text-gray-400"; // Low capacity (default gray)
      }
    } else {
      if (capacity > 1.0) {
        return "text-red-600"; // Over capacity (red)
      } else if (capacity >= 0.8) {
        return "text-green-600"; // Good capacity (green)
      } else if (capacity >= 0.5) {
        return "text-yellow-600"; // Medium capacity (yellow/amber)
      } else {
        return "text-gray-600"; // Low capacity (default gray)
      }
    }
  };



  // Filter services based on search term and service type
  useEffect(() => {
    if (services.length > 0) {
      let result = [...services];
      
      // Apply service type filter
      if (serviceTypeFilter) {
        result = result.filter(service => 
          service.service_type && service.service_type.toUpperCase() === serviceTypeFilter.toUpperCase()
        );
      }
      
      // Apply search filter (minimum 3 characters)
      if (searchTerm && searchTerm.length >= 3) {
        result = result.filter(service => 
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setFilteredServices(result);
    } else {
      setFilteredServices([]);
    }
  }, [services, searchTerm, serviceTypeFilter]);
  
  // Save filter values to sessionStorage when they change
  useEffect(() => {
    sessionStorage.setItem('squadDetailServiceSearchTerm', searchTerm);
  }, [searchTerm]);
  
  useEffect(() => {
    sessionStorage.setItem('squadDetailServiceTypeFilter', serviceTypeFilter);
  }, [serviceTypeFilter]);
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setServiceTypeFilter('');
    sessionStorage.removeItem('squadDetailServiceSearchTerm');
    sessionStorage.removeItem('squadDetailServiceTypeFilter');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch squad details
        const squadData = await api.getSquad(id);
        setSquad(squadData);
        
        // Fetch tribe and area info for breadcrumbs
        const tribeData = await api.getTribe(squadData.tribe_id);
        setTribe(tribeData);
        
        const areaData = await api.getArea(tribeData.area_id);
        setArea(areaData);
        
        // Fetch services
        const servicesData = await api.getServices(id);
        setServices(servicesData);
        
        // Fetch dependencies
        const dependenciesData = await api.getDependencies(id);
        setDependencies(dependenciesData);
        
        // Fetch on-call roster
        const onCallData = await api.getOnCall(id);
        setOnCall(onCallData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching squad data:', err);
        setError('Failed to load squad data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Handle loading state
  if (loading) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  // Handle not found
  if (!squad) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Squad not found</div>;
  }

  const getServiceIcon = (serviceType) => {
    const type = serviceType && serviceType.toUpperCase();
    switch (type) {
      case 'API':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'REPO':
      case 'REPOSITORY':
        return <GitBranch className="h-4 w-4 text-purple-500" />;
      case 'PLATFORM':
        return <Server className="h-4 w-4 text-green-500" />;
      case 'WEBPAGE':
        return <Globe className="h-4 w-4 text-orange-500" />;
      case 'APP_MODULE':
        return <Smartphone className="h-4 w-4 text-red-500" />;
      default:
        return <Database className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-green-900 text-green-200 border border-green-700 font-medium' : 'bg-green-100 text-green-800'} rounded-full text-xs`}>Healthy</span>;
      case 'degraded':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-yellow-900 text-yellow-200 border border-yellow-700 font-medium' : 'bg-yellow-100 text-yellow-800'} rounded-full text-xs`}>Degraded</span>;
      case 'down':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-red-900 text-red-200 border border-red-700 font-medium' : 'bg-red-100 text-red-800'} rounded-full text-xs`}>Down</span>;
      default:
        return <span className={`px-2 py-1 ${darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700 font-medium' : 'bg-gray-100 text-gray-800'} rounded-full text-xs`}>{status}</span>;
    }
  };

  const getDependencyBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'required':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-dark-blue-highlight text-dark-blue' : 'bg-blue-100 text-blue-800'} rounded-full text-xs`}>Required</span>;
      case 'optional':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} rounded-full text-xs`}>Optional</span>;
      default:
        return <span className={`px-2 py-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} rounded-full text-xs`}>{type}</span>;
    }
  };

  const handleServiceSave = async (savedService) => {
    // Refresh the services list from server
    const servicesData = await api.getServices(id);
    setServices(servicesData);
    
    // Close editor
    setEditingService(null);
    setIsAddingService(false);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setIsAddingService(false);
  };

  // Handler for updating team type
  const handleTeamTypeUpdate = async (newTeamType) => {
    setUpdatingTeamType(true);
    try {
      await api.updateSquadTeamType(squad.id, newTeamType);
      // Update the squad in our local state
      setSquad(prev => ({
        ...prev,
        team_type: newTeamType
      }));
      // Show success indicator temporarily
      setTimeout(() => setUpdatingTeamType(false), 1500);
    } catch (err) {
      console.error('Error updating team type:', err);
      alert('Failed to update team type. Please try again.');
      setUpdatingTeamType(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      await api.deleteService(serviceId);
      // Refresh services list
      const servicesData = await api.getServices(id);
      setServices(servicesData);
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service. Please try again.');
    }
  };

  const renderServiceItem = (service) => {
    if (editingService === service.id) {
      return (
        <div key={`editing-${service.id}`} className="mb-4">
          <ServiceEditor 
            service={service}
            onSave={handleServiceSave}
            onCancel={handleCancelEdit}
          />
        </div>
      );
    }
    
    return (
      <div key={service.id} 
          className={`flex items-center justify-between px-3 py-2 border ${darkMode ? 'border-gray-700 bg-gray-900 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} rounded-md transition-colors`}>
        <div className="flex items-center">
          <div className="mr-2">
            {getServiceIcon(service.service_type)}
          </div>
          <div>
            <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{service.name}</span>
            <span className={`ml-2 text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-100 text-gray-600'} rounded-full`}>
              {service.service_type || 'API'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>v{service.version}</span>
          {getStatusBadge(service.status)}
          
          {isAuthenticated && (
            <>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingService(service.id);
                }}
                className={`p-1 ${darkMode ? 'text-gray-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'}`}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteService(service.id);
                }}
                className={`p-1 ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          
          <Link 
            to={`/services/${service.id}`}
            className={`p-1 ${darkMode ? 'text-gray-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div className={`flex items-center text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-6`}>
        <Link to="/" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/areas" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Areas</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        {area && (
          <>
            <Link to={`/areas/${area.id}`} className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>{area.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        {tribe && (
          <>
            <Link to={`/tribes/${tribe.id}`} className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>{tribe.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{squad.name}</span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <div className="flex flex-col mb-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{squad.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  squad.status === 'Active' 
                    ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                    : squad.status === 'Forming'
                      ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                }`}>
                  {squad.status}
                </span>
              </div>
              
              <div className="flex items-center mt-2">
                <TeamTypeLabel 
                  teamType={squad.team_type || "stream_aligned"} 
                  size="md"
                />
                {isAuthenticated && (
                  <button 
                    onClick={() => setEditingTeamType(true)}
                    className={`ml-2 text-xs ${darkMode ? 'text-blue-400 hover:text-blue-300 hover:underline' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {/* Edit Team Type Dialog */}
              {isAuthenticated && editingTeamType && (
                <div className={`mt-3 p-3 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={updatingTeamType ? "opacity-50 pointer-events-none" : ""}>
                    <TeamTypeEditor 
                      teamType={squad.team_type || "stream_aligned"} 
                      onUpdate={(newType) => {
                        handleTeamTypeUpdate(newType);
                        setEditingTeamType(false);
                      }}
                      readOnly={false}
                    />
                  </div>
                  {updatingTeamType ? (
                    <div className={`text-center text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} mt-2`}>
                      Updating team type...
                    </div>
                  ) : (
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={() => setEditingTeamType(false)}
                        className={`px-2 py-1 text-sm ${darkMode ? 'text-gray-400 hover:text-gray-200 border-dark-border' : 'text-gray-600 hover:text-gray-800 border-gray-200'} border rounded`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
                        
            {/* Team Composition Bar */}
            <div className="mb-4">
              <CompactTeamCompositionBar
                core_count={squad.core_count}
                subcon_count={squad.subcon_count}
                core_capacity={squad.core_capacity}
                subcon_capacity={squad.subcon_capacity}
              />
            </div>
            <div className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>
              <DescriptionEditor
                entityType="squad"
                entityId={squad.id}
                initialDescription={squad.description || `The ${squad.name} squad is responsible for developing and maintaining services for the ${tribe ? tribe.name : ''} tribe.`}
                onDescriptionUpdated={(newDescription) => {
                  // Update the local state with the new description
                  setSquad({...squad, description: newDescription});
                }}
              />
            </div>
            <div className="flex space-x-4 mt-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Contact Squad
              </button>
              <button className={`px-4 py-2 border rounded-lg ${darkMode ? 'border-dark-border hover:bg-dark-tertiary text-dark-primary' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                View Documentation
              </button>
            </div>
          </div>

          {/* Services */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-2 flex items-center`}>
            <Database className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            Owned Services
            </h3>
          
          {/* Service filters */}
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="flex-grow">
              <div className={`flex items-center border rounded-md focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
                <input
                  type="text"
                  placeholder="Search services..."
                  className={`w-full px-3 py-2 border-none focus:outline-none ${darkMode ? 'bg-dark-tertiary text-dark-primary placeholder-gray-500' : 'bg-white text-gray-900'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className={`px-2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchTerm && searchTerm.length < 3 && (
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Enter at least 3 characters to search</p>
              )}
            </div>
            <div className="md:w-1/3">
              <select
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                aria-label="Filter by service type"
              >
                <option value="">All Service Types</option>
                <option value="API">API</option>
                <option value="REPO">Repository</option>
                <option value="PLATFORM">Platform</option>
                <option value="WEBPAGE">Web Page</option>
                <option value="APP_MODULE">App Module</option>
              </select>
            </div>
          </div>
          
          {/* Filter status and reset */}
          {(searchTerm || serviceTypeFilter) && (
            <div className={`flex justify-between items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
              <div>
                <span>Showing {filteredServices.length} of {services.length} services</span>
                {serviceTypeFilter && (
                  <span className="ml-2">• Type: <strong>{serviceTypeFilter}</strong></span>
                )}
                {searchTerm && searchTerm.length >= 3 && (
                  <span className="ml-2">• Search: <strong>"{searchTerm}"</strong></span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'} text-sm font-medium`}
              >
                Reset Filters
              </button>
            </div>
          )}
            
            {/* Adding new service form */}
            {isAddingService && (
              <div className="mb-6">
                <ServiceEditor
                  squad={squad}
                  isCreating={true}
                  onSave={handleServiceSave}
                  onCancel={handleCancelEdit}
                />
              </div>
            )}
            
            <div className="space-y-2">
              {loading ? (
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4 animate-pulse`}>Loading services...</div>
              ) : services.length > 0 ? (
                filteredServices.length > 0 ? (
                  filteredServices.map(service => renderServiceItem(service))
                ) : (
                  <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
                    No services found matching your filters
                    {(searchTerm || serviceTypeFilter) && (
                      <div className="mt-2">
                        <button 
                          className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:underline'}`}
                          onClick={resetFilters}
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No services found</div>
              )}
            </div>
            {isAuthenticated && !isAddingService && (
              <div className={`mt-3 pt-3 ${darkMode ? 'border-dark-border' : 'border-gray-200'} border-t text-right`}>
                <button 
                  className={`px-3 py-1.5 ${darkMode ? 'bg-blue-800 text-blue-200 border border-blue-600 hover:bg-blue-900' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} rounded-md flex items-center ml-auto font-medium`}
                  onClick={() => setIsAddingService(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </button>
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
              <Users className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
              Team Members
            </h3>
            {squad.team_members && squad.team_members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {squad.team_members.map(member => (
                  <Link 
                    key={member.id} 
                    to={`/users/${member.id}`}
                    className={`p-3 border rounded-lg flex items-center ${
                      darkMode 
                        ? 'border-dark-border hover:bg-gray-800' 
                        : 'border-gray-200 hover:bg-gray-50'
                    } cursor-pointer`}
                  >
                    <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-full mr-3`}>
                      <Users className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`} />
                    </div>
                    <div className="flex-grow">
                      <div className={`font-medium ${darkMode ? 'text-dark-primary' : ''}`}>{member.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>{member.role}</div>
                      <div className="text-xs mt-1 flex flex-wrap gap-1">
                        <span className={`px-2 py-0.5 rounded-full ${
                          member.employment_type === 'core'
                            ? darkMode ? 'bg-green-900 text-green-300' : 'bg-emerald-100 text-emerald-700'
                            : darkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {member.employment_type === 'core' ? 'Core Employee' : 'Contractor'}
                        </span>
                        {member.employment_type === 'subcon' && member.vendor_name && (
                          <span className={`px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {member.vendor_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${getCapacityColor(member.capacity || 1.0)}`}>
                      {((member.capacity || 1.0) * 100).toFixed(0)}%
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No team members found</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dependencies */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
              <GitBranch className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
              Dependencies
            </h3>
            {dependencies.length > 0 ? (
              <ul className="space-y-3">
                {dependencies.map(dep => (
                  <li key={dep.id} className="flex items-center justify-between">
                    <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>{dep.dependency_name}</span>
                    {getDependencyBadge(dep.dependency_type)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>No dependencies found</div>
            )}
          </div>

          {/* On-Call */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
              <Bell className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
              On-Call
            </h3>
            {onCall ? (
              <div className="space-y-3">
                <div>
                  <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Primary</div>
                  <div className={darkMode ? 'text-dark-primary' : 'text-gray-800'}>{onCall.primary_name}</div>
                  {onCall.primary_contact && (
                    <div className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{onCall.primary_contact}</div>
                  )}
                </div>
                <div>
                  <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Secondary</div>
                  <div className={darkMode ? 'text-dark-primary' : 'text-gray-800'}>{onCall.secondary_name}</div>
                  {onCall.secondary_contact && (
                    <div className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{onCall.secondary_contact}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>No on-call roster found</div>
            )}
          </div>

          {/* Additional Info */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4`}>Squad Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Tribe:</span>
                {tribe && (
                  <Link to={`/tribes/${tribe.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                    {tribe.name}
                  </Link>
                )}
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Area:</span>
                {area && (
                  <Link to={`/areas/${area.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                    {area.name}
                  </Link>
                )}
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Status:</span>
                <span className={darkMode ? 'text-dark-primary' : ''}>{squad.status}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Timezone:</span>
                <span className={darkMode ? 'text-dark-primary' : ''}>{squad.timezone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default SquadDetailPage;
