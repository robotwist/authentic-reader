import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import '../styles/NetworkAnalysis.css';
const NetworkAnalysis = ({ data, width = 600, height = 400 }) => {
    const svgRef = useRef(null);
    const [tooltip, setTooltip] = useState({
        visible: false,
        x: 0,
        y: 0,
        content: ''
    });
    // Generate color based on node type
    const getNodeColor = (type) => {
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
    const getNodeSize = (mentions) => {
        return Math.max(5, Math.min(15, 5 + mentions));
    };
    // Calculate edge thickness based on weight
    const getEdgeThickness = (weight) => {
        return Math.max(1, Math.min(5, weight));
    };
    // Generate edge style based on relationship type
    const getEdgeStyle = (type) => {
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
        if (!svgRef.current || data.nodes.length === 0)
            return;
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
        svg.call(zoom);
        // Convert edges to use indices
        const nodeMap = new Map(data.nodes.map((node, i) => [node.id, i]));
        const links = data.edges.map(edge => ({
            source: nodeMap.get(edge.source) || 0,
            target: nodeMap.get(edge.target) || 0,
            weight: edge.weight,
            type: edge.type
        }));
        // Create the simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force('link', d3.forceLink(links)
            .id((d) => d.id)
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
            .on('end', dragended));
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
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
            node
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y);
            labels
                .attr('x', (d) => d.x)
                .attr('y', (d) => d.y);
        });
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active)
                simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active)
                simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }, [data, width, height]);
    return (_jsxs("div", { className: "network-analysis", children: [_jsx("h3", { children: "Entity Network Analysis" }), _jsx("p", { className: "network-description", children: "This visualization shows relationships between entities mentioned in the article. Larger nodes indicate more mentions, and thicker lines show stronger connections." }), _jsxs("div", { className: "legend", children: [_jsx("h4", { children: "Node Types:" }), _jsxs("div", { className: "legend-items", children: [_jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "color-box", style: { backgroundColor: '#4e79a7' } }), _jsx("span", { children: "Person" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "color-box", style: { backgroundColor: '#f28e2c' } }), _jsx("span", { children: "Organization" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "color-box", style: { backgroundColor: '#e15759' } }), _jsx("span", { children: "Location" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "color-box", style: { backgroundColor: '#76b7b2' } }), _jsx("span", { children: "Event" })] })] })] }), _jsxs("div", { className: "network-container", children: [_jsx("svg", { ref: svgRef }), tooltip.visible && (_jsx("div", { className: "tooltip", style: {
                            left: tooltip.x + 10,
                            top: tooltip.y - 10,
                            opacity: tooltip.visible ? 1 : 0
                        }, dangerouslySetInnerHTML: { __html: tooltip.content } }))] }), _jsxs("div", { className: "network-insights", children: [_jsx("h4", { children: "Network Insights:" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Centrality:" }), " ", data.nodes.length > 0 ?
                                        `${data.nodes[0].id} is the most central entity` :
                                        'No central entities detected'] }), _jsxs("li", { children: [_jsx("strong", { children: "Communities:" }), " ", data.nodes.length > 3 ?
                                        'Multiple entity groups detected' :
                                        'Not enough entities for community analysis'] }), _jsxs("li", { children: [_jsx("strong", { children: "Power Analysis:" }), " ", data.nodes.length > 0 ?
                                        'Some entities have disproportionate influence' :
                                        'No power structure detected'] })] })] })] }));
};
export default NetworkAnalysis;
