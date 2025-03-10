import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import HeaderBar from './HeaderBar';
import LoginModal from './LoginModal';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { darkMode } = useTheme();

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



  // Make login modal function available globally for the sidebar
  window.showLoginModal = () => setShowLoginModal(true);
  
  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-dark-primary text-dark-primary' : 'bg-gray-50 text-gray-800'} overflow-hidden transition-colors duration-200`}>
      {/* Top Header Bar */}
      <HeaderBar />

      {/* Use the new Sidebar component with dark mode support */}
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
        <footer className={`${darkMode ? 'bg-dark-secondary border-dark-border text-dark-secondary' : 'bg-white border-gray-200 text-gray-500'} border-t p-4 text-center text-xs transition-colors duration-200`}>
          <p>&copy; 2025 Who What Where - v1.0</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;