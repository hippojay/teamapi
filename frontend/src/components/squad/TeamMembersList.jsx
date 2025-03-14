import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TeamMembersList = ({ squad }) => {
  const { darkMode } = useTheme();
  const [functionFilter, setFunctionFilter] = useState('all');
  
  // Get unique functions for the filter dropdown
  const uniqueFunctions = useMemo(() => {
    if (!squad.team_members) return [];
    
    const functionSet = new Set();
    squad.team_members.forEach(member => {
      if (member.function) {
        functionSet.add(member.function);
      }
    });
    
    return Array.from(functionSet).sort();
  }, [squad.team_members]);
  
  // Filter and sort members by function and employment type
  const filteredMembers = useMemo(() => {
    if (!squad.team_members) return [];
    
    // First filter by function if needed
    let result = functionFilter === 'all' 
      ? squad.team_members 
      : squad.team_members.filter(member => member.function === functionFilter);
    
    // Then sort: Core first (alphabetically), then contractors (alphabetically)
    return result.sort((a, b) => {
      // Sort core vs contractors
      if (a.employment_type === 'core' && b.employment_type !== 'core') return -1;
      if (a.employment_type !== 'core' && b.employment_type === 'core') return 1;
      
      // Then sort alphabetically within same employment type
      return a.name.localeCompare(b.name);
    });
  }, [squad.team_members, functionFilter]);
  
  
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
            {member.function && (
              <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                {member.function}
              </span>
            )}
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} flex items-center`}>
          <Users className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
          Team Members ({getActiveMembersCount()})
        </h3>
        
        {/* Function filter */}
        {uniqueFunctions.length > 0 && (
          <div className="flex items-center">
            <label htmlFor="function-filter" className={`text-sm mr-2 ${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>
              Filter by Function:
            </label>
            <select
              id="function-filter"
              value={functionFilter}
              onChange={(e) => setFunctionFilter(e.target.value)}
              className={`text-sm rounded-md ${darkMode ? 
                'bg-gray-800 border-gray-700 text-dark-primary focus:border-blue-600' : 
                'bg-white border-gray-300 text-gray-700 focus:border-blue-500'} 
                border focus:ring-0 focus:outline-none px-3 py-1.5`}
            >
              <option value="all">All Functions</option>
              {uniqueFunctions.map(func => (
                <option key={func} value={func}>{func}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {filteredMembers && filteredMembers.length > 0 ? (
        <div className="space-y-6">
          {/* Core Employees Section */}
          {filteredMembers.some(member => member.employment_type === 'core') && (
            <div>
              <div className={`flex items-center my-3`}>
                <div className={`${darkMode ? 'bg-green-900' : 'bg-green-100'} p-1.5 rounded-md mr-2`}>
                  <Users className={`h-4 w-4 ${darkMode ? 'text-green-300' : 'text-green-700'}`} />
                </div>
                <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>Core Employees</h4>
                <div className={`flex-grow ml-3 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers
                  .filter(member => member.employment_type === 'core')
                  .map(member => renderMemberCard(member))}
              </div>
            </div>
          )}
          
          {/* Contractors Section */}
          {filteredMembers.some(member => member.employment_type == 'subcon') && (
            <div>
              <div className={`flex items-center my-3`}>
                <div className={`${darkMode ? 'bg-amber-900' : 'bg-amber-100'} p-1.5 rounded-md mr-2`}>
                  <Users className={`h-4 w-4 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`} />
                </div>
                <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>Contractors</h4>
                <div className={`flex-grow ml-3 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers
                  .filter(member => member.employment_type == 'subcon')
                  .map(member => renderMemberCard(member))}
              </div>
            </div>
          )}
          
          {/* Display vacancies separately if needed */}
          {filteredMembers.some(member => member.is_vacancy) && (
            <div>
              <div className={`flex items-center my-3`}>
                <div className={`${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'} p-1.5 rounded-md mr-2`}>
                  <Users className={`h-4 w-4 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`} />
                </div>
                <h4 className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>Vacancies</h4>
                <div className={`flex-grow ml-3 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers
                  .filter(member => member.is_vacancy)
                  .map(member => renderMemberCard(member))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No team members found</div>
      )}
    </div>
  );
};

export default TeamMembersList;
