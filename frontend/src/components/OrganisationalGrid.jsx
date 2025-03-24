import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const OrganisationalGrid = () => {
  // eslint-disable-next-line no-unused-vars
const [selectedBox, setSelectedBox] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  // Navigation handler
  const handleBoxClick = (path, areaName) => {
    setSelectedBox(areaName);
    navigate(path);
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
     
      <div className={`relative border-2 ${darkMode ? 'border-gray-200' : 'border-gray-800'} rounded-lg shadow-lg p-0 ${darkMode ? 'bg-gray-200' : 'bg-gray-800'}`}>
        {/* Main grid container - using grid layout with black background for gaps */}
        <div className={`grid grid-rows-3 gap-4 h-[400px] ${darkMode ? 'bg-gray-200' : 'bg-gray-800'} p-4`}>
          
          {/* Top Row - 2 equal boxes */}
          <div className="grid grid-cols-2 gap-4 h-full">
            <div 
              onClick={() => handleBoxClick('/areas/1', 'Digi-sales')} 
              className={`${darkMode ? 'bg-dark-card hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} rounded-none p-4 flex items-center justify-center cursor-pointer transition-colors duration-200 h-full`}
            >
              <span className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Digi-sales</span>
            </div>
            <div 
              onClick={() => handleBoxClick('/areas/2', 'DS&GT')} 
              className={`${darkMode ? 'bg-dark-card hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} rounded-none p-4 flex items-center justify-center cursor-pointer transition-colors duration-200 h-full`}
            >
              <span className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>DS&GT</span>
            </div>
          </div>
          
          {/* Middle Row - 3 equal boxes */}
          <div className="grid grid-cols-3 gap-4 h-full">
            <div 
              onClick={() => handleBoxClick('/areas/3', 'Home')} 
              className={`${darkMode ? 'bg-dark-card hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} rounded-none p-4 flex items-center justify-center cursor-pointer transition-colors duration-200 h-full`}
            >
              <span className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Home</span>
            </div>
            <div 
              onClick={() => handleBoxClick('/areas/4', 'Mobile')} 
              className={`${darkMode ? 'bg-dark-card hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} rounded-none p-4 flex items-center justify-center cursor-pointer transition-colors duration-200 h-full`}
            >
              <span className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Mobile</span>
            </div>
            <div 
              onClick={() => handleBoxClick('/areas/5', 'New Markets')} 
              className={`${darkMode ? 'bg-dark-card hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} rounded-none p-4 flex items-center justify-center cursor-pointer transition-colors duration-200 h-full`}
            >
              <span className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>New Markets</span>
            </div>
          </div>
          
          {/* Bottom Row - 1 box containing 4 rounded rectangles */}
          <div className={`${darkMode ? 'bg-dark-card' : 'bg-white'} rounded-none p-4 flex items-center justify-center h-full`}>
            <div className="grid grid-cols-4 gap-6 w-full justify-items-center mx-auto">
              {/* Four rounded rectangles */}
              <div 
                onClick={() => handleBoxClick('/services/1', 'One Consumer')} 
                className={`h-16 w-28 rounded-lg ${darkMode ? 'bg-dark-card border-gray-500' : 'bg-white border-gray-800'} border-2 flex items-center justify-center cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors duration-200`}
              >
                <span className={`text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>One Consumer</span>
              </div>
              
              <div 
                onClick={() => handleBoxClick('/services/2', 'One Contact')} 
                className={`h-16 w-28 rounded-lg ${darkMode ? 'bg-dark-card border-gray-500' : 'bg-white border-gray-800'} border-2 flex items-center justify-center cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors duration-200`}
              >
                <span className={`text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>One Contact</span>
              </div>
              
              <div 
                onClick={() => handleBoxClick('/services/3', 'Sales Aggregation')} 
                className={`h-16 w-28 rounded-lg ${darkMode ? 'bg-dark-card border-gray-500' : 'bg-white border-gray-800'} border-2 flex items-center justify-center cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors duration-200`}
              >
                <span className={`text-sm text-center font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Sales Aggregation</span>
              </div>
              
              <div 
                onClick={() => handleBoxClick('/services/4', 'One Identity')} 
                className={`h-16 w-28 rounded-lg ${darkMode ? 'bg-dark-card border-gray-500' : 'bg-white border-gray-800'} border-2 flex items-center justify-center cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors duration-200`}
              >
                <span className={`text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>One Identity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganisationalGrid;