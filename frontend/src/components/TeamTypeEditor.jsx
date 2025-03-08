import React, { useState } from 'react';
import { Users, Layers, HelpCircle, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const teamTypeIcons = {
  stream_aligned: <Users className="h-5 w-5 text-blue-600" />,
  platform: <Layers className="h-5 w-5 text-purple-600" />,
  enabling: <HelpCircle className="h-5 w-5 text-green-600" />,
  complicated_subsystem: <Activity className="h-5 w-5 text-amber-600" />
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

const TeamTypeEditor = ({ teamType, onUpdate, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(teamType);
  const [showInfo, setShowInfo] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const canEdit = isAuthenticated && !readOnly;
  
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
            {teamTypeIcons[teamType] || <Users className="h-5 w-5 text-gray-400" />}
          </div>
          <div className="flex-grow">
            <span className="font-medium">
              {teamTypeLabels[teamType] || "Not Specified"}
            </span>
          </div>
          
          {canEdit && (
            <button 
              onClick={handleEdit}
              className="text-blue-500 text-sm hover:text-blue-700 hover:underline"
            >
              Change
            </button>
          )}
          
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="ml-2 text-gray-400 hover:text-gray-600"
            title="Show team type information"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        
        {showInfo && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            {teamTypeDescriptions[teamType] || "No description available."}
          </div>
        )}
      </div>
    );
  }
  
  // Edit component
  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h4 className="font-medium mb-3">Select Team Type:</h4>
      
      <div className="space-y-2">
        {Object.keys(teamTypeLabels).map(type => (
          <div 
            key={type}
            className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100 
                      ${selectedType === type ? 'bg-blue-50 border border-blue-200' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            <div className="mr-3">
              {teamTypeIcons[type]}
            </div>
            <div className="flex-grow">
              <div className="font-medium">{teamTypeLabels[type]}</div>
              <div className="text-xs text-gray-500">{teamTypeDescriptions[type]}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button 
          onClick={handleCancel}
          className="px-3 py-1 border rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TeamTypeEditor;