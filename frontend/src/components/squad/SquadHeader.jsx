import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import TeamTypeLabel from '../TeamTypeLabel';
import TeamTypeEditor from '../TeamTypeEditor';
import DescriptionEditor from '../DescriptionEditor';
import CompactTeamCompositionBar from '../CompactTeamCompositionBar';
import api from '../../api';

// Import Icons
import {
  SlackIcon,
  MicrosoftTeamsIcon,
  EnvelopeIcon,
  DocumentationIcon,
  JiraIcon
} from '../icons';

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
  
  // States for contact info editing
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    teams_channel: squad.teams_channel || '',
    slack_channel: squad.slack_channel || '',
    email_contact: squad.email_contact || '',
    documentation_url: squad.documentation_url || '',
    jira_board_url: squad.jira_board_url || ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save contact information
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      // Create a partial squad object with only contact fields and required fields
      const updatedContactInfo = {
        ...squad,
        ...contactInfo
      };

      const updatedSquad = await api.updateSquadContactInfo(squad.id, updatedContactInfo);
      onSquadUpdate(updatedSquad);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update contact info:', error);
      setErrorMessage(error.message || 'Failed to update contact information');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing and reset form
  const handleCancel = () => {
    setContactInfo({
      teams_channel: squad.teams_channel || '',
      slack_channel: squad.slack_channel || '',
      email_contact: squad.email_contact || '',
      documentation_url: squad.documentation_url || '',
      jira_board_url: squad.jira_board_url || ''
    });
    setErrorMessage('');
    setIsEditing(false);
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

      {/* Horizontal line after team composition bar */}
      <hr className={`my-4 ${darkMode ? 'border-dark-border' : 'border-gray-200'}`} />

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
      
      {/* Horizontal line before contact info */}
      <hr className={`my-4 ${darkMode ? 'border-dark-border' : 'border-gray-200'}`} />
      
      {/* Contact Info Section */}
      {errorMessage && (
        <div className="mt-4 text-red-500 text-sm bg-red-100 dark:bg-red-900/20 p-2 rounded">
          {errorMessage}
        </div>
      )}
      
      {isEditing ? (
        <div className={`mt-4 space-y-3 p-3 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>Edit Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Teams Channel */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-1`}>
                Teams Channel
              </label>
              <input
                type="text"
                name="teams_channel"
                value={contactInfo.teams_channel}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-dark-input border-dark-border text-dark-primary' : 'border-gray-300'}`}
                placeholder="Enter Teams channel name"
              />
            </div>

            {/* Slack Channel */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-1`}>
                Slack Channel
              </label>
              <input
                type="text"
                name="slack_channel"
                value={contactInfo.slack_channel}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-dark-input border-dark-border text-dark-primary' : 'border-gray-300'}`}
                placeholder="Enter Slack channel name"
              />
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-1`}>
                Email Contact
              </label>
              <input
                type="email"
                name="email_contact"
                value={contactInfo.email_contact}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-dark-input border-dark-border text-dark-primary' : 'border-gray-300'}`}
                placeholder="Enter contact email"
              />
            </div>

            {/* Documentation URL */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-1`}>
                Documentation URL
              </label>
              <input
                type="url"
                name="documentation_url"
                value={contactInfo.documentation_url}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-dark-input border-dark-border text-dark-primary' : 'border-gray-300'}`}
                placeholder="Enter documentation URL"
              />
            </div>

            {/* Jira Board URL */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-1`}>
                Jira Board URL
              </label>
              <input
                type="url"
                name="jira_board_url"
                value={contactInfo.jira_board_url}
                onChange={handleInputChange}
                className={`w-full p-2 rounded border ${darkMode ? 'bg-dark-input border-dark-border text-dark-primary' : 'border-gray-300'}`}
                placeholder="Enter Jira board URL"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={handleCancel}
              className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-3 py-1 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Display Contact Buttons */}
          <div className="flex flex-wrap gap-2 relative">
            {/* Edit button for authenticated users - pen icon */}
            {isAuthenticated && (
              <button
                onClick={() => setIsEditing(true)}
                className={`absolute right-0 top-0 p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Edit contact information"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}

            {/* Teams Button */}
            {squad.teams_channel && (
              <a
                href={`https://teams.microsoft.com/l/channel/${squad.teams_channel}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                <MicrosoftTeamsIcon className="h-4 w-4 mr-1.5" />
                Teams
              </a>
            )}

            {/* Slack Button */}
            {squad.slack_channel && (
              <a
                href={`https://slack.com/app_redirect?channel=${squad.slack_channel}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                <SlackIcon className="h-4 w-4 mr-1.5" />
                Slack
              </a>
            )}

            {/* Email Button */}
            {squad.email_contact && (
              <a
                href={`mailto:${squad.email_contact}`}
                className={`flex items-center px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                Email
              </a>
            )}

            {/* Documentation */}
            {squad.documentation_url && (
              <a
                href={squad.documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                <DocumentationIcon className="h-4 w-4 mr-1.5" />
                Documentation
              </a>
            )}

            {/* Jira Board */}
            {squad.jira_board_url && (
              <a
                href={squad.jira_board_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                <JiraIcon className="h-4 w-4 mr-1.5" />
                Jira Board
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SquadHeader;
