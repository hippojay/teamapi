import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { isTeamMember } from '../../utils/roleUtils';
import api from '../../api';

/**
 * Component that handles redirecting the current user to their team member profile
 * It first checks if they are a team member, and if so, attempts to find their
 * corresponding team member record based on email match, then redirects to that page
 */
const MyProfileRedirect = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const findUserProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (!isTeamMember(user)) {
        // Users who aren't team members get redirected to their settings page
        navigate('/profile');
        return;
      }
      
      try {
        // Fetch all team members and find the one with matching email
        const teamMembers = await api.getTeamMembers();
        
        // Find the team member with matching email (case insensitive)
        const teamMember = teamMembers.find(
          member => member.email && member.email.toLowerCase() === user.email.toLowerCase()
        );
        
        if (teamMember) {
          // Redirect to the team member's detail page
          navigate(`/users/${teamMember.id}`);
        } else {
          // If no matching team member found, redirect to profile page
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error finding team member profile:', error);
        setError('Failed to find your team member profile. Redirecting to settings.');
        // Add a slight delay before redirecting so user can see the error
        setTimeout(() => navigate('/profile'), 2000);
      } finally {
        setLoading(false);
      }
    };
    
    findUserProfile();
  }, [user, navigate]);
  
  if (loading) {
    return (
      <div className={`text-center py-16 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-blue-600 mb-4"></div>
        <div className="text-lg font-medium">Loading your profile...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`text-center py-16 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
        <div className={`mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
      </div>
    );
  }
  
  return null; // This component only handles the redirection
};

export default MyProfileRedirect;
