import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiGlobe, FiUsers, FiCpu, FiTarget } from 'react-icons/fi';
import CollaborativeAINetwork from '../components/CollaborativeAINetwork';
import '../styles/CollaborativeAINetworkPage.css';
const CollaborativeAINetworkPage = () => {
    const navigate = useNavigate();
    const [networkStats, setNetworkStats] = useState({
        totalCollaborations: 0,
        averageIntelligence: 0,
        activeConnections: 0,
        lastUpdate: new Date()
    });
    const handleNetworkUpdate = (network) => {
        console.log('Network updated:', network);
        setNetworkStats(prev => ({
            ...prev,
            activeConnections: network.filter((node) => node.status === 'active').length,
            lastUpdate: new Date()
        }));
    };
    const handleTaskComplete = (task) => {
        console.log('Collaborative task completed:', task);
        setNetworkStats(prev => ({
            ...prev,
            totalCollaborations: prev.totalCollaborations + 1,
            averageIntelligence: (prev.averageIntelligence + task.collectiveIntelligence) / 2
        }));
    };
    return (_jsxs("div", { className: "collaborative-ai-network-page", children: [_jsxs("div", { className: "page-header", children: [_jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Home"] }), _jsxs("div", { className: "header-info", children: [_jsx("h1", { children: "Collaborative AI Network" }), _jsx("p", { children: "Multi-agent system with collective intelligence and inter-agent communication" })] })] }), _jsxs("div", { className: "network-overview", children: [_jsxs("h3", { children: [_jsx(FiGlobe, {}), " Network Overview"] }), _jsxs("div", { className: "overview-grid", children: [_jsxs("div", { className: "overview-card", children: [_jsx("div", { className: "overview-icon", children: _jsx(FiUsers, {}) }), _jsxs("div", { className: "overview-content", children: [_jsx("h4", { children: "Multi-Agent Collaboration" }), _jsx("p", { children: "Specialized AI agents working together to achieve collective intelligence" })] })] }), _jsxs("div", { className: "overview-card", children: [_jsx("div", { className: "overview-icon", children: _jsx(FiCpu, {}) }), _jsxs("div", { className: "overview-content", children: [_jsx("h4", { children: "Collective Intelligence" }), _jsx("p", { children: "Network-wide intelligence that exceeds individual agent capabilities" })] })] }), _jsxs("div", { className: "overview-card", children: [_jsx("div", { className: "overview-icon", children: _jsx(FiTarget, {}) }), _jsxs("div", { className: "overview-content", children: [_jsx("h4", { children: "Real-time Communication" }), _jsx("p", { children: "Dynamic inter-agent communication and knowledge sharing" })] })] })] })] }), _jsxs("div", { className: "network-statistics", children: [_jsxs("h3", { children: [_jsx(FiGlobe, {}), " Network Statistics"] }), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Total Collaborations" }), _jsx("span", { className: "stat-value", children: networkStats.totalCollaborations })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Average Intelligence" }), _jsxs("span", { className: "stat-value", children: [Math.round(networkStats.averageIntelligence * 100), "%"] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Active Connections" }), _jsx("span", { className: "stat-value", children: networkStats.activeConnections })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Last Update" }), _jsx("span", { className: "stat-value", children: networkStats.lastUpdate.toLocaleTimeString() })] })] })] }), _jsx(CollaborativeAINetwork, { onNetworkUpdate: handleNetworkUpdate, onTaskComplete: handleTaskComplete }), _jsxs("div", { className: "quick-actions", children: [_jsx("h3", { children: "Quick Actions" }), _jsxs("div", { className: "actions-grid", children: [_jsxs("button", { onClick: () => navigate('/ai-orchestrator'), className: "action-card", children: [_jsx(FiCpu, {}), _jsx("span", { children: "AI Agent Orchestrator" })] }), _jsxs("button", { onClick: () => navigate('/autonomous-learning'), className: "action-card", children: [_jsx(FiTarget, {}), _jsx("span", { children: "Autonomous Learning" })] }), _jsxs("button", { onClick: () => navigate('/analysis'), className: "action-card", children: [_jsx(FiGlobe, {}), _jsx("span", { children: "Article Analysis" })] })] })] })] }));
};
export default CollaborativeAINetworkPage;
