import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Database, ChevronRight, Activity, GitBranch, Code } from 'lucide-react';
import api from '../api';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [squad, setSquad] = useState(null);
  const [tribe, setTribe] = useState(null);
  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Healthy</span>;
      case 'degraded':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Degraded</span>;
      case 'down':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Down</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!service) {
    return <div className="text-center py-10">Service not found</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/services" className="hover:text-blue-500">Services</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="font-medium text-gray-800">{service.name}</span>
      </div>

      {/* Service Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold flex items-center">
            <Database className="h-6 w-6 mr-2 text-blue-500" />
            {service.name}
          </h1>
          {getStatusBadge(service.status)}
        </div>
        <div className="mb-4">
          {service.description && (
            <p className="text-gray-600 mb-3">{service.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              {service.uptime}% Uptime
            </span>
            <span>•</span>
            <span>v{service.version}</span>
            {service.api_docs_url && (
              <>
                <span>•</span>
                <a href={service.api_docs_url} className="text-blue-500 hover:underline flex items-center">
                  <Code className="h-4 w-4 mr-1" />
                  API Docs
                </a>
              </>
            )}
          </div>
        </div>
        {squad && (
          <div className="border-t pt-4">
            <span className="text-gray-600">Owned by: </span>
            <Link to={`/squads/${squad.id}`} className="text-blue-600 hover:underline font-medium">
              {squad.name} Squad
            </Link>
            {tribe && (
              <>
                <span className="text-gray-600"> in </span>
                <Link to={`/tribes/${tribe.id}`} className="text-blue-600 hover:underline">
                  {tribe.name} Tribe
                </Link>
              </>
            )}
            {area && (
              <>
                <span className="text-gray-600"> within </span>
                <Link to={`/areas/${area.id}`} className="text-blue-600 hover:underline">
                  {area.name} Area
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Technical Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span>{service.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span>{service.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span>{service.uptime}%</span>
            </div>
            {service.api_docs_url && (
              <div className="flex justify-between">
                <span className="text-gray-600">API Documentation:</span>
                <a href={service.api_docs_url} className="text-blue-500 hover:underline">
                  Link
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Connected Services */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <GitBranch className="h-5 w-5 mr-2" />
            Dependencies
          </h2>
          <p className="text-gray-600 mb-4">
            To view dependencies, please check the <Link to={`/squads/${service.squad_id}`} className="text-blue-500 hover:underline">Squad page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
