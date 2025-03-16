import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const RegisterForm = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined
      });
      
      setSuccessMessage(response.message || 'Registration successful! Please check your email to verify your account.');
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: ''
      });
    } catch (error) {
      if (error.response?.data?.detail) {
        if (error.response.data.detail.includes('Email domain not allowed')) {
          setErrors({ email: 'This email domain is not allowed for registration' });
        } else if (error.response.data.detail.includes('Email already registered')) {
          setErrors({ email: 'This email is already registered' });
        } else if (error.response.data.detail.includes('Password')) {
          setErrors({ password: error.response.data.detail });
        } else {
          setErrors({ general: error.response.data.detail });
        }
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-dark-secondary text-dark-primary' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-xl w-full max-w-md`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Create an Account</h2>
        <button 
          onClick={() => navigate('/login')} 
          className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          title="Back to login"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      
      {successMessage && (
        <div className={`mb-6 p-3 ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'} rounded-md flex items-center`}>
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {errors.general && (
        <div className={`mb-6 p-3 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-md flex items-center`}>
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                : 'bg-white border-gray-300 text-gray-900'
            } ${errors.email ? 'border-red-500' : ''}`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="first_name" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="last_name" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
            Password <span className="text-red-500">*</span>
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
            } ${errors.password ? 'border-red-500' : ''}`}
            required
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
          <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Must be at least 8 characters and include uppercase, lowercase, number, and special character
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className={`block ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-2`}>
            Confirm Password <span className="text-red-500">*</span>
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
            } ${errors.confirmPassword ? 'border-red-500' : ''}`}
            required
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !!successMessage}
          className={`w-full py-2 px-4 rounded-md text-white font-medium
            ${isLoading || successMessage 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-700">
            Log in
          </Link>
        </span>
      </div>
    </div>
  );
};

export default RegisterForm;
