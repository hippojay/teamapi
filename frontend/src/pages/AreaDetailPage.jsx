import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CompactTeamCompositionBar from '../components/CompactTeamCompositionBar';
import DescriptionEditor from '../components/DescriptionEditor';
import AreaTribeLabel from '../components/AreaTribeLabel';
import { OKRSection } from '../components/okr';
import { useTheme } from '../context/ThemeContext';
import { Breadcrumbs } from '../components/common';
import api from '../api';

const AreaDetailPage = () => {
  const { id } = useParams();
  const [area, setArea] = useState(null);
  const [tribes, setTribes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  
  // getCapacityColor function commented out since it's not used
  /* 
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
  */

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch area details
        const areaData = await api.getArea(id);
        console.log("Area data received:", areaData);
        setArea(areaData);
        
        // Fetch tribes in this area
        const tribesData = await api.getTribes(id);
        setTribes(tribesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Tribe data:', err);
        setError('Failed to load Tribe data');
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

  if (!area) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Tribe not found</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Tribes', path: '/areas' },
        { label: area.name, isLast: true }
      ]} />

      {/* Area Header */}
      <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border mb-6`}>
        <h1 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-dark-primary' : ''}`}>{area.name}</h1>
        
        {/* Area Label */}
        <AreaTribeLabel
          entityType="area"
          entityId={area.id}
          label={area.label_str || area.label}
          onLabelUpdated={(newLabel) => {
            setArea({...area, label: newLabel, label_str: newLabel});
          }}
        />
        
        {/* Team Composition Bar */}
        {area.core_count !== undefined && (
          <div className="mb-4">
            <CompactTeamCompositionBar 
              core_count={area.core_count || 0} 
              subcon_count={area.subcon_count || 0}
              core_capacity={area.core_capacity || 0} 
              subcon_capacity={area.subcon_capacity || 0}
            />
          </div>
        )}
        <div className={darkMode ? 'text-dark-secondary' : 'text-gray-600'}>
          <DescriptionEditor
            entityType="area"
            entityId={area.id}
            initialDescription={area.description}
            onDescriptionUpdated={(newDescription) => {
              // Update the local state with the new description
              setArea({...area, description: newDescription});
            }}
          />
        </div>
      </div>

      {/* OKR Section */}
      <OKRSection 
        areaId={area.id} 
        entityName={area.name} 
        entityType="area" 
      />

      {/* Tribes in this Area */}
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''}`}>Clusters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tribes.length > 0 ? (
          tribes.map(tribe => (
            <div key={tribe.id} className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md hover:border-blue-500 transition-all duration-200`} onClick={() => window.location.href = `/tribes/${tribe.id}`}>
              <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-dark-primary' : ''}`}>{tribe.name}</h3>
              
              {/* Team Composition Bar */}
              {tribe.core_count !== undefined && (
                <div className="mb-4" onClick={(e) => e.stopPropagation()}>
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

            </div>
          ))
        ) : (
          <div className={`col-span-2 text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No clusters found in this Tribe
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaDetailPage;