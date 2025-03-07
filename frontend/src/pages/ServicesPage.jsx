import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Globe, GitBranch, Server, Smartphone, Code } from 'lucide-react';
import api from '../api';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [squads, setSquads] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Healthy</span>;
      case 'degraded':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Degraded</span>;
      case 'down':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Down</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

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
        <span className="font-medium text-gray-800">Services</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Services</h1>
      
      <div className="space-y-4">
        {services.length > 0 ? (
          services.map(service => {
            const squad = squads[service.squad_id];
            
            return (
              <div key={service.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    {service.service_type === 'api' && <Code className="h-5 w-5 mr-2 text-blue-500" />}
                    {service.service_type === 'repository' && <GitBranch className="h-5 w-5 mr-2 text-blue-500" />}
                    {service.service_type === 'platform' && <Server className="h-5 w-5 mr-2 text-blue-500" />}
                    {service.service_type === 'webpage' && <Globe className="h-5 w-5 mr-2 text-blue-500" />}
                    {service.service_type === 'app_module' && <Smartphone className="h-5 w-5 mr-2 text-blue-500" />}
                    {service.name}
                  </h2>
                  {getStatusBadge(service.status)}
                </div>
                {squad && (
                  <div className="mb-3 text-sm">
                    <span className="text-gray-600">Owned by: </span>
                    <Link to={`/squads/${squad.id}`} className="text-blue-600 hover:underline">
                      {squad.name} Squad
                    </Link>
                  </div>
                )}
                {service.description && (
                  <p className="text-gray-600 mb-4">{service.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span>{service.uptime}% Uptime</span>
                  <span>•</span>
                  <span>v{service.version}</span>
                  {service.url && (
                  <>
                  <span>•</span>
                  <a href={service.url} className="text-blue-500 hover:underline">
                  {service.service_type === 'api' ? 'API Docs' : 'Link'}
                  </a>
                  </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">No services found</div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
