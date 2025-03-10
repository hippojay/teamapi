import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import TeamTypeLabel from '../components/TeamTypeLabel';
import DescriptionEditor from '../components/DescriptionEditor';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const TribeDetailPage = () => {
  const { id } = useParams();
  const [tribe, setTribe] = useState(null);
  const [squads, setSquads] = useState([]);
  const [area, setArea] = useState(null);
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
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!tribe) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Tribe not found</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className={`flex items-center text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-6`}>
        <Link to="/" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/areas" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Areas</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        {area && (
          <>
            <Link to={`/areas/${area.id}`} className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>{area.name}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
          </>
        )}
        <Link to="/tribes" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>Tribes</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{tribe.name}</span>
      </div>

      {/* Tribe Header */}
      <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : ''}`}>{tribe.name}</h1>
          {area && (
            <Link 
              to={`/areas/${area.id}`}
              className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} text-sm`}
            >
              {area.name} Area
            </Link>
          )}
        </div>
        
        {/* Team Composition Bar */}
        <div className="mb-4">
          <CompactTeamCompositionBar 
            core_count={tribe.core_count} 
            subcon_count={tribe.subcon_count}
            core_capacity={tribe.core_capacity} 
            subcon_capacity={tribe.subcon_capacity}
          />
        </div>
        <div className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>
          <DescriptionEditor
            entityType="tribe"
            entityId={tribe.id}
            initialDescription={tribe.description}
            onDescriptionUpdated={(newDescription) => {
              // Update the local state with the new description
              setTribe({...tribe, description: newDescription});
            }}
          />
        </div>
      </div>

      {/* Squads in this Tribe */}
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''}`}>Squads</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.length > 0 ? (
          squads.map(squad => (
            <div key={squad.id} className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : ''}`}>{squad.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  squad.status === 'Active' 
                    ? darkMode ? 'bg-green-900 text-green-200 border border-green-700 font-medium' : 'bg-green-100 text-green-800'
                    : squad.status === 'Forming'
                      ? darkMode ? 'bg-blue-900 text-blue-200 border border-blue-700 font-medium' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700 font-medium' : 'bg-gray-100 text-gray-800'
                }`}>
                  {squad.status}
                </span>
              </div>
              <div className="mb-2">
                <TeamTypeLabel 
                  teamType={squad.team_type || "stream_aligned"} 
                  size="sm"
                />
              </div>
              
              {/* Team Composition Bar */}
              <div className="mb-4">
                <CompactTeamCompositionBar 
                  core_count={squad.core_count} 
                  subcon_count={squad.subcon_count}
                  core_capacity={squad.core_capacity} 
                  subcon_capacity={squad.subcon_capacity}
                />
              </div>
              {squad.description && (
                <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4 line-clamp-2`}>{squad.description}</p>
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
          <div className={`col-span-3 text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No squads found in this tribe
          </div>
        )}
      </div>
    </div>
  );
};

export default TribeDetailPage;