import React from 'react';
import { Activity, Server, Compass } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import PropTypes from 'prop-types';

/**
 * A reusable component that displays an interaction mode as a pill-shaped label
 * 
 * @param {Object} props
 * @param {string} props.interactionMode - The interaction mode identifier (collaboration, x_as_a_service, facilitating)
 * @param {boolean} props.showIcon - Whether to display the icon (default: true)
 * @param {boolean} props.showText - Whether to display the text label (default: true)
 * @param {string} props.size - Size of the component (sm, md, lg) (default: md)
 * @param {string} props.className - Additional CSS classes to apply
 */
const InteractionModeLabel = ({ 
  interactionMode, 
  showIcon = true,
  showText = true,
  size = 'md',
  className = ''
}) => {
  // Default to x_as_a_service if interactionMode is not specified
  const mode = interactionMode?.toLowerCase() || 'x_as_a_service';
  const { darkMode } = useTheme();

  // Configuration for each interaction mode with tooltip descriptions
  const modeConfig = {
    collaboration: {
      icon: <Activity />,
      label: 'Collaboration',
      tooltip: 'Teams work together closely with high communication frequency.',
      color: darkMode 
        ? 'bg-dark-purple-highlight text-dark-purple border-dark-purple-border' 
        : 'bg-purple-100 text-purple-800 border-purple-200'
    },
    x_as_a_service: {
      icon: <Server />,
      label: 'X-as-a-Service',
      tooltip: "Team consumes another team's service with minimal direct interaction.",
      color: darkMode 
        ? 'bg-dark-blue-highlight text-dark-blue border-dark-blue-border' 
        : 'bg-blue-100 text-blue-800 border-blue-200'
    },
    facilitating: {
      icon: <Compass />,
      label: 'Facilitating',
      tooltip: 'Team helps another team overcome obstacles or learn skills.',
      color: darkMode 
        ? 'bg-dark-green-highlight text-dark-green border-dark-green-border' 
        : 'bg-green-100 text-green-800 border-green-200'
    }
  };

  // Get the configuration for the current interaction mode, defaulting to x_as_a_service
  const config = modeConfig[mode] || modeConfig.x_as_a_service;

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
    <span 
      className={`inline-flex items-center rounded-full border ${config.color} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={config.tooltip}
    >
      {showIcon && (
        <span className={`${iconSizeClasses[size] || iconSizeClasses.md} ${!showText ? '' : 'mr-1'}`}>
          {React.cloneElement(config.icon, { className: iconSizeClasses[size] || iconSizeClasses.md })}
        </span>
      )}
      {showText && <span>{config.label}</span>}
    </span>
  );
};

InteractionModeLabel.propTypes = {
  interactionMode: PropTypes.string,
  showIcon: PropTypes.bool,
  showText: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default InteractionModeLabel;