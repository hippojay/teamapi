import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Database, GitBranch, Bell, Clock, ChevronRight, Globe, Server, Smartphone, Code, Plus, Edit, Trash2 } from 'lucide-react';
import DescriptionEditor from '../components/DescriptionEditor';
import ServiceEditor from '../components/ServiceEditor';
import { useAuth } from '../context/AuthContext';
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
  const [showTeamCompositionModal, setShowTeamCompositionModal] = useState(false);
  const modalRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const [editingService, setEditingService] = useState(null);
  const [isAddingService, setIsAddingService] = useState(false);
  
  // Helper function to get color based on capacity
  const getCapacityColor = (capacity) => {
    if (capacity > 1.0) {
      return "text-red-600"; // Over capacity (red)
    } else if (capacity >= 0.8) {
      return "text-green-600"; // Good capacity (green)
    } else if (capacity >= 0.5) {
      return "text-yellow-600"; // Medium capacity (yellow/amber)
    } else {
      return "text-gray-600"; // Low capacity (default gray)
    }
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
    return <div className="text-center py-10">Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  // Handle not found
  if (!squad) {
    return <div className="text-center py-10">Squad not found</div>;
  }

  const getServiceIcon = (serviceType) => {
    switch (serviceType && serviceType.toLowerCase()) {
      case 'api':
        return <Code className="h-4 w-4 text-blue-600" />;
      case 'repo':
      case 'repository':
        return <GitBranch className="h-4 w-4 text-purple-600" />;
      case 'platform':
        return <Server className="h-4 w-4 text-green-600" />;
      case 'webpage':
        return <Globe className="h-4 w-4 text-orange-600" />;
      case 'app_module':
        return <Smartphone className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Healthy</span>;
      case 'degraded':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Degraded</span>;
      case 'down':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Down</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const getDependencyBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'required':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Required</span>;
      case 'optional':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Optional</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{type}</span>;
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
          className="flex items-center justify-between px-3 py-2 border rounded-md hover:bg-gray-50 transition-colors">
        <div className="flex items-center">
          <div className="mr-2">
            {getServiceIcon(service.service_type)}
          </div>
          <div>
            <span className="font-medium text-gray-800">{service.name}</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
            {(service.service_type || 'API').toLowerCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">v{service.version}</span>
          {getStatusBadge(service.status)}
          
          {isAuthenticated && (
            <>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingService(service.id);
                }}
                className="p-1 text-gray-400 hover:text-blue-500"
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
                className="p-1 text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          
          <Link 
            to={`/services/${service.id}`}
            className="p-1 text-gray-400 hover:text-blue-500"
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
      <div className="flex items-center text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/areas" className="hover:text-blue-500">Areas</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        {area && (
          <>
            <Link to={`/areas/${area.id}`} className="hover:text-blue-500">{area.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        {tribe && (
          <>
            <Link to={`/tribes/${tribe.id}`} className="hover:text-blue-500">{tribe.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        <span className="font-medium text-gray-800">{squad.name}</span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{squad.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${
                squad.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : squad.status === 'Forming'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {squad.status}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 mb-4">
              <Users className="h-5 w-5" />
              <span>{squad.member_count > 0 ? squad.member_count : 'No'} member{squad.member_count !== 1 ? 's' : ''}</span>
              <span className="mx-2">•</span>
              <span className={`font-medium ${getCapacityColor(squad.total_capacity)}`}>
                {squad.total_capacity.toFixed(1)} FTE
              </span>
              <span className="mx-2">•</span>
              <Clock className="h-5 w-5" />
              <span>{squad.timezone}</span>
            </div>
            
            {/* Core vs Subcon stats - Bar Chart */}
            <div className="flex flex-col mb-4 p-3 bg-gray-50 rounded-lg cursor-pointer" onClick={() => setShowTeamCompositionModal(true)}>
              <div className="font-medium text-gray-700 mb-2">Team Composition:</div>
              <div className="h-8 w-full bg-gray-200 rounded-md overflow-hidden flex">
                {/* Core employees (green) */}
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ 
                    width: `${squad.core_capacity > 0 ? (squad.core_capacity / (squad.core_capacity + squad.subcon_capacity) * 100) : 0}%` 
                  }}
                  title={`Core: ${squad.core_count} members (${squad.core_capacity.toFixed(1)} FTE)`}
                ></div>
                {/* Contractors (red) */}
                <div 
                  className="h-full bg-red-500" 
                  style={{ 
                    width: `${squad.subcon_capacity > 0 ? (squad.subcon_capacity / (squad.core_capacity + squad.subcon_capacity) * 100) : 0}%` 
                  }}
                  title={`Contractors: ${squad.subcon_count} members (${squad.subcon_capacity.toFixed(1)} FTE)`}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-600">
                <div>Core ({Math.round(squad.core_capacity > 0 ? (squad.core_capacity / (squad.core_capacity + squad.subcon_capacity) * 100) : 0)}%)</div>
                <div>Click for details</div>
                <div>Contractors ({Math.round(squad.subcon_capacity > 0 ? (squad.subcon_capacity / (squad.core_capacity + squad.subcon_capacity) * 100) : 0)}%)</div>
              </div>
            </div>
            <div className="text-gray-600 mb-4">
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
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Contact Squad
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                View Documentation
              </button>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Owned Services
            </h3>
            
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
              {services.length > 0 ? (
                services.map(service => renderServiceItem(service))
              ) : (
                <div className="text-gray-500 text-center py-4">No services found</div>
              )}
            </div>
            {isAuthenticated && !isAddingService && (
              <div className="mt-3 pt-3 border-t text-right">
                <button 
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 flex items-center ml-auto"
                  onClick={() => setIsAddingService(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </button>
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Members
            </h3>
            {squad.team_members && squad.team_members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {squad.team_members.map(member => (
                  <Link 
                    key={member.id} 
                    to={`/users/${member.id}`}
                    className="p-3 border rounded-lg flex items-center hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Users className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.role}</div>
                      <div className="text-xs mt-1 flex flex-wrap gap-1">
                        <span className={`px-2 py-0.5 rounded-full ${member.employment_type === 'core' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {member.employment_type === 'core' ? 'Core Employee' : 'Contractor'}
                        </span>
                        {member.employment_type === 'subcon' && member.vendor_name && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
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
              <div className="text-gray-500 text-center py-4">No team members found</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dependencies */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <GitBranch className="h-5 w-5 mr-2" />
              Dependencies
            </h3>
            {dependencies.length > 0 ? (
              <ul className="space-y-3">
                {dependencies.map(dep => (
                  <li key={dep.id} className="flex items-center justify-between">
                    <span className="text-gray-600">{dep.dependency_name}</span>
                    {getDependencyBadge(dep.dependency_type)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 text-center">No dependencies found</div>
            )}
          </div>

          {/* On-Call */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              On-Call
            </h3>
            {onCall ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Primary</div>
                  <div className="text-gray-800">{onCall.primary_name}</div>
                  {onCall.primary_contact && (
                    <div className="text-sm text-blue-600">{onCall.primary_contact}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Secondary</div>
                  <div className="text-gray-800">{onCall.secondary_name}</div>
                  {onCall.secondary_contact && (
                    <div className="text-sm text-blue-600">{onCall.secondary_contact}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">No on-call roster found</div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Squad Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tribe:</span>
                {tribe && (
                  <Link to={`/tribes/${tribe.id}`} className="text-blue-600 hover:underline">
                    {tribe.name}
                  </Link>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Area:</span>
                {area && (
                  <Link to={`/areas/${area.id}`} className="text-blue-600 hover:underline">
                    {area.name}
                  </Link>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span>{squad.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timezone:</span>
                <span>{squad.timezone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Composition Modal */}
      {showTeamCompositionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTeamCompositionModal(false)}>
          <div 
            ref={modalRef} 
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Team Composition Details</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={() => setShowTeamCompositionModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h4 className="font-medium text-gray-800 mb-2">Core Employees</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-500">Members:</span>
                    <p className="font-medium text-emerald-600">{squad.core_count}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <p className="font-medium text-emerald-600">{squad.core_capacity.toFixed(1)} FTE</p>
                  </div>
                </div>
              </div>
              
              <div className="border-b pb-3">
                <h4 className="font-medium text-gray-800 mb-2">Contractors</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-500">Members:</span>
                    <p className="font-medium text-amber-600">{squad.subcon_count}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <p className="font-medium text-amber-600">{squad.subcon_capacity.toFixed(1)} FTE</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Totals</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-500">Members:</span>
                    <p className="font-medium text-blue-600">{squad.core_count + squad.subcon_count}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <p className="font-medium text-blue-600">{(squad.core_capacity + squad.subcon_capacity).toFixed(1)} FTE</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Core/Subcon Ratio:</span>
                  <p className="font-medium text-blue-600">
                    {squad.core_count > 0 
                      ? (squad.core_count / (squad.core_count + squad.subcon_count) * 100).toFixed(0) 
                      : 0}% / {squad.subcon_count > 0 
                      ? (squad.subcon_count / (squad.core_count + squad.subcon_count) * 100).toFixed(0) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-right">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => setShowTeamCompositionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SquadDetailPage;
