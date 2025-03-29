import React, { useState } from 'react';
import { Lock, Info } from 'lucide-react';

const RepositorySettings = ({ 
  settings, 
  editingSettings, 
  handleEditSetting, 
  handleSaveSetting, 
  darkMode 
}) => {
  // Extract GitLab settings
  const gitlabApiUrlSetting = settings.find(s => s.key === 'gitlab_api_url');
  const gitlabApiTokenSetting = settings.find(s => s.key === 'gitlab_api_token');

  // Track whether token is being shown
  const [showToken, setShowToken] = useState(false);

  // Check if GitLab API URL is being edited
  const isEditingGitlabUrl = editingSettings['gitlab_api_url'] !== undefined;
  
  // Check if GitLab API token is being edited
  const isEditingGitlabToken = editingSettings['gitlab_api_token'] !== undefined;

  // Format the token value for display
  const formatTokenValue = (value) => {
    if (!value) return '';
    if (showToken) return value;
    return '••••••••••••••••••••••••••';
  };

  return (
    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-dark-secondary border-dark-border' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
        Repository Search Configuration
      </h3>
      
      <div className="mb-6">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
          Configure GitLab API settings to enable repository search functionality.
        </p>
      </div>
      
      {/* GitLab API URL */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>
            GitLab API URL
          </label>
          {!isEditingGitlabUrl && (
            <button 
              onClick={() => handleEditSetting('gitlab_api_url', gitlabApiUrlSetting?.value || '')}
              className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              {gitlabApiUrlSetting ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        
        {isEditingGitlabUrl ? (
          <div>
            <input
              type="url"
              value={editingSettings['gitlab_api_url']}
              onChange={(e) => handleEditSetting('gitlab_api_url', e.target.value)}
              placeholder="https://gitlab.example.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button 
                onClick={() => {
                  const newSettings = {...editingSettings};
                  delete newSettings['gitlab_api_url'];
                  handleEditSetting('gitlab_api_url', undefined);
                }}
                className={`px-3 py-1 text-sm rounded ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveSetting('gitlab_api_url', 'GitLab API base URL for repository search')}
                className={`px-3 py-1 text-sm rounded ${
                  darkMode 
                    ? 'bg-green-800 text-green-200 hover:bg-green-700' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Save
              </button>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Info className="inline h-3 w-3 mr-1" />
              Example: https://gitlab.example.com (no trailing slash)
            </p>
          </div>
        ) : (
          <div className={`p-2 rounded-md ${darkMode ? 'bg-dark-tertiary' : 'bg-gray-50'}`}>
            {gitlabApiUrlSetting ? (
              <div className="flex items-center">
                <span className={`text-sm ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
                  {gitlabApiUrlSetting.value}
                </span>
              </div>
            ) : (
              <span className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Not configured
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* GitLab API Token */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>
            GitLab API Token
          </label>
          {!isEditingGitlabToken && (
            <button 
              onClick={() => handleEditSetting('gitlab_api_token', gitlabApiTokenSetting?.value || '')}
              className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              {gitlabApiTokenSetting ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        
        {isEditingGitlabToken ? (
          <div>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={editingSettings['gitlab_api_token']}
                onChange={(e) => handleEditSetting('gitlab_api_token', e.target.value)}
                placeholder="Enter GitLab API token"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                type="button"
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                onClick={() => setShowToken(!showToken)}
              >
                <Lock className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end mt-2 space-x-2">
              <button 
                onClick={() => {
                  const newSettings = {...editingSettings};
                  delete newSettings['gitlab_api_token'];
                  handleEditSetting('gitlab_api_token', undefined);
                  setShowToken(false);
                }}
                className={`px-3 py-1 text-sm rounded ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleSaveSetting('gitlab_api_token', 'GitLab API token for repository search (securely stored)');
                  setShowToken(false);
                }}
                className={`px-3 py-1 text-sm rounded ${
                  darkMode 
                    ? 'bg-green-800 text-green-200 hover:bg-green-700' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Save
              </button>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Info className="inline h-3 w-3 mr-1" />
              Create a token with api scope in your GitLab user settings
            </p>
          </div>
        ) : (
          <div className={`p-2 rounded-md ${darkMode ? 'bg-dark-tertiary' : 'bg-gray-50'}`}>
            {gitlabApiTokenSetting ? (
              <div className="flex items-center">
                <span className={`text-sm mr-2 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
                  {formatTokenValue(gitlabApiTokenSetting.value)}
                </span>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
            ) : (
              <span className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Not configured
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className={`mt-4 p-3 rounded-md border ${darkMode ? 'bg-dark-tertiary border-dark-border' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
          <Info className="h-4 w-4 mr-1" />
          Setup Information
        </h4>
        <ul className={`list-disc list-inside text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <li>GitLab API URL should be the base URL of your GitLab instance (e.g., https://gitlab.example.com)</li>
          <li>Token needs 'api' scope to search and read repositories</li>
          <li>For GitLab.com, use https://gitlab.com (no trailing slash)</li>
          <li>Both settings are required for repository search functionality to work</li>
        </ul>
      </div>
    </div>
  );
};

export default RepositorySettings;