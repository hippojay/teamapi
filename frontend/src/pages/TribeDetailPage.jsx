import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, ChevronRight, Clock } from 'lucide-react';
import api from '../api';

const TribeDetailPage = () => {
  const { id } = useParams();
  const [tribe, setTribe] = useState(null);
  const [squads, setSquads] = useState([]);
  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        // Fetch tribe details
        const tribeData = await api.getTribe(id);
        setTribe(tribeData);
        
        // Fetch area information
        const areaData = await api.getArea(tribeData.area_id);
        setArea(areaData);
        
        // Fetch squads in this tribe
        const squadsData = await api.getSquads(id);
        setSquads(squadsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tribe data:', err);
        setError('Failed to load tribe data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!tribe) {
    return <div className="text-center py-10">Tribe not found</div>;
  }

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
        <Link to="/tribes" className="hover:text-blue-500">Tribes</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="font-medium text-gray-800">{tribe.name}</span>
      </div>

      {/* Tribe Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">{tribe.name}</h1>
          {area && (
            <Link 
              to={`/areas/${area.id}`}
              className="text-blue-600 hover:underline text-sm"
            >
              {area.name} Area
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-2 text-gray-600 mb-3">
          <Users className="h-5 w-5" />
          <span>{tribe.member_count > 0 ? tribe.member_count : 'No'} member{tribe.member_count !== 1 ? 's' : ''}</span>
          <span className="mx-1">•</span>
          <span className={`font-medium ${getCapacityColor(tribe.total_capacity)}`}>
            {tribe.total_capacity.toFixed(1)} FTE
          </span>
        </div>
        
        {/* Core vs Subcon stats */}
        <div className="flex flex-col space-y-2 text-sm mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-700">Tribe Composition:</div>
          <div className="flex justify-between">
            <span>Core Employees:</span>
            <span className="font-medium text-emerald-600">{tribe.core_count} ({tribe.core_capacity.toFixed(1)} FTE)</span>
          </div>
          <div className="flex justify-between">
            <span>Contractors:</span>
            <span className="font-medium text-amber-600">{tribe.subcon_count} ({tribe.subcon_capacity.toFixed(1)} FTE)</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span>Core/Subcon Ratio:</span>
            <span className="font-medium text-blue-600">
              {tribe.core_count > 0 
                ? (tribe.core_count / (tribe.core_count + tribe.subcon_count) * 100).toFixed(0) 
                : 0}% / {tribe.subcon_count > 0 
                ? (tribe.subcon_count / (tribe.core_count + tribe.subcon_count) * 100).toFixed(0) 
                : 0}%
            </span>
          </div>
        </div>
        {tribe.description && (
          <p className="text-gray-600 mb-2">{tribe.description}</p>
        )}
      </div>

      {/* Squads in this Tribe */}
      <h2 className="text-xl font-semibold mb-4">Squads</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.length > 0 ? (
          squads.map(squad => (
            <div key={squad.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{squad.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  squad.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : squad.status === 'Forming'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {squad.status}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 mb-3">
                <Users className="h-4 w-4" />
                <span>{squad.member_count > 0 ? squad.member_count : 'No'} member{squad.member_count !== 1 ? 's' : ''}</span>
                <span className="mx-1">•</span>
                <span className={`font-medium ${getCapacityColor(squad.total_capacity)}`}>
                  {squad.total_capacity.toFixed(1)} FTE
                </span>
                <span className="mx-1">•</span>
                <Clock className="h-4 w-4" />
                <span>{squad.timezone}</span>
              </div>
              
              {/* Core vs Subcon info */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="p-1 bg-emerald-50 rounded text-center">
                  <span className="block text-emerald-600 font-medium">Core:</span>
                  <span className="text-emerald-700">{squad.core_count} ({squad.core_capacity.toFixed(1)})</span>
                </div>
                <div className="p-1 bg-amber-50 rounded text-center">
                  <span className="block text-amber-600 font-medium">Subcon:</span>
                  <span className="text-amber-700">{squad.subcon_count} ({squad.subcon_capacity.toFixed(1)})</span>
                </div>
              </div>
              {squad.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{squad.description}</p>
              )}
              <Link 
                to={`/squads/${squad.id}`}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Squad
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-6 text-gray-500">
            No squads found in this tribe
          </div>
        )}
      </div>
    </div>
  );
};

export default TribeDetailPage;
