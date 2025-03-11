import React, { useState, useRef } from 'react';
import { Info, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CompactTeamCompositionBar = ({ core_count, subcon_count, core_capacity, subcon_capacity, vacancy_count = 0 }) => {
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null);
  const { darkMode } = useTheme();
  
  // Calculate percentages for the bar
  const totalCapacity = core_capacity + subcon_capacity;
  const corePercentage = totalCapacity > 0 ? (core_capacity / totalCapacity * 100) : 0;
  const subconPercentage = totalCapacity > 0 ? (subcon_capacity / totalCapacity * 100) : 0;

  // Calculate percentages for team members
  const totalCount = core_count + subcon_count;
  const coreCountPercentage = totalCount > 0 ? (core_count / totalCount * 100) : 0;
  const subconCountPercentage = totalCount > 0 ? (subcon_count / totalCount * 100) : 0;

  return (
    <>
      <div className="flex items-center text-sm">
        <span className="flex items-center">
          <Users size={14} className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mr-1`} />
          <span className="font-normal">{totalCount} members</span>
        </span>
        <span className={`mx-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
        <span className="font-normal">{totalCapacity.toFixed(1)} FTE</span>
        <span className={`mx-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
        <span className="flex items-center">
        <div className="relative group">
          <div className={`h-4 w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden flex mx-1`}>
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${corePercentage}%` }}
            ></div>
            <div 
              className="h-full bg-orange-300" 
              style={{ width: `${subconPercentage}%` }}
            ></div>
          </div>
          
          {/* Combined tooltip on hover */}
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-auto whitespace-nowrap">
            <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 flex items-center justify-center">
              Core: {core_count} ({core_capacity.toFixed(1)} FTE) · 
              Contractors: {subcon_count} ({subcon_capacity.toFixed(1)} FTE)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
          <button 
            className="text-blue-500 hover:text-blue-700 ml-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModal(true);
            }}
            aria-label="Show team composition details"
          >
            <Info size={14} />
          </button>
        </span>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div 
            ref={modalRef} 
            className={`${darkMode ? 'bg-dark-card text-dark-primary' : 'bg-white text-gray-800'} p-6 rounded-lg shadow-lg max-w-md w-full`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Team Composition Details</h3>
              <button 
                className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowModal(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} pb-3`}>
                <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-2`}>Core Employees</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Members:</span>
                    <p className="font-medium text-emerald-500">{core_count}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Capacity:</span>
                    <p className="font-medium text-emerald-500">{core_capacity.toFixed(1)} FTE</p>
                  </div>
                </div>
              </div>
              
              <div className={`border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} pb-3`}>
                <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-2`}>Contractors</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Members:</span>
                    <p className="font-medium text-amber-500">{subcon_count}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Capacity:</span>
                    <p className="font-medium text-amber-500">{subcon_capacity.toFixed(1)} FTE</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-2`}>Totals</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Members:</span>
                    <p className="font-medium text-blue-500">{totalCount}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Capacity:</span>
                    <p className="font-medium text-blue-500">{totalCapacity.toFixed(1)} FTE</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Core/Subcon Ratio:</span>
                  <p className="font-medium text-blue-500">
                    {core_count > 0 
                      ? Math.round(coreCountPercentage)
                      : 0}% / {subcon_count > 0 
                      ? Math.round(subconCountPercentage)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
            
            {vacancy_count > 0 && (
            <div className={`border-t ${darkMode ? 'border-dark-border' : 'border-gray-200'} pt-3 mt-3`}>
            <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-2`}>Vacancies</h4>
            <div>
                <span className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>Open Positions:</span>
              <p className="font-medium text-yellow-500">{vacancy_count}</p>
              </div>
                <p className={`text-xs italic mt-1 ${darkMode ? 'text-dark-secondary' : 'text-gray-500'}`}>
                    Vacancies are not included in member counts or capacity calculations.
                  </p>
                </div>
              )}
              
              <div className="mt-6 text-right">
                <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={(e) => {
                    e.preventDefault();
                  e.stopPropagation();
                    setShowModal(false);
                }}
              >
                Close
              </button>
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompactTeamCompositionBar;