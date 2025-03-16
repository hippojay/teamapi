import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, Save, CheckCircle } from 'lucide-react';
import { formatRole, getRoleBadgeClasses } from '../utils/roleUtils';
import api from '../api';

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const { darkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const response = await api.updateProfile(formData);
      setSuccess('Profile updated successfully');
      updateUserData(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    // Password validation
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(passwordData.newPassword)) {
      setPasswordError('Password must include uppercase, lowercase, number, and special character');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      await api.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className={`container mx-auto mt-16 p-4 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }
  
  return (
    <div className={`container mx-auto mt-16 p-6 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
      <h1 className="text-3xl font-bold mb-8">Your Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-dark-tertiary border border-dark-border' : 'bg-white border border-gray-200'}`}>
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          {success && (
            <div className={`mb-4 p-3 rounded flex items-center ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'}`}>
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}
          
          {error && (
            <div className={`mb-4 p-3 rounded flex items-center ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block font-medium mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-dark-secondary border-dark-border text-dark-primary' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled
              />
              <p className="text-sm mt-1 text-gray-500">Email cannot be changed</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="username" className="block font-medium mb-1">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-dark-secondary border-dark-border text-dark-primary' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="first_name" className="block font-medium mb-1">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-dark-secondary border-dark-border text-dark-primary' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label htmlFor="last_name" className="block font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-dark-secondary border-dark-border text-dark-primary' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
        
        {/* Change Password */}
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-dark-tertiary border border-dark-border' : 'bg-white border border-gray-200'}`}>
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          
          {passwordSuccess && (
            <div className={`mb-4 p-3 rounded flex items-center ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'}`}>
              <CheckCircle className="h-5 w-5 mr-2" />
              {passwordSuccess}
            </div>
          )}
          
          {passwordError && (
            <div className={`mb-4 p-3 rounded flex items-center ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>
              <AlertCircle className="h-5 w-5 mr-2" />
              {passwordError}
            </div>
          )}
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block font-medium mb-1">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-dark-secondary border-dark-border text-dark-primary' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block font-medium mb-1">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-dark-secondary border-dark-border text-dark-primary' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
              <p className="text-sm mt-1 text-gray-500">
                Must be at least 8 characters and include uppercase, lowercase, number, and special character
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-dark-secondary border-dark-border text-dark-primary' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={passwordLoading}
              className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${
                passwordLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
        
        {/* Account Information */}
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-dark-tertiary border border-dark-border' : 'bg-white border border-gray-200'}`}>
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="space-y-3">
            <div>
              <span className="font-medium">Account Type:</span>{' '}
              <span className={`px-2 py-1 rounded text-sm ${getRoleBadgeClasses(user.role, darkMode)}`}>
                {formatRole(user.role)}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-1 rounded text-sm ${
                user.is_active 
                  ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' 
                  : darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Registered On:</span>{' '}
              <span>{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            
            <div>
              <span className="font-medium">Last Login:</span>{' '}
              <span>
                {user.last_login 
                  ? new Date(user.last_login).toLocaleDateString() + ' ' + new Date(user.last_login).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
