import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Clock } from 'lucide-react';
import TeamCompositionBar from '../components/TeamCompositionBar';
import TeamTypeLabel from '../components/TeamTypeLabel';
import api from '../api';

const SquadsPage = () => {
  const [squads, setSquads] = useState([]);
  const [filteredSquads, setFilteredSquads] = useState([]);
  const [tribes, setTribes] = useState({});
  const [areas, setAreas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamTypeFilter, setTeamTypeFilter] = useState('all');

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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Squads</h1>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="team-type-filter" className="text-sm font-medium text-gray-700">Filter by team type:</label>
          <select
            id="team-type-filter"
            className="py-1 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        <div className="mb-4 flex items-center bg-blue-50 p-2 rounded-md">
          <div className="flex-grow">
            <p className="text-sm text-blue-800">
              Showing only <strong>{teamTypeFilter === 'stream_aligned' ? 'Stream-aligned' : 
                teamTypeFilter === 'platform' ? 'Platform' : 
                teamTypeFilter === 'enabling' ? 'Enabling' : 'Complicated Subsystem'}</strong> teams
              ({filteredSquads.length} of {squads.length})
            </p>
          </div>
          <button 
            onClick={() => setTeamTypeFilter('all')} 
            className="text-xs text-blue-800 hover:text-blue-900 underline px-2"
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
                <div className="mb-2">
                  <TeamTypeLabel 
                    teamType={squad.team_type || "stream_aligned"} 
                    size="sm"
                  />
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
                
                {/* Team Composition Bar */}
                <div className="mb-4">
                  <TeamCompositionBar 
                    core_count={squad.core_count} 
                    subcon_count={squad.subcon_count}
                    core_capacity={squad.core_capacity} 
                    subcon_capacity={squad.subcon_capacity}
                  />
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
          <div className="col-span-3 text-center py-10 text-gray-500">
            {squads.length > 0 && teamTypeFilter !== 'all' ?
              <>
                <p>No squads found matching the selected team type.</p>
                <button 
                  onClick={() => setTeamTypeFilter('all')} 
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
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
