import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, GitBranch, FolderOpenDot, Plus, Check, AlertTriangle, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const RepositorySearchModal = ({ isOpen, onClose, onAddRepositories }) => {
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRepositories, setSelectedRepositories] = useState({});
  const [addedRepositories, setAddedRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Debounced search effect
  const debouncedSearch = useCallback(
    async (query) => {
      if (query.length < 3) {
        setSearchResults([]);
        setSearchPerformed(false);
        return;
      }

      setIsLoading(true);
      setError('');
      setSearchPerformed(true);
      
      try {
        const { results } = await api.searchRepositories(query);
        setSearchResults(results || []);
      } catch (err) {
        console.error('Error searching repositories:', err);
        setError('Failed to search repositories. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        debouncedSearch(searchTerm);
      } else {
        setSearchResults([]);
        setSearchPerformed(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Toggle repository selection
  const toggleRepositorySelection = (repo) => {
    setSelectedRepositories(prev => {
      const newSelection = { ...prev };
      if (newSelection[repo.id]) {
        delete newSelection[repo.id];
      } else {
        newSelection[repo.id] = repo;
      }
      return newSelection;
    });
  };

  // Add selected repositories to the right panel
  const addSelectedRepositories = () => {
    // Get all currently selected repositories
    const newRepos = Object.values(selectedRepositories);
    
    if (newRepos.length === 0) return;
    
    // Add the selected repositories to the right panel
    setAddedRepositories(prev => {
      // Create a map of existing repos for quick lookup
      const existingRepos = prev.reduce((acc, repo) => {
        acc[repo.id] = true;
        return acc;
      }, {});
      
      // Filter out any repositories that are already in the list
      const uniqueNewRepos = newRepos.filter(repo => !existingRepos[repo.id]);
      
      // Combine existing and new repositories
      return [...prev, ...uniqueNewRepos];
    });
    
    // Clear the selection
    setSelectedRepositories({});
  };

  // Remove a repository from the added list
  const removeAddedRepository = (repoId) => {
    setAddedRepositories(prev => prev.filter(repo => repo.id !== repoId));
  };

  // Finalize and add repositories to the service
  const finalizeAddRepositories = async () => {
    if (addedRepositories.length === 0) {
      setError('No repositories selected to add');
      return;
    }
    
    // For repositories, we need to fetch additional details
    try {
      const repoDetails = await Promise.all(
        addedRepositories
          .filter(repo => repo.type === 'repository')
          .map(async (repo) => {
            try {
              return await api.getRepositoryDetails(repo.id, repo.source);
            } catch (err) {
              console.error(`Error fetching details for repository ${repo.id}:`, err);
              // Return basic info if detailed fetch fails
              return {
                id: repo.id,
                name: repo.name,
                description: repo.description || '',
                url: repo.url || '',
                type: 'REPO',
                source: repo.source
              };
            }
          })
      );
      
      // Call the parent handler with the repository details
      onAddRepositories(repoDetails);
      onClose();
    } catch (err) {
      console.error('Error finalizing repositories:', err);
      setError('Failed to add repositories. Please try again.');
    }
  };

  // Reset everything when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedRepositories({});
      setAddedRepositories([]);
      setError('');
      setSearchPerformed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className={`w-full max-w-5xl max-h-[90vh] rounded-lg shadow-lg flex flex-col overflow-hidden ${
          darkMode ? 'bg-dark-card border border-dark-border' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} flex justify-between items-center`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
            Search and Add Repositories
          </h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className={`mx-4 mt-2 p-2 rounded-md ${
            darkMode ? 'bg-red-900 text-red-200 border border-red-800' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Split View */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Search */}
          <div className={`w-1/2 p-4 flex flex-col border-r ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
            <div className="mb-3">
              <div className={`flex items-center px-3 py-2 border rounded-md ${
                darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300'
              }`}>
                <Search className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search repositories (min 3 characters)"
                  className={`flex-1 outline-none ${
                    darkMode ? 'bg-dark-tertiary text-dark-primary placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className={`${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchTerm && searchTerm.length < 3 && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <Info className="inline h-3 w-3 mr-1" />
                  Enter at least 3 characters to search
                </p>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>
                Search Results
              </span>
              <button
                onClick={addSelectedRepositories}
                disabled={Object.keys(selectedRepositories).length === 0}
                className={`px-2 py-1 text-xs rounded-md flex items-center ${
                  Object.keys(selectedRepositories).length === 0
                    ? darkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Selected
              </button>
            </div>
            
            <div className={`flex-1 overflow-y-auto rounded-md border ${
              darkMode ? 'border-dark-border' : 'border-gray-200'
            }`}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className={`animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 ${
                    darkMode ? 'border-blue-400' : 'border-blue-500'
                  }`}></div>
                </div>
              ) : searchResults.length > 0 ? (
                <ul className={`divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  {searchResults.map(repo => (
                    <li key={`${repo.source}-${repo.id}`} className={`flex items-start p-3 ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!selectedRepositories[repo.id]}
                        onChange={() => toggleRepositorySelection(repo)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          {repo.type === 'repository' ? (
                            <GitBranch className={`h-4 w-4 mr-2 ${
                              darkMode ? 'text-blue-400' : 'text-blue-500'
                            }`} />
                          ) : (
                            <FolderOpenDot className={`h-4 w-4 mr-2 ${
                              darkMode ? 'text-yellow-500' : 'text-yellow-600'
                            }`} />
                          )}
                          <span className={`font-medium truncate ${
                            darkMode ? 'text-dark-primary' : 'text-gray-800'
                          }`}>
                            {repo.name}
                          </span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            repo.type === 'repository'
                              ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                              : darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {repo.type === 'repository' ? 'Repository' : 'Group'}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 truncate ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {repo.path}
                        </p>
                        {repo.description && (
                          <p className={`text-xs mt-1 ${
                            darkMode ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {repo.description.length > 100
                              ? `${repo.description.substring(0, 100)}...`
                              : repo.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : searchPerformed ? (
                <div className={`flex flex-col items-center justify-center h-full ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <p className="text-sm">No repositories found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-full ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Start typing to search for repositories</p>
                  <p className="text-xs mt-1">Search for repositories to add to the service</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Selected */}
          <div className="w-1/2 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <span className={`text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>
                Repositories to Add ({addedRepositories.length})
              </span>
            </div>
            
            <div className={`flex-1 overflow-y-auto rounded-md border ${
              darkMode ? 'border-dark-border' : 'border-gray-200'
            }`}>
              {addedRepositories.length > 0 ? (
                <ul className={`divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  {addedRepositories.map(repo => (
                    <li key={`${repo.source}-${repo.id}`} className={`flex items-start p-3 ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          {repo.type === 'repository' ? (
                            <GitBranch className={`h-4 w-4 mr-2 ${
                              darkMode ? 'text-blue-400' : 'text-blue-500'
                            }`} />
                          ) : (
                            <FolderOpenDot className={`h-4 w-4 mr-2 ${
                              darkMode ? 'text-yellow-500' : 'text-yellow-600'
                            }`} />
                          )}
                          <span className={`font-medium truncate ${
                            darkMode ? 'text-dark-primary' : 'text-gray-800'
                          }`}>
                            {repo.name}
                          </span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            repo.type === 'repository'
                              ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                              : darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {repo.type === 'repository' ? 'Repository' : 'Group'}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 truncate ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {repo.path}
                        </p>
                      </div>
                      <button
                        onClick={() => removeAddedRepository(repo.id)}
                        className={`ml-2 p-1 rounded-full ${
                          darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`flex flex-col items-center justify-center h-full ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <p className="text-sm">No repositories added yet</p>
                  <p className="text-xs mt-1">Select repositories from the left panel and click "Add Selected"</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t ${darkMode ? 'border-dark-border' : 'border-gray-200'} flex justify-end space-x-2`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 border rounded-md ${
              darkMode ? 'border-dark-border text-dark-primary hover:bg-dark-tertiary' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button 
            onClick={finalizeAddRepositories}
            disabled={addedRepositories.length === 0}
            className={`px-4 py-2 rounded-md flex items-center ${
              addedRepositories.length === 0
                ? darkMode ? 'bg-blue-900 text-blue-300 opacity-50 cursor-not-allowed' : 'bg-blue-400 text-white opacity-50 cursor-not-allowed'
                : darkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Check className="h-4 w-4 mr-1" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepositorySearchModal;