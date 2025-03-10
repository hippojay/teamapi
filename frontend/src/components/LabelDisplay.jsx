import React from 'react';
import { Building, Server, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * A component that displays an Area or Tribe label without editing functionality
 */
const LabelDisplay = ({ label }) => {
  const { darkMode } = useTheme();
  
  // Define available labels
  const labelOptions = [
    { value: 'CFU_ALIGNED', label: 'CFU Aligned', icon: <Building size={14} /> },
    { value: 'PLATFORM_GROUP', label: 'Platform Group', icon: <Server size={14} /> },
    { value: 'DIGITAL', label: 'Digital', icon: <Globe size={14} /> },
  ];
  
  // Normalize label value
  let normalizedLabel = null;
  if (label) {
    if (typeof label === 'string') {
      normalizedLabel = label.toUpperCase();
    } else if (label.value) {
      normalizedLabel = label.value.toUpperCase();
    } else if (label.name) {
      normalizedLabel = label.name;
    }
  }
  
  if (!normalizedLabel) return null;
  
  // Get label configuration
  const labelConfig = labelOptions.find(opt => opt.value === normalizedLabel);
  if (!labelConfig) return null;
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs
        ${darkMode
          ? 'bg-dark-blue-highlight text-dark-blue border border-dark-blue-border'
          : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}
    >
      <span className="mr-1">{labelConfig.icon}</span>
      <span>{labelConfig.label}</span>
    </span>
  );
};

export default LabelDisplay;