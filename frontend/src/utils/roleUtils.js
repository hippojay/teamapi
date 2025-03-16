/**
 * Role utility functions to handle different role formats
 */

/**
 * Check if user has admin role, handling different formats
 * @param {Object} user - User object
 * @returns {boolean} - True if user has admin role
 */
export const isAdmin = (user) => {
  if (!user || !user.role) return false;
  
  const role = user.role.toLowerCase();
  return role === 'admin' || user.is_admin === true;
};

/**
 * Check if user has team member role, handling different formats
 * @param {Object} user - User object
 * @returns {boolean} - True if user has team member role
 */
export const isTeamMember = (user) => {
  if (!user || !user.role) return false;
  
  const role = user.role.toLowerCase();
  return role === 'team_member';
};

/**
 * Format role for display
 * @param {string} role - Role from backend
 * @returns {string} - Formatted role for display
 */
export const formatRole = (role) => {
  if (!role) return 'Guest';
  
  const lowerRole = role.toLowerCase();
  
  switch (lowerRole) {
    case 'admin':
      return 'Administrator';
    case 'team_member':
      return 'Team Member';
    default:
      return 'Guest';
  }
};

/**
 * Get CSS classes for role badge
 * @param {string} role - Role from backend
 * @param {boolean} darkMode - Dark mode flag
 * @returns {string} - CSS classes for role badge
 */
export const getRoleBadgeClasses = (role, darkMode) => {
  if (!role) return darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
  
  const lowerRole = role.toLowerCase();
  
  switch (lowerRole) {
    case 'admin':
      return darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800';
    case 'team_member':
      return darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
    default:
      return darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
  }
};
