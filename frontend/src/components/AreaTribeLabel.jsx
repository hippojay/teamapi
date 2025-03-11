import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Building, Server, Globe, PenLine, Check, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

/**
 * A component that displays an Area or Tribe label and allows authenticated users to edit it
 */
const AreaTribeLabel = ({ entityType, entityId, label, onLabelUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  
  console.log(`AreaTribeLabel rendered for ${entityType}:${entityId} with label:`, label);
  
  // Set initial selected label on mount and when label prop changes
  useEffect(() => {
    console.log(`Label prop changed to:`, label);
    
    // Convert from various possible formats to our internal format
    let normalizedLabel = null;
    
    if (label) {
      if (typeof label === 'string') {
        // For string values like "cfu_aligned" or "CFU_ALIGNED"
        normalizedLabel = label.toUpperCase();
      } else if (label.value) {
        // For object values like {value: "cfu_aligned"}
        normalizedLabel = label.value.toUpperCase();
      } else if (label.name) {
        // For enum objects like {name: "CFU_ALIGNED"}
        normalizedLabel = label.name;
      }
    }
    
    console.log("Normalized label:", normalizedLabel);
    setSelectedLabel(normalizedLabel);
  }, [label]);

  // Define available labels with tooltips
  const labelOptions = [
    { 
      value: 'CFU_ALIGNED', 
      label: 'CFU Aligned', 
      icon: <Building size={16} />,
      tooltip: 'A Consumer or Business funded and managed tribe or cluster'
    },
    { 
      value: 'PLATFORM_GROUP', 
      label: 'Platform Group', 
      icon: <Server size={16} />,
      tooltip: 'Provides services to be consumed by other teams'
    },
    { 
      value: 'DIGITAL', 
      label: 'Digital', 
      icon: <Globe size={16} />,
      tooltip: 'A digital funded and managed tribe'
    },
  ];

  // Get label configuration for display
  const getLabelConfig = (labelValue) => {
    if (!labelValue) return null;
    return labelOptions.find(opt => opt.value === labelValue) || null;
  };

  const currentLabelConfig = getLabelConfig(selectedLabel);

  // Handle label selection change
  const handleLabelChange = (value) => {
    setSelectedLabel(value);
  };

  // Handle saving the label
  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (entityType === 'area') {
        await api.updateAreaLabel(entityId, selectedLabel);
      } else if (entityType === 'tribe') {
        await api.updateTribeLabel(entityId, selectedLabel);
      }
      
      // Call the callback function to update parent component
      if (onLabelUpdated) {
        onLabelUpdated(selectedLabel);
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error(`Error updating ${entityType} label:`, err);
      setError(err.message || `Failed to update ${entityType} label`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling the edit
  const handleCancel = () => {
    // Reset to the original value
    setSelectedLabel(label ? 
      (typeof label === 'string' ? label.toUpperCase() : 
       label.value ? label.value.toUpperCase() : 
       label.name ? label.name : null) 
      : null);
    setIsEditing(false);
    setError(null);
  };

  // Display in editing mode
  if (isEditing) {
    return (
      <div className="mb-3">
        <div className="flex flex-wrap gap-2 mb-2">
          {labelOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLabelChange(option.value)}
              className={`flex items-center px-3 py-1.5 rounded-full border text-sm
                ${selectedLabel === option.value
                  ? darkMode
                    ? 'bg-blue-900 text-blue-100 border-blue-700'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                  : darkMode
                    ? 'bg-dark-card text-dark-secondary border-dark-border hover:bg-dark-hover'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              title={option.tooltip}
            >
              <span className="mr-1.5">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
          <button
            onClick={() => handleLabelChange(null)}
            className={`flex items-center px-3 py-1.5 rounded-full border text-sm
              ${selectedLabel === null
                ? darkMode
                  ? 'bg-blue-900 text-blue-100 border-blue-700'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
                : darkMode
                  ? 'bg-dark-card text-dark-secondary border-dark-border hover:bg-dark-hover'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
          >
            <span className="mr-1.5"><X size={16} /></span>
            <span>None</span>
          </button>
        </div>
        
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`flex items-center px-3 py-1 rounded-md text-sm
              ${darkMode
                ? 'bg-blue-700 text-white hover:bg-blue-600 disabled:bg-blue-900 disabled:text-blue-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
              }`}
          >
            <Check size={16} className="mr-1" />
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className={`flex items-center px-3 py-1 rounded-md text-sm
              ${darkMode
                ? 'bg-dark-card text-dark-secondary border border-dark-border hover:bg-dark-hover'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
          >
            <X size={16} className="mr-1" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Display in view mode
  return (
    <div className="flex items-center mb-3">
      {currentLabelConfig ? (
        <span 
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm
            ${darkMode
              ? 'bg-dark-blue-highlight text-dark-blue border border-dark-blue-border'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}
          title={currentLabelConfig.tooltip}
        >
          <span className="mr-1.5">{currentLabelConfig.icon}</span>
          <span>{currentLabelConfig.label}</span>
        </span>
      ) : null}
      
      {isAuthenticated && (
        <button
          onClick={() => setIsEditing(true)}
          className={`${currentLabelConfig ? 'ml-2' : ''} p-1 rounded-full 
            ${darkMode
              ? 'text-dark-secondary hover:bg-dark-hover hover:text-dark-primary'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          title={currentLabelConfig ? "Edit label" : "Add label"}
        >
          <PenLine size={16} />
        </button>
      )}
    </div>
  );
};

AreaTribeLabel.propTypes = {
  entityType: PropTypes.oneOf(['area', 'tribe']).isRequired,
  entityId: PropTypes.number.isRequired,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      value: PropTypes.string,
      name: PropTypes.string
    })
  ]),
  onLabelUpdated: PropTypes.func
};

export default AreaTribeLabel;