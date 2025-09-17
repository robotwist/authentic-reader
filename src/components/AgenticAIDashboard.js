import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCpu, FiGlobe, FiTarget, FiTrendingUp, FiZap, FiAlertTriangle, FiBarChart2, FiSettings, FiShield, FiEye, FiActivity, FiStar, FiRefreshCw } from 'react-icons/fi';
import '../styles/AgenticAIDashboard.css';
const AgenticAIDashboard = () => {
    const navigate = useNavigate();
    const [systems, setSystems] = useState([
        {
            id: 'ai-orchestrator',
            name: 'AI Agent Orchestrator',
            type: 'orchestrator',
            status: 'active',
            performance: { efficiency: 0.95, accuracy: 0.92, intelligence: 0.88 },
            metrics: { tasksCompleted: 127, agentsActive: 6, learningCycles: 0, collaborations: 45 },
            lastUpdate: new Date()
        },
        {
            id: 'autonomous-learning',
            name: 'Autonomous Learning Agent',
            type: 'learning',
            status: 'processing',
            performance: { efficiency: 0.89, accuracy: 0.94, intelligence: 0.91 },
            metrics: { tasksCompleted: 0, agentsActive: 4, learningCycles: 23, collaborations: 12 },
            lastUpdate: new Date(Date.now() - 300000) // 5 minutes ago
        },
        {
            id: 'collaborative-network',
            name: 'Collaborative AI Network',
            type: 'network',
            status: 'active',
            performance: { efficiency: 0.92, accuracy: 0.89, intelligence: 0.95 },
            metrics: { tasksCompleted: 89, agentsActive: 6, learningCycles: 0, collaborations: 156 },
            lastUpdate: new Date(Date.now() - 60000) // 1 minute ago
        },
        {
            id: 'enhanced-analysis',
            name: 'Enhanced Analysis System',
            type: 'analysis',
            status: 'idle',
            performance: { efficiency: 0.87, accuracy: 0.91, intelligence: 0.86 },
            metrics: { tasksCompleted: 234, agentsActive: 3, learningCycles: 0, collaborations: 67 },
            lastUpdate: new Date(Date.now() - 1800000) // 30 minutes ago
        }
    ]);
    const [insights, setInsights] = useState([
        {
            id: 'insight-1',
            type: 'performance',
            title: 'Orchestrator Efficiency Peak',
            description: 'AI Agent Orchestrator achieved 95% efficiency, highest in 24 hours',
            impact: 'positive',
            timestamp: new Date(Date.now() - 300000),
            priority: 'high'
        },
        {
            id: 'insight-2',
            type: 'learning',
            title: 'Learning Model Improvement',
            description: 'Autonomous Learning Agent improved bias detection accuracy by 3.2%',
            impact: 'positive',
            timestamp: new Date(Date.now() - 600000),
            priority: 'medium'
        },
        {
            id: 'insight-3',
            type: 'collaboration',
            title: 'Network Collaboration Success',
            description: 'Collaborative AI Network completed 15 multi-agent tasks successfully',
            impact: 'positive',
            timestamp: new Date(Date.now() - 900000),
            priority: 'high'
        },
        {
            id: 'insight-4',
            type: 'optimization',
            title: 'System Optimization Opportunity',
            description: 'Enhanced Analysis System showing 13% idle time, ready for optimization',
            impact: 'neutral',
            timestamp: new Date(Date.now() - 1200000),
            priority: 'low'
        }
    ]);
    const [overallMetrics, setOverallMetrics] = useState({
        totalSystems: 4,
        activeSystems: 3,
        totalTasks: 450,
        averageEfficiency: 0.91,
        collectiveIntelligence: 0.90,
        systemHealth: 0.94
    });
    useEffect(() => {
        // Update metrics every 30 seconds
        const interval = setInterval(() => {
            updateSystemMetrics();
        }, 30000);
        return () => clearInterval(interval);
    }, []);
    const updateSystemMetrics = () => {
        const activeSystems = systems.filter(s => s.status === 'active' || s.status === 'processing').length;
        const totalTasks = systems.reduce((sum, s) => sum + s.metrics.tasksCompleted, 0);
        const averageEfficiency = systems.reduce((sum, s) => sum + s.performance.efficiency, 0) / systems.length;
        const collectiveIntelligence = systems.reduce((sum, s) => sum + s.performance.intelligence, 0) / systems.length;
        const systemHealth = (activeSystems / systems.length) * averageEfficiency;
        setOverallMetrics({
            totalSystems: systems.length,
            activeSystems,
            totalTasks,
            averageEfficiency,
            collectiveIntelligence,
            systemHealth
        });
    };
    const getSystemStatusColor = (status) => {
        switch (status) {
            case 'active': return '#28a745';
            case 'processing': return '#ffc107';
            case 'idle': return '#6c757d';
            case 'error': return '#dc3545';
            default: return '#6c757d';
        }
    };
    const getSystemTypeIcon = (type) => {
        switch (type) {
            case 'orchestrator': return _jsx(FiCpu, {});
            case 'learning': return _jsx(FiCpu, {});
            case 'network': return _jsx(FiGlobe, {});
            case 'analysis': return _jsx(FiTarget, {});
            default: return _jsx(FiActivity, {});
        }
    };
    const getInsightPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'medium': return '#ffc107';
            case 'low': return '#28a745';
            default: return '#6c757d';
        }
    };
    const getInsightImpactIcon = (impact) => {
        switch (impact) {
            case 'positive': return _jsx(FiTrendingUp, {});
            case 'negative': return _jsx(FiAlertTriangle, {});
            case 'neutral': return _jsx(FiActivity, {});
            default: return _jsx(FiActivity, {});
        }
    };
    const formatTimeAgo = (date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (days > 0)
            return `${days}d ago`;
        if (hours > 0)
            return `${hours}h ago`;
        if (minutes > 0)
            return `${minutes}m ago`;
        return 'Just now';
    };
    return (_jsxs("div", { className: "agentic-ai-dashboard", children: [_jsxs("div", { className: "dashboard-header", children: [_jsxs("div", { className: "header-content", children: [_jsx(FiCpu, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h1", { children: "Agentic AI Dashboard" }), _jsx("p", { children: "Comprehensive overview of all AI systems and their performance" })] })] }), _jsxs("div", { className: "dashboard-controls", children: [_jsxs("button", { className: "control-button", children: [_jsx(FiRefreshCw, {}), "Refresh"] }), _jsxs("button", { className: "control-button", children: [_jsx(FiSettings, {}), "Settings"] })] })] }), _jsxs("div", { className: "overall-metrics", children: [_jsxs("h3", { children: [_jsx(FiBarChart2, {}), " System Overview"] }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card primary", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiCpu, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Active Systems" }), _jsxs("span", { className: "metric-value", children: [overallMetrics.activeSystems, "/", overallMetrics.totalSystems] }), _jsx("p", { className: "metric-description", children: "Systems currently operational" })] })] }), _jsxs("div", { className: "metric-card success", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiTarget, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Total Tasks" }), _jsx("span", { className: "metric-value", children: overallMetrics.totalTasks }), _jsx("p", { className: "metric-description", children: "Tasks completed today" })] })] }), _jsxs("div", { className: "metric-card warning", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiTrendingUp, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Average Efficiency" }), _jsxs("span", { className: "metric-value", children: [Math.round(overallMetrics.averageEfficiency * 100), "%"] }), _jsx("p", { className: "metric-description", children: "System performance average" })] })] }), _jsxs("div", { className: "metric-card info", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiCpu, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Collective Intelligence" }), _jsxs("span", { className: "metric-value", children: [Math.round(overallMetrics.collectiveIntelligence * 100), "%"] }), _jsx("p", { className: "metric-description", children: "Network intelligence score" })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiShield, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "System Health" }), _jsxs("span", { className: "metric-value", children: [Math.round(overallMetrics.systemHealth * 100), "%"] }), _jsx("p", { className: "metric-description", children: "Overall system health" })] })] })] })] }), _jsxs("div", { className: "ai-systems", children: [_jsxs("h3", { children: [_jsx(FiGlobe, {}), " AI Systems"] }), _jsx("div", { className: "systems-grid", children: systems.map((system) => (_jsxs("div", { className: `system-card ${system.status}`, children: [_jsxs("div", { className: "system-header", children: [_jsx("div", { className: "system-icon", children: getSystemTypeIcon(system.type) }), _jsxs("div", { className: "system-status", children: [_jsx("span", { className: "status-dot", style: { backgroundColor: getSystemStatusColor(system.status) } }), _jsx("span", { className: "status-text", children: system.status })] })] }), _jsxs("div", { className: "system-content", children: [_jsx("h4", { children: system.name }), _jsx("p", { className: "system-type", children: system.type }), _jsxs("div", { className: "system-performance", children: [_jsxs("div", { className: "performance-metric", children: [_jsx("span", { children: "Efficiency:" }), _jsxs("span", { className: "metric-value", children: [Math.round(system.performance.efficiency * 100), "%"] })] }), _jsxs("div", { className: "performance-metric", children: [_jsx("span", { children: "Accuracy:" }), _jsxs("span", { className: "metric-value", children: [Math.round(system.performance.accuracy * 100), "%"] })] }), _jsxs("div", { className: "performance-metric", children: [_jsx("span", { children: "Intelligence:" }), _jsxs("span", { className: "metric-value", children: [Math.round(system.performance.intelligence * 100), "%"] })] })] }), _jsxs("div", { className: "system-metrics", children: [_jsxs("div", { className: "metric", children: [_jsx("span", { children: "Tasks:" }), _jsx("span", { children: system.metrics.tasksCompleted })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Agents:" }), _jsx("span", { children: system.metrics.agentsActive })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Learning:" }), _jsx("span", { children: system.metrics.learningCycles })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Collaborations:" }), _jsx("span", { children: system.metrics.collaborations })] })] }), _jsxs("div", { className: "system-footer", children: [_jsxs("span", { className: "last-update", children: ["Updated ", formatTimeAgo(system.lastUpdate)] }), _jsxs("button", { className: "system-action", onClick: () => navigate(`/${system.id.replace('-', '-')}`), children: [_jsx(FiEye, {}), "View"] })] })] })] }, system.id))) })] }), _jsxs("div", { className: "system-insights", children: [_jsxs("h3", { children: [_jsx(FiStar, {}), " AI Insights"] }), _jsx("div", { className: "insights-list", children: insights.map((insight) => (_jsxs("div", { className: `insight-card ${insight.impact}`, children: [_jsxs("div", { className: "insight-header", children: [_jsx("div", { className: "insight-icon", children: getInsightImpactIcon(insight.impact) }), _jsx("div", { className: "insight-priority", children: _jsx("span", { className: "priority-badge", style: { backgroundColor: getInsightPriorityColor(insight.priority) }, children: insight.priority }) })] }), _jsxs("div", { className: "insight-content", children: [_jsx("h4", { children: insight.title }), _jsx("p", { children: insight.description }), _jsx("span", { className: "insight-time", children: formatTimeAgo(insight.timestamp) })] })] }, insight.id))) })] }), _jsxs("div", { className: "quick-actions", children: [_jsxs("h3", { children: [_jsx(FiZap, {}), " Quick Actions"] }), _jsxs("div", { className: "actions-grid", children: [_jsxs("button", { onClick: () => navigate('/ai-orchestrator'), className: "action-card", children: [_jsx(FiCpu, {}), _jsx("span", { children: "AI Orchestrator" })] }), _jsxs("button", { onClick: () => navigate('/autonomous-learning'), className: "action-card", children: [_jsx(FiCpu, {}), _jsx("span", { children: "Autonomous Learning" })] }), _jsxs("button", { onClick: () => navigate('/collaborative-network'), className: "action-card", children: [_jsx(FiGlobe, {}), _jsx("span", { children: "Collaborative Network" })] }), _jsxs("button", { onClick: () => navigate('/analysis'), className: "action-card", children: [_jsx(FiTarget, {}), _jsx("span", { children: "Enhanced Analysis" })] })] })] })] }));
};
export default AgenticAIDashboard;
