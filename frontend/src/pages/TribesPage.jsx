import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import { useTheme } from '../context/ThemeContext';
import { Breadcrumbs } from '../components/common';
import api from '../api';

const TribesPage = () => {
  const [tribes, setTribes] = useState([]);
  const [areas, setAreas] = useState({});
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
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Tribes', isLast: true }
      ]} />

      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-dark-primary' : ''}`}>Tribes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tribes.length > 0 ? (
          tribes.map(tribe => (
            <div key={tribe.id} className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{tribe.name}</h2>
              </div>
              {areas[tribe.area_id] && (
                <div className="mb-2 text-sm">
                  <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Area: </span>
                  <Link to={`/areas/${tribe.area_id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                    {areas[tribe.area_id].name}
                  </Link>
                </div>
              )}
              
              {/* Team Composition Bar */}
              {tribe.core_count !== undefined && (
                <div className="mb-3">
                  <CompactTeamCompositionBar 
                    core_count={tribe.core_count || 0} 
                    subcon_count={tribe.subcon_count || 0}
                    core_capacity={tribe.core_capacity || 0} 
                    subcon_capacity={tribe.subcon_capacity || 0}
                  />
                </div>
              )}
              {tribe.description && (
                <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4 line-clamp-2`}>{tribe.description}</p>
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
          <div className={`col-span-2 text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No tribes found</div>
        )}
      </div>
    </div>
  );
};

export default TribesPage;