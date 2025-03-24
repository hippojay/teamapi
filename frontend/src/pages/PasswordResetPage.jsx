import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowLeft, Key, RefreshCw, LogIn } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

// Helper function to get query params
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const PasswordResetPage = () => {
  const { darkMode } = useTheme();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const query = useQuery();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Get token from URL query params
  const token = query.get('token');

  useEffect(() => {
    // Validate token exists
    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      setIsValidating(false);
    } else {
      // Token validation would typically happen here
      // For now, we'll just assume the token is valid if it exists
      setIsValidating(false);
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors when user types
    if (validationError) {
      setValidationError('');
    }
  };
  
  const validate = () => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    // Check password complexity
    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      setValidationError('Password must include uppercase, lowercase, number, and special character');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validate()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await api.resetPassword(token, formData.password);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset failed. The link may have expired or is invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-dark-secondary text-dark-primary' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-xl w-full max-w-md text-center`}>
          <RefreshCw className={`animate-spin h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-dark-secondary text-dark-primary' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-xl w-full max-w-md`}>
        {!isSuccess ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Set New Password</h1>
              <Link 
                to="/login" 
                className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                title="Back to login"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>
            
            {error ? (
              <div className="text-center">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Reset Link Invalid</h2>
                <p className="mb-6 text-red-500">{error}</p>
                
                <p className="mb-4">Please try again with a new reset link:</p>
                
                <div className="space-x-4">
                  <Link 
                    to="/login" 
                    className={`inline-flex items-center px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                  
                  <Link 
                    to="/reset-password-request" 
                    className={`inline-flex items-center px-4 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Request New Link
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-6">Enter your new password below.</p>
                
                {validationError && (
                  <div className={`mb-6 p-3 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-md flex items-center`}>
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="password" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
                      New Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Must be at least 8 characters and include uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
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
                      ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'}`}>
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Password Reset Successful!</h2>
            <p className="mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
            
            <Link 
              to="/login" 
              className={`inline-flex items-center px-4 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetPage;
