import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import KeyResultModal from './KeyResultModal';

const KeyResultItem = ({ keyResult, objectiveId, onUpdate, onDelete }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  // Calculate progress percentage
  const progress = (keyResult.current_value / keyResult.target_value) * 100;
  const progressCapped = Math.min(Math.max(progress, 0), 100); // Ensure between 0-100%

  // Get progress color based on value
  const getProgressColor = () => {
    if (progressCapped === 0) return darkMode ? 'text-gray-500' : 'text-gray-400'; // More visible zero state
    if (progressCapped < 30) return 'text-red-500';
    if (progressCapped < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const progressBarColor = getProgressColor();

  return (
    <div className={`py-2 px-3 mb-1 border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'} rounded-lg`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center">
            <span className="mr-2 px-2 py-0.5 text-xs rounded-full font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              KR{keyResult.position || 1}
            </span>
            <h5 className="font-medium">{keyResult.content}</h5>
          </div>
        </div>
        
        <div className="flex items-center">
          {/* Progress circle */}
          <div className="flex items-center mr-2">
            <div className="relative h-8 w-8 flex items-center justify-center">
              <svg className="h-8 w-8" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="none" 
                  className={`stroke-current ${darkMode ? 'text-gray-700' : 'text-gray-200'}`} 
                  strokeWidth="3" 
                />
                {/* Progress circle - always visible even at 0% */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="none" 
                  className={`stroke-current ${progressBarColor}`} 
                  strokeWidth="3" 
                  strokeDasharray="100" 
                  strokeDashoffset={progressCapped === 0 ? 99.9 : (100 - progressCapped)} 
                  strokeLinecap="round" 
                  transform="rotate(-90 18 18)" 
                />
                {/* Percentage text */}
                <text 
                  x="18" 
                  y="18" 
                  dy=".35em" 
                  textAnchor="middle" 
                  className={`fill-current ${darkMode ? 'text-gray-200' : 'text-gray-800'} text-xs font-medium`}
                >
                  {Math.round(progressCapped)}%
                </text>
              </svg>
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="flex space-x-1">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-1 text-gray-500 hover:text-yellow-500"
                title="Edit Key Result"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1 text-gray-500 hover:text-red-500"
                title="Delete Key Result"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <KeyResultModal
          onClose={() => setShowEditModal(false)}
          onSave={(data) => {
            onUpdate({...data, id: keyResult.id, objective_id: objectiveId});
            setShowEditModal(false);
          }}
          title="Edit Key Result"
          initialData={keyResult}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete this key result? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(keyResult.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyResultItem;
