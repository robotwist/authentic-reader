import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiClock, FiShield } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/DarkPatternDetection.css';
const DarkPatternDetection = ({ defaultText = '', defaultUrl = '' }) => {
    const [text, setText] = useState(defaultText);
    const [url, setUrl] = useState(defaultUrl);
    const [analysisMode, setAnalysisMode] = useState(defaultUrl ? 'url' : 'text');
    const [result, setResult] = useState(null);
    const { serviceStatus, isCheckingStatus, analysisInProgress, error, analyzeDarkPatterns } = useLlamaAnalysis();
    useEffect(() => {
        // Automatically analyze when component loads with default values
        if ((defaultText || defaultUrl) && serviceStatus?.status === 'healthy') {
            handleAnalysis();
        }
    }, [defaultText, defaultUrl, serviceStatus]);
    const handleAnalysis = async () => {
        if (analysisMode === 'text' && !text.trim())
            return;
        if (analysisMode === 'url' && !url.trim())
            return;
        const content = analysisMode === 'text' ? text : url;
        const darkPatternResult = await analyzeDarkPatterns(content, analysisMode);
        if (darkPatternResult) {
            setResult(darkPatternResult);
        }
    };
    const handleReset = () => {
        setText('');
        setUrl('');
        setResult(null);
    };
    const getSeverityColor = (severity) => {
        if (severity >= 8)
            return '#EA4335'; // High - Red
        if (severity >= 5)
            return '#FBBC05'; // Medium - Yellow
        return '#34A853'; // Low - Green
    };
    const getSeverityLabel = (severity) => {
        if (severity >= 8)
            return 'High';
        if (severity >= 5)
            return 'Medium';
        return 'Low';
    };
    return (_jsxs("div", { className: "dark-pattern-container", children: [_jsxs("h2", { className: "dark-pattern-title", children: [_jsx(FiShield, { className: "icon" }), " Dark Pattern Detection"] }), _jsxs("div", { className: "service-status", children: [_jsx("h4", { children: "Llama Service Status" }), isCheckingStatus ? (_jsx("p", { children: "Checking service status..." })) : serviceStatus?.status === 'healthy' ? (_jsxs("div", { className: "status-healthy", children: [_jsx(FiCheck, { className: "status-icon" }), _jsxs("span", { children: ["Service is online using ", serviceStatus.model, serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`] })] })) : (_jsxs("div", { className: "status-error", children: [_jsx(FiAlertCircle, { className: "status-icon" }), _jsxs("span", { children: ["Service is offline: ", serviceStatus?.error || 'Unknown error'] })] }))] }), _jsxs("div", { className: "analysis-mode-toggle", children: [_jsx("button", { className: `mode-button ${analysisMode === 'text' ? 'active' : ''}`, onClick: () => setAnalysisMode('text'), children: "Analyze Text" }), _jsx("button", { className: `mode-button ${analysisMode === 'url' ? 'active' : ''}`, onClick: () => setAnalysisMode('url'), children: "Analyze URL" })] }), _jsxs("form", { onSubmit: (e) => { e.preventDefault(); handleAnalysis(); }, className: "dark-pattern-form", children: [analysisMode === 'text' ? (_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "text-input", children: "Text to Analyze" }), _jsx("textarea", { id: "text-input", value: text, onChange: (e) => setText(e.target.value), placeholder: "Paste an article, terms of service, or text to check for dark patterns and manipulative design...", rows: 10, disabled: analysisInProgress || serviceStatus?.status !== 'healthy' })] })) : (_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "url-input", children: "URL to Analyze" }), _jsx("input", { type: "url", id: "url-input", value: url, onChange: (e) => setUrl(e.target.value), placeholder: "Enter a website URL to analyze for dark patterns...", disabled: analysisInProgress || serviceStatus?.status !== 'healthy' }), _jsx("small", { className: "input-helper", children: "Note: The service will extract and analyze text content from the URL." })] })), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "primary-button", disabled: analysisInProgress ||
                                    serviceStatus?.status !== 'healthy' ||
                                    (analysisMode === 'text' && !text.trim()) ||
                                    (analysisMode === 'url' && !url.trim()), children: analysisInProgress ? 'Analyzing...' : 'Detect Dark Patterns' }), _jsx("button", { type: "button", className: "secondary-button", onClick: handleReset, disabled: analysisInProgress || ((!text && !url) && !result), children: "Reset" })] })] }), error && (_jsxs("div", { className: "error-message", children: [_jsx(FiAlertCircle, { className: "icon" }), error] })), result && (_jsxs("div", { className: "result-container", children: [_jsx("h3", { children: "Dark Pattern Analysis Results" }), _jsxs("div", { className: "dark-pattern-summary", children: [_jsx("h4", { children: "Summary" }), _jsx("p", { children: result.summary }), _jsxs("div", { className: "overall-score", children: [_jsx("div", { className: "score-label", children: "Dark Pattern Severity" }), _jsxs("div", { className: "score-value", style: { color: getSeverityColor(result.overall_severity) }, children: [result.overall_severity.toFixed(1), "/10"] }), _jsx("div", { className: "score-bar-container", children: _jsx("div", { className: "score-bar", style: {
                                                width: `${result.overall_severity * 10}%`,
                                                backgroundColor: getSeverityColor(result.overall_severity)
                                            } }) }), _jsxs("div", { className: "severity-label", style: { color: getSeverityColor(result.overall_severity) }, children: [getSeverityLabel(result.overall_severity), " Severity"] })] })] }), _jsxs("div", { className: "dark-patterns-detected", children: [_jsx("h4", { children: "Detected Dark Patterns" }), result.patterns.length === 0 ? (_jsxs("div", { className: "no-patterns-found", children: [_jsx(FiCheck, { className: "check-icon" }), _jsx("p", { children: "No dark patterns detected. The content appears to respect user autonomy." })] })) : (_jsx("div", { className: "pattern-list", children: result.patterns.map((pattern, index) => (_jsxs("div", { className: "pattern-card", children: [_jsxs("div", { className: "pattern-header", children: [_jsx("h5", { className: "pattern-name", children: pattern.name }), _jsxs("div", { className: "pattern-severity", style: { backgroundColor: getSeverityColor(pattern.severity) }, children: [getSeverityLabel(pattern.severity), " Severity"] })] }), _jsx("div", { className: "pattern-description", children: _jsx("p", { children: pattern.description }) }), pattern.example && (_jsxs("div", { className: "pattern-example", children: [_jsx("div", { className: "example-label", children: "Example in Text:" }), _jsxs("div", { className: "example-content", children: ["\"", pattern.example, "\""] })] })), _jsxs("div", { className: "pattern-impact", children: [_jsx("div", { className: "impact-label", children: "Potential Impact:" }), _jsx("p", { children: pattern.impact })] }), _jsxs("div", { className: "pattern-recommendation", children: [_jsx("div", { className: "recommendation-label", children: "Recommendation:" }), _jsx("p", { children: pattern.recommendation })] })] }, index))) }))] }), result.categories.length > 0 && (_jsxs("div", { className: "pattern-categories", children: [_jsx("h4", { children: "Dark Pattern Categories" }), _jsx("div", { className: "category-grid", children: result.categories.map((category, index) => (_jsxs("div", { className: "category-card", children: [_jsx("div", { className: "category-name", children: category.name }), _jsxs("div", { className: "category-count", children: [category.count, " patterns"] }), _jsx("div", { className: "category-description", children: category.description })] }, index))) })] })), _jsxs("div", { className: "result-metadata", children: [_jsxs("div", { className: "metadata-item", children: [_jsx(FiClock, { className: "icon" }), "Processed in ", result.processing_time.toFixed(2), " seconds"] }), _jsxs("div", { className: "metadata-item", children: [_jsx(FiCpu, { className: "icon" }), "Model: ", result.model_used] })] })] }))] }));
};
export default DarkPatternDetection;
