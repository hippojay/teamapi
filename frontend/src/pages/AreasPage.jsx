import React, { useState, useEffect } from 'react';
// Removed unused import
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import LabelDisplay from '../components/LabelDisplay';
import { useTheme } from '../context/ThemeContext';
import { Breadcrumbs } from '../components/common';
import api from '../api';

const AreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  
  // Removed unused getCapacityColor function

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
      <Breadcrumbs items={[
        { label: 'Tribes', isLast: true }
      ]} />

      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-dark-primary' : ''}`}>Tribes</h1>
      
      <div className="space-y-6">
        {areas.length > 0 ? (
          areas.map(area => {
            const handleCardClick = (e) => {
              if (e.isDefaultPrevented()) return;
              window.location.href = `/areas/${area.id}`;
            };

            return (
              <div 
                key={area.id} 
                className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border hover:border-blue-500 transition-colors cursor-pointer`}
                onClick={handleCardClick}
              >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{area.name}</h2>
                  {(area.label || area.label_str) && (
                    <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                      <LabelDisplay label={area.label_str || area.label} />
                    </div>
                  )}
                </div>

                {/* Team Composition Bar */}
                {area.core_count !== undefined && (
                  <div className="mt-3 mb-3" onClick={(e) => e.stopPropagation()}>
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
                <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4 overflow-hidden`}>
                  {/* Show full description without truncation */}
                  {area.description}
                </p>
              )}
              </div>
            );
          })
        ) : (
          <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Tribes found</div>
        )}
      </div>
    </div>
  );
};

export default AreasPage;