import React from 'react';
import { useTheme } from '../context/ThemeContext';
import DependencyMap from '../components/DependencyMap';

const DependencyMapPage = () => {
  const { darkMode } = useTheme();
  return (
    <div>
      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Team Dependencies Map</h1>
      <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-6`}>
        This visualisation shows dependencies between squads based on Team Topologies concepts. 
        The interaction modes (Collaboration, X-as-a-Service, Facilitating) are represented by 
        different line patterns and colours. Drag nodes to rearrange the 
        visualisation, and click on a node to view more details about that squad.
      </p>
      
      <DependencyMap />
    </div>
  );
};

export default DependencyMapPage;
