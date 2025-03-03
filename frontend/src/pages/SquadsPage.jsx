import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Clock } from 'lucide-react';
import api from '../api';

const SquadsPage = () => {
  const [squads, setSquads] = useState([]);
  const [tribes, setTribes] = useState({});
  const [areas, setAreas] = useState({});
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
        // Fetch all squads
        const squadsData = await api.getSquads();
        setSquads(squadsData);
        
        // Fetch all tribes for mapping
        const tribesData = await api.getTribes();
        const tribesMap = {};
        tribesData.forEach(tribe => {
          tribesMap[tribe.id] = tribe;
        });
        setTribes(tribesMap);
        
        // Fetch all areas for mapping
        const areasData = await api.getAreas();
        const areasMap = {};
        areasData.forEach(area => {
          areasMap[area.id] = area;
        });
        setAreas(areasMap);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching squads:', err);
        setError('Failed to load squads');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="font-medium text-gray-800">Squads</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Squads</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.length > 0 ? (
          squads.map(squad => {
            const tribe = tribes[squad.tribe_id];
            const area = tribe ? areas[tribe.area_id] : null;
            
            return (
              <div key={squad.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">{squad.name}</h2>
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
                {tribe && (
                  <div className="mb-2 text-sm">
                    <span className="text-gray-600">Tribe: </span>
                    <Link to={`/tribes/${tribe.id}`} className="text-blue-600 hover:underline">
                      {tribe.name}
                    </Link>
                    {area && (
                      <>
                        <span className="text-gray-600"> in </span>
                        <Link to={`/areas/${area.id}`} className="text-blue-600 hover:underline">
                          {area.name}
                        </Link>
                      </>
                    )}
                  </div>
                )}
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
            );
          })
        ) : (
          <div className="col-span-3 text-center py-10 text-gray-500">No squads found</div>
        )}
      </div>
    </div>
  );
};

export default SquadsPage;
