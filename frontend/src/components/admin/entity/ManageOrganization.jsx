import React, { useState, useEffect } from 'react';
import api from '../../../api';
import AreaForm from './AreaForm';
import TribeForm from './TribeForm';
import SquadForm from './SquadForm';

const ManageOrganization = ({ darkMode }) => {
  // Current selected area, tribe, or squad
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);

  // Form visibility states
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showTribeForm, setShowTribeForm] = useState(false);
  const [showSquadForm, setShowSquadForm] = useState(false);
  
  // Whether we're editing or creating new
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [isEditingTribe, setIsEditingTribe] = useState(false);
  const [isEditingSquad, setIsEditingSquad] = useState(false);

  // Data states
  const [areas, setAreas] = useState([]);
  const [tribes, setTribes] = useState([]);
  const [squads, setSquads] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load areas, tribes, and squads
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all areas
      const areasData = await api.getAreas();
      setAreas(areasData);
      
      // Load all tribes
      const tribesData = await api.getTribes();
      setTribes(tribesData);
      
      // Load all squads
      const squadsData = await api.getSquads();
      setSquads(squadsData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load organizational data');
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);

  // Success message auto-clear
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Area handlers
  const handleAddArea = () => {
    setSelectedArea(null);
    setIsEditingArea(false);
    setShowAreaForm(true);
    setShowTribeForm(false);
    setShowSquadForm(false);
  };

  const handleEditArea = (area) => {
    setSelectedArea(area);
    setIsEditingArea(true);
    setShowAreaForm(true);
    setShowTribeForm(false);
    setShowSquadForm(false);
  };

  const handleSaveArea = async (areaData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEditingArea) {
        // Update existing area
        await api.updateArea(selectedArea.id, areaData);
        setSuccess(`Area "${areaData.name}" updated successfully`);
      } else {
        // Create new area
        await api.createArea(areaData);
        setSuccess(`Area "${areaData.name}" created successfully`);
      }
      
      // Reload data and reset form state
      await loadData();
      setShowAreaForm(false);
      setIsEditingArea(false);
      setSelectedArea(null);
    } catch (err) {
      console.error('Error saving area:', err);
      setError(`Failed to ${isEditingArea ? 'update' : 'create'} area: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Tribe handlers
  const handleAddTribe = (areaId = null) => {
    setSelectedTribe(null);
    setIsEditingTribe(false);
    setShowTribeForm(true);
    setShowAreaForm(false);
    setShowSquadForm(false);
    
    // If areaId is provided, pre-select the area
    if (areaId) {
      const area = areas.find(a => a.id === areaId);
      if (area) {
        setSelectedArea(area);
      }
    }
  };

  const handleEditTribe = (tribe) => {
    setSelectedTribe(tribe);
    setIsEditingTribe(true);
    setShowTribeForm(true);
    setShowAreaForm(false);
    setShowSquadForm(false);
  };

  const handleSaveTribe = async (tribeData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEditingTribe) {
        // Update existing tribe
        await api.updateTribe(selectedTribe.id, tribeData);
        
        // Check if area_id has changed
        if (tribeData.area_id && tribeData.area_id !== selectedTribe.area_id) {
          await api.updateTribeArea(selectedTribe.id, tribeData.area_id);
        }
        
        setSuccess(`Tribe "${tribeData.name}" updated successfully`);
      } else {
        // Create new tribe
        await api.createTribe(tribeData, tribeData.area_id);
        setSuccess(`Tribe "${tribeData.name}" created successfully`);
      }
      
      // Reload data and reset form state
      await loadData();
      setShowTribeForm(false);
      setIsEditingTribe(false);
      setSelectedTribe(null);
    } catch (err) {
      console.error('Error saving tribe:', err);
      setError(`Failed to ${isEditingTribe ? 'update' : 'create'} tribe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Squad handlers
  const handleAddSquad = (tribeId = null) => {
    setSelectedSquad(null);
    setIsEditingSquad(false);
    setShowSquadForm(true);
    setShowAreaForm(false);
    setShowTribeForm(false);
    
    // If tribeId is provided, pre-select the tribe
    if (tribeId) {
      const tribe = tribes.find(t => t.id === tribeId);
      if (tribe) {
        setSelectedTribe(tribe);
      }
    }
  };

  const handleEditSquad = (squad) => {
    setSelectedSquad(squad);
    setIsEditingSquad(true);
    setShowSquadForm(true);
    setShowAreaForm(false);
    setShowTribeForm(false);
  };

  const handleSaveSquad = async (squadData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEditingSquad) {
        // Update existing squad
        await api.updateSquad(selectedSquad.id, squadData);
        
        // Check if tribe_id has changed
        if (squadData.tribe_id && squadData.tribe_id !== selectedSquad.tribe_id) {
          await api.updateSquadTribe(selectedSquad.id, squadData.tribe_id);
        }
        
        setSuccess(`Squad "${squadData.name}" updated successfully`);
      } else {
        // Create new squad
        await api.createSquad(squadData, squadData.tribe_id);
        setSuccess(`Squad "${squadData.name}" created successfully`);
      }
      
      // Reload data and reset form state
      await loadData();
      setShowSquadForm(false);
      setIsEditingSquad(false);
      setSelectedSquad(null);
    } catch (err) {
      console.error('Error saving squad:', err);
      setError(`Failed to ${isEditingSquad ? 'update' : 'create'} squad: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel form handlers
  const handleCancelArea = () => {
    setShowAreaForm(false);
    setSelectedArea(null);
    setIsEditingArea(false);
  };

  const handleCancelTribe = () => {
    setShowTribeForm(false);
    setSelectedTribe(null);
    setIsEditingTribe(false);
  };

  const handleCancelSquad = () => {
    setShowSquadForm(false);
    setSelectedSquad(null);
    setIsEditingSquad(false);
  };

  return (
    <div className={`p-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <h2 className="text-xl font-bold mb-4">Manage Organization Structure</h2>
      
      {/* Status messages */}
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-200">
          {success}
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Loading...</span>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleAddArea}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Area
        </button>
        <button
          onClick={() => handleAddTribe()}
          className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Add Tribe
        </button>
        <button
          onClick={() => handleAddSquad()}
          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Add Squad
        </button>
      </div>
      
      {/* Forms */}
      {showAreaForm && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {isEditingArea ? `Edit Area: ${selectedArea.name}` : 'Add New Area'}
          </h3>
          <AreaForm
            area={selectedArea}
            onSave={handleSaveArea}
            onCancel={handleCancelArea}
            darkMode={darkMode}
          />
        </div>
      )}
      
      {showTribeForm && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {isEditingTribe ? `Edit Tribe: ${selectedTribe.name}` : 'Add New Tribe'}
          </h3>
          <TribeForm
            tribe={selectedTribe}
            areaId={selectedArea?.id}
            onSave={handleSaveTribe}
            onCancel={handleCancelTribe}
            darkMode={darkMode}
          />
        </div>
      )}
      
      {showSquadForm && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {isEditingSquad ? `Edit Squad: ${selectedSquad.name}` : 'Add New Squad'}
          </h3>
          <SquadForm
            squad={selectedSquad}
            tribeId={selectedTribe?.id}
            onSave={handleSaveSquad}
            onCancel={handleCancelSquad}
            darkMode={darkMode}
          />
        </div>
      )}
      
      {/* Organization structure display */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Current Organization Structure</h3>
        
        {areas.length === 0 ? (
          <p className={`italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No areas have been defined yet.
          </p>
        ) : (
          <div className="space-y-4">
            {areas.map(area => (
              <div 
                key={area.id}
                className={`p-3 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    {area.name}
                    {area.label && (
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                        {area.label_str || area.label}
                      </span>
                    )}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditArea(area)}
                      className={`px-2 py-1 text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAddTribe(area.id)}
                      className="px-2 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Add Tribe
                    </button>
                  </div>
                </div>
                
                {area.description && (
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {area.description}
                  </p>
                )}
                
                <div className="pl-4 border-l-2 border-blue-500 mt-2">
                  {tribes.filter(tribe => tribe.area_id === area.id).length === 0 ? (
                    <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No tribes in this area
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {tribes
                        .filter(tribe => tribe.area_id === area.id)
                        .map(tribe => (
                          <div 
                            key={tribe.id}
                            className={`p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <h5 className="font-semibold flex items-center">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                                {tribe.name}
                                {tribe.label && (
                                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'}`}>
                                    {tribe.label_str || tribe.label}
                                  </span>
                                )}
                              </h5>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditTribe(tribe)}
                                  className={`px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleAddSquad(tribe.id)}
                                  className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  Add Squad
                                </button>
                              </div>
                            </div>
                            
                            {tribe.description && (
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {tribe.description}
                              </p>
                            )}
                            
                            <div className="pl-3 border-l-2 border-indigo-500 mt-2">
                              {squads.filter(squad => squad.tribe_id === tribe.id).length === 0 ? (
                                <p className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  No squads in this tribe
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {squads
                                    .filter(squad => squad.tribe_id === tribe.id)
                                    .map(squad => (
                                      <div 
                                        key={squad.id}
                                        className={`p-1.5 border rounded flex justify-between items-center ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-100 border-gray-200'}`}
                                      >
                                        <div>
                                          <span className="flex items-center font-medium">
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                                            {squad.name}
                                            <span className={`ml-1.5 text-xs px-1 py-0.5 rounded ${
                                              squad.status === 'Active' 
                                                ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                                                : squad.status === 'Planning'
                                                  ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                                                  : (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                                            }`}>
                                              {squad.status}
                                            </span>
                                          </span>
                                          {squad.description && (
                                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                              {squad.description.length > 50 
                                                ? `${squad.description.substring(0, 50)}...` 
                                                : squad.description
                                              }
                                            </p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => handleEditSquad(squad)}
                                          className={`px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrganization;
