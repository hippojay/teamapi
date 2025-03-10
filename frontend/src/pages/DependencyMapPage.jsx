import React from 'react';
import DependencyMap from '../components/DependencyMap';

const DependencyMapPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Dependencies Map</h1>
      <p className="text-gray-600 mb-6">
        This visualization shows dependencies between squads based on Team Topologies concepts. 
        Required dependencies are shown in red, while optional dependencies are shown in blue. 
        The interaction modes (Collaboration, X-as-a-Service, Facilitating) are represented by 
        different line patterns and colors. Drag nodes to rearrange the 
        visualization, and click on a node to view more details about that squad.
      </p>
      
      <DependencyMap />
    </div>
  );
};

export default DependencyMapPage;
