import React from 'react';
import { Users, Home as HomeIcon, Database, Layers, User, ChevronLeftCircle, ChevronRightCircle, Target } from 'lucide-react';
import CustomGrid from './CustomGrid';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;

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
    { path: '/areas', icon: (props) => <CustomGrid {...props} />, label: 'Tribes' },
    { path: '/tribes', icon: Layers, label: 'Clusters' },
    { path: '/squads', icon: Users, label: 'Squads' },
    { path: '/services', icon: Database, label: 'Services' },
    { path: '/users', icon: User, label: 'Team Members' },
    { path: '/okrs', icon: Target, label: 'OKRs' },
  ];

  return (
    <div 
      className={`fixed h-full ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${darkMode ? 'bg-dark-secondary border-dark-border' : 'bg-white border-gray-200'} border-r shadow-sm flex flex-col z-20 overflow-hidden pt-16 transition-all duration-300 ease-in-out`}
    >
      {/* Collapse toggle button */}
      <button 
        className={`absolute top-20 ${isCollapsed ? '-right-3' : '-right-3'} ${darkMode ? 'bg-dark-tertiary text-dark-primary hover:bg-gray-800' : 'bg-white text-gray-800 hover:bg-gray-100'} border ${darkMode ? 'border-dark-border' : 'border-gray-200'} rounded-full p-1 shadow-md transition-colors z-30`}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? 
          <ChevronRightCircle className="h-5 w-5 text-blue-600" /> : 
          <ChevronLeftCircle className="h-5 w-5 text-blue-600" />
        }
      </button>

      {/* Navigation */}
      <nav className="flex-1 pt-6 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={`flex items-center ${isCollapsed ? 'justify-center px-4' : 'px-6'} py-3 ${darkMode ? 'text-dark-primary hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'} hover:text-blue-600 ${
                  isActive(item.path) 
                    ? `${darkMode ? 'bg-gray-800' : 'bg-blue-50'} text-blue-600 ${isCollapsed ? 'border-r-2' : 'border-r-4'} border-blue-600` 
                    : ''
                } transition-colors`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      

      
      {/* Footer with Version Information */}
      <div className={`mt-auto p-4 border-t ${darkMode ? 'border-dark-border text-dark-secondary' : 'border-gray-200 text-gray-500'} text-xs ${isCollapsed ? 'text-center' : ''}`}>
        {!isCollapsed && <p className="text-center">Who What Where - v1.0</p>}
      </div>
    </div>
  );
};

export default Sidebar;