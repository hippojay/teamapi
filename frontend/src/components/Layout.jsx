import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, Home as HomeIcon, Database, Layers, User, LogIn, LogOut, ChevronRight } from 'lucide-react';
import CustomGrid from './CustomGrid';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  // Make login modal function available globally for the sidebar
  window.showLoginModal = () => setShowLoginModal(true);
  
  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      {/* Top Header Bar - Fixed Full Width */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm p-4 flex items-center z-30">
        <div className="w-1/3 flex items-center">
          <Link to="/" className="text-xl font-bold text-gray-800 no-underline flex items-center">
            <CustomGrid className="h-6 w-6 mr-2 text-blue-600" />
            Who What Where
          </Link>
        </div>
        
        <div className="w-1/3 flex justify-center">
          <SearchBar />
        </div>
        
        <div className="w-1/3 flex justify-end">  
          {/* Space for future elements like notifications or help */}
        </div>
      </div>

      {/* Use the new Sidebar component */}
      <Sidebar isCollapsed={isSidebarCollapsed} toggleCollapse={toggleSidebar} />
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
      
      {/* Main Content - Adjusted with dynamic left margin for sidebar and top margin for header */}
      <div className={`flex-1 flex flex-col ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} mt-16 transition-all duration-300 ease-in-out`}>
        {/* Content - No extra margin needed on top now */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t p-4 text-center text-xs text-gray-500">
          <p>&copy; 2025 Who What Where - v1.0</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;