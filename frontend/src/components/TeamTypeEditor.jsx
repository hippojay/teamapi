import React, { useState } from 'react';
import { Users, Layers, HelpCircle, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TeamTypeEditor = ({ teamType, onUpdate, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(teamType);
  const [showInfo, setShowInfo] = useState(false);
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  
  const canEdit = isAuthenticated && !readOnly;

  // Define team type icons with color context
  const teamTypeIcons = {
    stream_aligned: <Users className={`h-5 w-5 ${darkMode ? 'text-blue-500' : 'text-blue-600'}`} />,
    platform: <Layers className={`h-5 w-5 ${darkMode ? 'text-purple-500' : 'text-purple-600'}`} />,
    enabling: <HelpCircle className={`h-5 w-5 ${darkMode ? 'text-green-500' : 'text-green-600'}`} />,
    complicated_subsystem: <Activity className={`h-5 w-5 ${darkMode ? 'text-amber-500' : 'text-amber-600'}`} />
  };
  
  const teamTypeLabels = {
    stream_aligned: "Stream-aligned",
    platform: "Platform",
    enabling: "Enabling",
    complicated_subsystem: "Complicated Subsystem"
  };
  
  const teamTypeDescriptions = {
    stream_aligned: "Teams aligned to a single, valuable stream of work; the most common team type.",
    platform: "Teams that enable stream-aligned teams to deliver work with substantial autonomy.",
    enabling: "Teams that assist stream-aligned teams with specialized capabilities and knowledge.",
    complicated_subsystem: "Teams that focus on a specific subsystem that requires deep expertise."
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSubmit = () => {
    onUpdate(selectedType);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setSelectedType(teamType);
    setIsEditing(false);
  };
  
  // Display component
  if (!isEditing) {
    return (
      <div className="relative">
        <div className="flex items-center">
          <div className="mr-2">
            {teamTypeIcons[teamType] || <Users className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
          </div>
          <div className="flex-grow">
            <span className={`font-medium ${darkMode ? 'text-dark-primary' : ''}`}>
              {teamTypeLabels[teamType] || "Not Specified"}
            </span>
          </div>
          
          {canEdit && (
            <button 
              onClick={handleEdit}
              className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'} hover:underline`}
            >
              Change
            </button>
          )}
          
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`ml-2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            title="Show team type information"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        
        {showInfo && (
          <div className={`mt-2 p-3 ${darkMode ? 'bg-dark-tertiary text-dark-secondary' : 'bg-gray-50 text-gray-600'} rounded-md text-sm`}>
            {teamTypeDescriptions[teamType] || "No description available."}
          </div>
        )}
      </div>
    );
  }
  
  // Edit component
  return (
    <div className={`p-4 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border' : 'bg-gray-50 border-gray-200'}`}>
      <h4 className={`font-medium mb-3 ${darkMode ? 'text-dark-primary' : ''}`}>Select Team Type:</h4>
      
      <div className="space-y-2">
        {Object.keys(teamTypeLabels).map(type => (
          <div 
            key={type}
            className={`flex items-center p-2 rounded-md cursor-pointer ${
              selectedType === type 
                ? darkMode 
                  ? 'bg-dark-blue-highlight border border-dark-blue-border text-dark-primary' 
                  : 'bg-blue-50 border border-blue-200'
                : darkMode 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedType(type)}
          >
            <div className="mr-3">
              {teamTypeIcons[type]}
            </div>
            <div className="flex-grow">
              <div className={`font-medium ${darkMode ? 'text-dark-primary' : ''}`}>{teamTypeLabels[type]}</div>
              <div className={`text-xs ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>{teamTypeDescriptions[type]}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button 
          onClick={handleCancel}
          className={`px-3 py-1 border rounded-md ${
            darkMode 
              ? 'border-dark-border text-dark-primary hover:bg-gray-800' 
              : 'border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          className={`px-3 py-1 bg-blue-500 text-white rounded-md ${darkMode ? 'hover:bg-blue-600' : 'hover:bg-blue-600'}`}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TeamTypeEditor;