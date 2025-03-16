import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const OKRModal = ({ onClose, onSave, title, initialData = {}, entityType }) => {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    cascade: initialData.cascade || false
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Show cascade option only for Area or Tribe OKRs
  const showCascadeOption = entityType === 'area' || entityType === 'tribe';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg max-w-lg w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Objective title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              placeholder="Describe the objective (optional)"
            ></textarea>
          </div>
          
          {showCascadeOption && (
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cascade"
                  name="cascade"
                  checked={formData.cascade}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="text-sm" htmlFor="cascade">
                  Cascade this objective to {entityType === 'area' ? 'tribes and squads' : 'squads'}
                </label>
              </div>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                When enabled, this objective will be visible to all {entityType === 'area' ? 'tribes and squads' : 'squads'} within this {entityType}.
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OKRModal;
