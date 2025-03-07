import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import TeamCompositionBar from '../components/TeamCompositionBar';
import DescriptionEditor from '../components/DescriptionEditor';
import api from '../api';

const AreaDetailPage = () => {
  const { id } = useParams();
  const [area, setArea] = useState(null);
  const [tribes, setTribes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch area details
        const areaData = await api.getArea(id);
        setArea(areaData);
        
        // Fetch tribes in this area
        const tribesData = await api.getTribes(id);
        setTribes(tribesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching area data:', err);
        setError('Failed to load area data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!area) {
    return <div className="text-center py-10">Area not found</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/areas" className="hover:text-blue-500">Areas</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="font-medium text-gray-800">{area.name}</span>
      </div>

      {/* Area Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h1 className="text-2xl font-bold mb-3">{area.name}</h1>
        <div className="flex items-center space-x-2 text-gray-600 mb-3">
          <Users className="h-5 w-5" />
          <span>{area.member_count > 0 ? area.member_count : 'No'} member{area.member_count !== 1 ? 's' : ''}</span>
          <span className="mx-1">•</span>
          <span className={`font-medium ${getCapacityColor(area.total_capacity)}`}>
            {area.total_capacity.toFixed(1)} FTE
          </span>
        </div>
        
        {/* Team Composition Bar */}
        {area.core_count !== undefined && (
          <TeamCompositionBar 
            core_count={area.core_count || 0} 
            subcon_count={area.subcon_count || 0}
            core_capacity={area.core_capacity || 0} 
            subcon_capacity={area.subcon_capacity || 0}
          />
        )}
        <div className="text-gray-600 mb-2">
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

      {/* Tribes in this Area */}
      <h2 className="text-xl font-semibold mb-4">Tribes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tribes.length > 0 ? (
          tribes.map(tribe => (
            <div key={tribe.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-3">{tribe.name}</h3>
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <Users className="h-4 w-4" />
                <span>{tribe.member_count > 0 ? tribe.member_count : 'No'} member{tribe.member_count !== 1 ? 's' : ''}</span>
                <span className="mx-1">•</span>
                <span className={`font-medium ${getCapacityColor(tribe.total_capacity)}`}>
                  {tribe.total_capacity.toFixed(1)} FTE
                </span>
              </div>
              
              {/* Team Composition Bar */}
              {tribe.core_count !== undefined && (
                <div className="mb-4">
                  <TeamCompositionBar 
                    core_count={tribe.core_count || 0} 
                    subcon_count={tribe.subcon_count || 0}
                    core_capacity={tribe.core_capacity || 0} 
                    subcon_capacity={tribe.subcon_capacity || 0}
                  />
                </div>
              )}
              {tribe.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{tribe.description}</p>
              )}
              <Link 
                to={`/tribes/${tribe.id}`}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Tribe
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-6 text-gray-500">
            No tribes found in this area
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaDetailPage;
