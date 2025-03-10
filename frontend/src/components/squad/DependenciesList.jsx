import React from 'react';
import { GitBranch } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DependenciesList = ({ dependencies }) => {
  const { darkMode } = useTheme();

  const getDependencyBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'required':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-dark-blue-highlight text-dark-blue' : 'bg-blue-100 text-blue-800'} rounded-full text-xs`}>Required</span>;
      case 'optional':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} rounded-full text-xs`}>Optional</span>;
      default:
        return <span className={`px-2 py-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} rounded-full text-xs`}>{type}</span>;
    }
  };

  return (
    <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
        <GitBranch className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
        Dependencies
      </h3>
      {dependencies.length > 0 ? (
        <ul className="space-y-3">
          {dependencies.map(dep => (
            <li key={dep.id} className="flex items-center justify-between">
              <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>{dep.dependency_name}</span>
              {getDependencyBadge(dep.dependency_type)}
            </li>
          ))}
        </ul>
      ) : (
        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>No dependencies found</div>
      )}
    </div>
  );
};

export default DependenciesList;
