import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import TeamTypeLabel from '../components/TeamTypeLabel';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const SquadsPage = () => {
  const [squads, setSquads] = useState([]);
  const [filteredSquads, setFilteredSquads] = useState([]);
  const [tribes, setTribes] = useState({});
  const [areas, setAreas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamTypeFilter, setTeamTypeFilter] = useState('all');
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

  // Filter squads by team type whenever squads or teamTypeFilter changes
  useEffect(() => {
    if (!squads.length) return;
    
    if (teamTypeFilter === 'all') {
      setFilteredSquads(squads);
    } else {
      const filtered = squads.filter(squad => {
        return (squad.team_type || 'stream_aligned').toLowerCase() === teamTypeFilter.toLowerCase();
      });
      setFilteredSquads(filtered);
    }
  }, [squads, teamTypeFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all squads
        const squadsData = await api.getSquads();
        setSquads(squadsData);
        setFilteredSquads(squadsData);
        
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
        <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Squads</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : ''}`}>Squads</h1>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="team-type-filter" className={`text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'}`}>Filter by team type:</label>
          <select
            id="team-type-filter"
            className={`py-1 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              darkMode 
                ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
            value={teamTypeFilter}
            onChange={(e) => setTeamTypeFilter(e.target.value)}
          >
            <option value="all">All teams</option>
            <option value="stream_aligned">Stream-aligned</option>
            <option value="platform">Platform</option>
            <option value="enabling">Enabling</option>
            <option value="complicated_subsystem">Complicated Subsystem</option>
          </select>
        </div>
      </div>
      
      {teamTypeFilter !== 'all' && (
        <div className={`mb-4 flex items-center ${darkMode ? 'bg-dark-blue-highlight' : 'bg-blue-50'} p-2 rounded-md`}>
          <div className="flex-grow">
            <p className={`text-sm ${darkMode ? 'text-dark-blue' : 'text-blue-800'}`}>
              Showing only <strong>{teamTypeFilter === 'stream_aligned' ? 'Stream-aligned' : 
                teamTypeFilter === 'platform' ? 'Platform' : 
                teamTypeFilter === 'enabling' ? 'Enabling' : 'Complicated Subsystem'}</strong> teams
              ({filteredSquads.length} of {squads.length})
            </p>
          </div>
          <button 
            onClick={() => setTeamTypeFilter('all')} 
            className={`text-xs ${darkMode ? 'text-dark-blue hover:text-blue-300' : 'text-blue-800 hover:text-blue-900'} underline px-2`}
          >
            Clear filter
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSquads.length > 0 ? (
          filteredSquads.map(squad => {
            const tribe = tribes[squad.tribe_id];
            const area = tribe ? areas[tribe.area_id] : null;
            
            return (
              <div 
                key={squad.id} 
                className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border hover:border-blue-500 transition-colors cursor-pointer`}
                onClick={(e) => {
                  if (e.isDefaultPrevented()) return;
                  window.location.href = `/squads/${squad.id}`;
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{squad.name}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    squad.status === 'Active' 
                      ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                      : squad.status === 'Forming'
                        ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
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
                {tribe && (
                  <div className={`mb-2 text-sm ${darkMode ? 'text-dark-secondary' : ''}`}>
                    <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>Cluster: </span>
                    <span onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/tribes/${tribe.id}`;
                    }} className={`cursor-pointer ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                      {tribe.name}
                    </span>
                    {area && (
                      <>
                        <span className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}> in </span>
                        <span onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/areas/${area.id}`;
                        }} className={`cursor-pointer ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                          {area.name}
                        </span>
                      </>
                    )}
                  </div>
                )}
                
                {/* Team Composition Bar */}
                <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                  <CompactTeamCompositionBar 
                    core_count={squad.core_count} 
                    subcon_count={squad.subcon_count}
                    core_capacity={squad.core_capacity} 
                    subcon_capacity={squad.subcon_capacity}
                  />
                </div>
                {squad.description && (
                  <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4 overflow-hidden`}>
                    {/* Show full description without truncation */}
                    {squad.description}
                  </p>
                )}
                </div>
            );
          })
        ) : (
          <div className={`col-span-3 text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {squads.length > 0 && teamTypeFilter !== 'all' ?
              <>
                <p>No squads found matching the selected team type.</p>
                <button 
                  onClick={() => setTeamTypeFilter('all')} 
                  className={`mt-2 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline`}
                >
                  Show all squads
                </button>
              </> :
              'No squads found'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadsPage;