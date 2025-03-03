import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import api from '../api';

const AreasPage = () => {
  const [areas, setAreas] = useState([]);
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
    const fetchAreas = async () => {
      try {
        const data = await api.getAreas();
        setAreas(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching areas:', err);
        setError('Failed to load areas');
        setLoading(false);
      }
    };

    fetchAreas();
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
        <span className="font-medium text-gray-800">Areas</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Areas</h1>
      
      <div className="space-y-6">
        {areas.length > 0 ? (
          areas.map(area => (
            <div key={area.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-800">{area.name}</h2>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {area.member_count > 0 ? area.member_count : 'No'} member{area.member_count !== 1 ? 's' : ''}
                  </span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className={`text-sm font-medium ${getCapacityColor(area.total_capacity)}`}>
                    {area.total_capacity.toFixed(1)} FTE
                  </span>
                </div>
              </div>
              {area.description && (
                <p className="text-gray-600 mb-4">{area.description}</p>
              )}
              <Link 
                to={`/areas/${area.id}`}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Area
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">No areas found</div>
        )}
      </div>
    </div>
  );
};

export default AreasPage;
