import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import LoadingIndicator from '../../components/admin/LoadingIndicator';

const OrgExplorerPage = () => {
  const { darkMode } = useTheme();
  
  // Data states
  const [areas, setAreas] = useState([]);
  const [tribes, setTribes] = useState([]);
  const [squads, setSquads] = useState([]);
  
  // Expanded states
  const [expandedAreas, setExpandedAreas] = useState({});
  const [expandedTribes, setExpandedTribes] = useState({});
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all org data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all areas
      const areasData = await api.getAreas();
      setAreas(areasData);
      
      // Load all tribes
      const tribesData = await api.getTribes();
      setTribes(tribesData);
      
      // Load all squads
      const squadsData = await api.getSquads();
      setSquads(squadsData);
      
      // By default, expand all areas but not tribes
      const initialExpandedAreas = {};
      areasData.forEach(area => {
        initialExpandedAreas[area.id] = true;
      });
      setExpandedAreas(initialExpandedAreas);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load organizational data');
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Toggle expanded state for an area
  const toggleAreaExpand = (areaId) => {
    setExpandedAreas(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  // Toggle expanded state for a tribe
  const toggleTribeExpand = (tribeId) => {
    setExpandedTribes(prev => ({
      ...prev,
      [tribeId]: !prev[tribeId]
    }));
  };

  // Expand all areas
  const expandAllAreas = () => {
    const expandedState = {};
    areas.forEach(area => {
      expandedState[area.id] = true;
    });
    setExpandedAreas(expandedState);
  };

  // Collapse all areas
  const collapseAllAreas = () => {
    setExpandedAreas({});
  };

  // Expand all tribes
  const expandAllTribes = () => {
    const expandedState = {};
    tribes.forEach(tribe => {
      expandedState[tribe.id] = true;
    });
    setExpandedTribes(expandedState);
  };

  // Collapse all tribes
  const collapseAllTribes = () => {
    setExpandedTribes({});
  };

  // Count the total number of squads in a tribe
  const countSquadsInTribe = (tribeId) => {
    return squads.filter(squad => squad.tribe_id === tribeId).length;
  };

  // Count the total number of squads in an area
  const countSquadsInArea = (areaId) => {
    const tribeIds = tribes
      .filter(tribe => tribe.area_id === areaId)
      .map(tribe => tribe.id);
    
    return squads.filter(squad => tribeIds.includes(squad.tribe_id)).length;
  };

  return (
    <div className={`container mx-auto mt-16 p-6 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organization Explorer</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={expandAllAreas}
            className={`px-3 py-2 text-sm rounded ${
              darkMode ? 'bg-dark-button hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Expand All Areas
          </button>
          <button
            onClick={collapseAllAreas}
            className={`px-3 py-2 text-sm rounded ${
              darkMode ? 'bg-dark-button hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Collapse All Areas
          </button>
          <button
            onClick={expandAllTribes}
            className={`px-3 py-2 text-sm rounded ${
              darkMode ? 'bg-dark-button hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Expand All Tribes
          </button>
          <button
            onClick={collapseAllTribes}
            className={`px-3 py-2 text-sm rounded ${
              darkMode ? 'bg-dark-button hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Collapse All Tribes
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      
      {loading ? (
        <LoadingIndicator />
      ) : (
        <div className="space-y-3">
          {areas.map(area => (
            <div
              key={area.id}
              className={`border rounded-lg overflow-hidden ${
                darkMode ? 'border-gray-700' : 'border-gray-300'
              }`}
            >
              {/* Area Header */}
              <div 
                className={`flex items-center px-4 py-3 ${
                  darkMode ? 'bg-dark-secondary' : 'bg-gray-100'
                } cursor-pointer`}
                onClick={() => toggleAreaExpand(area.id)}
              >
                <span className="mr-2">
                  {expandedAreas[area.id] ? (
                    <ChevronDown className="h-5 w-5 text-blue-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-blue-500" />
                  )}
                </span>
                <h3 className="text-lg font-semibold flex-1">{area.name}</h3>
                {area.label && (
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                    darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {area.label_str || area.label}
                  </span>
                )}
                <div className={`ml-2 flex items-center text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Users className="h-4 w-4 mr-1" />
                  <span>{countSquadsInArea(area.id)} squad{countSquadsInArea(area.id) !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              {/* Area Content (Tribes) */}
              {expandedAreas[area.id] && (
                <div className={`p-4 ${darkMode ? 'bg-dark-tertiary' : 'bg-white'}`}>
                  {tribes.filter(tribe => tribe.area_id === area.id).length === 0 ? (
                    <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No tribes in this area
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tribes
                        .filter(tribe => tribe.area_id === area.id)
                        .map(tribe => (
                          <div 
                            key={tribe.id}
                            className={`border rounded ${
                              darkMode ? 'border-gray-700' : 'border-gray-300'
                            }`}
                          >
                            {/* Tribe Header */}
                            <div 
                              className={`flex items-center px-3 py-2 ${
                                darkMode ? 'bg-gray-800' : 'bg-gray-50'
                              } cursor-pointer`}
                              onClick={() => toggleTribeExpand(tribe.id)}
                            >
                              <span className="mr-2">
                                {expandedTribes[tribe.id] ? (
                                  <ChevronDown className="h-4 w-4 text-indigo-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-indigo-500" />
                                )}
                              </span>
                              <h4 className="font-semibold flex-1">{tribe.name}</h4>
                              {tribe.label && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                  darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {tribe.label_str || tribe.label}
                                </span>
                              )}
                              <div className={`ml-2 flex items-center text-xs ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <Users className="h-3 w-3 mr-1" />
                                <span>{countSquadsInTribe(tribe.id)} squad{countSquadsInTribe(tribe.id) !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            
                            {/* Tribe Content (Squads) */}
                            {expandedTribes[tribe.id] && (
                              <div className={`p-3 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                                {squads.filter(squad => squad.tribe_id === tribe.id).length === 0 ? (
                                  <p className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    No squads in this tribe
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {squads
                                      .filter(squad => squad.tribe_id === tribe.id)
                                      .map(squad => (
                                        <div 
                                          key={squad.id}
                                          className={`p-2 border rounded flex items-center ${
                                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                                          }`}
                                        >
                                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                          <h5 className="font-medium text-sm flex-1">{squad.name}</h5>
                                          {squad.status && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                              squad.status === 'Active' 
                                                ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                                                : squad.status === 'Planning'
                                                  ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                                                  : (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                                            }`}>
                                              {squad.status}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {areas.length === 0 && (
            <p className={`italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No areas have been defined yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OrgExplorerPage;
