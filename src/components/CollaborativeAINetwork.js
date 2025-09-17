import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiTarget, FiBarChart2, FiCpu, FiPlay, FiPause, FiGitBranch, FiGlobe, FiShield, FiArrowRight } from 'react-icons/fi';
import '../styles/CollaborativeAINetwork.css';
const CollaborativeAINetwork = ({ onNetworkUpdate, onTaskComplete }) => {
    const [nodes, setNodes] = useState([
        {
            id: 'central-hub',
            name: 'Central Intelligence Hub',
            type: 'hub',
            position: { x: 50, y: 50 },
            status: 'active',
            connections: ['bias-specialist', 'fact-checker', 'sentiment-analyzer', 'coordinator-1'],
            capabilities: ['Task Distribution', 'Result Synthesis', 'Network Coordination'],
            performance: { efficiency: 0.95, reliability: 0.92, collaboration: 0.88 },
            knowledge: { domain: 'General AI', expertise: 0.90, sharedInsights: 15 }
        },
        {
            id: 'bias-specialist',
            name: 'Bias Detection Specialist',
            type: 'specialist',
            position: { x: 20, y: 30 },
            status: 'active',
            connections: ['central-hub', 'coordinator-1'],
            capabilities: ['Political Bias', 'Framing Analysis', 'Source Bias'],
            currentTask: 'Analyzing political content bias',
            performance: { efficiency: 0.89, reliability: 0.87, collaboration: 0.85 },
            knowledge: { domain: 'Media Bias', expertise: 0.94, sharedInsights: 8 }
        },
        {
            id: 'fact-checker',
            name: 'Fact-Checking Specialist',
            type: 'specialist',
            position: { x: 80, y: 30 },
            status: 'processing',
            connections: ['central-hub', 'coordinator-1'],
            capabilities: ['Claim Verification', 'Source Validation', 'Evidence Analysis'],
            currentTask: 'Verifying scientific claims',
            performance: { efficiency: 0.92, reliability: 0.94, collaboration: 0.89 },
            knowledge: { domain: 'Fact-Checking', expertise: 0.91, sharedInsights: 12 }
        },
        {
            id: 'sentiment-analyzer',
            name: 'Sentiment Analysis Specialist',
            type: 'specialist',
            position: { x: 20, y: 70 },
            status: 'active',
            connections: ['central-hub', 'coordinator-1'],
            capabilities: ['Emotional Analysis', 'Tone Detection', 'Polarity Analysis'],
            performance: { efficiency: 0.94, reliability: 0.89, collaboration: 0.87 },
            knowledge: { domain: 'Sentiment Analysis', expertise: 0.93, sharedInsights: 6 }
        },
        {
            id: 'coordinator-1',
            name: 'Task Coordinator',
            type: 'coordinator',
            position: { x: 50, y: 80 },
            status: 'active',
            connections: ['central-hub', 'bias-specialist', 'fact-checker', 'sentiment-analyzer', 'validator-1'],
            capabilities: ['Task Management', 'Resource Allocation', 'Progress Tracking'],
            performance: { efficiency: 0.88, reliability: 0.90, collaboration: 0.92 },
            knowledge: { domain: 'Coordination', expertise: 0.87, sharedInsights: 10 }
        },
        {
            id: 'validator-1',
            name: 'Quality Validator',
            type: 'validator',
            position: { x: 80, y: 70 },
            status: 'idle',
            connections: ['coordinator-1'],
            capabilities: ['Quality Assurance', 'Cross-Validation', 'Error Detection'],
            performance: { efficiency: 0.91, reliability: 0.93, collaboration: 0.86 },
            knowledge: { domain: 'Validation', expertise: 0.89, sharedInsights: 4 }
        }
    ]);
    const [connections, setConnections] = useState([
        {
            id: 'hub-bias',
            from: 'central-hub',
            to: 'bias-specialist',
            strength: 0.9,
            type: 'data',
            status: 'active',
            dataFlow: 85
        },
        {
            id: 'hub-fact',
            from: 'central-hub',
            to: 'fact-checker',
            strength: 0.8,
            type: 'data',
            status: 'busy',
            dataFlow: 92
        },
        {
            id: 'hub-sentiment',
            from: 'central-hub',
            to: 'sentiment-analyzer',
            strength: 0.85,
            type: 'data',
            status: 'active',
            dataFlow: 78
        },
        {
            id: 'coord-bias',
            from: 'coordinator-1',
            to: 'bias-specialist',
            strength: 0.75,
            type: 'control',
            status: 'active',
            dataFlow: 65
        },
        {
            id: 'coord-fact',
            from: 'coordinator-1',
            to: 'fact-checker',
            strength: 0.8,
            type: 'control',
            status: 'busy',
            dataFlow: 88
        },
        {
            id: 'coord-sentiment',
            from: 'coordinator-1',
            to: 'sentiment-analyzer',
            strength: 0.7,
            type: 'control',
            status: 'active',
            dataFlow: 72
        },
        {
            id: 'coord-validator',
            from: 'coordinator-1',
            to: 'validator-1',
            strength: 0.6,
            type: 'feedback',
            status: 'idle',
            dataFlow: 0
        }
    ]);
    const [tasks, setTasks] = useState([]);
    const [isNetworkActive, setIsNetworkActive] = useState(false);
    const [networkMetrics, setNetworkMetrics] = useState({
        totalNodes: 0,
        activeConnections: 0,
        averageEfficiency: 0,
        collectiveIntelligence: 0,
        totalInsights: 0
    });
    useEffect(() => {
        updateNetworkMetrics();
        if (isNetworkActive) {
            startCollaborativeTasks();
        }
    }, [nodes, connections, isNetworkActive]);
    const updateNetworkMetrics = () => {
        const totalNodes = nodes.length;
        const activeConnections = connections.filter(c => c.status === 'active' || c.status === 'busy').length;
        const averageEfficiency = nodes.reduce((sum, node) => sum + node.performance.efficiency, 0) / totalNodes;
        const totalInsights = nodes.reduce((sum, node) => sum + node.knowledge.sharedInsights, 0);
        const collectiveIntelligence = (averageEfficiency + (activeConnections / connections.length)) / 2;
        setNetworkMetrics({
            totalNodes,
            activeConnections,
            averageEfficiency,
            collectiveIntelligence,
            totalInsights
        });
    };
    const startCollaborativeTasks = useCallback(async () => {
        const collaborativeTask = {
            id: `task-${Date.now()}`,
            title: 'Comprehensive Media Analysis',
            description: 'Multi-agent collaboration to analyze complex media content',
            participants: ['bias-specialist', 'fact-checker', 'sentiment-analyzer', 'validator-1'],
            status: 'planning',
            progress: 0,
            startTime: new Date(),
            insights: [],
            collectiveIntelligence: 0
        };
        setTasks(prev => [collaborativeTask, ...prev]);
        // Simulate collaborative task execution
        await executeCollaborativeTask(collaborativeTask);
    }, []);
    const executeCollaborativeTask = async (task) => {
        const phases = [
            { name: 'Planning', duration: 2000, progress: 25 },
            { name: 'Data Collection', duration: 3000, progress: 50 },
            { name: 'Analysis', duration: 4000, progress: 75 },
            { name: 'Synthesis', duration: 2000, progress: 100 }
        ];
        for (const phase of phases) {
            // Update task status
            setTasks(prev => prev.map(t => t.id === task.id
                ? { ...t, status: 'executing', progress: phase.progress }
                : t));
            // Simulate node collaboration
            await simulateNodeCollaboration(task, phase.name);
            // Wait for phase completion
            await new Promise(resolve => setTimeout(resolve, phase.duration));
        }
        // Complete task
        const completedTask = {
            ...task,
            status: 'completed',
            endTime: new Date(),
            collectiveIntelligence: Math.random() * 0.3 + 0.7
        };
        setTasks(prev => prev.map(t => t.id === task.id ? completedTask : t));
        if (onTaskComplete) {
            onTaskComplete(completedTask);
        }
    };
    const simulateNodeCollaboration = async (task, phase) => {
        const insights = [
            'Detected new bias pattern in political content',
            'Identified factual inconsistencies in claims',
            'Recognized emotional manipulation techniques',
            'Cross-validated analysis results across specialists',
            'Generated comprehensive media literacy insights'
        ];
        // Add random insights
        const newInsights = insights.slice(0, Math.floor(Math.random() * 3) + 1);
        setTasks(prev => prev.map(t => t.id === task.id
            ? { ...t, insights: [...t.insights, ...newInsights] }
            : t));
        // Update node statuses
        setNodes(prev => prev.map(node => {
            if (task.participants.includes(node.id)) {
                return {
                    ...node,
                    status: Math.random() > 0.3 ? 'processing' : 'active',
                    knowledge: {
                        ...node.knowledge,
                        sharedInsights: node.knowledge.sharedInsights + Math.floor(Math.random() * 2) + 1
                    }
                };
            }
            return node;
        }));
    };
    const getNodeStatusColor = (status) => {
        switch (status) {
            case 'active': return '#28a745';
            case 'processing': return '#ffc107';
            case 'idle': return '#6c757d';
            case 'error': return '#dc3545';
            default: return '#6c757d';
        }
    };
    const getNodeTypeIcon = (type) => {
        switch (type) {
            case 'hub': return _jsx(FiGlobe, {});
            case 'specialist': return _jsx(FiTarget, {});
            case 'coordinator': return _jsx(FiUsers, {});
            case 'validator': return _jsx(FiShield, {});
            default: return _jsx(FiCpu, {});
        }
    };
    const getConnectionTypeColor = (type) => {
        switch (type) {
            case 'data': return '#007bff';
            case 'control': return '#28a745';
            case 'feedback': return '#ffc107';
            case 'collaboration': return '#6f42c1';
            default: return '#6c757d';
        }
    };
    return (_jsxs("div", { className: "collaborative-ai-network", children: [_jsxs("div", { className: "network-header", children: [_jsxs("div", { className: "header-content", children: [_jsx(FiGlobe, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "Collaborative AI Network" }), _jsx("p", { children: "Multi-agent system with collective intelligence and inter-agent communication" })] })] }), _jsx("div", { className: "network-controls", children: _jsx("button", { onClick: () => setIsNetworkActive(!isNetworkActive), className: `network-button ${isNetworkActive ? 'active' : ''}`, children: isNetworkActive ? (_jsxs(_Fragment, { children: [_jsx(FiPause, {}), "Pause Network"] })) : (_jsxs(_Fragment, { children: [_jsx(FiPlay, {}), "Activate Network"] })) }) })] }), _jsx("div", { className: "network-visualization", children: _jsxs("div", { className: "network-canvas", children: [_jsx("svg", { className: "connections-layer", width: "100%", height: "400", children: connections.map((connection) => {
                                const fromNode = nodes.find(n => n.id === connection.from);
                                const toNode = nodes.find(n => n.id === connection.to);
                                if (!fromNode || !toNode)
                                    return null;
                                const x1 = fromNode.position.x;
                                const y1 = fromNode.position.y;
                                const x2 = toNode.position.x;
                                const y2 = toNode.position.y;
                                return (_jsxs("g", { children: [_jsx("line", { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%`, stroke: getConnectionTypeColor(connection.type), strokeWidth: connection.strength * 3, opacity: connection.status === 'idle' ? 0.3 : 0.8, className: "connection-line" }), _jsx("circle", { cx: `${(x1 + x2) / 2}%`, cy: `${(y1 + y2) / 2}%`, r: "3", fill: getConnectionTypeColor(connection.type), opacity: connection.dataFlow / 100 })] }, connection.id));
                            }) }), _jsx("div", { className: "nodes-layer", children: nodes.map((node) => (_jsxs("div", { className: `network-node ${node.type} ${node.status}`, style: {
                                    left: `${node.position.x}%`,
                                    top: `${node.position.y}%`
                                }, children: [_jsx("div", { className: "node-icon", children: getNodeTypeIcon(node.type) }), _jsxs("div", { className: "node-content", children: [_jsx("h4", { children: node.name }), _jsxs("div", { className: "node-status", children: [_jsx("span", { className: "status-dot", style: { backgroundColor: getNodeStatusColor(node.status) } }), _jsx("span", { className: "status-text", children: node.status })] }), node.currentTask && (_jsx("p", { className: "node-task", children: node.currentTask })), _jsxs("div", { className: "node-metrics", children: [_jsxs("div", { className: "metric", children: [_jsx("span", { children: "Efficiency:" }), _jsxs("span", { children: [Math.round(node.performance.efficiency * 100), "%"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Insights:" }), _jsx("span", { children: node.knowledge.sharedInsights })] })] })] })] }, node.id))) })] }) }), _jsxs("div", { className: "network-metrics", children: [_jsxs("h3", { children: [_jsx(FiBarChart2, {}), " Network Metrics"] }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Total Nodes" }), _jsx("span", { className: "metric-value", children: networkMetrics.totalNodes })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Active Connections" }), _jsx("span", { className: "metric-value", children: networkMetrics.activeConnections })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Average Efficiency" }), _jsxs("span", { className: "metric-value", children: [Math.round(networkMetrics.averageEfficiency * 100), "%"] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Collective Intelligence" }), _jsxs("span", { className: "metric-value", children: [Math.round(networkMetrics.collectiveIntelligence * 100), "%"] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Total Insights" }), _jsx("span", { className: "metric-value", children: networkMetrics.totalInsights })] })] })] }), _jsxs("div", { className: "collaborative-tasks", children: [_jsxs("h3", { children: [_jsx(FiUsers, {}), " Collaborative Tasks"] }), _jsx("div", { className: "tasks-list", children: tasks.map((task) => (_jsxs("div", { className: `task-item ${task.status}`, children: [_jsxs("div", { className: "task-header", children: [_jsx("h4", { children: task.title }), _jsx("span", { className: `task-status ${task.status}`, children: task.status })] }), _jsx("p", { className: "task-description", children: task.description }), _jsxs("div", { className: "task-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${task.progress}%` } }) }), _jsxs("span", { className: "progress-text", children: [task.progress, "%"] })] }), _jsxs("div", { className: "task-participants", children: [_jsx("strong", { children: "Participants:" }), _jsx("div", { className: "participants-list", children: task.participants.map(participantId => {
                                                const participant = nodes.find(n => n.id === participantId);
                                                return (_jsx("span", { className: "participant", children: participant?.name || participantId }, participantId));
                                            }) })] }), task.insights.length > 0 && (_jsxs("div", { className: "task-insights", children: [_jsx("strong", { children: "Collaborative Insights:" }), _jsx("ul", { children: task.insights.slice(-3).map((insight, index) => (_jsx("li", { children: insight }, index))) })] })), task.status === 'completed' && (_jsxs("div", { className: "task-intelligence", children: [_jsx("strong", { children: "Collective Intelligence Score:" }), _jsxs("span", { className: "intelligence-score", children: [Math.round(task.collectiveIntelligence * 100), "%"] })] }))] }, task.id))) })] }), _jsxs("div", { className: "connection-details", children: [_jsxs("h3", { children: [_jsx(FiGitBranch, {}), " Connection Details"] }), _jsx("div", { className: "connections-grid", children: connections.map((connection) => (_jsxs("div", { className: `connection-card ${connection.status}`, children: [_jsxs("div", { className: "connection-header", children: [_jsx("span", { className: "connection-type", children: connection.type }), _jsx("span", { className: `connection-status ${connection.status}`, children: connection.status })] }), _jsxs("div", { className: "connection-info", children: [_jsxs("div", { className: "connection-nodes", children: [_jsx("span", { children: connection.from }), _jsx(FiArrowRight, {}), _jsx("span", { children: connection.to })] }), _jsxs("div", { className: "connection-metrics", children: [_jsxs("div", { className: "metric", children: [_jsx("span", { children: "Strength:" }), _jsxs("span", { children: [Math.round(connection.strength * 100), "%"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Data Flow:" }), _jsxs("span", { children: [connection.dataFlow, "%"] })] })] })] })] }, connection.id))) })] })] }));
};
export default CollaborativeAINetwork;
