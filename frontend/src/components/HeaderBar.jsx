import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, User, LogOut, Settings, Key } from 'lucide-react';
import CustomGrid from './CustomGrid';
import SearchBar from './SearchBar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isAdmin, isTeamMember } from '../utils/roleUtils';

const HeaderBar = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const handleProfileClick = () => {
    setProfileOpen(!profileOpen);
  };

  return (
    <div className={`fixed top-0 left-0 right-0 ${darkMode ? 'bg-dark-secondary border-dark-border' : 'bg-white border-gray-200'} border-b shadow-sm p-4 flex items-center z-30 transition-colors duration-200`}>
      <div className="w-1/3 flex items-center">
        <Link to="/" className={`text-xl font-bold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} no-underline flex items-center transition-colors duration-200`}>
          <CustomGrid className="h-6 w-6 mr-2 text-blue-600" />
          Who What Where
        </Link>
      </div>
      
      <div className="w-1/3 flex justify-center">
        <SearchBar />
      </div>
      
      <div className="w-1/3 flex justify-end items-center">  
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors mr-3`}
          aria-label="Toggle dark mode"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User Profile Button and Dropdown */}
        {isAuthenticated ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={handleProfileClick}
              className={`flex items-center p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              aria-label="User profile"
              title="Profile"
            >
              <User className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </button>

            {profileOpen && (
              <div 
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${darkMode ? 'bg-dark-tertiary border border-dark-border' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50`}
              >
                <div className={`px-4 py-2 text-sm ${darkMode ? 'text-dark-primary' : 'text-gray-700'} border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
                  <div className="font-semibold">{user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                
                
                {isTeamMember(user) && (
                  <Link 
                    to="/users/me"
                    className={`flex items-center px-4 py-2 text-sm ${darkMode ? 'text-dark-primary hover:bg-dark-hover' : 'text-gray-700 hover:bg-gray-100'} w-full text-left`}
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                )}

                  <Link 
                  to="/profile"
                  className={`flex items-center px-4 py-2 text-sm ${darkMode ? 'text-dark-primary hover:bg-dark-hover' : 'text-gray-700 hover:bg-gray-100'} w-full text-left`}
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  My Settings
                </Link>


                {isAdmin(user) && (
                  <Link 
                    to="/admin"
                    className={`flex items-center px-4 py-2 text-sm ${darkMode ? 'text-dark-primary hover:bg-dark-hover' : 'text-gray-700 hover:bg-gray-100'} w-full text-left`}
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Settings
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className={`flex items-center px-4 py-2 text-sm ${darkMode ? 'text-dark-primary hover:bg-dark-hover' : 'text-gray-700 hover:bg-gray-100'} w-full text-left`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className={`flex items-center px-3 py-1 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
          >
            <Key className="h-4 w-4 mr-1" />
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default HeaderBar;
