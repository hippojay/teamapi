import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const KeyResultModal = ({ onClose, onSave, title, initialData = {} }) => {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    content: initialData.content || '',
    current_value: initialData.current_value !== undefined ? initialData.current_value : 0,
    target_value: initialData.target_value !== undefined ? initialData.target_value : 100,
    position: initialData.position || 1
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to proper floats
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
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
    if (!formData.content.trim()) {
      newErrors.content = 'Key result content is required';
    }
    
    if (formData.target_value <= 0) {
      newErrors.target_value = 'Target value must be greater than zero';
    }
    
    if (formData.current_value < 0) {
      newErrors.current_value = 'Current value cannot be negative';
    }
    
    if (formData.position < 1) {
      newErrors.position = 'Position must be at least 1';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg max-w-lg w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="content">
              Key Result *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="2"
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${errors.content ? 'border-red-500' : ''}`}
              placeholder="What is the key result?"
            ></textarea>
            {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="position">
                Position
              </label>
              <input
                type="number"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                min="1"
                className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${errors.position ? 'border-red-500' : ''}`}
              />
              {errors.position && <p className="mt-1 text-sm text-red-500">{errors.position}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="current_value">
                Current Value
              </label>
              <input
                type="number"
                id="current_value"
                name="current_value"
                value={formData.current_value}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${errors.current_value ? 'border-red-500' : ''}`}
              />
              {errors.current_value && <p className="mt-1 text-sm text-red-500">{errors.current_value}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="target_value">
                Target Value *
              </label>
              <input
                type="number"
                id="target_value"
                name="target_value"
                value={formData.target_value}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${errors.target_value ? 'border-red-500' : ''}`}
              />
              {errors.target_value && <p className="mt-1 text-sm text-red-500">{errors.target_value}</p>}
            </div>
          </div>
          
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

export default KeyResultModal;
