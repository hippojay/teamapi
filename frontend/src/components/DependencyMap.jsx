import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import * as d3 from 'd3';

const DependencyMap = () => {
  const [dependencies, setDependencies] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [tooltipContent, setTooltipContent] = useState({ x: 0, y: 0, content: '', visible: false });
  
  // Filter options
  const [selectedDependencyType, setSelectedDependencyType] = useState('all');
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
    
    // Filter dependencies based on selected type and interaction mode
    const filteredDependencies = dependencies.filter(dep => {
      // Filter by dependency type
      if (selectedDependencyType !== 'all' && dep.dependency_type.toLowerCase() !== selectedDependencyType) {
        return false;
      }
      
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
      .attr('style', 'max-width: 100%; height: auto;');
    
    // Define arrow marker for links - combine dependency type and interaction mode
    svg.append('defs').selectAll('marker')
      .data(['required-collaboration', 'required-x_as_a_service', 'required-facilitating', 
             'optional-collaboration', 'optional-x_as_a_service', 'optional-facilitating'])
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
        // Get base color from dependency type
        const baseColor = d.startsWith('required') ? '#E53E3E' : '#3182CE';
        
        // Modify shade based on interaction mode
        if (d.includes('collaboration')) {
          return d3.color(baseColor).darker(0.5);
        } else if (d.includes('facilitating')) {
          return d3.color(baseColor).brighter(0.5);
        }
        return baseColor; // x_as_a_service - default color
      })
      .attr('d', 'M0,-5L10,0L0,5');
    
    // Create links with combined styles for type and interaction mode
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => {
        // Base color from dependency type
        const baseColor = d.type === 'required' ? '#E53E3E' : '#3182CE';
        
        // Modify shade based on interaction mode
        if (d.interaction === 'collaboration') {
          return d3.color(baseColor).darker(0.5);
        } else if (d.interaction === 'facilitating') {
          return d3.color(baseColor).brighter(0.5);
        }
        return baseColor; // x_as_a_service - default color
      })
      .attr('stroke-width', d => d.type === 'required' ? 2 : 1.5)
      .attr('stroke-dasharray', d => {
        // Base pattern for optional dependencies
        let pattern = d.type === 'optional' ? '5,5' : null;
        
        // Modify pattern based on interaction mode
        if (d.interaction === 'collaboration') {
          return pattern ? '8,4' : '3,3';
        } else if (d.interaction === 'facilitating') {
          return pattern ? '3,3,6,3' : '6,3';
        }
        return pattern; // x_as_a_service - default pattern
      })
      .attr('marker-end', d => `url(#arrow-${d.type}-${d.interaction})`);
    
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
      .attr('fill', '#fff')
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
  }, [loading, squads, dependencies, selectedDependencyType, selectedInteractionMode, searchTerm]);
  
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Team Dependencies</h2>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Dependency Type</label>
          <select 
            className="w-full border border-gray-300 rounded-md p-2"
            value={selectedDependencyType}
            onChange={(e) => setSelectedDependencyType(e.target.value)}
          >
            <option value="all">All Dependencies</option>
            <option value="required">Required Dependencies</option>
            <option value="optional">Optional Dependencies</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Interaction Mode</label>
          <select 
            className="w-full border border-gray-300 rounded-md p-2"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Squad</label>
          <input 
            type="text"
            placeholder="Search by squad name"
            className="w-full border border-gray-300 rounded-md p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg relative overflow-hidden">
        <div className="flex justify-center">
          <svg ref={svgRef} className="cursor-grab active:cursor-grabbing"></svg>
        </div>
        
        <div className="text-xs text-gray-500 mt-4">
          <p>Drag nodes to reposition. Click on a node to view squad details.</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Dependency Types:</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <div className="h-3 w-6 bg-red-600 mr-2"></div>
              <span className="text-sm">Required Dependency</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-6 bg-blue-600 mr-2 border-dashed border-t-2 border-white"></div>
              <span className="text-sm">Optional Dependency</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-2">Interaction Modes:</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <div className="h-3 w-6 bg-blue-700 mr-2"></div>
              <span className="text-sm" title="Team consumes another team's service with minimal direct interaction.">X-as-a-Service (Default)</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-6 bg-purple-700 mr-2 border-dotted border-t-2 border-white"></div>
              <span className="text-sm" title="Teams work together closely with high communication frequency.">Collaboration</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-6 bg-green-600 mr-2 border-dashed border-t-2 border-dotted border-white"></div>
              <span className="text-sm" title="Team helps another team overcome obstacles or learn skills.">Facilitating</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tooltip container */}
      <div 
        ref={tooltipRef}
        className="absolute bg-white shadow-lg rounded p-2 text-sm z-50 pointer-events-none"
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
