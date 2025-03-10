import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Search, Filter } from 'lucide-react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

const UsersPage = () => {
  const { darkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBySquad, setFilterBySquad] = useState('');
  const [filterByType, setFilterByType] = useState('');
  const [filterByFunction, setFilterByFunction] = useState('');
  const [squads, setSquads] = useState([]);
  const [uniqueFunctions, setUniqueFunctions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all team members
        const data = await api.getTeamMembers();
        setUsers(data);
        setFilteredUsers(data);
        
        // Extract unique functions
        const functions = new Set();
        data.forEach(user => {
          if (user.function) {
            functions.add(user.function);
          }
        });
        setUniqueFunctions(Array.from(functions).sort());
        
        // Fetch all squads for filtering
        const squadsData = await api.getSquads();
        setSquads(squadsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter users based on search term, squad filter, function filter, and employment type filter
  useEffect(() => {
    let result = users;
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(lowerCaseSearch) || 
        user.role.toLowerCase().includes(lowerCaseSearch) ||
        (user.geography && user.geography.toLowerCase().includes(lowerCaseSearch)) ||
        (user.location && user.location.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    if (filterBySquad) {
      result = result.filter(user => user.squad_id === parseInt(filterBySquad));
    }
    
    if (filterByType) {
      result = result.filter(user => user.employment_type === filterByType);
    }
    
    if (filterByFunction) {
      result = result.filter(user => user.function === filterByFunction);
    }
    
    // Sort users alphabetically by name
    result = result.sort((a, b) => a.name.localeCompare(b.name));
    
    setFilteredUsers(result);
  }, [searchTerm, filterBySquad, filterByType, filterByFunction, users]);
  
  // Function to generate initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Get capacity color
  const getCapacityColor = (capacity) => {
    if (!capacity && capacity !== 0) {
      return "bg-gray-100 text-gray-800"; // Handle undefined/NaN cases
    } else if (capacity > 1.0) {
      return darkMode ? "bg-red-900 text-red-200 border border-red-700" : "bg-red-100 text-red-800"; // Over capacity (red)
    } else if (capacity >= 0.8) {
      return darkMode ? "bg-green-900 text-green-200 border border-green-700" : "bg-green-100 text-green-800"; // Good capacity (green)
    } else if (capacity >= 0.5) {
      return darkMode ? "bg-yellow-900 text-yellow-200 border border-yellow-700" : "bg-yellow-100 text-yellow-800"; // Medium capacity (yellow)
    } else {
      return darkMode ? "bg-gray-800 text-gray-200 border border-gray-700" : "bg-gray-100 text-gray-800"; // Low capacity (gray)
    }
  };

  if (loading) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading users...</div>;
  }

  if (error) {
    return <div className={`text-center py-10 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : 'text-gray-900'} mb-4`}>Team Members</h1>
        <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>View and filter all team members across the organisation.</p>
      </div>
      
      {/* Filters */}
      <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white'} p-4 rounded-lg shadow-sm border mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-4">
          {/* Search */}
          <div className="relative flex-grow mb-4 md:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name, role, region, or location..."
              className={`pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : ''}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Squad Filter */}
          <div className="relative md:w-1/4 mb-4 md:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className={`pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white'}`}
              value={filterBySquad}
              onChange={(e) => setFilterBySquad(e.target.value)}
            >
              <option value="">All Squads</option>
              {squads.map(squad => (
                <option key={squad.id} value={squad.id}>
                  {squad.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Function Filter */}
          <div className="relative md:w-1/5 mb-4 md:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className={`pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white'}`}
              value={filterByFunction}
              onChange={(e) => setFilterByFunction(e.target.value)}
            >
              <option value="">All Functions</option>
              {uniqueFunctions.map(func => (
                <option key={func} value={func}>{func}</option>
              ))}
            </select>
          </div>
          
          {/* Employment Type Filter */}
          <div className="relative md:w-1/5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className={`pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white'}`}
              value={filterByType}
              onChange={(e) => setFilterByType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="core">Core Employees</option>
              <option value="subcon">Contractors</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <Link
              key={user.id}
              to={`/users/${user.id}`}
              className={`${darkMode ? 'bg-dark-card border-dark-border hover:bg-dark-highlight' : 'bg-white hover:shadow-md'} p-6 rounded-lg shadow-sm border transition-shadow duration-300`}
            >
              <div className="flex items-center">
                {user.image_url ? (
                  <img
                    src={user.image_url}
                    alt={user.name}
                    className="h-16 w-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold mr-4">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="flex-grow">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-900'}`}>{user.name}</h3>
                  <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>{user.role}</p>
                  <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                    {user.geography && <span>{user.geography}</span>}
                    {user.geography && user.location && <span> • </span>}
                    {user.location && <span>{user.location}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.employment_type === 'core' ? darkMode ? 'bg-emerald-900 text-emerald-200 border border-emerald-700' : 'bg-emerald-100 text-emerald-700' : darkMode ? 'bg-amber-900 text-amber-200 border border-amber-700' : 'bg-amber-100 text-amber-700'}`}>
                      {user.employment_type === 'core' ? 'Core Employee' : 'Contractor'}
                    </span>
                    {user.employment_type === 'subcon' && user.vendor_name && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900 text-blue-200 border border-blue-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.vendor_name}
                      </span>
                    )}
                    {user.function && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900 text-indigo-200 border border-indigo-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {user.function}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className={`text-sm px-3 py-1 rounded-full ${getCapacityColor(user.capacity)}`}>
                  {user.capacity !== null && user.capacity !== undefined ? `${(user.capacity * 100).toFixed(0)}%` : '0%'} Capacity
                </span>
                {user.squad_id && (
                  <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
                    {squads.find(s => s.id === user.squad_id)?.name || 'Unknown Squad'}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={`text-center py-16 ${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white'} rounded-lg shadow-sm border`}>
          <User className={`h-12 w-12 mx-auto ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-900'} mb-2`}>No users found</h3>
          <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
