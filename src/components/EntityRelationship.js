import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiClock, FiShare2 } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/EntityRelationship.css';
// This would normally be done with a library like D3.js or Cytoscape.js
// For simplicity, we're implementing a basic force-directed graph
class ForceGraph {
    constructor(canvas, nodes, links) {
        Object.defineProperty(this, "canvas", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ctx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "nodes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "links", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "simulation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "width", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "height", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "animationId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.nodes = nodes;
        this.links = links;
        this.simulation = this.createSimulation();
    }
    createSimulation() {
        // Simple force simulation
        return {
            tick: () => {
                // Apply forces
                for (let i = 0; i < this.links.length; i++) {
                    const link = this.links[i];
                    const source = this.nodes[link.source];
                    const target = this.nodes[link.target];
                    // Calculate direction
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    // Apply force along the link
                    if (distance > 0) {
                        const forceX = dx / distance * 0.1;
                        const forceY = dy / distance * 0.1;
                        source.vx += forceX;
                        source.vy += forceY;
                        target.vx -= forceX;
                        target.vy -= forceY;
                    }
                }
                // Node repulsion
                for (let i = 0; i < this.nodes.length; i++) {
                    for (let j = i + 1; j < this.nodes.length; j++) {
                        const nodeA = this.nodes[i];
                        const nodeB = this.nodes[j];
                        const dx = nodeB.x - nodeA.x;
                        const dy = nodeB.y - nodeA.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > 0 && distance < 100) {
                            const forceX = dx / distance * 1;
                            const forceY = dy / distance * 1;
                            nodeA.vx -= forceX;
                            nodeA.vy -= forceY;
                            nodeB.vx += forceX;
                            nodeB.vy += forceY;
                        }
                    }
                }
                // Update positions
                for (let i = 0; i < this.nodes.length; i++) {
                    const node = this.nodes[i];
                    // Apply velocity
                    node.x += node.vx;
                    node.y += node.vy;
                    // Damping
                    node.vx *= 0.9;
                    node.vy *= 0.9;
                    // Contain within canvas
                    if (node.x < 50)
                        node.x = 50;
                    if (node.x > this.width - 50)
                        node.x = this.width - 50;
                    if (node.y < 50)
                        node.y = 50;
                    if (node.y > this.height - 50)
                        node.y = this.height - 50;
                }
            }
        };
    }
    start() {
        if (this.animationId)
            return;
        const animate = () => {
            this.simulation.tick();
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        this.animationId = requestAnimationFrame(animate);
    }
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Draw links
        this.ctx.strokeStyle = '#aaa';
        this.ctx.lineWidth = 1;
        for (const link of this.links) {
            const source = this.nodes[link.source];
            const target = this.nodes[link.target];
            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
            // Draw relationship label
            if (link.label) {
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.beginPath();
                this.ctx.ellipse(midX, midY, 40, 15, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.font = '10px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(link.label, midX, midY);
            }
        }
        // Draw nodes
        for (const node of this.nodes) {
            // Draw circle
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = node.color;
            this.ctx.fill();
            // Draw text
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.name, node.x, node.y);
        }
    }
}
const EntityRelationship = ({ defaultText = '' }) => {
    const [text, setText] = useState(defaultText);
    const [result, setResult] = useState(null);
    const { serviceStatus, isCheckingStatus, analysisInProgress, error, analyzeEntities } = useLlamaAnalysis();
    const canvasRef = useRef(null);
    const graphRef = useRef(null);
    useEffect(() => {
        // If default text is provided, analyze it automatically
        if (defaultText && serviceStatus?.status === 'healthy') {
            handleAnalysis();
        }
    }, [defaultText, serviceStatus]);
    useEffect(() => {
        // Initialize the graph when we have results
        if (result && canvasRef.current) {
            // Clean up any existing graph
            if (graphRef.current) {
                graphRef.current.stop();
            }
            // Create nodes and links from entities
            const nodes = result.entities.map((entity, i) => ({
                id: i,
                name: entity.name,
                type: entity.type,
                radius: 20 + entity.mentions * 3, // Size by mentions
                color: getEntityColor(entity.type),
                sentiment: entity.sentiment,
                x: Math.random() * canvasRef.current.width,
                y: Math.random() * canvasRef.current.height,
                vx: 0,
                vy: 0
            }));
            // Create links from relationships
            const links = [];
            result.entities.forEach((entity, sourceIndex) => {
                entity.relationships.forEach(rel => {
                    // Find the target entity index
                    const targetIndex = result.entities.findIndex(e => e.name === rel.entity);
                    if (targetIndex !== -1) {
                        links.push({
                            source: sourceIndex,
                            target: targetIndex,
                            label: rel.relationship,
                            value: rel.confidence
                        });
                    }
                });
            });
            // Initialize the graph
            const graph = new ForceGraph(canvasRef.current, nodes, links);
            graphRef.current = graph;
            graph.start();
            // Clean up on unmount
            return () => {
                if (graphRef.current) {
                    graphRef.current.stop();
                }
            };
        }
    }, [result]);
    const getEntityColor = (type) => {
        const colors = {
            'Person': '#4285F4', // Blue
            'Organization': '#EA4335', // Red
            'Location': '#34A853', // Green
            'Date': '#FBBC05', // Yellow
            'Product': '#9C27B0', // Purple
            'Event': '#FF9800', // Orange
            'Work': '#795548' // Brown
        };
        return colors[type] || '#9E9E9E'; // Grey for unknown types
    };
    const handleAnalysis = async () => {
        if (!text.trim())
            return;
        const entityResult = await analyzeEntities(text);
        if (entityResult) {
            setResult(entityResult);
        }
    };
    const handleReset = () => {
        setText('');
        setResult(null);
        // Stop the graph simulation
        if (graphRef.current) {
            graphRef.current.stop();
            graphRef.current = null;
        }
        // Clear the canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    };
    return (_jsxs("div", { className: "entity-relationship-container", children: [_jsxs("h2", { className: "entity-relationship-title", children: [_jsx(FiShare2, { className: "icon" }), " Entity Relationship Analysis"] }), _jsxs("div", { className: "service-status", children: [_jsx("h4", { children: "Llama Service Status" }), isCheckingStatus ? (_jsx("p", { children: "Checking service status..." })) : serviceStatus?.status === 'healthy' ? (_jsxs("div", { className: "status-healthy", children: [_jsx(FiCheck, { className: "status-icon" }), _jsxs("span", { children: ["Service is online using ", serviceStatus.model, serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`] })] })) : (_jsxs("div", { className: "status-error", children: [_jsx(FiAlertCircle, { className: "status-icon" }), _jsxs("span", { children: ["Service is offline: ", serviceStatus?.error || 'Unknown error'] })] }))] }), _jsxs("form", { onSubmit: (e) => { e.preventDefault(); handleAnalysis(); }, className: "entity-relationship-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "text-input", children: "Text to Analyze" }), _jsx("textarea", { id: "text-input", value: text, onChange: (e) => setText(e.target.value), placeholder: "Paste an article or text to extract and visualize entities and their relationships...", rows: 10, disabled: analysisInProgress || serviceStatus?.status !== 'healthy' })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "primary-button", disabled: analysisInProgress || !text.trim() || serviceStatus?.status !== 'healthy', children: analysisInProgress ? 'Analyzing Entities...' : 'Analyze Entities' }), _jsx("button", { type: "button", className: "secondary-button", onClick: handleReset, disabled: analysisInProgress || (!text && !result), children: "Reset" })] })] }), error && (_jsxs("div", { className: "error-message", children: [_jsx(FiAlertCircle, { className: "icon" }), error] })), result && (_jsxs("div", { className: "result-container", children: [_jsx("h3", { children: "Entity Relationship Results" }), _jsx("div", { className: "entity-visualization", children: _jsx("canvas", { ref: canvasRef, width: 800, height: 500, className: "entity-canvas" }) }), _jsxs("div", { className: "entity-list", children: [_jsx("h4", { children: "Detected Entities" }), _jsx("div", { className: "entity-grid", children: result.entities.map((entity, index) => (_jsxs("div", { className: "entity-card", children: [_jsx("div", { className: "entity-type-indicator", style: { backgroundColor: getEntityColor(entity.type) } }), _jsxs("div", { className: "entity-details", children: [_jsx("div", { className: "entity-name", children: entity.name }), _jsx("div", { className: "entity-type", children: entity.type }), _jsxs("div", { className: "entity-mentions", children: ["Mentioned ", entity.mentions, " times"] }), _jsxs("div", { className: "entity-sentiment", children: ["Sentiment: ", entity.sentiment > 0 ? 'Positive' : entity.sentiment < 0 ? 'Negative' : 'Neutral'] })] })] }, index))) })] }), _jsxs("div", { className: "result-metadata", children: [_jsxs("div", { className: "metadata-item", children: [_jsx(FiClock, { className: "icon" }), "Processed in ", result.processing_time.toFixed(2), " seconds"] }), _jsxs("div", { className: "metadata-item", children: [_jsx(FiCpu, { className: "icon" }), "Model: ", result.model_used] })] })] }))] }));
};
export default EntityRelationship;
