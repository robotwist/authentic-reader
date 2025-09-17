import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiClock, FiBarChart2 } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/BiasDetection.css';
// Helper functions for rendering
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
        return '#28a745'; // green
    if (score < 5)
        return '#5cb85c'; // light green
    if (score < 7)
        return '#ffc107'; // yellow
    if (score < 9)
        return '#fd7e14'; // orange
    return '#dc3545'; // red
};
const BiasDetection = ({ defaultText = '' }) => {
    const [text, setText] = useState(defaultText);
    const [result, setResult] = useState(null);
    const { serviceStatus, isCheckingStatus, analysisInProgress, error, analyzeBias } = useLlamaAnalysis();
    useEffect(() => {
        // If default text is provided, analyze it automatically
        if (defaultText && serviceStatus?.status === 'healthy') {
            handleAnalysis();
        }
    }, [defaultText, serviceStatus]);
    const handleAnalysis = async () => {
        if (!text.trim())
            return;
        const biasResult = await analyzeBias(text);
        if (biasResult) {
            setResult(biasResult);
        }
    };
    const handleReset = () => {
        setText('');
        setResult(null);
    };
    const renderBiasScore = (type, score) => {
        const level = getBiasLevelText(score);
        const color = getBiasLevelColor(score);
        return (_jsxs("div", { className: "bias-score-item", children: [_jsxs("div", { className: "bias-score-label", children: [type, " Bias"] }), _jsx("div", { className: "bias-score-bar-container", children: _jsx("div", { className: "bias-score-bar", style: {
                            width: `${score * 10}%`,
                            backgroundColor: color
                        } }) }), _jsxs("div", { className: "bias-score-value", style: { color }, children: [level, " (", score.toFixed(1), "/10)"] })] }));
    };
    return (_jsxs("div", { className: "bias-detection-container", children: [_jsxs("h2", { className: "bias-detection-title", children: [_jsx(FiBarChart2, { className: "icon" }), " Bias Detection"] }), _jsxs("div", { className: "service-status", children: [_jsx("h4", { children: "Llama Service Status" }), isCheckingStatus ? (_jsx("p", { children: "Checking service status..." })) : serviceStatus?.status === 'healthy' ? (_jsxs("div", { className: "status-healthy", children: [_jsx(FiCheck, { className: "status-icon" }), _jsxs("span", { children: ["Service is online using ", serviceStatus.model, serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`] })] })) : (_jsxs("div", { className: "status-error", children: [_jsx(FiAlertCircle, { className: "status-icon" }), _jsxs("span", { children: ["Service is offline: ", serviceStatus?.error || 'Unknown error'] })] }))] }), _jsxs("form", { onSubmit: (e) => { e.preventDefault(); handleAnalysis(); }, className: "bias-detection-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "text-input", children: "Text to Analyze" }), _jsx("textarea", { id: "text-input", value: text, onChange: (e) => setText(e.target.value), placeholder: "Paste an article, social media post, or other content to analyze for bias...", rows: 10, disabled: analysisInProgress || serviceStatus?.status !== 'healthy' })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "primary-button", disabled: analysisInProgress || !text.trim() || serviceStatus?.status !== 'healthy', children: analysisInProgress ? 'Analyzing...' : 'Analyze for Bias' }), _jsx("button", { type: "button", className: "secondary-button", onClick: handleReset, disabled: analysisInProgress || (!text && !result), children: "Reset" })] })] }), error && (_jsxs("div", { className: "error-message", children: [_jsx(FiAlertCircle, { className: "icon" }), error] })), result && (_jsxs("div", { className: "result-container", children: [_jsx("h3", { children: "Bias Analysis Results" }), _jsxs("div", { className: "bias-scores-container", children: [renderBiasScore('Political', result.bias_scores.political), renderBiasScore('Ideological', result.bias_scores.ideological), renderBiasScore('Partisan', result.bias_scores.partisan)] }), _jsxs("div", { className: "bias-assessment", children: [_jsx("h4", { children: "Overall Assessment" }), _jsx("p", { children: result.overall_bias_assessment })] }), result.detected_bias_phrases.length > 0 && (_jsxs("div", { className: "bias-phrases", children: [_jsx("h4", { children: "Detected Bias Phrases" }), _jsx("ul", { children: result.detected_bias_phrases.map((phrase, index) => (_jsx("li", { children: phrase }, index))) })] })), _jsxs("div", { className: "result-metadata", children: [_jsxs("div", { className: "metadata-item", children: [_jsx(FiClock, { className: "icon" }), "Processed in ", result.processing_time.toFixed(2), " seconds"] }), _jsxs("div", { className: "metadata-item", children: [_jsx(FiCpu, { className: "icon" }), "Model: ", result.model_used] }), result.analysis_method && (_jsxs("div", { className: "metadata-item", children: [_jsx(FiBarChart2, { className: "icon" }), "Method: ", result.analysis_method === 'llama_ai' ? 'AI Analysis' : 'Local Analysis', result.fallback_reason && (_jsxs("span", { className: "fallback-note", children: [" (Fallback: ", result.fallback_reason, ")"] }))] })), result.confidence && (_jsxs("div", { className: "metadata-item", children: [_jsx(FiCheck, { className: "icon" }), "Confidence: ", (result.confidence * 100).toFixed(0), "%"] }))] })] }))] }));
};
export default BiasDetection;
