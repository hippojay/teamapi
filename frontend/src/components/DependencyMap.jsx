import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import api from '../api';
import * as d3 from 'd3';

const DependencyMap = () => {
  const { darkMode } = useTheme();
  const [dependencies, setDependencies] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [tooltipContent, setTooltipContent] = useState({ x: 0, y: 0, content: '', visible: false });
  
  // Filter options
  // Removed selectedDependencyType state
  const [selectedInteractionMode, setSelectedInteractionMode] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deps, allSquads] = await Promise.all([
          api.getAllDependencies(),
          api.getSquads()
        ]);
        
        setDependencies(deps);
        setSquads(allSquads);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dependency data:', err);
        setError('Failed to load dependency data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Create the visualisation whenever data changes
  useEffect(() => {
    if (loading || squads.length === 0 || dependencies.length === 0) return;
    
    // Filter dependencies based on selected interaction mode
    const filteredDependencies = dependencies.filter(dep => {
      // Filter by interaction mode
      if (selectedInteractionMode !== 'all' && dep.interaction_mode !== selectedInteractionMode) {
        return false;
      }
      
      return true;
    });
    
    // Filter squads based on search term
    const filteredSquads = squads.filter(squad => {
      if (!searchTerm) return true;
      return squad.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    // Find all squad IDs involved in dependencies
    const squadIdsInDependencies = new Set();
    filteredDependencies.forEach(dep => {
      squadIdsInDependencies.add(dep.dependent_squad_id);
      squadIdsInDependencies.add(dep.dependency_squad_id);
    });
    
    // If searching, only include squads matching the search
    // Otherwise, include all squads involved in dependencies
    const relevantSquads = searchTerm
      ? filteredSquads
      : squads.filter(squad => squadIdsInDependencies.has(squad.id));
    
    // Create nodes for each squad
    const nodes = relevantSquads.map(squad => ({
      id: squad.id,
      name: squad.name,
      group: squad.tribe_id // Use tribe_id for coloring
    }));
    
    // Create links from dependencies
    const links = filteredDependencies
      .filter(dep => {
        // Only include links where both squads are in the filtered set
        const dependentSquadExists = relevantSquads.some(s => s.id === dep.dependent_squad_id);
        const dependencySquadExists = relevantSquads.some(s => s.id === dep.dependency_squad_id);
        return dependentSquadExists && dependencySquadExists;
      })
      .map(dep => ({
        source: dep.dependent_squad_id,
        target: dep.dependency_squad_id,
        type: dep.dependency_type,
        interaction: dep.interaction_mode
      }));
    
    // Clear previous visualisation
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Set up dimensions
    const width = 800;
    const height = 600;
    
    // Create the force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));
    
    // Create SVG container
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;')
      .attr('class', darkMode ? 'bg-dark-tertiary' : 'bg-white');
    
    // Define arrow marker for links - for interaction modes
    svg.append('defs').selectAll('marker')
      .data(['collaboration', 'x_as_a_service', 'facilitating'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => {
        // Set color based on interaction mode
        if (d === 'collaboration') {
          return '#9C5FFF'; // Purple
        } else if (d === 'facilitating') {
          return '#48BB78'; // Green
        } else {
          return '#3182CE'; // Blue for x_as_a_service
        }
      })
      .attr('d', 'M0,-5L10,0L0,5');
    
    // Create links with combined styles for type and interaction mode
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => {
        // Set color based on interaction mode
        if (d.interaction === 'collaboration') {
          return '#9C5FFF'; // Purple
        } else if (d.interaction === 'facilitating') {
          return '#48BB78'; // Green
        } else {
          return '#3182CE'; // Blue for x_as_a_service
        }
      })
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => {
        // Modify pattern based on interaction mode
        if (d.interaction === 'collaboration') {
          return '3,3';
        } else if (d.interaction === 'facilitating') {
          return '6,3';
        }
        return null; // x_as_a_service - solid line
      })
      .attr('marker-end', d => `url(#arrow-${d.interaction})`);
    
    // Create color scale for nodes based on tribe
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add circles to each node
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => color(d.group))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // Add text labels to each node
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff') // White text is good for both dark and light modes with colored backgrounds
      .attr('font-weight', 'bold') // Make text bolder for better visibility
      .text(d => d.name.substring(0, 3))
      .append('title')
      .text(d => d.name);
    
    // Add hover interaction
    node.on('mouseover', function(event, d) {
      // Count incoming and outgoing dependencies
      const incoming = links.filter(link => link.target.id === d.id).length;
      const outgoing = links.filter(link => link.source.id === d.id).length;
      
      // Show tooltip
      const tooltip = d3.select(tooltipRef.current);
      setTooltipContent({
        x: event.pageX,
        y: event.pageY,
        content: `
          <div><strong>${d.name}</strong></div>
          <div>Incoming: ${incoming}</div>
          <div>Outgoing: ${outgoing}</div>
        `,
        visible: true
      });
    })
    .on('mouseout', function() {
      setTooltipContent(prev => ({ ...prev, visible: false }));
    })
    .on('click', function(event, d) {
      // Navigate to squad detail page on click
      window.location.href = `/squads/${d.id}`;
    });
    
    // Update positions on each simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
        
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions for interactive nodes
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // Stop simulation when component unmounts
    return () => simulation.stop();
  }, [loading, squads, dependencies, selectedInteractionMode, searchTerm]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading dependency map...</div>;
  }
  
  if (error) {
    return <div className="text-red-600 p-4 text-center">{error}</div>;
  }
  
  if (dependencies.length === 0) {
    return <div className="p-4 bg-yellow-100 rounded-lg">No dependencies found in the system.</div>;
  }
  
  // Get interaction mode label
  const getInteractionModeLabel = (mode) => {
    switch (mode) {
      case 'collaboration': return 'Collaboration';
      case 'x_as_a_service': return 'X-as-a-Service';
      case 'facilitating': return 'Facilitating';
      default: return mode;
    }
  };
  
  return (
    <div className={`${darkMode ? 'bg-dark-card' : 'bg-white'} rounded-lg shadow p-6`}>
      <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Team Dependencies</h2>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Removed dependency type filter */}
        
        <div className="flex-1">
          <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>Filter by Interaction Mode</label>
          <select 
            className={`w-full border ${darkMode ? 'border-dark-border bg-dark-tertiary text-dark-primary' : 'border-gray-300 bg-white text-gray-800'} rounded-md p-2`}
            value={selectedInteractionMode}
            onChange={(e) => setSelectedInteractionMode(e.target.value)}
          >
            <option value="all">All Interactions</option>
            <option value="collaboration">Collaboration</option>
            <option value="x_as_a_service">X-as-a-Service</option>
            <option value="facilitating">Facilitating</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className={`block text-sm font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-700'} mb-1`}>Search Squad</label>
          <input 
            type="text"
            placeholder="Search by squad name"
            className={`w-full border ${darkMode ? 'border-dark-border bg-dark-tertiary text-dark-primary placeholder-gray-500' : 'border-gray-300 bg-white text-gray-800'} rounded-md p-2`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className={`${darkMode ? 'bg-dark-secondary' : 'bg-gray-50'} p-4 rounded-lg relative overflow-hidden`}>
        <div className="flex justify-center">
          <svg ref={svgRef} className="cursor-grab active:cursor-grabbing"></svg>
        </div>
        
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-4`}>
          <p>Drag nodes to reposition. Click on a node to view squad details.</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Removed dependency types legend */}
        
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>Interaction Modes:</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <div className="h-3 w-6 bg-blue-700 mr-2"></div>
              <span className={`text-sm ${darkMode ? 'text-dark-primary' : ''}`} title="Team consumes another team's service with minimal direct interaction.">X-as-a-Service (Default)</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-6 bg-purple-700 mr-2 border-dotted border-t-2 border-white"></div>
              <span className={`text-sm ${darkMode ? 'text-dark-primary' : ''}`} title="Teams work together closely with high communication frequency.">Collaboration</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-6 bg-green-600 mr-2 border-dashed border-t-2 border-dotted border-white"></div>
              <span className={`text-sm ${darkMode ? 'text-dark-primary' : ''}`} title="Team helps another team overcome obstacles or learn skills.">Facilitating</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tooltip container */}
      <div 
        ref={tooltipRef}
        className={`absolute ${darkMode ? 'bg-dark-tertiary text-dark-primary' : 'bg-white text-gray-800'} shadow-lg rounded p-2 text-sm z-50 pointer-events-none`}
        style={{
          left: `${tooltipContent.x + 10}px`,
          top: `${tooltipContent.y - 10}px`,
          opacity: tooltipContent.visible ? 1 : 0,
          transition: 'opacity 0.2s',
          maxWidth: '200px'
        }}
        dangerouslySetInnerHTML={{ __html: tooltipContent.content }}
      />
    </div>
  );
};

export default DependencyMap;
