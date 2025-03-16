import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import OKRModal from './OKRModal';
import KeyResultItem from './KeyResultItem';
import KeyResultModal from './KeyResultModal';

const OKRItem = ({
  objective,
  entityType,
  onUpdateObjective,
  onDeleteObjective,
  onAddKeyResult,
  onUpdateKeyResult,
  onDeleteKeyResult
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddKRModal, setShowAddKRModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  // Calculate overall progress for the objective based on key results
  const calculateProgress = () => {
    if (!objective.key_results || objective.key_results.length === 0) {
      return 0;
    }

    const totalProgress = objective.key_results.reduce((sum, kr) => {
      const progress = kr.current_value / kr.target_value * 100;
      return sum + progress;
    }, 0);

    return totalProgress / objective.key_results.length;
  };

  const progress = calculateProgress();
  
  // Get the source entity label
  const getSourceLabel = () => {
    if (objective.area_id && entityType !== 'area') {
      // Get the area name if available, otherwise just show 'Area' (update: now Tribe)
      return 'Tribe OKR';
    } else if (objective.tribe_id && entityType !== 'tribe' && entityType !== 'area') {
      // Get the tribe name if available, otherwise just show 'Tribe' (update: now cluster)
      return 'Cluster OKR';
    }
    return null;
  };

  // Determine if this is a cascaded OKR
  const isCascaded = () => {
    if (objective.cascade) {
      // For tribe: cascaded if from area and we're viewing a tribe
      if (entityType === 'tribe' && objective.area_id) {
        return true;
      }
      // For squad: cascaded if from area or tribe and we're viewing a squad
      if (entityType === 'squad' && (objective.area_id || objective.tribe_id)) {
        return true;
      }
    }
    return false;
  };

  const cascadeLabel = getSourceLabel();
  const showCascadeLabel = isCascaded() && cascadeLabel;

  return (
    <div className={`border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg overflow-hidden mb-3`}>
      {/* Objective header */}
      <div 
        className={`py-2 px-3 flex justify-between items-start cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center">
            <span className="mr-2 px-2 py-1 text-xs rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              O
            </span>
            <h3 className="font-medium">{objective.content}</h3>
            {showCascadeLabel && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200 font-semibold">
                {cascadeLabel}
              </span>
            )}
            {objective.cascade && !showCascadeLabel && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 font-semibold">
                Cascaded
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {/* Progress circle */}
          <div className="relative h-10 w-10 flex items-center justify-center">
            <svg className="h-10 w-10" viewBox="0 0 36 36">
              {/* Background circle */}
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                fill="none" 
                className={`stroke-current ${darkMode ? 'text-gray-700' : 'text-gray-200'}`} 
                strokeWidth="4" 
              />
              {/* Progress circle - always visible even at 0% */}
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                fill="none" 
                className={`stroke-current ${progress === 0 ? (darkMode ? 'text-gray-500' : 'text-gray-400') : 'text-blue-500'}`} 
                strokeWidth="4" 
                strokeDasharray="100" 
                strokeDashoffset={progress === 0 ? 99.9 : (100 - progress)} 
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
                {Math.round(progress)}%
              </text>
            </svg>
          </div>
          
          {/* Expand/collapse icon */}
          <div className="w-5 h-5 flex items-center justify-center">
            <svg 
              className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Key Results (expanded view) */}
      {expanded && (
        <div className={`py-2 px-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3">
            <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Key Results</h4>
            {isAuthenticated && (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddKRModal(true);
                  }}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Key Result
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {objective.key_results.length === 0 ? (
            <p className={`text-sm py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No key results defined for this objective.
            </p>
          ) : (
            <div className="space-y-1">
              {objective.key_results
                .slice() // Create a copy to avoid mutating the original array
                .sort((a, b) => (a.position || 1) - (b.position || 1)) // Sort by position
                .map((kr, index) => (
                  <KeyResultItem
                    key={kr.id}
                    keyResult={{...kr, displayPosition: index + 1}} // Pass the display position
                    objectiveId={objective.id}
                    onUpdate={onUpdateKeyResult}
                    onDelete={(krId) => onDeleteKeyResult(objective.id, krId)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Objective Modal */}
      {showEditModal && (
        <OKRModal
          onClose={() => setShowEditModal(false)}
          onSave={(data) => {
            onUpdateObjective({ ...data, id: objective.id });
            setShowEditModal(false);
          }}
          title="Edit Objective"
          initialData={objective}
          entityType={entityType}
        />
      )}

      {/* Add Key Result Modal */}
      {showAddKRModal && (
        <KeyResultModal
          onClose={() => setShowAddKRModal(false)}
          onSave={(data) => {
            onAddKeyResult(objective.id, data);
            setShowAddKRModal(false);
          }}
          title="Add Key Result"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete this objective and all its associated key results? This action cannot be undone.
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
                  onDeleteObjective(objective.id);
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

export default OKRItem;
