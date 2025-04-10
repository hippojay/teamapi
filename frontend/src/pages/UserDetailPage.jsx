import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useParams, Link } from 'react-router-dom';
import { Briefcase, Users, ChevronRight } from 'lucide-react';
import api from '../api';

const UserDetailPage = () => {
  const { darkMode } = useTheme();
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [squad, setSquad] = useState(null);
  const [tribe, setTribe] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  
  // Helper function to get color based on capacity
  const getCapacityColor = (capacity) => {
    if (!capacity && capacity !== 0) {
      return darkMode ? "text-gray-400" : "text-gray-600"; // Handle undefined/NaN cases
    } else if (capacity > 1.0) {
      return darkMode ? "text-red-400" : "text-red-600"; // Over capacity (red)
    } else if (capacity >= 0.8) {
      return darkMode ? "text-green-400" : "text-green-600"; // Good capacity (green)
    } else if (capacity >= 0.5) {
      return darkMode ? "text-yellow-400" : "text-yellow-600"; // Medium capacity (yellow/amber)
    } else {
      return darkMode ? "text-gray-400" : "text-gray-600"; // Low capacity (default gray)
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user details
        const userData = await api.getTeamMember(id);
        setUser(userData);
        
        // Fetch squad, tribe info for breadcrumb
        if (userData.squad_id) {
          const squadData = await api.getSquad(userData.squad_id);
          setSquad(squadData);
          
          // Fetch tribe data
          if (squadData.tribe_id) {
            const tribeData = await api.getTribe(squadData.tribe_id);
            setTribe(tribeData);
          }
        }
        
        // Fetch supervisor data (assuming this will be added to API later)
        if (userData.supervisor_id) {
          const supervisorData = await api.getTeamMember(userData.supervisor_id);
          setSupervisor(supervisorData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Calculate total capacity across all squad memberships
  // Note: With the updated database model, capacity is only stored in squad_members association table,
  // not directly on the TeamMember model anymore
  const calculateTotalCapacity = (user) => {
    if (!user.squads || user.squads.length === 0) {
      return 0; // No squads means no capacity
    }
    
    // Sum up capacity from all squad memberships
    return user.squads.reduce((sum, squadMembership) => sum + (squadMembership.capacity || 0), 0);
  };

  // Handle loading state
  if (loading) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div className={`text-center py-10 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  // Handle not found
  if (!user) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>User not found</div>;
  }

  // Get total capacity and check if overcapacity
  const totalCapacity = calculateTotalCapacity(user);
  const isOverCapacity = totalCapacity > 1.0;

  // Function to generate initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div className={`flex items-center text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-6`}>
        <Link to="/" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        {squad && (
          <>
            <Link to={`/squads/${squad.id}`} className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>{squad.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{user.name}</span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <div className="flex mb-6">
              {/* User Avatar/Initials */}
              <div className="mr-6">
                {user.image_url ? (
                  <img
                    src={user.image_url}
                    alt={user.name}
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                    {getInitials(user.name)}
                  </div>
                )}
              </div>
              
              {/* User Details */}
              <div>
                <h2 className={`text-2xl font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{user.name}</h2>
                <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mt-1`}>{user.role}</div>
                <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-500'} mt-1`}>{user.email}</div>
                {user.geography && (
                  <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-500'} mt-1`}>
                    <span className="font-medium">Region:</span> {user.geography}
                  </div>
                )}
                {user.location && (
                  <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-500'} mt-1`}>
                    <span className="font-medium">Location:</span> {user.location}
                  </div>
                )}
                <div className={`mt-2 font-medium ${getCapacityColor(totalCapacity)}`}>
                  {(totalCapacity * 100).toFixed(0)}% Allocation
                </div>
                {isOverCapacity && (
                  <div className={`mt-2 px-3 py-1 ${darkMode ? 'bg-red-900 border-red-700 text-red-300' : 'bg-red-100 border-red-300 text-red-700'} border rounded-md text-sm flex items-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Overcapacity! Total allocation: {(totalCapacity * 100).toFixed(0)}%</span>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${user.employment_type === 'core' 
                    ? darkMode ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-emerald-100 text-emerald-700' 
                    : darkMode ? 'bg-amber-900 text-amber-300 border border-amber-700' : 'bg-amber-100 text-amber-700'}`}>
                    {user.employment_type === 'core' ? 'Core Employee' : 'Contractor'}
                  </span>
                  {user.employment_type === 'subcon' && user.vendor_name && (
                    <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-blue-900 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.vendor_name}
                    </span>
                  )}
                  {user.function && (
                    <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-indigo-900 text-indigo-300 border border-indigo-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {user.function}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <a 
                href={`mailto:${user.email}`}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Contact
              </a>
              <button className={`px-4 py-2 border rounded-lg ${darkMode ? 'border-dark-border hover:bg-dark-tertiary text-dark-primary' : 'border-gray-300 hover:bg-gray-50'}`}>
                Schedule Meeting
              </button>
            </div>
          </div>

          {/* Squad Membership */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
              <Users className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
              Squad Membership
            </h3>
            
            {user.squads && user.squads.length > 0 ? (
              <div className="space-y-4">
                {user.squads.map(squadMembership => (
                  <div key={squadMembership.squad_id} className={`p-4 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-900 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        to={`/squads/${squadMembership.squad_id}`}
                        className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}
                      >
                        {squadMembership.squad_name}
                      </Link>
                      <span className={`font-medium ${getCapacityColor(squadMembership.capacity || 0)}`}>
                        {((squadMembership.capacity || 0) * 100).toFixed(0)}% Allocation
                      </span>
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>
                      {squadMembership.role || user.role}
                    </div>
                  </div>
                ))}
              </div>
            ) : squad ? (
              <div className={`p-4 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-900 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Link 
                    to={`/squads/${squad.id}`}
                    className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}
                  >
                    {squad.name}
                  </Link>
                  <span className={`font-medium ${getCapacityColor(totalCapacity)}`}>
                    {(totalCapacity * 100).toFixed(0)}% Allocation
                  </span>
                </div>
                <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>
                  {user.role}
                </div>
              </div>
            ) : (
              <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No squad memberships found</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supervisor */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4 flex items-center`}>
              <Briefcase className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
              Organisational Information
            </h3>
            
            <div className="space-y-4">
              {/* Supervisor */}
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? 'text-dark-secondary' : 'text-gray-500'} mb-2`}>Line Manager</h4>
                {supervisor ? (
                  <Link 
                    to={`/users/${supervisor.id}`}
                    className={`flex items-center p-3 border rounded-lg ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {supervisor.image_url ? (
                      <img
                        src={supervisor.image_url}
                        alt={supervisor.name}
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold mr-3">
                        {getInitials(supervisor.name)}
                      </div>
                    )}
                    <div>
                      <div className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{supervisor.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>{supervisor.role}</div>
                    </div>
                  </Link>
                ) : (
                  <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No supervisor assigned</div>
                )}
              </div>
              
              {/* Tribe */}
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? 'text-dark-secondary' : 'text-gray-500'} mb-2`}>Cluster</h4>
                {tribe ? (
                  <Link 
                    to={`/tribes/${tribe.id}`}
                    className={`block p-3 border rounded-lg ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{tribe.name}</div>
                    {tribe.description && (
                      <div className={`text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mt-1`}>
                        {tribe.description.length > 100 
                          ? tribe.description.substring(0, 100) + '...' 
                          : tribe.description}
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No cluster information</div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4`}>Additional Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Primary Capacity:</span>
                <span className={`font-medium ${getCapacityColor(totalCapacity)}`}>
                  {(totalCapacity * 100).toFixed(0)}%
                </span>
              </div>
              {user.squads && user.squads.length > 1 && (
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Total Allocation:</span>
                  <span className={`font-medium ${getCapacityColor(totalCapacity)}`}>
                    {(totalCapacity * 100).toFixed(0)}%
                    {isOverCapacity && (
                      <span className={`ml-2 text-xs px-2 py-0.5 ${darkMode ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-red-100 text-red-700'} rounded-full`}>Overcapacity</span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Role:</span>
                <span className={`${darkMode ? 'text-dark-primary' : ''}`}>{user.role}</span>
              </div>
              {user.function && (
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Function:</span>
                <span className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{user.function}</span>
              </div>
              )}
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Region:</span>
                <span className={`${darkMode ? 'text-dark-primary' : ''}`}>{user.geography || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Location:</span>
                <span className={`${darkMode ? 'text-dark-primary' : ''}`}>{user.location || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Email:</span>
                <a href={`mailto:${user.email}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                  {user.email}
                </a>
              </div>
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Employment Type:</span>
                <span className={`font-medium ${user.employment_type === 'core' ? darkMode ? 'text-green-400' : 'text-emerald-600' : darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  {user.employment_type === 'core' ? 'Core Employee' : 'Contractor'}
                </span>
              </div>
              {user.employment_type === 'subcon' && user.vendor_name && (
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Vendor:</span>
                <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{user.vendor_name}</span>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
