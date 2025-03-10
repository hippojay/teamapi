import React from 'react';
import { Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const OnCallInfo = ({ onCall }) => {
  const { darkMode } = useTheme();

  return (
    <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
        <Bell className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
        On-Call
      </h3>
      {onCall ? (
        <div className="space-y-3">
          <div>
            <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Primary</div>
            <div className={darkMode ? 'text-dark-primary' : 'text-gray-800'}>{onCall.primary_name}</div>
            {onCall.primary_contact && (
              <div className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{onCall.primary_contact}</div>
            )}
          </div>
          <div>
            <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Secondary</div>
            <div className={darkMode ? 'text-dark-primary' : 'text-gray-800'}>{onCall.secondary_name}</div>
            {onCall.secondary_contact && (
              <div className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{onCall.secondary_contact}</div>
            )}
          </div>
        </div>
      ) : (
        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>No on-call roster found</div>
      )}
    </div>
  );
};

export default OnCallInfo;
