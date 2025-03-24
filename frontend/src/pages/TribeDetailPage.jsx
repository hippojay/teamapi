import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import TeamTypeLabel from '../components/TeamTypeLabel';
import DescriptionEditor from '../components/DescriptionEditor';
import AreaTribeLabel from '../components/AreaTribeLabel';
import { OKRSection } from '../components/okr';
import { useTheme } from '../context/ThemeContext';
import { Breadcrumbs } from '../components/common';
import api from '../api';

const TribeDetailPage = () => {
  const { id } = useParams();
  const [tribe, setTribe] = useState(null);
  const [squads, setSquads] = useState([]);
  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  
  // Removed unused getCapacityColor function

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
      <Breadcrumbs items={[
        { label: 'Tribes', path: '/areas' },
        area && { label: area.name, path: `/areas/${area.id}` },
        { label: 'Cluster', path: '/tribes' },
        { label: tribe.name, isLast: true }
      ].filter(Boolean)} />

      {/* Tribe Header */}
      <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : ''}`}>{tribe.name}</h1>
          {area && (
            <Link 
              to={`/areas/${area.id}`}
              className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} text-sm`}
            >
              {area.name} Tribe
            </Link>
          )}
        </div>
        
        {/* Tribe Label */}
        <AreaTribeLabel
          entityType="tribe"
          entityId={tribe.id}
          label={tribe.label_str || tribe.label}
          onLabelUpdated={(newLabel) => {
            setTribe({...tribe, label: newLabel, label_str: newLabel});
          }}
        />
        
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

      {/* OKR Section */}
      <OKRSection 
        tribeId={tribe.id} 
        entityName={tribe.name} 
        entityType="tribe" 
      />

      {/* Squads in this Tribe */}
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''}`}>Squads</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.length > 0 ? (
          squads.map(squad => (
            <div key={squad.id} className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md hover:border-blue-500 transition-all duration-200`} onClick={() => window.location.href = `/squads/${squad.id}`}>
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
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
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
                <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4 line-clamp-2`}>{squad.description}</p>
              )}

            </div>
          ))
        ) : (
          <div className={`col-span-3 text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No squads found in this cluster
          </div>
        )}
      </div>
    </div>
  );
};

export default TribeDetailPage;