import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const LoginModal = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useTheme();
  const { login } = useAuth();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        onClose();
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Using React Portal to render the modal at the document body level
  // This ensures it appears above all other UI elements regardless of
  // their z-index or position in the DOM hierarchy
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[9999]" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
      <div className={`${darkMode ? 'bg-dark-secondary text-dark-primary' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-xl w-full max-w-md relative`}>
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Log In</h2>
        
        {error && (
          <div className={`mb-4 p-3 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-md`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium
              ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default LoginModal;