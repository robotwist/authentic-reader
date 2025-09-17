import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { FiCpu, FiTrendingUp, FiTarget, FiClock, FiBarChart2, FiSettings, FiPlay, FiPause, FiDownload, FiEye, FiShield, FiUsers } from 'react-icons/fi';
import '../styles/AutonomousLearningAgent.css';
const AutonomousLearningAgent = ({ onModelUpdate, onLearningComplete }) => {
    const [models, setModels] = useState([
        {
            id: 'bias-detection-v1.2',
            name: 'Bias Detection Model',
            type: 'bias-detection',
            version: '1.2.3',
            accuracy: 0.89,
            precision: 0.87,
            recall: 0.91,
            f1Score: 0.89,
            trainingDataSize: 15420,
            lastUpdated: new Date(Date.now() - 86400000), // 1 day ago
            status: 'active',
            performance: { current: 0.89, previous: 0.85, improvement: 0.04 }
        },
        {
            id: 'fact-checking-v1.1',
            name: 'Fact-Checking Model',
            type: 'fact-checking',
            version: '1.1.7',
            accuracy: 0.92,
            precision: 0.94,
            recall: 0.90,
            f1Score: 0.92,
            trainingDataSize: 8920,
            lastUpdated: new Date(Date.now() - 172800000), // 2 days ago
            status: 'active',
            performance: { current: 0.92, previous: 0.89, improvement: 0.03 }
        },
        {
            id: 'sentiment-analysis-v1.3',
            name: 'Sentiment Analysis Model',
            type: 'sentiment-analysis',
            version: '1.3.1',
            accuracy: 0.94,
            precision: 0.93,
            recall: 0.95,
            f1Score: 0.94,
            trainingDataSize: 23450,
            lastUpdated: new Date(Date.now() - 43200000), // 12 hours ago
            status: 'training',
            performance: { current: 0.94, previous: 0.91, improvement: 0.03 }
        },
        {
            id: 'credibility-assessment-v1.0',
            name: 'Credibility Assessment Model',
            type: 'credibility-assessment',
            version: '1.0.5',
            accuracy: 0.87,
            precision: 0.85,
            recall: 0.89,
            f1Score: 0.87,
            trainingDataSize: 6780,
            lastUpdated: new Date(Date.now() - 259200000), // 3 days ago
            status: 'evaluating',
            performance: { current: 0.87, previous: 0.84, improvement: 0.03 }
        }
    ]);
    const [learningSessions, setLearningSessions] = useState([]);
    const [feedbackData, setFeedbackData] = useState([]);
    const [isLearning, setIsLearning] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);
    const [learningProgress, setLearningProgress] = useState(0);
    const [systemMetrics, setSystemMetrics] = useState({
        totalLearningTime: 0,
        averageAccuracy: 0,
        totalImprovements: 0,
        activeModels: 0
    });
    useEffect(() => {
        // Initialize system metrics
        updateSystemMetrics();
        // Start autonomous learning cycle
        startAutonomousLearning();
    }, []);
    const updateSystemMetrics = () => {
        const activeModels = models.filter(m => m.status === 'active').length;
        const averageAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;
        const totalImprovements = models.reduce((sum, m) => sum + m.performance.improvement, 0);
        const totalLearningTime = learningSessions.reduce((sum, s) => sum + s.duration, 0);
        setSystemMetrics({
            totalLearningTime,
            averageAccuracy,
            totalImprovements,
            activeModels
        });
    };
    const startAutonomousLearning = useCallback(async () => {
        setIsLearning(true);
        // Create new learning session
        const session = {
            id: `session-${Date.now()}`,
            startTime: new Date(),
            duration: 0,
            dataProcessed: 0,
            accuracyImprovement: 0,
            newPatternsLearned: 0,
            status: 'running',
            insights: []
        };
        setCurrentSession(session);
        setLearningSessions(prev => [session, ...prev]);
        // Simulate learning process
        await simulateLearningProcess(session);
        setIsLearning(false);
        setCurrentSession(null);
    }, []);
    const simulateLearningProcess = async (session) => {
        const steps = [
            { name: 'Data Collection', duration: 2000, progress: 20 },
            { name: 'Pattern Analysis', duration: 3000, progress: 40 },
            { name: 'Model Training', duration: 4000, progress: 60 },
            { name: 'Validation', duration: 2000, progress: 80 },
            { name: 'Model Update', duration: 1000, progress: 100 }
        ];
        for (const step of steps) {
            setLearningProgress(step.progress);
            // Update session insights
            const insight = generateInsight(step.name);
            session.insights.push(insight);
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, step.duration));
            // Update models during training
            if (step.name === 'Model Training') {
                await updateModels();
            }
        }
        // Complete session
        session.endTime = new Date();
        session.duration = session.endTime.getTime() - session.startTime.getTime();
        session.status = 'completed';
        session.dataProcessed = Math.floor(Math.random() * 1000) + 500;
        session.accuracyImprovement = Math.random() * 0.05;
        session.newPatternsLearned = Math.floor(Math.random() * 10) + 5;
        setLearningSessions(prev => prev.map(s => s.id === session.id ? session : s));
        if (onLearningComplete) {
            onLearningComplete(session);
        }
        updateSystemMetrics();
    };
    const generateInsight = (step) => {
        const insights = {
            'Data Collection': [
                'Discovered new bias patterns in political content',
                'Identified emerging fact-checking challenges',
                'Found correlation between source credibility and accuracy'
            ],
            'Pattern Analysis': [
                'Detected seasonal variations in content bias',
                'Recognized new rhetorical techniques',
                'Identified evolving misinformation patterns'
            ],
            'Model Training': [
                'Improved bias detection accuracy by 3.2%',
                'Enhanced fact-checking precision for scientific claims',
                'Optimized sentiment analysis for nuanced content'
            ],
            'Validation': [
                'Model performance validated across diverse datasets',
                'Cross-validation shows consistent improvement',
                'Edge case handling significantly improved'
            ],
            'Model Update': [
                'Successfully deployed updated models',
                'Performance monitoring activated',
                'Ready for next learning cycle'
            ]
        };
        const stepInsights = insights[step] || ['Learning process completed'];
        return stepInsights[Math.floor(Math.random() * stepInsights.length)];
    };
    const updateModels = async () => {
        const updatedModels = models.map(model => {
            if (model.status === 'training') {
                // Simulate model improvement
                const improvement = Math.random() * 0.03;
                const newAccuracy = Math.min(0.99, model.accuracy + improvement);
                return {
                    ...model,
                    accuracy: newAccuracy,
                    precision: Math.min(0.99, model.precision + improvement * 0.8),
                    recall: Math.min(0.99, model.recall + improvement * 0.9),
                    f1Score: Math.min(0.99, model.f1Score + improvement),
                    trainingDataSize: model.trainingDataSize + Math.floor(Math.random() * 100) + 50,
                    lastUpdated: new Date(),
                    status: 'active',
                    performance: {
                        current: newAccuracy,
                        previous: model.accuracy,
                        improvement
                    }
                };
            }
            return model;
        });
        setModels(updatedModels);
        // Notify about model updates
        updatedModels.forEach(model => {
            if (model.status === 'active' && onModelUpdate) {
                onModelUpdate(model);
            }
        });
    };
    const addFeedback = (modelId, prediction, actualResult, userFeedback) => {
        const feedback = {
            id: `feedback-${Date.now()}`,
            timestamp: new Date(),
            modelId,
            prediction,
            actualResult,
            userFeedback,
            confidence: Math.random() * 0.3 + 0.7,
            improvement: Math.random() * 0.02
        };
        setFeedbackData(prev => [feedback, ...prev]);
    };
    const getModelStatusColor = (status) => {
        switch (status) {
            case 'active': return '#28a745';
            case 'training': return '#ffc107';
            case 'evaluating': return '#17a2b8';
            case 'updating': return '#fd7e14';
            default: return '#6c757d';
        }
    };
    const getPerformanceColor = (value) => {
        if (value >= 0.9)
            return '#28a745';
        if (value >= 0.8)
            return '#ffc107';
        if (value >= 0.7)
            return '#fd7e14';
        return '#dc3545';
    };
    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0)
            return `${hours}h ${minutes % 60}m`;
        if (minutes > 0)
            return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };
    return (_jsxs("div", { className: "autonomous-learning-agent", children: [_jsxs("div", { className: "learning-header", children: [_jsxs("div", { className: "header-content", children: [_jsx(FiCpu, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "Autonomous Learning Agent" }), _jsx("p", { children: "Self-improving AI models for enhanced media analysis" })] })] }), _jsx("div", { className: "learning-controls", children: _jsx("button", { onClick: startAutonomousLearning, disabled: isLearning, className: "learn-button", children: isLearning ? (_jsxs(_Fragment, { children: [_jsx(FiPause, { className: "spinner" }), "Learning..."] })) : (_jsxs(_Fragment, { children: [_jsx(FiPlay, {}), "Start Learning"] })) }) })] }), isLearning && currentSession && (_jsxs("div", { className: "learning-progress", children: [_jsxs("div", { className: "progress-header", children: [_jsx("h3", { children: "Learning Session in Progress" }), _jsxs("span", { className: "session-id", children: ["Session: ", currentSession.id] })] }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${learningProgress}%` } }) }), _jsxs("div", { className: "progress-details", children: [_jsxs("span", { children: ["Progress: ", learningProgress, "%"] }), _jsxs("span", { children: ["Duration: ", formatDuration(Date.now() - currentSession.startTime.getTime())] })] }), currentSession.insights.length > 0 && (_jsxs("div", { className: "current-insights", children: [_jsx("strong", { children: "Latest Insight:" }), " ", currentSession.insights[currentSession.insights.length - 1]] }))] })), _jsxs("div", { className: "models-section", children: [_jsxs("h3", { children: [_jsx(FiTarget, {}), " Learning Models"] }), _jsx("div", { className: "models-grid", children: models.map((model) => (_jsxs("div", { className: "model-card", children: [_jsxs("div", { className: "model-header", children: [_jsxs("div", { className: "model-icon", children: [model.type === 'bias-detection' && _jsx(FiEye, {}), model.type === 'fact-checking' && _jsx(FiShield, {}), model.type === 'sentiment-analysis' && _jsx(FiTrendingUp, {}), model.type === 'credibility-assessment' && _jsx(FiUsers, {})] }), _jsxs("div", { className: "model-status", children: [_jsx("span", { className: "status-dot", style: { backgroundColor: getModelStatusColor(model.status) } }), _jsx("span", { className: "status-text", children: model.status })] })] }), _jsxs("div", { className: "model-content", children: [_jsx("h4", { children: model.name }), _jsxs("p", { className: "model-version", children: ["v", model.version] }), _jsxs("div", { className: "model-metrics", children: [_jsxs("div", { className: "metric-row", children: [_jsx("span", { children: "Accuracy:" }), _jsxs("span", { className: "metric-value", style: { color: getPerformanceColor(model.accuracy) }, children: [Math.round(model.accuracy * 100), "%"] })] }), _jsxs("div", { className: "metric-row", children: [_jsx("span", { children: "Precision:" }), _jsxs("span", { className: "metric-value", style: { color: getPerformanceColor(model.precision) }, children: [Math.round(model.precision * 100), "%"] })] }), _jsxs("div", { className: "metric-row", children: [_jsx("span", { children: "Recall:" }), _jsxs("span", { className: "metric-value", style: { color: getPerformanceColor(model.recall) }, children: [Math.round(model.recall * 100), "%"] })] }), _jsxs("div", { className: "metric-row", children: [_jsx("span", { children: "F1 Score:" }), _jsxs("span", { className: "metric-value", style: { color: getPerformanceColor(model.f1Score) }, children: [Math.round(model.f1Score * 100), "%"] })] })] }), _jsxs("div", { className: "model-performance", children: [_jsxs("div", { className: "performance-indicator", children: [_jsx("span", { children: "Improvement:" }), _jsxs("span", { className: `improvement ${model.performance.improvement > 0 ? 'positive' : 'negative'}`, children: [model.performance.improvement > 0 ? '+' : '', Math.round(model.performance.improvement * 100), "%"] })] }), _jsxs("div", { className: "training-data", children: [_jsx("span", { children: "Training Data:" }), _jsx("span", { children: model.trainingDataSize.toLocaleString() })] })] }), _jsxs("div", { className: "model-actions", children: [_jsxs("button", { className: "action-btn", children: [_jsx(FiEye, {}), " View Details"] }), _jsxs("button", { className: "action-btn", children: [_jsx(FiDownload, {}), " Export"] })] })] })] }, model.id))) })] }), _jsxs("div", { className: "sessions-section", children: [_jsxs("h3", { children: [_jsx(FiClock, {}), " Learning Sessions"] }), _jsx("div", { className: "sessions-list", children: learningSessions.slice(0, 5).map((session) => (_jsxs("div", { className: `session-item ${session.status}`, children: [_jsxs("div", { className: "session-header", children: [_jsx("span", { className: "session-id", children: session.id }), _jsx("span", { className: `session-status ${session.status}`, children: session.status })] }), _jsxs("div", { className: "session-details", children: [_jsxs("div", { className: "session-metric", children: [_jsx("strong", { children: "Duration:" }), " ", formatDuration(session.duration)] }), _jsxs("div", { className: "session-metric", children: [_jsx("strong", { children: "Data Processed:" }), " ", session.dataProcessed.toLocaleString()] }), _jsxs("div", { className: "session-metric", children: [_jsx("strong", { children: "Accuracy Improvement:" }), _jsxs("span", { className: `improvement ${session.accuracyImprovement > 0 ? 'positive' : 'negative'}`, children: [session.accuracyImprovement > 0 ? '+' : '', Math.round(session.accuracyImprovement * 100), "%"] })] }), _jsxs("div", { className: "session-metric", children: [_jsx("strong", { children: "New Patterns:" }), " ", session.newPatternsLearned] })] }), session.insights.length > 0 && (_jsxs("div", { className: "session-insights", children: [_jsx("strong", { children: "Key Insights:" }), _jsx("ul", { children: session.insights.slice(-3).map((insight, index) => (_jsx("li", { children: insight }, index))) })] }))] }, session.id))) })] }), _jsxs("div", { className: "metrics-section", children: [_jsxs("h3", { children: [_jsx(FiBarChart2, {}), " System Metrics"] }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Total Learning Time" }), _jsx("span", { className: "metric-value", children: formatDuration(systemMetrics.totalLearningTime) })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Average Accuracy" }), _jsxs("span", { className: "metric-value", children: [Math.round(systemMetrics.averageAccuracy * 100), "%"] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Total Improvements" }), _jsxs("span", { className: "metric-value", children: [Math.round(systemMetrics.totalImprovements * 100), "%"] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("h4", { children: "Active Models" }), _jsx("span", { className: "metric-value", children: systemMetrics.activeModels })] })] })] }), _jsxs("div", { className: "feedback-section", children: [_jsxs("h3", { children: [_jsx(FiSettings, {}), " Feedback System"] }), _jsxs("div", { className: "feedback-stats", children: [_jsxs("div", { className: "feedback-stat", children: [_jsx("span", { className: "stat-label", children: "Total Feedback" }), _jsx("span", { className: "stat-value", children: feedbackData.length })] }), _jsxs("div", { className: "feedback-stat", children: [_jsx("span", { className: "stat-label", children: "Correct Predictions" }), _jsx("span", { className: "stat-value", children: feedbackData.filter(f => f.userFeedback === 'correct').length })] }), _jsxs("div", { className: "feedback-stat", children: [_jsx("span", { className: "stat-label", children: "Average Confidence" }), _jsxs("span", { className: "stat-value", children: [feedbackData.length > 0
                                                ? Math.round(feedbackData.reduce((sum, f) => sum + f.confidence, 0) / feedbackData.length * 100)
                                                : 0, "%"] })] })] })] })] }));
};
export default AutonomousLearningAgent;
