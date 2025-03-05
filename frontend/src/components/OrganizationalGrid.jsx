import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OrganizationalGrid = () => {
  const [selectedBox, setSelectedBox] = useState(null);
  const navigate = useNavigate();
  
  // Navigation handler
  const handleBoxClick = (path, areaName) => {
    setSelectedBox(areaName);
    navigate(path);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Organizational Structure</h2>
      
      <div className="relative border-2 border-gray-800 rounded-lg shadow-lg p-0 bg-gray-800">
        {/* Main grid container - using grid layout with black background for gaps */}
        <div className="grid grid-rows-3 gap-4 h-[600px] bg-gray-800 p-4">
          
          {/* Top Row - 2 equal boxes */}
          <div className="grid grid-cols-2 gap-4 h-full">
            <div 
              onClick={() => handleBoxClick('/areas/1', 'Digi-sales')} 
              className="bg-white rounded-none p-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200 h-full"
            >
              <span className="text-xl font-semibold text-gray-800">Digi-sales</span>
            </div>
            <div 
              onClick={() => handleBoxClick('/areas/2', 'DS&GT')} 
              className="bg-white rounded-none p-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200 h-full"
            >
              <span className="text-xl font-semibold text-gray-800">DS&GT</span>
            </div>
          </div>
          
          {/* Middle Row - 3 equal boxes */}
          <div className="grid grid-cols-3 gap-4 h-full">
            <div 
              onClick={() => handleBoxClick('/areas/3', 'Home')} 
              className="bg-white rounded-none p-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200 h-full"
            >
              <span className="text-xl font-semibold text-gray-800">Home</span>
            </div>
            <div 
              onClick={() => handleBoxClick('/areas/4', 'Mobile')} 
              className="bg-white rounded-none p-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200 h-full"
            >
              <span className="text-xl font-semibold text-gray-800">Mobile</span>
            </div>
            <div 
              onClick={() => handleBoxClick('/areas/5', 'New Markets')} 
              className="bg-white rounded-none p-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200 h-full"
            >
              <span className="text-xl font-semibold text-gray-800">New Markets</span>
            </div>
          </div>
          
          {/* Bottom Row - 1 box containing 4 rounded rectangles */}
          <div className="bg-white rounded-none p-4 flex items-center justify-center h-full">
            <div className="grid grid-cols-4 gap-6 w-full justify-items-center mx-auto">
              {/* Four rounded rectangles */}
              <div 
                onClick={() => handleBoxClick('/services/1', 'One Consumer')} 
                className="h-20 w-36 rounded-lg bg-white border-2 border-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="text-base font-medium text-gray-800">One Consumer</span>
              </div>
              
              <div 
                onClick={() => handleBoxClick('/services/2', 'One Contact')} 
                className="h-20 w-36 rounded-lg bg-white border-2 border-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="text-base font-medium text-gray-800">One Contact</span>
              </div>
              
              <div 
                onClick={() => handleBoxClick('/services/3', 'Sales Aggregation')} 
                className="h-20 w-36 rounded-lg bg-white border-2 border-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="text-base font-medium text-gray-800">Sales Aggregation</span>
              </div>
              
              <div 
                onClick={() => handleBoxClick('/services/4', 'One Identity')} 
                className="h-20 w-36 rounded-lg bg-white border-2 border-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="text-base font-medium text-gray-800">One Identity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-600">
        <p>Click on any area to navigate to its detailed view</p>
      </div>
    </div>
  );
};

export default OrganizationalGrid;