import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const SquadDetailsInfo = ({ squad, tribe, area }) => {
  const { darkMode } = useTheme();

  return (
    <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4`}>Squad Details</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Cluster:</span>
          {tribe && (
            <Link to={`/tribes/${tribe.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
              {tribe.name}
            </Link>
          )}
        </div>
        <div className="flex justify-between">
          <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Tribe:</span>
          {area && (
            <Link to={`/areas/${area.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
              {area.name}
            </Link>
          )}
        </div>
        <div className="flex justify-between">
          <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Status:</span>
          <span className={darkMode ? 'text-dark-primary' : ''}>{squad.status}</span>
        </div>
        <div className="flex justify-between">
          <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Timezone:</span>
          <span className={darkMode ? 'text-dark-primary' : ''}>{squad.timezone}</span>
        </div>
      </div>
    </div>
  );
};

export default SquadDetailsInfo;
