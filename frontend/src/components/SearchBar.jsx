import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Users, Database, Layers, Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

// Debounce helper function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useTheme();
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Only search if there are at least 3 characters
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
      setIsLoading(true);
      api.search(debouncedSearchTerm)
        .then(data => {
          setResults(data.results);
          setIsOpen(true);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Search error:', error);
          setIsLoading(false);
        });
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Add ESC key event listener
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length >= 3) {
      setIsLoading(true);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    setResults([]);
  };

  const handleResultClick = (result) => {
    navigate(result.url);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Get the appropriate icon based on result type
  const getResultIcon = (type) => {
    switch (type) {
      case 'area':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'tribe':
        return <Layers className="h-4 w-4 text-green-600" />;
      case 'squad':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'person':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'service':
        return <Database className="h-4 w-4 text-red-600" />;
      default:
        return <SearchIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format type label
  const formatTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search teams, services, or people..."
          className={`pl-10 pr-10 py-2 border rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode 
              ? 'bg-dark-tertiary border-dark-border text-dark-primary placeholder-gray-500' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => searchTerm.length >= 3 && setIsOpen(true)}
        />
        <SearchIcon className={`absolute left-3 top-2.5 h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        
        {/* Clear button */}
        {searchTerm && (
          <button 
            className={`absolute right-3 top-2.5 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={clearSearch}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 mt-2 w-96 ${
          darkMode 
            ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
            : 'bg-white border-gray-200 text-gray-900'
        } rounded-lg shadow-lg border overflow-hidden right-0`}>
          <div className={`p-2 border-b ${darkMode ? 'bg-dark-secondary border-dark-border' : 'bg-gray-50 border-gray-200'}`}>
            <div className="text-sm font-medium">
            {isLoading ? (
            'Searching...'
            ) : results.length > 0 ? (
            `${results.length} results for "${searchTerm}"`
            ) : searchTerm.length >= 3 ? (
            `No results for "${searchTerm}"`
            ) : (
                'Type at least 3 characters to search'
                )}
              </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                {results.map(result => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`px-4 py-2 ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-gray-100'
                    } cursor-pointer`}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center">
                      {getResultIcon(result.type)}
                      <div className="ml-3 flex-grow">
                        <div className="font-medium">{result.name}</div>
                        <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} flex justify-between`}>
                          <span>{result.parent_name || (result.description?.length > 30 ? result.description.substring(0, 30) + '...' : result.description)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode 
                              ? 'bg-gray-700 text-gray-300' 
                              : 'bg-gray-200 text-gray-700'
                          } ml-2`}>
                            {formatTypeLabel(result.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isLoading && (
              <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;