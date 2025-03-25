import React from 'react';

const AddSettingModal = ({ showAddSettingModal, setShowAddSettingModal, newSetting, setNewSetting, handleAddSetting, darkMode }) => {
  if (!showAddSettingModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-xl w-full max-w-md p-6 ${darkMode ? 'bg-dark-secondary' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4">Add New Setting</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Key</label>
            <input
              type="text"
              value={newSetting.key}
              onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="allowed_email_domains"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <textarea
              value={newSetting.value}
              onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300 text-gray-900'}`}
              rows="4"
              placeholder="example.com
gmail.com
domain.org"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={newSetting.description}
              onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300 text-gray-900'}`}
              rows="2"
              placeholder="Description of this setting..."
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowAddSettingModal(false)}
            className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Cancel
          </button>
          
          <button
            onClick={handleAddSetting}
            className={`px-4 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            Add Setting
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSettingModal;
