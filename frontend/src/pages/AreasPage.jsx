import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const AreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className={`flex items-center text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-6`}>
        <Link to="/" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Areas</span>
      </div>

      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-dark-primary' : ''}`}>Areas</h1>
      
      <div className="space-y-6">
        {areas.length > 0 ? (
          areas.map(area => (
            <div key={area.id} className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{area.name}</h2>

                {/* Team Composition Bar */}
                {area.core_count !== undefined && (
                  <div className="mt-3 mb-3">
                    <CompactTeamCompositionBar 
                      core_count={area.core_count || 0} 
                      subcon_count={area.subcon_count || 0}
                      core_capacity={area.core_capacity || 0} 
                      subcon_capacity={area.subcon_capacity || 0}
                    />
                  </div>
                )}
              </div>
              {area.description && (
                <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4`}>{area.description}</p>
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
          <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No areas found</div>
        )}
      </div>
    </div>
  );
};

export default AreasPage;