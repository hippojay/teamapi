import React, { useState, useEffect } from 'react';
import api from '../../../api';

const SquadForm = ({ squad, tribeId, onSave, onCancel, darkMode }) => {
  const [formData, setFormData] = useState({
    name: squad?.name || '',
    description: squad?.description || '',
    status: squad?.status || 'Active',
    timezone: squad?.timezone || 'UTC',
    team_type: squad?.team_type || 'stream_aligned',
    tribe_id: tribeId || squad?.tribe_id || null,
    member_count: squad?.member_count || 0,
    core_count: squad?.core_count || 0,
    subcon_count: squad?.subcon_count || 0,
    total_capacity: squad?.total_capacity || 0,
    core_capacity: squad?.core_capacity || 0,
    subcon_capacity: squad?.subcon_capacity || 0,
    teams_channel: squad?.teams_channel || '',
    slack_channel: squad?.slack_channel || '',
    email_contact: squad?.email_contact || '',
    documentation_url: squad?.documentation_url || '',
    jira_board_url: squad?.jira_board_url || ''
  });

  const [tribes, setTribes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamTypeOptions = [
    { value: 'stream_aligned', label: 'Stream Aligned' },
    { value: 'platform', label: 'Platform' },
    { value: 'enabling', label: 'Enabling' },
    { value: 'complicated_subsystem', label: 'Complicated Subsystem' }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore' },
    { value: 'America/New_York', label: 'America/New_York' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Planning', label: 'Planning' },
    { value: 'Disbanded', label: 'Disbanded' }
  ];

  // Load tribes when component mounts
  useEffect(() => {
    const fetchTribes = async () => {
      try {
        setLoading(true);
        const data = await api.getTribes();
        setTribes(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tribes:', err);
        setError('Failed to load tribes');
        setLoading(false);
      }
    };

    fetchTribes();
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
    // Handle tribe_id
    else if (name === 'tribe_id') {
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
          Squad Name*
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          placeholder="Enter squad name"
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
          placeholder="Enter squad description"
        />
      </div>

      <div>
        <label 
          htmlFor="tribe_id"
          className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Tribe*
        </label>
        <select
          id="tribe_id"
          name="tribe_id"
          value={formData.tribe_id || ''}
          onChange={handleChange}
          required
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          disabled={loading}
        >
          <option value="">-- Select Tribe --</option>
          {tribes.map(tribe => (
            <option key={tribe.id} value={tribe.id}>
              {tribe.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="status"
            className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label 
            htmlFor="timezone"
            className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            {timezoneOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label 
          htmlFor="team_type"
          className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Team Type
        </label>
        <select
          id="team_type"
          name="team_type"
          value={formData.team_type}
          onChange={handleChange}
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
        >
          {teamTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Communication Channels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="teams_channel"
              className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Teams Channel
            </label>
            <input
              type="text"
              id="teams_channel"
              name="teams_channel"
              value={formData.teams_channel || ''}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="Teams channel name"
            />
          </div>

          <div>
            <label 
              htmlFor="slack_channel"
              className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Slack Channel
            </label>
            <input
              type="text"
              id="slack_channel"
              name="slack_channel"
              value={formData.slack_channel || ''}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="Slack channel name"
            />
          </div>
        </div>

        <div className="mt-2">
          <label 
            htmlFor="email_contact"
            className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Email Contact
          </label>
          <input
            type="email"
            id="email_contact"
            name="email_contact"
            value={formData.email_contact || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            placeholder="squad@example.com"
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Documentation Links
        </h3>
        <div className="space-y-2">
          <div>
            <label 
              htmlFor="documentation_url"
              className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Documentation URL
            </label>
            <input
              type="url"
              id="documentation_url"
              name="documentation_url"
              value={formData.documentation_url || ''}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="https://docs.example.com"
            />
          </div>

          <div>
            <label 
              htmlFor="jira_board_url"
              className={`block mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Jira Board URL
            </label>
            <input
              type="url"
              id="jira_board_url"
              name="jira_board_url"
              value={formData.jira_board_url || ''}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="https://jira.example.com/boards/123"
            />
          </div>
        </div>
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

export default SquadForm;
