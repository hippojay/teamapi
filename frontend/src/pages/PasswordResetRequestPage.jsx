import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const PasswordResetRequestPage = () => {
  const { darkMode } = useTheme();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.requestPasswordReset(email);
      setSuccess(response.message || 'If your email is registered, you will receive password reset instructions.');
      setEmail('');
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-dark-secondary text-dark-primary' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-xl w-full max-w-md`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <Link 
            to="/login" 
            className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            title="Back to login"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
        
        {success ? (
          <div className="text-center py-8">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'}`}>
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
            <p className="mb-6">{success}</p>
            
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              If you don't receive an email within a few minutes, check your spam folder or try again.
            </p>
            
            <div className="mt-6">
              <Link 
                to="/login" 
                className={`inline-flex items-center px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-6">Enter your email address and we'll send you instructions to reset your password.</p>
            
            {error && (
              <div className={`mb-6 p-3 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-md flex items-center`}>
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Remember your password?{' '}
                <Link to="/login" className="text-blue-500 hover:text-blue-700">
                  Log in
                </Link>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordResetRequestPage;
