import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, GitBranch, Globe, Server, Smartphone, Code, Plus, Edit, Trash2, X, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { canEditServices } from '../../utils/authUtils';
import ServiceEditor from '../ServiceEditor';
import api from '../../api';

const ServicesList = ({ squad, services, setServices }) => {
  const { darkMode } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const canEdit = isAuthenticated && canEditServices(user, squad);
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

  // Filter services based on search term and service type
  useEffect(() => {
    if (services.length > 0) {
      let result = [...services];
      
      // Apply service type filter
      if (serviceTypeFilter) {
        result = result.filter(service => 
          service.service_type && service.service_type.toLowerCase() === serviceTypeFilter.toLowerCase()
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

  const handleServiceSave = async (savedService) => {
    // Refresh the services list from server
    const servicesData = await api.getServices(squad.id);
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
      const servicesData = await api.getServices(squad.id);
      setServices(servicesData);
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service. Please try again.');
    }
  };

  const getServiceIcon = (serviceType) => {
    const type = serviceType && serviceType.toLowerCase();
    switch (type) {
      case 'api':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'repo':
      case 'repository':
        return <GitBranch className="h-4 w-4 text-purple-500" />;
      case 'platform':
        return <Server className="h-4 w-4 text-green-500" />;
      case 'webpage':
        return <Globe className="h-4 w-4 text-orange-500" />;
      case 'app_module':
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
          
          {canEdit && (
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
            <option value="api">API</option>
            <option value="repo">Repository</option>
            <option value="platform">Platform</option>
            <option value="webpage">Web Page</option>
            <option value="app_module">App Module</option>
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
        {services.length > 0 ? (
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
      {canEdit && !isAddingService && (
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
  );
};

export default ServicesList;
