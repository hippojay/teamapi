import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Search, Filter } from 'lucide-react';
import api from '../api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBySquad, setFilterBySquad] = useState('');
  const [squads, setSquads] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all team members
        const data = await api.getTeamMembers();
        setUsers(data);
        setFilteredUsers(data);
        
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
  
  // Filter users based on search term and squad filter
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
    
    setFilteredUsers(result);
  }, [searchTerm, filterBySquad, users]);
  
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
    if (capacity > 1.0) {
      return "bg-red-100 text-red-800"; // Over capacity (red)
    } else if (capacity >= 0.8) {
      return "bg-green-100 text-green-800"; // Good capacity (green)
    } else if (capacity >= 0.5) {
      return "bg-yellow-100 text-yellow-800"; // Medium capacity (yellow)
    } else {
      return "bg-gray-100 text-gray-800"; // Low capacity (gray)
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Members</h1>
        <p className="text-gray-600">View and filter all team members across the organization.</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          {/* Search */}
          <div className="relative flex-grow mb-4 md:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name, role, region, or location..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Squad Filter */}
          <div className="relative md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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
        </div>
      </div>
      
      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <Link
              key={user.id}
              to={`/users/${user.id}`}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-300"
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
                  <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">{user.role}</p>
                  <div className="text-gray-500 text-sm">
                    {user.geography && <span>{user.geography}</span>}
                    {user.geography && user.location && <span> • </span>}
                    {user.location && <span>{user.location}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className={`text-sm px-3 py-1 rounded-full ${getCapacityColor(user.capacity)}`}>
                  {(user.capacity * 100).toFixed(0)}% Capacity
                </span>
                {user.squad_id && (
                  <span className="text-sm text-blue-600 font-medium">
                    {squads.find(s => s.id === user.squad_id)?.name || 'Unknown Squad'}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
