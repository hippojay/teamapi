import React, { useState, useRef } from 'react';

const TeamCompositionBar = ({ core_count, subcon_count, core_capacity, subcon_capacity }) => {
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null);
  
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
      <div className="flex flex-col mb-4 p-3 bg-gray-50 rounded-lg cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="font-medium text-gray-700 mb-2">Team Composition:</div>
        <div className="h-8 w-full bg-gray-200 rounded-md overflow-hidden flex">
          {/* Core employees (green) */}
          <div 
            className="h-full bg-emerald-500" 
            style={{ 
              width: `${corePercentage}%` 
            }}
            title={`Core: ${core_count} members (${core_capacity.toFixed(1)} FTE)`}
          ></div>
          {/* Contractors (red) */}
          <div 
            className="h-full bg-red-500" 
            style={{ 
              width: `${subconPercentage}%` 
            }}
            title={`Contractors: ${subcon_count} members (${subcon_capacity.toFixed(1)} FTE)`}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <div>Core ({Math.round(corePercentage)}%)</div>
          <div></div>
          <div>Contractors ({Math.round(subconPercentage)}%)</div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={() => setShowModal(false)}
        >
          <div 
            ref={modalRef} 
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Team Composition Details</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={() => setShowModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h4 className="font-medium text-gray-800 mb-2">Core Employees</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-500">Members:</span>
                    <p className="font-medium text-emerald-600">{core_count}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <p className="font-medium text-emerald-600">{core_capacity.toFixed(1)} FTE</p>
                  </div>
                </div>
              </div>
              
              <div className="border-b pb-3">
                <h4 className="font-medium text-gray-800 mb-2">Contractors</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-500">Members:</span>
                    <p className="font-medium text-amber-600">{subcon_count}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <p className="font-medium text-amber-600">{subcon_capacity.toFixed(1)} FTE</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Totals</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-500">Members:</span>
                    <p className="font-medium text-blue-600">{core_count + subcon_count}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <p className="font-medium text-blue-600">{(core_capacity + subcon_capacity).toFixed(1)} FTE</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Core/Subcon Ratio:</span>
                  <p className="font-medium text-blue-600">
                    {core_count > 0 
                      ? Math.round(coreCountPercentage)
                      : 0}% / {subcon_count > 0 
                      ? Math.round(subconCountPercentage)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-right">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => setShowModal(false)}
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

export default TeamCompositionBar;
