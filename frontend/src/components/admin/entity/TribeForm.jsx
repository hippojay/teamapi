import React, { useState, useEffect } from 'react';
import api from '../../../api';

const TribeForm = ({ tribe, areaId, onSave, onCancel, darkMode }) => {
  const [formData, setFormData] = useState({
    name: tribe?.name || '',
    description: tribe?.description || '',
    label: tribe?.label || null,
    area_id: areaId || tribe?.area_id || null,
    member_count: tribe?.member_count || 0,
    core_count: tribe?.core_count || 0,
    subcon_count: tribe?.subcon_count || 0,
    total_capacity: tribe?.total_capacity || 0,
    core_capacity: tribe?.core_capacity || 0,
    subcon_capacity: tribe?.subcon_capacity || 0
  });

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const labelOptions = [
    { value: 'cfu_aligned', label: 'CFU Aligned' },
    { value: 'platform_group', label: 'Platform Group' },
    { value: 'digital', label: 'Digital' }
  ];

  // Load areas when component mounts
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoading(true);
        const data = await api.getAreas();
        setAreas(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching areas:', err);
        setError('Failed to load areas');
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle number fields
    if (['member_count', 'core_count', 'subcon_count', 'total_capacity', 'core_capacity', 'subcon_capacity'].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } 
    // Handle area_id
    else if (name === 'area_id') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || null
      });
    }
    // Handle other fields
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleLabelChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      label: value === 'none' ? null : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`space-y-4 p-4 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
    >
      {error && (
        <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <label 
          htmlFor="name"
          className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Tribe Name*
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          placeholder="Enter tribe name"
        />
      </div>

      <div>
        <label 
          htmlFor="description"
          className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows="3"
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          placeholder="Enter tribe description"
        />
      </div>

      <div>
        <label 
          htmlFor="area_id"
          className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Area*
        </label>
        <select
          id="area_id"
          name="area_id"
          value={formData.area_id || ''}
          onChange={handleChange}
          required
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          disabled={loading}
        >
          <option value="">-- Select Area --</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label 
          htmlFor="label"
          className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Tribe Label
        </label>
        <select
          id="label"
          name="label"
          value={formData.label || 'none'}
          onChange={handleLabelChange}
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
        >
          <option value="none">-- No Label --</option>
          {labelOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hidden advanced fields that are typically set by the system */}
      <input type="hidden" name="member_count" value={formData.member_count} />
      <input type="hidden" name="core_count" value={formData.core_count} />
      <input type="hidden" name="subcon_count" value={formData.subcon_count} />
      <input type="hidden" name="total_capacity" value={formData.total_capacity} />
      <input type="hidden" name="core_capacity" value={formData.core_capacity} />
      <input type="hidden" name="subcon_capacity" value={formData.subcon_capacity} />

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 border rounded ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
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
  );
};

export default TribeForm;
