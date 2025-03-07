import React, { useState, useEffect } from 'react';
import { Pencil, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ReactMarkdown from 'react-markdown';

const DescriptionEditor = ({ entityType, entityId, initialDescription, onDescriptionUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(initialDescription || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Update local state when initialDescription prop changes
  useEffect(() => {
    setDescription(initialDescription || '');
  }, [initialDescription]);
  
  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    
    try {
      await api.updateDescription(entityType, entityId, description);
      setIsEditing(false);
      // Call the callback to update parent component
      if (onDescriptionUpdated) {
        onDescriptionUpdated(description);
      }
    } catch (err) {
      setError('Failed to save changes. Please try again.');
      console.error('Error saving description:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    // Reset to initial value and exit edit mode
    setDescription(initialDescription || '');
    setIsEditing(false);
    setError('');
  };
  
  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
          placeholder="Enter description (markdown supported)"
        />
        
        <div className="mt-3 flex justify-end space-x-2">
          <button
            onClick={handleCancel}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-3 py-2 text-white rounded-md flex items-center
              ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="prose max-w-none">
        {description ? (
          <ReactMarkdown>{description}</ReactMarkdown>
        ) : (
          <p className="text-gray-500 italic">No description available.</p>
        )}
      </div>
      
      {isAuthenticated && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-0 right-0 p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md"
          title="Edit description"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default DescriptionEditor;
