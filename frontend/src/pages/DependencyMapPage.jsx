import React from 'react';
import DependencyMap from '../components/DependencyMap';

const DependencyMapPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Dependencies Map</h1>
      <p className="text-gray-600 mb-6">
        This visualisation shows dependencies between squads. Required dependencies are shown in red,
        while optional dependencies are shown in blue with dashed lines. Drag nodes to rearrange the 
        visualisation, and click on a node to view more details about that squad.
      </p>
      
      <DependencyMap />
    </div>
  );
};

export default DependencyMapPage;
