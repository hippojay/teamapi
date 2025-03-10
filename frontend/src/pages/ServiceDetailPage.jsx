import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, GitBranch, Code, Globe, Server, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Breadcrumbs } from '../components/common';
import api from '../api';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [squad, setSquad] = useState(null);
  const [tribe, setTribe] = useState(null);
  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch service details
        const serviceData = await api.getService(id);
        setService(serviceData);
        
        // Fetch squad information
        const squadData = await api.getSquad(serviceData.squad_id);
        setSquad(squadData);
        
        // Fetch tribe information
        if (squadData.tribe_id) {
          const tribeData = await api.getTribe(squadData.tribe_id);
          setTribe(tribeData);
          
          // Fetch area information
          if (tribeData.area_id) {
            const areaData = await api.getArea(tribeData.area_id);
            setArea(areaData);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching service data:', err);
        setError('Failed to load service data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const getServiceIcon = (serviceType) => {
    switch (serviceType && serviceType.toLowerCase()) {
      case 'api':
        return <Code className="h-6 w-6 mr-2 text-blue-500" />;
      case 'repo':
      case 'repository':
        return <GitBranch className="h-6 w-6 mr-2 text-purple-500" />;
      case 'platform':
        return <Server className="h-6 w-6 mr-2 text-green-500" />;
      case 'webpage':
        return <Globe className="h-6 w-6 mr-2 text-orange-500" />;
      case 'app_module':
        return <Smartphone className="h-6 w-6 mr-2 text-red-500" />;
      default:
        return <Code className="h-6 w-6 mr-2 text-blue-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <span className={`px-3 py-1 ${darkMode ? 'bg-green-900 text-green-200 border border-green-700 font-medium' : 'bg-green-100 text-green-800'} rounded-full text-sm`}>Healthy</span>;
      case 'degraded':
        return <span className={`px-3 py-1 ${darkMode ? 'bg-yellow-900 text-yellow-200 border border-yellow-700 font-medium' : 'bg-yellow-100 text-yellow-800'} rounded-full text-sm`}>Degraded</span>;
      case 'down':
        return <span className={`px-3 py-1 ${darkMode ? 'bg-red-900 text-red-200 border border-red-700 font-medium' : 'bg-red-100 text-red-800'} rounded-full text-sm`}>Down</span>;
      default:
        return <span className={`px-3 py-1 ${darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700 font-medium' : 'bg-gray-100 text-gray-800'} rounded-full text-sm`}>{status}</span>;
    }
  };

  if (loading) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!service) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Service not found</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Services', path: '/services' },
        { label: service.name, isLast: true }
      ]} />

      {/* Service Header */}
      <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-dark-primary' : ''} flex items-center`}>
            {getServiceIcon(service.service_type)}
            {service.name}
            <span className={`text-sm ml-2 px-2 py-1 ${darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-100 text-gray-700'} rounded-full`}>
              {(service.service_type || 'API').toLowerCase()}
            </span>
          </h1>
          {getStatusBadge(service.status)}
        </div>
        <div className="mb-4">
          {service.description && (
            <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-3`}>{service.description}</p>
          )}
          <div className={`flex items-center space-x-4 text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>
            <span className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              {service.uptime}% Uptime
            </span>
            <span>•</span>
            <span>v{service.version}</span>
            {service.url && (
              <>
                <span>•</span>
                <a href={service.url} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:underline'} flex items-center`}>
                  <Code className="h-4 w-4 mr-1" />
                  {(service.service_type === 'API') ? 'API Docs' : 'Link'}
                </a>
              </>
            )}
          </div>
        </div>
        {squad && (
          <div className={`border-t ${darkMode ? 'border-dark-border' : 'border-gray-200'} pt-4`}>
            <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Owned by: </span>
            <Link to={`/squads/${squad.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} font-medium`}>
              {squad.name} Squad
            </Link>
            {tribe && (
              <>
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}> in </span>
                <Link to={`/tribes/${tribe.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                  {tribe.name} Cluster
                </Link>
              </>
            )}
            {area && (
              <>
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}> within </span>
                <Link to={`/areas/${area.id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                  {area.name} Tribe
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Details */}
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''} flex items-center`}>
            <Code className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
            Technical Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Version:</span>
              <span className={`${darkMode ? 'text-dark-primary' : ''}`}>{service.version}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Status:</span>
              <span className={`${darkMode ? 'text-dark-primary' : ''}`}>{service.status}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Uptime:</span>
              <span className={`${darkMode ? 'text-dark-primary' : ''}`}>{service.uptime}%</span>
            </div>
            <div className="flex justify-between">
              <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Service Type:</span>
              <span className={`${darkMode ? 'text-dark-primary' : ''}`}>{(service.service_type || 'API').toLowerCase()}</span>
            </div>
            {service.url && (
              <div className="flex justify-between">
                <span className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>{(service.service_type === 'API') ? 'API Documentation' : 'URL'}:</span>
                <a href={service.url} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:underline'}`}>
                  Link
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Connected Services */}
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''} flex items-center`}>
            <GitBranch className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : ''}`} />
            Dependencies
          </h2>
          <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4`}>
            To view dependencies, please check the <Link to={`/squads/${service.squad_id}`} className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:underline'}`}>Squad page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;