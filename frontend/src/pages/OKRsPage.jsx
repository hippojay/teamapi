import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../components/common';
import { useTheme } from '../context/ThemeContext';
import { OKRItem, OKRModal } from '../components/okr';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const OKRsPage = () => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    areaId: '',
    tribeId: '',
    squadId: ''
  });
  const [areas, setAreas] = useState([]);
  const [tribes, setTribes] = useState([]);
  const [squads, setSquads] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  // Load objectives and filter options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all areas, tribes, and squads for filters
        const areasData = await api.getAreas();
        setAreas(areasData);
        
        const tribesData = await api.getTribes();
        setTribes(tribesData);
        
        const squadsData = await api.getSquads();
        setSquads(squadsData);
        
        // Fetch objectives based on current filters
        await fetchObjectives();
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch objectives based on filters
  const fetchObjectives = async () => {
    try {
      setLoading(true);
      const data = await api.getObjectives(
        filter.areaId || null,
        filter.tribeId || null, 
        filter.squadId || null
      );
      setObjectives(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching objectives:', err);
      setError('Failed to load objectives');
      setLoading(false);
    }
  };

  // Apply filters
  const handleFilterChange = async (e) => {
    const { name, value } = e.target;
    
    // Update filter state
    const newFilter = { ...filter, [name]: value };
    
    // If area changes, reset tribe and squad
    if (name === 'areaId') {
      newFilter.tribeId = '';
      newFilter.squadId = '';
    }
    
    // If tribe changes, reset squad
    if (name === 'tribeId') {
      newFilter.squadId = '';
    }
    
    setFilter(newFilter);
    
    // Fetch filtered objectives
    try {
      setLoading(true);
      const data = await api.getObjectives(
        newFilter.areaId || null,
        newFilter.tribeId || null, 
        newFilter.squadId || null
      );
      setObjectives(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching objectives:', err);
      setError('Failed to load objectives');
      setLoading(false);
    }
  };

  // Handle adding a new objective
  const handleAddObjective = async (newObjective) => {
    try {
      const created = await api.createObjective({
        ...newObjective,
        area_id: filter.areaId || null,
        tribe_id: filter.tribeId || null,
        squad_id: filter.squadId || null
      });
      
      setObjectives([...objectives, created]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating objective:', err);
      setError('Failed to create objective');
    }
  };

  // Handle updating an objective
  const handleUpdateObjective = async (updatedObjective) => {
    try {
      const updated = await api.updateObjective(updatedObjective.id, updatedObjective);
      setObjectives(objectives.map(obj => obj.id === updated.id ? updated : obj));
    } catch (err) {
      console.error('Error updating objective:', err);
      setError('Failed to update objective');
    }
  };

  // Handle deleting an objective
  const handleDeleteObjective = async (objectiveId) => {
    try {
      await api.deleteObjective(objectiveId);
      setObjectives(objectives.filter(obj => obj.id !== objectiveId));
    } catch (err) {
      console.error('Error deleting objective:', err);
      setError('Failed to delete objective');
    }
  };

  // Handle adding a key result to an objective
  const handleAddKeyResult = async (objectiveId, keyResult) => {
    try {
      const created = await api.createKeyResult({ ...keyResult, objective_id: objectiveId });
      
      // Update the objectives list with the new key result
      setObjectives(objectives.map(obj => {
        if (obj.id === objectiveId) {
          return {
            ...obj,
            key_results: [...obj.key_results, created]
          };
        }
        return obj;
      }));
    } catch (err) {
      console.error('Error creating key result:', err);
      setError('Failed to create key result');
    }
  };

  // Handle updating a key result
  const handleUpdateKeyResult = async (keyResult) => {
    try {
      const updated = await api.updateKeyResult(keyResult.id, keyResult);
      
      // Update the objectives list with the updated key result
      setObjectives(objectives.map(obj => {
        if (obj.id === updated.objective_id) {
          return {
            ...obj,
            key_results: obj.key_results.map(kr => kr.id === updated.id ? updated : kr)
          };
        }
        return obj;
      }));
    } catch (err) {
      console.error('Error updating key result:', err);
      setError('Failed to update key result');
    }
  };

  // Handle deleting a key result
  const handleDeleteKeyResult = async (objectiveId, keyResultId) => {
    try {
      await api.deleteKeyResult(keyResultId);
      
      // Update the objectives list by removing the deleted key result
      setObjectives(objectives.map(obj => {
        if (obj.id === objectiveId) {
          return {
            ...obj,
            key_results: obj.key_results.filter(kr => kr.id !== keyResultId)
          };
        }
        return obj;
      }));
    } catch (err) {
      console.error('Error deleting key result:', err);
      setError('Failed to delete key result');
    }
  };

  // Filter tribes based on selected area
  const filteredTribes = filter.areaId 
    ? tribes.filter(tribe => tribe.area_id === parseInt(filter.areaId))
    : tribes;
  
  // Filter squads based on selected tribe
  const filteredSquads = filter.tribeId
    ? squads.filter(squad => squad.tribe_id === parseInt(filter.tribeId))
    : squads;

  // Get entity name based on filter
  const getEntityName = () => {
    if (filter.squadId) {
      const squad = squads.find(s => s.id === parseInt(filter.squadId));
      return squad ? squad.name : 'Squad';
    }
    if (filter.tribeId) {
      const tribe = tribes.find(t => t.id === parseInt(filter.tribeId));
      return tribe ? tribe.name : 'Tribe';
    }
    if (filter.areaId) {
      const area = areas.find(a => a.id === parseInt(filter.areaId));
      return area ? area.name : 'Area';
    }
    return 'All';
  };

  // Get entity type based on filter
  const getEntityType = () => {
    if (filter.squadId) return 'squad';
    if (filter.tribeId) return 'tribe';
    if (filter.areaId) return 'area';
    return '';
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'OKRs', isLast: true }
      ]} />

      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Objectives & Key Results
        </h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!filter.areaId && !filter.tribeId && !filter.squadId}
          >
            Add Objective
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={`mb-6 p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Area
            </label>
            <select
              name="areaId"
              value={filter.areaId}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="">All Areas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tribe
            </label>
            <select
              name="tribeId"
              value={filter.tribeId}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              disabled={!filter.areaId}
            >
              <option value="">All Tribes</option>
              {filteredTribes.map(tribe => (
                <option key={tribe.id} value={tribe.id}>{tribe.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Squad
            </label>
            <select
              name="squadId"
              value={filter.squadId}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              disabled={!filter.tribeId}
            >
              <option value="">All Squads</option>
              {filteredSquads.map(squad => (
                <option key={squad.id} value={squad.id}>{squad.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading ? (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading objectives...
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-lg mb-2">No objectives found</p>
              <p className="text-sm">
                {filter.areaId || filter.tribeId || filter.squadId 
                  ? 'Try changing your filters or add a new objective.' 
                  : 'Select an Area, Tribe, or Squad to view/add objectives.'}
              </p>
            </div>
          ) : (
            objectives.map(objective => (
              <OKRItem
                key={objective.id}
                objective={objective}
                entityType={getEntityType()}
                onUpdateObjective={handleUpdateObjective}
                onDeleteObjective={handleDeleteObjective}
                onAddKeyResult={handleAddKeyResult}
                onUpdateKeyResult={handleUpdateKeyResult}
                onDeleteKeyResult={handleDeleteKeyResult}
              />
            ))
          )}
        </div>
      )}

      {/* Add Objective Modal */}
      {showAddModal && (
        <OKRModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddObjective}
          title={`Add Objective to ${getEntityName()}`}
          entityType={getEntityType()}
        />
      )}
    </div>
  );
};

export default OKRsPage;
