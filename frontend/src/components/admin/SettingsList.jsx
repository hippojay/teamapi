import React from 'react';
import { Edit, Plus } from 'lucide-react';
import SettingEditForm from './SettingEditForm';

const SettingsList = ({
  settings,
  editingSettings,
  handleEditSetting,
  handleSaveSetting,
  setShowAddSettingModal,
  darkMode
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>System Settings</h3>
        </div>
        <button
          onClick={() => setShowAddSettingModal(true)}
          className={`flex items-center px-3 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Setting
        </button>
      </div>
      
      <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
        <table className={`min-w-full divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
          <thead className={darkMode ? 'bg-dark-tertiary' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Key</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Value</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Description</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Last Updated</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${darkMode ? 'divide-y divide-dark-border' : 'divide-y divide-gray-200'}`}>
            {settings.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">No settings found</td>
              </tr>
            ) : (
              settings.map(setting => (
                <tr key={setting.id} className={darkMode ? 'bg-dark-secondary' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{setting.key}</td>
                  <td className="px-6 py-4">
                    {editingSettings[setting.key] !== undefined ? (
                      <SettingEditForm 
                        setting={setting} 
                        value={editingSettings[setting.key]} 
                        onChange={(value) => handleEditSetting(setting.key, value)} 
                        darkMode={darkMode} 
                      />
                    ) : (
                      <div>
                        <div className="text-sm whitespace-pre-wrap">{setting.value}</div>
                        {setting.key === 'allowed_email_domains' && (
                          <div className="text-xs mt-1 text-gray-500">
                            Only users with email addresses from these domains can register.
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 whitespace-pre-wrap">{setting.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(setting.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingSettings[setting.key] !== undefined ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleSaveSetting(setting.key, setting.description)}
                          className={`p-1 rounded ${
                            darkMode 
                              ? 'bg-green-800 text-green-200 hover:bg-green-700' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          title="Save"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            const newSettings = {...editingSettings};
                            delete newSettings[setting.key];
                            handleEditSetting(setting.key, undefined);
                          }}
                          className={`p-1 rounded ${
                            darkMode 
                              ? 'bg-red-900 text-red-200 hover:bg-red-800' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title="Cancel"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditSetting(setting.key, setting.value)}
                        className={`p-1 rounded ${
                          darkMode 
                            ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        title="Edit setting"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SettingsList;
