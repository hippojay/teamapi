import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Check, X, LogIn, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

// Helper function to get query params
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const EmailVerificationPage = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const query = useQuery();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Get token and email from URL query params
  const token = query.get('token');
  const email = query.get('email');

  useEffect(() => {
    // Only verify if both token and email are present
    if (token && email) {
      verifyEmail();
    } else {
      setError('Missing verification information. Please use the link from your email.');
    }
  }, [token, email]);

  const verifyEmail = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      await api.verifyEmail(email, token);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. The link may have expired or is invalid.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-dark-secondary text-dark-primary' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-xl w-full max-w-md`}>
        <h1 className="text-2xl font-bold mb-6 text-center">Email Verification</h1>
        
        {isVerifying ? (
          <div className="text-center py-8">
            <RefreshCw className={`animate-spin h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <p>Verifying your email address...</p>
          </div>
        ) : isSuccess ? (
          <div className="text-center">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'}`}>
              <Check className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Email Verified!</h2>
            <p className="mb-6">Your email has been successfully verified. You can now log in to your account.</p>
            
            <Link 
              to="/login" 
              className={`inline-flex items-center px-4 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
              <X className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="mb-6 text-red-500">{error}</p>
            
            <p className="mb-4">If you're having trouble verifying your email:</p>
            <ul className={`mb-6 list-disc text-left pl-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Make sure you're using the latest verification link sent to your email</li>
              <li>The verification link expires after 10 minutes</li>
              <li>Try registering again to receive a new verification link</li>
            </ul>
            
            <div className="space-x-4">
              <Link 
                to="/login" 
                className={`inline-flex items-center px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
              
              <Link 
                to="/register" 
                className={`inline-flex items-center px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Register Again
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
