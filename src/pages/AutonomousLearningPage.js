import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCpu, FiTarget, FiBarChart2, FiZap } from 'react-icons/fi';
import AutonomousLearningAgent from '../components/AutonomousLearningAgent';
import '../styles/AutonomousLearningPage.css';
const AutonomousLearningPage = () => {
    const navigate = useNavigate();
    const [learningStats, setLearningStats] = useState({
        totalSessions: 0,
        averageImprovement: 0,
        modelsTrained: 0,
        lastUpdate: new Date()
    });
    const handleModelUpdate = (model) => {
        console.log('Model updated:', model);
        setLearningStats(prev => ({
            ...prev,
            modelsTrained: prev.modelsTrained + 1,
            lastUpdate: new Date()
        }));
    };
    const handleLearningComplete = (session) => {
        console.log('Learning session completed:', session);
        setLearningStats(prev => ({
            ...prev,
            totalSessions: prev.totalSessions + 1,
            averageImprovement: (prev.averageImprovement + session.accuracyImprovement) / 2
        }));
    };
    return (_jsxs("div", { className: "autonomous-learning-page", children: [_jsxs("div", { className: "page-header", children: [_jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Home"] }), _jsxs("div", { className: "header-info", children: [_jsx("h1", { children: "Autonomous Learning Agent" }), _jsx("p", { children: "Self-improving AI models that continuously enhance their analysis capabilities" })] })] }), _jsxs("div", { className: "learning-overview", children: [_jsxs("h3", { children: [_jsx(FiCpu, {}), " Learning Overview"] }), _jsxs("div", { className: "overview-grid", children: [_jsxs("div", { className: "overview-card", children: [_jsx("div", { className: "overview-icon", children: _jsx(FiZap, {}) }), _jsxs("div", { className: "overview-content", children: [_jsx("h4", { children: "Active Learning" }), _jsx("p", { children: "Models continuously learn from new data and user feedback" })] })] }), _jsxs("div", { className: "overview-card", children: [_jsx("div", { className: "overview-icon", children: _jsx(FiTarget, {}) }), _jsxs("div", { className: "overview-content", children: [_jsx("h4", { children: "Performance Optimization" }), _jsx("p", { children: "Automatic tuning of model parameters for better accuracy" })] })] }), _jsxs("div", { className: "overview-card", children: [_jsx("div", { className: "overview-icon", children: _jsx(FiBarChart2, {}) }), _jsxs("div", { className: "overview-content", children: [_jsx("h4", { children: "Adaptive Training" }), _jsx("p", { children: "Learning strategies that adapt to changing content patterns" })] })] })] })] }), _jsxs("div", { className: "learning-stats", children: [_jsxs("h3", { children: [_jsx(FiBarChart2, {}), " Learning Statistics"] }), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Total Sessions" }), _jsx("span", { className: "stat-value", children: learningStats.totalSessions })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Average Improvement" }), _jsxs("span", { className: "stat-value", children: [Math.round(learningStats.averageImprovement * 100), "%"] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Models Trained" }), _jsx("span", { className: "stat-value", children: learningStats.modelsTrained })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Last Update" }), _jsx("span", { className: "stat-value", children: learningStats.lastUpdate.toLocaleTimeString() })] })] })] }), _jsx(AutonomousLearningAgent, { onModelUpdate: handleModelUpdate, onLearningComplete: handleLearningComplete }), _jsxs("div", { className: "quick-actions", children: [_jsx("h3", { children: "Quick Actions" }), _jsxs("div", { className: "actions-grid", children: [_jsxs("button", { onClick: () => navigate('/ai-orchestrator'), className: "action-card", children: [_jsx(FiCpu, {}), _jsx("span", { children: "AI Agent Orchestrator" })] }), _jsxs("button", { onClick: () => navigate('/analysis'), className: "action-card", children: [_jsx(FiTarget, {}), _jsx("span", { children: "Article Analysis" })] }), _jsxs("button", { onClick: () => navigate('/sentiment-analysis'), className: "action-card", children: [_jsx(FiBarChart2, {}), _jsx("span", { children: "Sentiment Analysis" })] })] })] })] }));
};
export default AutonomousLearningPage;
