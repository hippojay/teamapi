import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import TeamCompositionBar from '../components/TeamCompositionBar';
import api from '../api';

const TribesPage = () => {
  const [tribes, setTribes] = useState([]);
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
        // Fetch all tribes
        const tribesData = await api.getTribes();
        setTribes(tribesData);
        
        // Fetch all areas for mapping
        const areasData = await api.getAreas();
        const areasMap = {};
        areasData.forEach(area => {
          areasMap[area.id] = area;
        });
        setAreas(areasMap);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tribes:', err);
        setError('Failed to load tribes');
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
        <span className="font-medium text-gray-800">Tribes</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Tribes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tribes.length > 0 ? (
          tribes.map(tribe => (
            <div key={tribe.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{tribe.name}</h2>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {tribe.member_count > 0 ? tribe.member_count : 'No'} member{tribe.member_count !== 1 ? 's' : ''}
                  </span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className={`text-sm font-medium ${getCapacityColor(tribe.total_capacity)}`}>
                    {tribe.total_capacity.toFixed(1)} FTE
                  </span>
                </div>
              </div>
              {areas[tribe.area_id] && (
                <div className="mb-2 text-sm">
                  <span className="text-gray-600">Area: </span>
                  <Link to={`/areas/${tribe.area_id}`} className="text-blue-600 hover:underline">
                    {areas[tribe.area_id].name}
                  </Link>
                </div>
              )}
              
              {/* Team Composition Bar */}
              {tribe.core_count !== undefined && (
                <div className="mb-3">
                  <TeamCompositionBar 
                    core_count={tribe.core_count || 0} 
                    subcon_count={tribe.subcon_count || 0}
                    core_capacity={tribe.core_capacity || 0} 
                    subcon_capacity={tribe.subcon_capacity || 0}
                  />
                </div>
              )}
              {tribe.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{tribe.description}</p>
              )}
              <Link 
                to={`/tribes/${tribe.id}`}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Tribe
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-10 text-gray-500">No tribes found</div>
        )}
      </div>
    </div>
  );
};

export default TribesPage;
