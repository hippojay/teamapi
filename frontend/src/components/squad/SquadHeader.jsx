import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import TeamTypeLabel from '../TeamTypeLabel';
import TeamTypeEditor from '../TeamTypeEditor';
import DescriptionEditor from '../DescriptionEditor';
import CompactTeamCompositionBar from '../CompactTeamCompositionBar';
import api from '../../api';

const SquadHeader = ({ squad, tribe, onSquadUpdate, vacancyCount = 0 }) => {
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [editingTeamType, setEditingTeamType] = useState(false);
  const [updatingTeamType, setUpdatingTeamType] = useState(false);

  // Handler for updating team type
  const handleTeamTypeUpdate = async (newTeamType) => {
    setUpdatingTeamType(true);
    try {
      await api.updateSquadTeamType(squad.id, newTeamType);
      // Update the squad in our local state
      const updatedSquad = {
        ...squad,
        team_type: newTeamType
      };
      onSquadUpdate(updatedSquad);
      
      // Show success indicator temporarily
      setTimeout(() => setUpdatingTeamType(false), 1500);
    } catch (err) {
      console.error('Error updating team type:', err);
      alert('Failed to update team type. Please try again.');
      setUpdatingTeamType(false);
    }
  };

  return (
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
          vacancy_count={vacancyCount}
        />
      </div>

      <div className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>
        <DescriptionEditor
          entityType="squad"
          entityId={squad.id}
          initialDescription={squad.description || `The ${squad.name} squad is responsible for developing and maintaining services for the ${tribe ? tribe.name : ''} tribe.`}
          onDescriptionUpdated={(newDescription) => {
            // Update the local state with the new description
            onSquadUpdate({...squad, description: newDescription});
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
  );
};

export default SquadHeader;
