import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import CustomGrid from './CustomGrid';
import SearchBar from './SearchBar';
import { useTheme } from '../context/ThemeContext';

const HeaderBar = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className={`fixed top-0 left-0 right-0 ${darkMode ? 'bg-dark-secondary border-dark-border' : 'bg-white border-gray-200'} border-b shadow-sm p-4 flex items-center z-30 transition-colors duration-200`}>
      <div className="w-1/3 flex items-center">
        <Link to="/" className={`text-xl font-bold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} no-underline flex items-center transition-colors duration-200`}>
          <CustomGrid className="h-6 w-6 mr-2 text-blue-600" />
          Who What Where
        </Link>
      </div>
      
      <div className="w-1/3 flex justify-center">
        <SearchBar />
      </div>
      
      <div className="w-1/3 flex justify-end items-center">  
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors mr-2`}
          aria-label="Toggle dark mode"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
