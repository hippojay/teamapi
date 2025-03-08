import React from 'react';
import { Users, Layers, HelpCircle, Activity } from 'lucide-react';

/**
 * A reusable component that displays a team type as a pill-shaped label
 * 
 * @param {Object} props
 * @param {string} props.teamType - The team type identifier (stream_aligned, platform, enabling, complicated_subsystem)
 * @param {boolean} props.showIcon - Whether to display the icon (default: true)
 * @param {boolean} props.showText - Whether to display the text label (default: true)
 * @param {string} props.size - Size of the component (sm, md, lg) (default: md)
 * @param {string} props.className - Additional CSS classes to apply
 */
const TeamTypeLabel = ({ 
  teamType, 
  showIcon = true,
  showText = true,
  size = 'md',
  className = ''
}) => {
  // Default to stream_aligned if teamType is not specified
  const type = teamType?.toLowerCase() || 'stream_aligned';

  // Configuration for each team type
  const typeConfig = {
    stream_aligned: {
      icon: <Users />,
      label: 'Stream-aligned',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    platform: {
      icon: <Layers />,
      label: 'Platform',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    enabling: {
      icon: <HelpCircle />,
      label: 'Enabling',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    complicated_subsystem: {
      icon: <Activity />,
      label: 'Complicated Subsystem',
      color: 'bg-amber-100 text-amber-800 border-amber-200'
    }
  };

  // Get the configuration for the current team type, defaulting to stream_aligned
  const config = typeConfig[type] || typeConfig.stream_aligned;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1 px-3'
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${config.color} ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {showIcon && (
        <span className={`${iconSizeClasses[size] || iconSizeClasses.md} ${!showText ? '' : 'mr-1'}`}>
          {React.cloneElement(config.icon, { className: iconSizeClasses[size] || iconSizeClasses.md })}
        </span>
      )}
      {showText && <span>{config.label}</span>}
    </span>
  );
};

export default TeamTypeLabel;
