import React, { useState } from 'react';
import { X, Check, Code, GitBranch, Server, Globe, Smartphone, Search, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import RepositorySearchModal from './RepositorySearchModal';

const ServiceEditor = ({ 
  service = null, 
  squad = null, 
  onSave, 
  onCancel,
  isCreating = false 
}) => {
  const { darkMode } = useTheme();
  const initialState = service ? {
    name: service.name || '',
    description: service.description || '',
    status: service.status || 'HEALTHY',
    version: service.version || '1.0.0',
    service_type: service.service_type || 'API',
    url: service.url || '',
    uptime: service.uptime || 99.9,
    squad_id: service.squad_id || (squad ? squad.id : null)
  } : {
    name: '',
    description: '',
    status: 'HEALTHY',
    version: '1.0.0',
    service_type: 'API',
    url: '',
    uptime: 99.9,
    squad_id: squad ? squad.id : null
  };

  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showRepositoryModal, setShowRepositoryModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Service name is required');
      return false;
    }
    
    if (!formData.squad_id) {
      setError('Squad selection is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      let savedService;
      
      if (isCreating) {
        savedService = await api.createService(formData);
      } else {
        savedService = await api.updateService(service.id, formData);
      }
      
      onSave(savedService);
    } catch (err) {
      console.error('Failed to save service:', err);
      setError(err.message || 'Failed to save service. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to render service type icon
  const renderServiceTypeIcon = () => {
    switch(formData.service_type) {
      case 'API':
        return <Server className="h-5 w-5 text-blue-500 mr-2" />;
      case 'REPO':
        return <GitBranch className="h-5 w-5 text-green-500 mr-2" />;
      case 'PLATFORM':
        return <Globe className="h-5 w-5 text-purple-500 mr-2" />;
      case 'WEBPAGE':
        return <Code className="h-5 w-5 text-gray-500 mr-2" />;
      case 'APP_MODULE':
        return <Smartphone className="h-5 w-5 text-indigo-500 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-4 rounded-md border shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-dark-primary' : ''}`}>
        {renderServiceTypeIcon()}
        {isCreating ? 'Add New Service' : 'Edit Service'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        {error && (
          <div className={`mb-4 p-2 ${darkMode ? 'bg-red-900 text-red-200 border-red-800' : 'bg-red-50 text-red-700 border-red-200'} border rounded-md text-sm`}>
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Name field */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>
              Service Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
          
          {/* Version field */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>
              Version
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="1.0.0"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-dark-tertiary border-dark-border text-dark-primary placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            rows="2"
            placeholder="Add a brief description of this service"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Service Type */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>
              Service Type
            </label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="API">API</option>
              <option value="REPO">Code Repository</option>
              <option value="PLATFORM">Platform Service</option>
              <option value="WEBPAGE">Web Page</option>
              <option value="APP_MODULE">Mobile App Module</option>
            </select>
            
            {/* Repository search button - only show for REPO type */}
            {formData.service_type === 'REPO' && (
              <button
                type="button"
                onClick={() => setShowRepositoryModal(true)}
                className={`mt-2 w-full px-3 py-2 flex items-center justify-center border rounded-md ${
                  darkMode 
                    ? 'bg-dark-tertiary border-dark-border text-blue-400 hover:bg-dark-secondary' 
                    : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <Search className="h-4 w-4 mr-2" />
                Search and Add Repositories
              </button>
            )}
          </div>
          
          {/* Status field */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="HEALTHY">Healthy</option>
              <option value="DEGRADED">Degraded</option>
              <option value="DOWN">Down</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>
            URL
          </label>
          <input
            type="url"
            name="url"
            value={formData.url || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-dark-tertiary border-dark-border text-dark-primary placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder={
              formData.service_type === 'API' ? 'https://example.com/api/docs' :
              formData.service_type === 'REPO' ? 'https://github.com/org/repo' :
              formData.service_type === 'PLATFORM' ? 'https://platform.example.com' :
              formData.service_type === 'WEBPAGE' ? 'https://example.com/page' :
              'https://app.example.com/module'
            }
          />
        </div>
        
        <div className={`flex justify-end space-x-2 pt-2 ${darkMode ? 'border-dark-border' : 'border-gray-200'} border-t`}>
          <button
            type="button"
            onClick={onCancel}
            className={`px-3 py-1.5 border rounded-md flex items-center ${
              darkMode 
                ? 'border-dark-border text-dark-primary hover:bg-dark-tertiary' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </button>
          <button
            type="submit"
            className={`px-3 py-1.5 bg-blue-600 text-white rounded-md ${saving ? '' : 'hover:bg-blue-700'} flex items-center`}
            disabled={saving}
          >
            <Check className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
      
      {/* Repository Search Modal */}
      <RepositorySearchModal
        isOpen={showRepositoryModal}
        onClose={() => setShowRepositoryModal(false)}
        onAddRepositories={(repositories) => {
          // If we're only adding one repository, update the current form
          if (repositories.length === 1) {
            const repo = repositories[0];
            setFormData(prev => ({
              ...prev,
              name: repo.name,
              description: repo.description || prev.description,
              url: repo.url || prev.url,
              service_type: 'REPO'
            }));
          } else if (repositories.length > 1) {
            // For multiple repositories, save the current one first
            handleSubmit(new Event('submit'));
            
            // Then create additional services for each repository
            repositories.forEach(async (repo) => {
              try {
                await api.createService({
                  name: repo.name,
                  description: repo.description || '',
                  status: 'HEALTHY',
                  version: '1.0.0',
                  service_type: 'REPO',
                  url: repo.url || '',
                  uptime: 99.9,
                  squad_id: formData.squad_id
                });
              } catch (err) {
                console.error('Failed to create repository service:', err);
              }
            });
            
            // Force a refresh of the service list
            if (onSave) {
              onSave({ id: 0 }); // Dummy ID to trigger refresh
            }
          }
        }}
      />
    </div>
  );
};

export default ServiceEditor;