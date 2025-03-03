import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, Database, GitBranch, Bell, Clock, ChevronRight } from 'lucide-react';
import api from '../api';

const SquadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [squad, setSquad] = useState(null);
  const [services, setServices] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [onCall, setOnCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tribe, setTribe] = useState(null);
  const [area, setArea] = useState(null);
  
  // Helper function to get color based on capacity
  const getCapacityColor = (capacity) => {
    if (capacity > 1.0) {
      return "text-red-600"; // Over capacity (red)
    } else if (capacity >= 0.8) {
      return "text-green-600"; // Good capacity (green)
    } else if (capacity >= 0.5) {
      return "text-yellow-600"; // Medium capacity (yellow/amber)
    } else {
      return "text-gray-600"; // Low capacity (default gray)
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch squad details
        const squadData = await api.getSquad(id);
        setSquad(squadData);
        
        // Fetch tribe and area info for breadcrumbs
        const tribeData = await api.getTribe(squadData.tribe_id);
        setTribe(tribeData);
        
        const areaData = await api.getArea(tribeData.area_id);
        setArea(areaData);
        
        // Fetch services
        const servicesData = await api.getServices(id);
        setServices(servicesData);
        
        // Fetch dependencies
        const dependenciesData = await api.getDependencies(id);
        setDependencies(dependenciesData);
        
        // Fetch on-call roster
        const onCallData = await api.getOnCall(id);
        setOnCall(onCallData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching squad data:', err);
        setError('Failed to load squad data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Handle loading state
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  // Handle not found
  if (!squad) {
    return <div className="text-center py-10">Squad not found</div>;
  }

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Healthy</span>;
      case 'degraded':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Degraded</span>;
      case 'down':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Down</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const getDependencyBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'required':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Required</span>;
      case 'optional':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Optional</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{type}</span>;
    }
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/areas" className="hover:text-blue-500">Areas</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        {area && (
          <>
            <Link to={`/areas/${area.id}`} className="hover:text-blue-500">{area.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        {tribe && (
          <>
            <Link to={`/tribes/${tribe.id}`} className="hover:text-blue-500">{tribe.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        <span className="font-medium text-gray-800">{squad.name}</span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{squad.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${
                squad.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : squad.status === 'Forming'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {squad.status}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 mb-4">
              <Users className="h-5 w-5" />
              <span>{squad.member_count > 0 ? squad.member_count : 'No'} member{squad.member_count !== 1 ? 's' : ''}</span>
              <span className="mx-2">•</span>
              <span className={`font-medium ${getCapacityColor(squad.total_capacity)}`}>
                {squad.total_capacity.toFixed(1)} FTE
              </span>
              <span className="mx-2">•</span>
              <Clock className="h-5 w-5" />
              <span>{squad.timezone}</span>
            </div>
            <p className="text-gray-600 mb-4">
              {squad.description || `The ${squad.name} squad is responsible for developing and maintaining services for the ${tribe ? tribe.name : ''} tribe.`}
            </p>
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Contact Squad
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                View Documentation
              </button>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Owned Services
            </h3>
            <div className="space-y-4">
              {services.length > 0 ? (
                services.map(service => (
                  <div key={service.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{service.name}</h4>
                      {getStatusBadge(service.status)}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{service.uptime}% Uptime</span>
                      <span>•</span>
                      <span>v{service.version}</span>
                      <span>•</span>
                      {service.api_docs_url && (
                        <a href={service.api_docs_url} className="text-blue-500 hover:underline">API Docs</a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No services found</div>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Members
            </h3>
            {squad.members && squad.members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {squad.members.map(member => (
                  <Link 
                    key={member.id} 
                    to={`/users/${member.id}`}
                    className="p-3 border rounded-lg flex items-center hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Users className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.role}</div>
                    </div>
                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${getCapacityColor(member.capacity)}`}>
                      {(member.capacity * 100).toFixed(0)}%
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">No team members found</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dependencies */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <GitBranch className="h-5 w-5 mr-2" />
              Dependencies
            </h3>
            {dependencies.length > 0 ? (
              <ul className="space-y-3">
                {dependencies.map(dep => (
                  <li key={dep.id} className="flex items-center justify-between">
                    <span className="text-gray-600">{dep.dependency_name}</span>
                    {getDependencyBadge(dep.dependency_type)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 text-center">No dependencies found</div>
            )}
          </div>

          {/* On-Call */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              On-Call
            </h3>
            {onCall ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Primary</div>
                  <div className="text-gray-800">{onCall.primary_name}</div>
                  {onCall.primary_contact && (
                    <div className="text-sm text-blue-600">{onCall.primary_contact}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Secondary</div>
                  <div className="text-gray-800">{onCall.secondary_name}</div>
                  {onCall.secondary_contact && (
                    <div className="text-sm text-blue-600">{onCall.secondary_contact}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">No on-call roster found</div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Squad Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tribe:</span>
                {tribe && (
                  <Link to={`/tribes/${tribe.id}`} className="text-blue-600 hover:underline">
                    {tribe.name}
                  </Link>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Area:</span>
                {area && (
                  <Link to={`/areas/${area.id}`} className="text-blue-600 hover:underline">
                    {area.name}
                  </Link>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span>{squad.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timezone:</span>
                <span>{squad.timezone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadDetailPage;
