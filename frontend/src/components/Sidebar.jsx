import React from 'react';
import { Users, Home as HomeIcon, Database, Layers, User, LogIn, LogOut, ChevronRight, ChevronLeft, ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';
import CustomGrid from './CustomGrid';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const userMenuRef = React.useRef(null);
  const dropdownRef = React.useRef(null);

  // Handle click outside of user menu to close it
  React.useEffect(() => {
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

  // Navigation items data
  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/areas', icon: (props) => <CustomGrid {...props} />, label: 'Areas' },
    { path: '/tribes', icon: Layers, label: 'Tribes' },
    { path: '/squads', icon: Users, label: 'Squads' },
    { path: '/services', icon: Database, label: 'Services' },
    { path: '/users', icon: User, label: 'Team Members' },
  ];

  return (
    <div 
      className={`fixed h-full ${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-white border-r shadow-sm flex flex-col z-20 overflow-y-auto pt-16 transition-all duration-300 ease-in-out`}
    >
      {/* Collapse toggle button */}
      <button 
        className={`absolute top-20 ${isCollapsed ? '-right-3' : '-right-3'} bg-white border rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors z-30`}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? 
          <ChevronRightCircle className="h-5 w-5 text-blue-600" /> : 
          <ChevronLeftCircle className="h-5 w-5 text-blue-600" />
        }
      </button>

      {/* Navigation */}
      <nav className="flex-1 pt-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={`flex items-center ${isCollapsed ? 'justify-center px-4' : 'px-6'} py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${isActive(item.path) ? `bg-blue-50 text-blue-600 ${isCollapsed ? 'border-r-2' : 'border-r-4'} border-blue-600` : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Footer with Authentication Controls */}
      <div className={`mt-auto p-4 border-t text-xs text-gray-500 ${isCollapsed ? 'text-center' : ''}`}>
        {!isAuthenticated ? (
          <button 
            onClick={() => window.showLoginModal()}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-center space-x-2'
            } p-2 text-blue-600 hover:bg-blue-50 border shadow-sm rounded-md transition-colors mb-3`}
            title={isCollapsed ? "Log In" : ""}
          >
            <LogIn className="h-4 w-4" />
            {!isCollapsed && <span>Log In</span>}
          </button>
        ) : (
          <div className="relative mb-3" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center' : 'justify-between'
              } p-2 text-gray-700 hover:bg-gray-100 border shadow-sm rounded-md transition-colors`}
              title={isCollapsed ? user?.username : ""}
            >
              <div className="flex items-center">
                <User className="h-4 w-4 text-blue-600 mr-2" />
                {!isCollapsed && <span className="font-medium text-sm">{user?.username}</span>}
              </div>
              {!isCollapsed && <ChevronRight className="h-3 w-3" />}
            </button>
            
            {showUserMenu && createPortal(
              <div 
                ref={dropdownRef}
                className="fixed bg-white rounded-md shadow-xl border overflow-hidden z-[9999]"
                style={{
                  left: userMenuRef.current ? 
                    (isCollapsed ? 
                      userMenuRef.current.getBoundingClientRect().right + 8 + 'px' : 
                      userMenuRef.current.getBoundingClientRect().right + 8 + 'px') : 
                    (isCollapsed ? '4rem' : '16rem'),
                  top: userMenuRef.current ? userMenuRef.current.getBoundingClientRect().top + 'px' : 'auto',
                  width: '12rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      logout();
                      localStorage.removeItem('token');
                      setShowUserMenu(false);
                      setTimeout(() => {
                        navigate('/');
                        window.location.reload();
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
        
        {!isCollapsed && <p className="text-center">Who What Where - v1.0</p>}
      </div>
    </div>
  );
};

export default Sidebar;