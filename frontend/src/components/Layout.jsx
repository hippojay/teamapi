import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, Home as HomeIcon, Database, Layers, User, LogIn, LogOut, ChevronRight } from 'lucide-react';
import CustomGrid from './CustomGrid';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import SearchBar from './SearchBar';

const Layout = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const userMenuRef = useRef(null);

  // Create a separate ref for the dropdown menu
  const dropdownRef = useRef(null);

  // Handle click outside of user menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if clicking outside both the button and dropdown
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target))
      ) {
        setShowUserMenu(false);
      }
    };

    // Add event listener when the menu is shown
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Function to check if a route is active
  const isActive = (path) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed */}
      <div className="fixed h-full w-64 bg-white border-r shadow-sm flex flex-col z-20 overflow-y-auto">
        {/* Logo/App Name */}
        <div className="p-6 border-b">
          <Link to="/" className="text-xl font-bold text-gray-800 no-underline flex items-center">
            <CustomGrid className="h-6 w-6 mr-2 text-blue-600" />
            Who What Where
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 pt-6">
          <ul className="space-y-1">
            <li>
              <Link 
                to="/" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <HomeIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">Home</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/areas" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/areas') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <CustomGrid className="h-5 w-5 mr-3" />
                <span className="font-medium">Areas</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/tribes" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/tribes') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Layers className="h-5 w-5 mr-3" />
                <span className="font-medium">Tribes</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/squads" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/squads') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Users className="h-5 w-5 mr-3" />
                <span className="font-medium">Squads</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/services" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/services') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Database className="h-5 w-5 mr-3" />
                <span className="font-medium">Services</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/users" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/users') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                <span className="font-medium">Team Members</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Footer with Authentication Controls */}
        <div className="mt-auto p-4 border-t text-xs text-gray-500">
          <p className="mb-3">Who What Where - v1.0</p>
          
          {!isAuthenticated ? (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center justify-center space-x-2 p-2 text-blue-600 hover:bg-blue-50 border shadow-sm rounded-md transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Log In</span>
            </button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center justify-between p-2 text-gray-700 hover:bg-gray-100 border shadow-sm rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <User className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-sm">{user?.username}</span>
                </div>
                <ChevronRight className="h-3 w-3" />
              </button>
              
              {showUserMenu && createPortal(
                <div 
                  ref={dropdownRef}
                  className="fixed bg-white rounded-md shadow-xl border overflow-hidden z-[9999]"
                  style={{
                    left: userMenuRef.current ? userMenuRef.current.getBoundingClientRect().right + 8 + 'px' : '16rem',
                    top: userMenuRef.current ? userMenuRef.current.getBoundingClientRect().top + 'px' : 'auto',
                    width: '12rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <button
                    onClick={(e) => {
                      // Stop event propagation to prevent click-outside from triggering
                      e.stopPropagation();
                      console.log("Logout clicked");
                      
                      try {
                        // Perform logout
                        logout();
                        // Ensure user state is cleared by checking localStorage
                        localStorage.removeItem('token');
                        console.log("Logout successful");
                        
                        // Close menu and navigate to home after a short delay
                        setShowUserMenu(false);
                        
                        // Small timeout to ensure state updates before navigation
                        setTimeout(() => {
                          navigate('/');
                          window.location.reload(); // Force a refresh to ensure new state takes effect
                        }, 100);
                      } catch (error) {
                        console.error("Logout error:", error);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Log out</span>
                  </button>
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
        
        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
          />
        )}
      </div>
      
      {/* Main Content - Adjusted with left margin for sidebar */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header - Fixed */}
        <header className="fixed top-0 right-0 left-64 bg-white border-b shadow-sm p-4 flex justify-between items-center z-20">
          <div className="w-2/5">
            <h1 className="text-xl font-bold text-gray-800">
              {/* Dynamic Page Title */}
              {currentPath === '/' ? 'Home' : 
               currentPath.startsWith('/areas') ? 'Areas' :
               currentPath.startsWith('/tribes') ? 'Tribes' :
               currentPath.startsWith('/squads') ? 'Squads' :
               currentPath.startsWith('/services') ? 'Services' :
               currentPath.startsWith('/users') ? 'Team Members' : 'Who What Where'}
            </h1>
          </div>
          
          <div className="w-3/5 flex justify-end">
            <SearchBar />
          </div>
        </header>
        
        {/* Content - Adjusted with top margin for header */}
        <main className="flex-1 p-6 mt-16 overflow-auto">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t p-4 text-center text-gray-600">
          <p>&copy; 2025 Who What Where - Team API Portal</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
