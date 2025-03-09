import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Globe, GitBranch, Server, Smartphone, Code } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [squads, setSquads] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all services
        const servicesData = await api.getServices();
        setServices(servicesData);
        
        // Fetch all squads for mapping
        const squadsData = await api.getSquads();
        const squadsMap = {};
        squadsData.forEach(squad => {
          squadsMap[squad.id] = squad;
        });
        setSquads(squadsMap);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getServiceIcon = (serviceType) => {
    switch (serviceType && serviceType.toLowerCase()) {
      case 'api':
        return <Code className="h-5 w-5 mr-2 text-blue-500" />;
      case 'repo':
      case 'repository':
        return <GitBranch className="h-5 w-5 mr-2 text-purple-500" />;
      case 'platform':
        return <Server className="h-5 w-5 mr-2 text-green-500" />;
      case 'webpage':
        return <Globe className="h-5 w-5 mr-2 text-orange-500" />;
      case 'app_module':
        return <Smartphone className="h-5 w-5 mr-2 text-red-500" />;
      default:
        return <Code className="h-5 w-5 mr-2 text-blue-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-green-900 text-green-200 border border-green-700 font-medium' : 'bg-green-100 text-green-800'} rounded-full text-xs`}>Healthy</span>;
      case 'degraded':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-yellow-900 text-yellow-200 border border-yellow-700 font-medium' : 'bg-yellow-100 text-yellow-800'} rounded-full text-xs`}>Degraded</span>;
      case 'down':
        return <span className={`px-2 py-1 ${darkMode ? 'bg-red-900 text-red-200 border border-red-700 font-medium' : 'bg-red-100 text-red-800'} rounded-full text-xs`}>Down</span>;
      default:
        return <span className={`px-2 py-1 ${darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700 font-medium' : 'bg-gray-100 text-gray-800'} rounded-full text-xs`}>{status}</span>;
    }
  };

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
        <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Services</span>
      </div>

      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-dark-primary' : ''}`}>Services</h1>
      
      <div className="space-y-4">
        {services.length > 0 ? (
          services.map(service => {
            const squad = squads[service.squad_id];
            
            return (
              <div key={service.id} className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} flex items-center`}>
                    {getServiceIcon(service.service_type)}
                    {service.name}
                  </h2>
                  {getStatusBadge(service.status)}
                </div>
                {squad && (
                  <div className="mb-3 text-sm">
                    <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Owned by: </span>
                    <Link to={`/squads/${squad.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                      {squad.name} Squad
                    </Link>
                  </div>
                )}
                {service.description && (
                  <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4`}>{service.description}</p>
                )}
                <div className={`flex items-center space-x-4 text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4`}>
                  <span>{service.uptime}% Uptime</span>
                  <span>•</span>
                  <span>v{service.version}</span>
                  {service.url && (
                  <>
                  <span>•</span>
                  <a href={service.url} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:underline'}`}>
                  {(service.service_type === 'API') ? 'API Docs' : 'Link'}
                  </a>
                  </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No services found</div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;