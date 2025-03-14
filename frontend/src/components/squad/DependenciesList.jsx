import React, { useState, useEffect } from 'react';
import { GitBranch, Users, Package, Share2, PlusCircle, Edit, Trash } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import InteractionModeLabel from '../../components/InteractionModeLabel';

const DependenciesList = ({ dependencies, squadId, onDependenciesChange }) => {
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingDependency, setEditingDependency] = useState(null);
  
  const getInteractionModeIcon = (mode) => {
    switch (mode) {
      case 'collaboration':
        return <Users className={`h-4 w-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} title="Collaboration" />;
      case 'x_as_a_service':
        return <Package className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} title="X-as-a-Service" />;
      case 'facilitating':
        return <Share2 className={`h-4 w-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} title="Facilitating" />;
      default:
        return <Package className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} title="Undefined" />;
    }
  };
  
  const getInteractionModeLabel = (mode) => {
    switch (mode) {
      case 'collaboration':
        return "Collaboration";
      case 'x_as_a_service':
        return "X-as-a-Service";
      case 'facilitating':
        return "Facilitating";
      default:
        return mode;
    }
  };

  // Handler for editing a dependency
  const handleEditDependency = (dependency) => {
    setEditingDependency(dependency);
    setShowModal(true);
  };
  
  // Handler for adding a new dependency
  const handleAddDependency = () => {
    setEditingDependency(null); // Set to null to indicate a new dependency
    setShowModal(true);
  };
  
  // Handler for deleting a dependency
  const handleDeleteDependency = async (dependencyId) => {
    if (window.confirm('Are you sure you want to delete this dependency?')) {
      try {
        await api.deleteDependency(dependencyId);
        // Update the dependencies list after deletion
        if (onDependenciesChange) {
          onDependenciesChange();
        }
      } catch (error) {
        console.error('Failed to delete dependency:', error);
        alert('Failed to delete dependency. Please try again.');
      }
    }
  };

  return (
    <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} flex items-center`}>
          <GitBranch className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
          Dependencies
        </h3>
        {isAuthenticated && (
          <button 
            onClick={handleAddDependency}
            className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center text-sm`}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Dependency
          </button>
        )}
      </div>
      
      {dependencies.length > 0 ? (
        <div className={`overflow-x-auto ${darkMode ? 'dark-scrollbar' : ''}`}>
          <table className={`w-full ${darkMode ? 'text-dark-secondary' : 'text-gray-700'}`}>
            <thead>
              <tr className={`${darkMode ? 'border-dark-border' : 'border-gray-200'} border-b`}>
                <th className="text-left py-2 px-2">Dependency</th>
                <th className="text-center py-2 px-2">Interaction Mode</th>
                <th className="text-center py-2 px-2">Frequency</th>
                <th className="text-right py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dependencies.map(dep => (
                <tr 
                  key={dep.id} 
                  className={`${darkMode ? 'border-dark-border hover:bg-dark-hover' : 'border-gray-200 hover:bg-gray-50'} border-b`}
                >
                  <td className="py-2 px-2">{dep.dependency_squad_name || dep.dependency_name}</td>
                  <td className="py-2 px-2 text-center flex items-center justify-center">
                    <InteractionModeLabel interactionMode={dep.interaction_mode} size="md" />
                  </td>
                  <td className="py-2 px-2 text-center">{dep.interaction_frequency || 'Not specified'}</td>
                  <td className="py-2 px-2 text-right">
                    {isAuthenticated && (
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEditDependency(dep)}
                          className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteDependency(dep.id)}
                          className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No dependencies found</div>
      )}
      
      {/* Modal for adding/editing dependencies */}
      {showModal && (
        <DependencyModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          dependency={editingDependency}
          squadId={squadId}
          onSave={() => {
            setShowModal(false);
            if (onDependenciesChange) {
              onDependenciesChange();
            }
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// Modal component for adding/editing dependencies
const DependencyModal = ({ isOpen, onClose, dependency, squadId, onSave, darkMode }) => {
  // Add dark mode styles for select dropdowns
  useEffect(() => {
    // Add a style tag for dark mode dropdown options
    if (darkMode) {
      const styleEl = document.createElement('style');
      styleEl.id = 'dark-select-styles';
      styleEl.innerHTML = `
        .dark-mode-active select {
          background-color: #1e1e1e !important;
          color: white !important;
          -webkit-text-fill-color: white !important;
          border-color: #4a5568 !important;
        }
        .dark-mode-active select option {
          background-color: #1e1e1e !important;
          color: white !important;
          -webkit-text-fill-color: white !important;
        }
        .dark-mode-active input[type="text"] {
          background-color: #1e1e1e !important;
          color: white !important;
          -webkit-text-fill-color: white !important;
          border-color: #4a5568 !important;
        }
      `;
      document.head.appendChild(styleEl);
      document.body.classList.add('dark-mode-active');
      
      return () => {
        const existingStyle = document.getElementById('dark-select-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.body.classList.remove('dark-mode-active');
      };
    }
  }, [darkMode]);
  
  const [formData, setFormData] = useState({
    dependency_name: dependency ? dependency.dependency_name : '',
    interaction_mode: dependency ? dependency.interaction_mode : 'x_as_a_service',
    interaction_frequency: dependency ? dependency.interaction_frequency : '',
    dependency_squad_id: dependency ? dependency.dependency_squad_id : '',
  });
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Fetch all squads when modal opens
  useEffect(() => {
    const fetchSquads = async () => {
      try {
        const allSquads = await api.getSquads();
        // Filter out the current squad
        setSquads(allSquads.filter(squad => squad.id !== squadId));
      } catch (err) {
        console.error('Failed to fetch squads:', err);
        setError('Failed to load squads. Please try again.');
      }
    };
    
    fetchSquads();
  }, [squadId]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear any previous success/error messages when form is changed
    setError(null);
    setSuccess(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate required fields
      if (!formData.dependency_name) {
        setError('Dependency name is required');
        setLoading(false);
        return;
      }
      
      if (!dependency && !formData.dependency_squad_id) {
        setError('Please select a squad');
        setLoading(false);
        return;
      }
      
      // Ensure formData has the expected interaction_mode format
      const processedFormData = {
        ...formData,
        // Ensure interaction_mode is one of the accepted values
        interaction_mode: ['x_as_a_service', 'collaboration', 'facilitating'].includes(formData.interaction_mode) 
          ? formData.interaction_mode 
          : 'x_as_a_service'
      };
      
      if (dependency) {
        // Update existing dependency
        await api.updateDependency(dependency.id, processedFormData);
      } else {
        // Create new dependency
        const dependencyData = {
          ...processedFormData,
          dependent_squad_id: squadId
        };
        await api.createDependency(dependencyData);
      }
      
      // Show success message
      setSuccess(true);
      
      // Close modal and refresh dependencies after a short delay
      setTimeout(() => {
        // Refresh the dependencies list
        onSave();
      }, 1000);
    } catch (err) {
      console.error('Failed to save dependency:', err);
      setError('Failed to save dependency. Please try again, or refresh the page to see if your changes were saved.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-dark-card border-dark-border text-white' : 'bg-white border-gray-200 text-gray-800'} p-6 rounded-lg shadow-lg border w-full max-w-md mx-auto`}>
        <h3 className="text-lg font-semibold mb-4">
          {dependency ? 'Edit Dependency' : 'Add Dependency'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Success message */}
          {success && (
            <div className={`p-3 mb-4 text-sm rounded-lg ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'}`}>
              Dependency saved successfully!
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className={`p-3 mb-4 text-sm rounded-lg ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>
              {error}
            </div>
          )}
          
          {/* Squad selection (for new dependencies) */}
          {!dependency && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Dependency Squad
              </label>
              <select
                name="dependency_squad_id"
                value={formData.dependency_squad_id}
                onChange={handleInputChange}
                required
                className={`w-full border ${darkMode ? 'bg-dark-secondary text-white border-gray-600' : 'bg-white border-gray-300'} rounded-md p-2`}
                style={{ color: darkMode ? 'white' : 'inherit' }}
              >
                <option value="">Select a squad</option>
                {squads.map(squad => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Dependency name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Dependency Name
            </label>
            <input
              type="text"
              name="dependency_name"
              value={formData.dependency_name}
              onChange={handleInputChange}
              required
              className={`w-full border ${darkMode ? 'bg-dark-secondary text-white border-gray-600' : 'bg-white border-gray-300'} rounded-md p-2`}
              style={{ color: darkMode ? 'white' : 'inherit' }}
            />
          </div>
          
          {/* Interaction mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Interaction Mode
            </label>
            <select
              name="interaction_mode"
              value={formData.interaction_mode}
              onChange={handleInputChange}
              className={`w-full border ${darkMode ? 'bg-dark-secondary text-white border-gray-600' : 'bg-white border-gray-300'} rounded-md p-2`}
              style={{ color: darkMode ? 'white' : 'inherit' }}
            >
              <option value="x_as_a_service">X-as-a-Service</option>
              <option value="collaboration">Collaboration</option>
              <option value="facilitating">Facilitating</option>
            </select>
          </div>
          
          {/* Interaction frequency */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Interaction Frequency
            </label>
            <select
              name="interaction_frequency"
              value={formData.interaction_frequency}
              onChange={handleInputChange}
              className={`w-full border ${darkMode ? 'bg-dark-secondary text-white border-gray-600' : 'bg-white border-gray-300'} rounded-md p-2`}
              style={{ color: darkMode ? 'white' : 'inherit' }}
            >
              <option value="">Not specified</option>
              <option value="Regular">Regular</option>
              <option value="As needed">As needed</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DependenciesList;