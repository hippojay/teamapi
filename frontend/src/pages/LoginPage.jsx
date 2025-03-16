import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, UserPlus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
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
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-dark-secondary text-dark-primary' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-xl w-full max-w-md`}>
        <h2 className="text-2xl font-bold mb-6">Log In</h2>
        
        {error && (
          <div className={`mb-4 p-3 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-md`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>Username or Email</label>
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
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className={`${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>Password</label>
              <Link to="/reset-password-request" className="text-sm text-blue-500 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>
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
            className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Key className="h-4 w-4 mr-2" />
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-gray-300 text-center">
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Don't have an account?
          </p>
          <Link 
            to="/register" 
            className={`mt-2 inline-flex items-center px-4 py-2 rounded-md ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
