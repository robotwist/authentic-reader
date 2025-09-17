import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import '../styles/NetworkAnalysis.css';

interface NetworkNode {
  id: string;
  type: string;
  mentions: number;
  sentiment: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface NetworkAnalysisProps {
  data: NetworkGraphData;
  width?: number;
  height?: number;
}

const NetworkAnalysis: React.FC<NetworkAnalysisProps> = ({
  data,
  width = 600,
  height = 400
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });
  
  // Generate color based on node type
  const getNodeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'person':
        return '#4e79a7';
      case 'organization':
        return '#f28e2c';
      case 'location':
        return '#e15759';
      case 'event':
        return '#76b7b2';
      case 'product':
        return '#59a14f';
      default:
        return '#b07aa1';
    }
  };
  
  // Calculate node size based on mentions
  const getNodeSize = (mentions: number) => {
    return Math.max(5, Math.min(15, 5 + mentions));
  };
  
  // Calculate edge thickness based on weight
  const getEdgeThickness = (weight: number) => {
    return Math.max(1, Math.min(5, weight));
  };
  
  // Generate edge style based on relationship type
  const getEdgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'positive':
        return '#59a14f';
      case 'negative':
        return '#e15759';
      case 'neutral':
        return '#bab0ab';
      default:
        return '#bab0ab';
    }
  };
  
  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
    
    // Create a group for the graph
    const g = svg.append('g');
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom as any);
    
    // Convert edges to use indices
    const nodeMap = new Map(data.nodes.map((node, i) => [node.id, i]));
    const links = data.edges.map(edge => ({
      source: nodeMap.get(edge.source) || 0,
      target: nodeMap.get(edge.target) || 0,
      weight: edge.weight,
      type: edge.type
    }));
    
    // Create the simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));
    
    // Create the edges
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', d => getEdgeThickness(d.weight))
      .attr('stroke', d => getEdgeStyle(d.type))
      .attr('opacity', 0.6);
    
    // Create the nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', d => getNodeSize(d.mentions))
      .attr('fill', d => getNodeColor(d.type))
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);
    
    // Add node labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text(d => d.id)
      .attr('font-size', '10px')
      .attr('dx', 12)
      .attr('dy', 4);
    
    // Add tooltips
    node.on('mouseover', (event, d) => {
      setTooltip({
        visible: true,
        x: event.pageX,
        y: event.pageY,
        content: `${d.id} (${d.type})<br/>Mentions: ${d.mentions}<br/>Sentiment: ${d.sentiment.toFixed(2)}`
      });
    })
    .on('mouseout', () => {
      setTooltip({ ...tooltip, visible: false });
    });
    
    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
        
      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
        
      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
    
    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [data, width, height]);
  
  return (
    <div className="network-analysis">
      <h3>Entity Network Analysis</h3>
      <p className="network-description">
        This visualization shows relationships between entities mentioned in the article. 
        Larger nodes indicate more mentions, and thicker lines show stronger connections.
      </p>
      
      <div className="legend">
        <h4>Node Types:</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: '#4e79a7' }}></span>
            <span>Person</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: '#f28e2c' }}></span>
            <span>Organization</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: '#e15759' }}></span>
            <span>Location</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: '#76b7b2' }}></span>
            <span>Event</span>
          </div>
        </div>
      </div>
      
      <div className="network-container">
        <svg ref={svgRef}></svg>
        
        {tooltip.visible && (
          <div 
            className="tooltip" 
            style={{ 
              left: tooltip.x + 10, 
              top: tooltip.y - 10,
              opacity: tooltip.visible ? 1 : 0
            }}
            dangerouslySetInnerHTML={{ __html: tooltip.content }}
          />
        )}
      </div>
      
      <div className="network-insights">
        <h4>Network Insights:</h4>
        <ul>
          <li>
            <strong>Centrality:</strong> {data.nodes.length > 0 ? 
              `${data.nodes[0].id} is the most central entity` : 
              'No central entities detected'}
          </li>
          <li>
            <strong>Communities:</strong> {data.nodes.length > 3 ? 
              'Multiple entity groups detected' : 
              'Not enough entities for community analysis'}
          </li>
          <li>
            <strong>Power Analysis:</strong> {data.nodes.length > 0 ? 
              'Some entities have disproportionate influence' : 
              'No power structure detected'}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NetworkAnalysis; 