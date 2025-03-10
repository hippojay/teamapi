import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Breadcrumbs = ({ squad, tribe, area }) => {
  const { darkMode } = useTheme();

  return (
    <div className={`flex items-center text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-6`}>
      <Link to="/" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Home</Link>
      <ChevronRight className="h-4 w-4 mx-2" />
      <Link to="/areas" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Tribes</Link>
      <ChevronRight className="h-4 w-4 mx-2" />
      {area && (
        <>
          <Link to={`/areas/${area.id}`} className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>{area.name}</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
        </>
      )}
      {tribe && (
        <>
          <Link to={`/tribes/${tribe.id}`} className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>{tribe.name}</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
        </>
      )}
      <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{squad?.name}</span>
    </div>
  );
};

export default Breadcrumbs;
