import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TeamMembersList = ({ squad }) => {
  const { darkMode } = useTheme();
  
  // Helper function to get color based on capacity
  const getCapacityColor = (capacity) => {
    if (darkMode) {
      if (capacity > 1.0) {
        return "text-red-400"; // Over capacity (red)
      } else if (capacity >= 0.8) {
        return "text-green-400"; // Good capacity (green)
      } else if (capacity >= 0.5) {
        return "text-yellow-400"; // Medium capacity (yellow/amber)
      } else {
        return "text-gray-400"; // Low capacity (default gray)
      }
    } else {
      if (capacity > 1.0) {
        return "text-red-600"; // Over capacity (red)
      } else if (capacity >= 0.8) {
        return "text-green-600"; // Good capacity (green)
      } else if (capacity >= 0.5) {
        return "text-yellow-600"; // Medium capacity (yellow/amber)
      } else {
        return "text-gray-600"; // Low capacity (default gray)
      }
    }
  };

  // Helper function to render a team member card
  const renderMemberCard = (member) => {
    // Check if it's a vacancy
    const isVacancy = member.is_vacancy;
    
    // For vacancies, use a div instead of a Link, and apply different styling
    const CardComponent = isVacancy ? 'div' : Link;
    
    // Calculate the props for the component
    const componentProps = isVacancy ? {
      key: member.id,
      className: `p-3 border-2 border-dashed rounded-lg flex items-center ${darkMode ? 'border-yellow-500 bg-yellow-900/10 opacity-75' : 'border-yellow-400 bg-yellow-50 opacity-75'}`
    } : {
      key: member.id,
      to: `/users/${member.id}`,
      className: `p-3 border rounded-lg flex items-center ${darkMode ? 'border-dark-border hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} cursor-pointer`
    };
    
    return (
      <CardComponent {...componentProps}>
        <div className={`${darkMode ? isVacancy ? 'bg-yellow-800' : 'bg-blue-900' : isVacancy ? 'bg-yellow-200' : 'bg-blue-100'} p-2 rounded-full mr-3`}>
          <Users className={`h-4 w-4 ${darkMode ? isVacancy ? 'text-yellow-400' : 'text-blue-400' : isVacancy ? 'text-yellow-700' : 'text-blue-700'}`} />
        </div>
        <div className="flex-grow">
          <div className={`font-medium ${darkMode ? 'text-dark-primary' : ''}`}>{member.name}</div>
          <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>{member.role}</div>
          <div className="text-xs mt-1 flex flex-wrap gap-1">
          {isVacancy ? (
            <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
              Vacancy
            </span>
          ) : (
            <>
              <span className={`px-2 py-0.5 rounded-full ${
                member.employment_type === 'core'
                  ? darkMode ? 'bg-green-900 text-green-300' : 'bg-emerald-100 text-emerald-700'
                  : darkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700'
              }`}>
                {member.employment_type === 'core' ? 'Core Employee' : 'Contractor'}
              </span>
              {member.employment_type === 'subcon' && member.vendor_name && (
                <span className={`px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  {member.vendor_name}
                </span>
              )}
            </>
          )}
          </div>
        </div>
        <div className={`text-sm font-medium px-2 py-1 rounded-full ${getCapacityColor(member.capacity || 1.0)}`}>
          {((member.capacity || 1.0) * 100).toFixed(0)}%
        </div>
      </CardComponent>
    );
  };

  // Function to get active (non-vacancy) members count
  const getActiveMembersCount = () => {
    if (!squad.team_members) return 0;
    return squad.team_members.filter(member => !member.is_vacancy).length;
  };

  return (
    <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
        <Users className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
        Team Members ({getActiveMembersCount()})
      </h3>
      
      {squad.team_members && squad.team_members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {squad.team_members.map(member => renderMemberCard(member))}
        </div>
      ) : (
        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No team members found</div>
      )}
    </div>
  );
};

export default TeamMembersList;
