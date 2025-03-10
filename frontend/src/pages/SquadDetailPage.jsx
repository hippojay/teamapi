import { Breadcrumbs } from '../components/common';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useTheme } from '../context/ThemeContext';
import api from '../api';

// Import squad components
import {
  SquadHeader,
  ServicesList,
  TeamMembersList,
  DependenciesList,
  OnCallInfo,
  SquadDetailsInfo
} from '../components/squad';

const SquadDetailPage = () => {
  const { id } = useParams();
  const [squad, setSquad] = useState(null);
  const [services, setServices] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [onCall, setOnCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tribe, setTribe] = useState(null);
  const [area, setArea] = useState(null);

  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch squad details
        const squadData = await api.getSquad(id);
        setSquad(squadData);
        
        // Fetch tribe and area info for breadcrumbs
        const tribeData = await api.getTribe(squadData.tribe_id);
        setTribe(tribeData);
        
        const areaData = await api.getArea(tribeData.area_id);
        setArea(areaData);
        
        // Fetch services
        const servicesData = await api.getServices(id);
        setServices(servicesData);
        
        // Fetch dependencies
        const dependenciesData = await api.getDependencies(id);
        setDependencies(dependenciesData);
        
        // Fetch on-call roster
        const onCallData = await api.getOnCall(id);
        setOnCall(onCallData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching squad data:', err);
        setError('Failed to load squad data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Handler for updating the squad state when changes are made
  const handleSquadUpdate = (updatedSquad) => {
    setSquad(updatedSquad);
  };

  // Refresh dependencies after changes
  const handleDependenciesChange = async () => {
    try {
      const dependenciesData = await api.getDependencies(id);
      setDependencies(dependenciesData);
    } catch (err) {
      console.error('Error refreshing dependencies:', err);
    }
  };

  // Handle loading state
  if (loading) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  // Handle not found
  if (!squad) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Squad not found</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Areas', path: '/areas' },
        area && { label: area.name, path: `/areas/${area.id}` },
        tribe && { label: tribe.name, path: `/tribes/${tribe.id}` },
        { label: squad.name, isLast: true }
      ].filter(Boolean)} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Squad Header with Description and Team Composition */}
          <SquadHeader 
            squad={squad} 
            tribe={tribe} 
            onSquadUpdate={handleSquadUpdate} 
          />

          {/* Services */}
          <ServicesList 
            squad={squad} 
            services={services} 
            setServices={setServices} 
          />

          {/* Team Members */}
          <TeamMembersList squad={squad} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dependencies */}
          <DependenciesList 
            dependencies={dependencies} 
            squadId={parseInt(id)} 
            onDependenciesChange={handleDependenciesChange} 
          />

          {/* On-Call */}
          <OnCallInfo onCall={onCall} />

          {/* Additional Info */}
          <SquadDetailsInfo squad={squad} tribe={tribe} area={area} />
        </div>
      </div>
    </div>
  );
};

export default SquadDetailPage;
