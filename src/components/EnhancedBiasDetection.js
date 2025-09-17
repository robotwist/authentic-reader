import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiBarChart2, FiTarget, FiShield, FiTrendingUp, FiInfo, FiActivity } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/EnhancedBiasDetection.css';
const EnhancedBiasDetection = ({ defaultText = '', showRealTime = false }) => {
    const [text, setText] = useState(defaultText);
    const [result, setResult] = useState(null);
    const [insights, setInsights] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const { serviceStatus, isCheckingStatus, analysisInProgress, error, analyzeBias } = useLlamaAnalysis();
    useEffect(() => {
        if (defaultText && serviceStatus?.status === 'healthy') {
            handleAnalysis();
        }
    }, [defaultText, serviceStatus]);
    // Real-time analysis for longer text
    useEffect(() => {
        if (showRealTime && text.length > 100 && serviceStatus?.status === 'healthy') {
            const timeoutId = setTimeout(() => {
                handleAnalysis();
            }, 2000); // Debounce for 2 seconds
            return () => clearTimeout(timeoutId);
        }
    }, [text, showRealTime, serviceStatus]);
    const handleAnalysis = async () => {
        if (!text.trim())
            return;
        setIsAnalyzing(true);
        const biasResult = await analyzeBias(text);
        if (biasResult) {
            setResult(biasResult);
            setAnalysisHistory(prev => [biasResult, ...prev.slice(0, 4)]); // Keep last 5
            generateInsights(biasResult);
        }
        setIsAnalyzing(false);
    };
    const generateInsights = (biasResult) => {
        const newInsights = [];
        // Political bias insights
        if (biasResult.political_bias > 7) {
            newInsights.push({
                type: 'warning',
                title: 'High Political Bias Detected',
                message: 'This content shows strong political leanings. Consider seeking additional perspectives.',
                action: 'Find opposing viewpoints'
            });
        }
        else if (biasResult.political_bias < 3) {
            newInsights.push({
                type: 'success',
                title: 'Balanced Political Content',
                message: 'This content appears politically balanced and objective.',
                action: 'Continue reading'
            });
        }
        // Emotional bias insights
        if (biasResult.emotional_bias > 6) {
            newInsights.push({
                type: 'warning',
                title: 'Emotional Manipulation Detected',
                message: 'This content uses strong emotional language that may cloud judgment.',
                action: 'Read with caution'
            });
        }
        // Cognitive bias insights
        if (biasResult.cognitive_bias > 5) {
            newInsights.push({
                type: 'info',
                title: 'Cognitive Bias Patterns',
                message: 'This content may contain logical fallacies or cognitive biases.',
                action: 'Fact-check claims'
            });
        }
        // Overall assessment
        const averageBias = (biasResult.political_bias + biasResult.emotional_bias + biasResult.cognitive_bias) / 3;
        if (averageBias < 4) {
            newInsights.push({
                type: 'success',
                title: 'High-Quality Content',
                message: 'This content appears to be well-balanced and fact-based.',
                action: 'Recommended reading'
            });
        }
        else if (averageBias > 7) {
            newInsights.push({
                type: 'warning',
                title: 'High Bias Content',
                message: 'This content shows significant bias across multiple dimensions.',
                action: 'Seek alternative sources'
            });
        }
        // AI recommendations
        newInsights.push({
            type: 'recommendation',
            title: 'AI Recommendations',
            message: generateAIRecommendations(biasResult),
            action: 'View detailed analysis'
        });
        setInsights(newInsights);
    };
    const generateAIRecommendations = (biasResult) => {
        const recommendations = [];
        if (biasResult.political_bias > 5) {
            recommendations.push('Seek sources from different political perspectives');
        }
        if (biasResult.emotional_bias > 5) {
            recommendations.push('Look for more neutral, fact-based reporting');
        }
        if (biasResult.cognitive_bias > 4) {
            recommendations.push('Verify claims with fact-checking sources');
        }
        if (recommendations.length === 0) {
            return 'This content appears balanced. Continue reading with critical thinking.';
        }
        return recommendations.join('. ') + '.';
    };
    const getBiasLevelText = (score) => {
        if (score < 3)
            return 'Very Low';
        if (score < 5)
            return 'Low';
        if (score < 7)
            return 'Moderate';
        if (score < 9)
            return 'High';
        return 'Very High';
    };
    const getBiasLevelColor = (score) => {
        if (score < 3)
            return '#28a745';
        if (score < 5)
            return '#5cb85c';
        if (score < 7)
            return '#ffc107';
        if (score < 9)
            return '#fd7e14';
        return '#dc3545';
    };
    const getInsightIcon = (type) => {
        switch (type) {
            case 'warning': return _jsx(FiAlertCircle, {});
            case 'info': return _jsx(FiInfo, {});
            case 'success': return _jsx(FiCheck, {});
            case 'recommendation': return _jsx(FiInfo, {});
        }
    };
    const getInsightColor = (type) => {
        switch (type) {
            case 'warning': return '#dc3545';
            case 'info': return '#007bff';
            case 'success': return '#28a745';
            case 'recommendation': return '#ffc107';
        }
    };
    return (_jsxs("div", { className: "enhanced-bias-detection", children: [_jsxs("div", { className: "detection-header", children: [_jsxs("h2", { children: [_jsx(FiShield, { className: "header-icon" }), "Enhanced Bias Detection"] }), _jsx("p", { children: "AI-powered analysis with real-time insights and recommendations" })] }), _jsxs("div", { className: "service-status-card", children: [_jsx("h4", { children: "AI Analysis Service" }), isCheckingStatus ? (_jsxs("div", { className: "status-loading", children: [_jsx(FiActivity, { className: "spinner" }), _jsx("span", { children: "Checking service status..." })] })) : serviceStatus?.status === 'healthy' ? (_jsxs("div", { className: "status-healthy", children: [_jsx(FiCheck, { className: "status-icon" }), _jsxs("span", { children: ["Service online \u2022 ", serviceStatus.model, serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`] })] })) : (_jsxs("div", { className: "status-error", children: [_jsx(FiAlertCircle, { className: "status-icon" }), _jsx("span", { children: "Service unavailable" })] }))] }), _jsxs("div", { className: "input-section", children: [_jsxs("div", { className: "input-header", children: [_jsx("h3", { children: "Content Analysis" }), showRealTime && (_jsxs("div", { className: "realtime-indicator", children: [_jsx(FiActivity, { className: "indicator-icon" }), _jsx("span", { children: "Real-time analysis enabled" })] }))] }), _jsx("textarea", { value: text, onChange: (e) => setText(e.target.value), placeholder: "Paste or type content to analyze for bias...", className: "content-input", rows: 6 }), _jsxs("div", { className: "input-actions", children: [_jsx("button", { onClick: handleAnalysis, disabled: !text.trim() || analysisInProgress || isAnalyzing, className: "analyze-button", children: isAnalyzing ? (_jsxs(_Fragment, { children: [_jsx(FiActivity, { className: "spinner" }), "Analyzing..."] })) : (_jsxs(_Fragment, { children: [_jsx(FiTarget, {}), "Analyze Bias"] })) }), _jsx("button", { onClick: () => setText(''), disabled: !text, className: "clear-button", children: "Clear" })] })] }), result && (_jsxs("div", { className: "results-section", children: [_jsxs("div", { className: "results-header", children: [_jsx("h3", { children: "Analysis Results" }), _jsx("div", { className: "confidence-score", children: _jsxs("span", { children: ["Confidence: ", result.confidence || 'High'] }) })] }), _jsxs("div", { className: "bias-scores-grid", children: [_jsxs("div", { className: "bias-score-card", children: [_jsxs("div", { className: "score-header", children: [_jsx(FiTarget, { className: "score-icon" }), _jsx("span", { children: "Political Bias" })] }), _jsxs("div", { className: "score-value", style: { color: getBiasLevelColor(result.political_bias) }, children: [result.political_bias.toFixed(1), "/10"] }), _jsx("div", { className: "score-level", style: { color: getBiasLevelColor(result.political_bias) }, children: getBiasLevelText(result.political_bias) }), _jsx("div", { className: "score-bar", children: _jsx("div", { className: "score-fill", style: {
                                                width: `${result.political_bias * 10}%`,
                                                backgroundColor: getBiasLevelColor(result.political_bias)
                                            } }) })] }), _jsxs("div", { className: "bias-score-card", children: [_jsxs("div", { className: "score-header", children: [_jsx(FiBarChart2, { className: "score-icon" }), _jsx("span", { children: "Emotional Bias" })] }), _jsxs("div", { className: "score-value", style: { color: getBiasLevelColor(result.emotional_bias) }, children: [result.emotional_bias.toFixed(1), "/10"] }), _jsx("div", { className: "score-level", style: { color: getBiasLevelColor(result.emotional_bias) }, children: getBiasLevelText(result.emotional_bias) }), _jsx("div", { className: "score-bar", children: _jsx("div", { className: "score-fill", style: {
                                                width: `${result.emotional_bias * 10}%`,
                                                backgroundColor: getBiasLevelColor(result.emotional_bias)
                                            } }) })] }), _jsxs("div", { className: "bias-score-card", children: [_jsxs("div", { className: "score-header", children: [_jsx(FiCpu, { className: "score-icon" }), _jsx("span", { children: "Cognitive Bias" })] }), _jsxs("div", { className: "score-value", style: { color: getBiasLevelColor(result.cognitive_bias) }, children: [result.cognitive_bias.toFixed(1), "/10"] }), _jsx("div", { className: "score-level", style: { color: getBiasLevelColor(result.cognitive_bias) }, children: getBiasLevelText(result.cognitive_bias) }), _jsx("div", { className: "score-bar", children: _jsx("div", { className: "score-fill", style: {
                                                width: `${result.cognitive_bias * 10}%`,
                                                backgroundColor: getBiasLevelColor(result.cognitive_bias)
                                            } }) })] })] }), _jsxs("div", { className: "insights-section", children: [_jsxs("h3", { children: [_jsx(FiInfo, { className: "section-icon" }), "AI Insights & Recommendations"] }), _jsx("div", { className: "insights-grid", children: insights.map((insight, index) => (_jsxs("div", { className: `insight-card ${insight.type}`, style: { borderColor: getInsightColor(insight.type) }, children: [_jsxs("div", { className: "insight-header", children: [getInsightIcon(insight.type), _jsx("h4", { children: insight.title })] }), _jsx("p", { children: insight.message }), insight.action && (_jsx("div", { className: "insight-action", children: _jsx("span", { children: insight.action }) }))] }, index))) })] }), analysisHistory.length > 1 && (_jsxs("div", { className: "history-section", children: [_jsxs("h3", { children: [_jsx(FiTrendingUp, { className: "section-icon" }), "Recent Analysis History"] }), _jsx("div", { className: "history-chart", children: analysisHistory.slice(1).map((hist, index) => (_jsxs("div", { className: "history-item", children: [_jsxs("div", { className: "history-label", children: ["#", analysisHistory.length - index - 1] }), _jsxs("div", { className: "history-bars", children: [_jsx("div", { className: "history-bar political", style: {
                                                        height: `${hist.political_bias * 10}%`,
                                                        backgroundColor: getBiasLevelColor(hist.political_bias)
                                                    } }), _jsx("div", { className: "history-bar emotional", style: {
                                                        height: `${hist.emotional_bias * 10}%`,
                                                        backgroundColor: getBiasLevelColor(hist.emotional_bias)
                                                    } }), _jsx("div", { className: "history-bar cognitive", style: {
                                                        height: `${hist.cognitive_bias * 10}%`,
                                                        backgroundColor: getBiasLevelColor(hist.cognitive_bias)
                                                    } })] })] }, index))) })] }))] })), error && (_jsxs("div", { className: "error-card", children: [_jsx(FiAlertCircle, { className: "error-icon" }), _jsx("h4", { children: "Analysis Error" }), _jsx("p", { children: error })] }))] }));
};
export default EnhancedBiasDetection;
