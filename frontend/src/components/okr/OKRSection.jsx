import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api';
import OKRItem from './OKRItem';
import OKRModal from './OKRModal';

const OKRSection = ({ areaId, tribeId, squadId, entityName, entityType }) => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  // Load objectives
  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        setLoading(true);
        const data = await api.getObjectives(areaId, tribeId, squadId);
        setObjectives(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching objectives:', err);
        setError('Failed to load objectives');
        setLoading(false);
      }
    };

    fetchObjectives();
  }, [areaId, tribeId, squadId]);

  // Handle adding a new objective
  const handleAddObjective = async (newObjective) => {
    try {
      const created = await api.createObjective({
        ...newObjective,
        area_id: areaId || null,
        tribe_id: tribeId || null,
        squad_id: squadId || null
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

  if (loading) {
    return <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">Loading OKRs...</div>;
  }

  if (error) {
    return <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">{error}</div>;
  }

  return (
    <div className={`mt-4 p-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Objectives & Key Results</h2>
        {isAuthenticated && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Objective
          </button>
        )}
      </div>

      {objectives.length === 0 ? (
        <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No objectives found for this {entityType}.
        </p>
      ) : (
        <div className="space-y-2">
          {objectives
            .slice() // Create a copy to avoid mutating the original array
            .sort((a, b) => {
              // Sort cascaded OKRs first
              const aIsCascaded = (a.area_id && entityType !== 'area') || (a.tribe_id && entityType !== 'tribe' && entityType !== 'area');
              const bIsCascaded = (b.area_id && entityType !== 'area') || (b.tribe_id && entityType !== 'tribe' && entityType !== 'area');
              
              if (aIsCascaded && !bIsCascaded) return -1;
              if (!aIsCascaded && bIsCascaded) return 1;
              
              // For cascaded OKRs, prioritize Area over Tribe
              if (aIsCascaded && bIsCascaded) {
                const aIsArea = a.area_id && entityType !== 'area';
                const bIsArea = b.area_id && entityType !== 'area';
                if (aIsArea && !bIsArea) return -1;
                if (!aIsArea && bIsArea) return 1;
              }
              
              // Otherwise sort by ID (assuming newer objectives have higher IDs)
              return b.id - a.id;
            })
            .map(objective => (
              <OKRItem
                key={objective.id}
                objective={objective}
                entityType={entityType}
                onUpdateObjective={handleUpdateObjective}
                onDeleteObjective={handleDeleteObjective}
                onAddKeyResult={handleAddKeyResult}
                onUpdateKeyResult={handleUpdateKeyResult}
                onDeleteKeyResult={handleDeleteKeyResult}
              />
            ))}
        </div>
      )}

      {showAddModal && (
        <OKRModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddObjective}
          title={`Add Objective to ${entityName}`}
          entityType={entityType}
        />
      )}
    </div>
  );
};

export default OKRSection;
