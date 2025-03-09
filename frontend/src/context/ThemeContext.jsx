import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const ThemeContext = createContext(null);

// Provider component
export const ThemeProvider = ({ children }) => {
  // Check if user has a theme preference saved
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme === 'true';
  });

  // Apply dark mode class to html tag when theme changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Context value
  const themeContextValue = {
    darkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
