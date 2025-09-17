import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiClock, FiTarget } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/RhetoricalAnalysis.css';
const RhetoricalAnalysis = ({ defaultText = '' }) => {
    const [text, setText] = useState(defaultText);
    const [result, setResult] = useState(null);
    const { serviceStatus, isCheckingStatus, analysisInProgress, error, analyzeRhetorical } = useLlamaAnalysis();
    useEffect(() => {
        // If default text is provided, analyze it automatically
        if (defaultText && serviceStatus?.status === 'healthy') {
            handleAnalysis();
        }
    }, [defaultText, serviceStatus]);
    const handleAnalysis = async () => {
        if (!text.trim())
            return;
        const rhetoricalResult = await analyzeRhetorical(text);
        if (rhetoricalResult) {
            setResult(rhetoricalResult);
        }
    };
    const handleReset = () => {
        setText('');
        setResult(null);
    };
    const getTechniqueColor = (category) => {
        const colors = {
            'Ethos': '#4285F4', // Blue for credibility
            'Pathos': '#EA4335', // Red for emotion
            'Logos': '#34A853', // Green for logic
            'Kairos': '#FBBC05', // Yellow for timing
            'Fallacy': '#9C27B0', // Purple for fallacies
            'Literary': '#FF9800', // Orange for literary devices
            'Persuasive': '#795548' // Brown for persuasion techniques
        };
        return colors[category] || '#9E9E9E'; // Grey for unknown types
    };
    const getHighlightedText = () => {
        if (!result || !result.techniques || result.techniques.length === 0) {
            return _jsx("p", { children: text });
        }
        // Sort by start_index to ensure we process in order
        const sortedTechniques = [...result.techniques].sort((a, b) => a.start_index - b.start_index);
        let lastIndex = 0;
        const textPieces = [];
        for (const technique of sortedTechniques) {
            // Add text before the technique
            if (technique.start_index > lastIndex) {
                textPieces.push(_jsx("span", { children: text.substring(lastIndex, technique.start_index) }, `text-${lastIndex}`));
            }
            // Add the highlighted technique
            textPieces.push(_jsxs("span", { className: "highlighted-technique", style: { backgroundColor: `${getTechniqueColor(technique.category)}30` }, title: `${technique.name}: ${technique.description}`, children: [text.substring(technique.start_index, technique.end_index), _jsxs("span", { className: "technique-tooltip", children: [_jsx("strong", { children: technique.name }), " (", technique.category, ")", _jsx("p", { children: technique.description })] })] }, `technique-${technique.start_index}`));
            lastIndex = technique.end_index;
        }
        // Add any remaining text
        if (lastIndex < text.length) {
            textPieces.push(_jsx("span", { children: text.substring(lastIndex) }, `text-${lastIndex}`));
        }
        return _jsx("div", { className: "highlighted-content", children: textPieces });
    };
    return (_jsxs("div", { className: "rhetorical-analysis-container", children: [_jsxs("h2", { className: "rhetorical-analysis-title", children: [_jsx(FiTarget, { className: "icon" }), " Rhetorical Analysis"] }), _jsxs("div", { className: "service-status", children: [_jsx("h4", { children: "Llama Service Status" }), isCheckingStatus ? (_jsx("p", { children: "Checking service status..." })) : serviceStatus?.status === 'healthy' ? (_jsxs("div", { className: "status-healthy", children: [_jsx(FiCheck, { className: "status-icon" }), _jsxs("span", { children: ["Service is online using ", serviceStatus.model, serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`] })] })) : (_jsxs("div", { className: "status-error", children: [_jsx(FiAlertCircle, { className: "status-icon" }), _jsxs("span", { children: ["Service is offline: ", serviceStatus?.error || 'Unknown error'] })] }))] }), _jsxs("form", { onSubmit: (e) => { e.preventDefault(); handleAnalysis(); }, className: "rhetorical-analysis-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "text-input", children: "Text to Analyze" }), _jsx("textarea", { id: "text-input", value: text, onChange: (e) => setText(e.target.value), placeholder: "Paste an article or text to identify rhetorical techniques and persuasion methods...", rows: 10, disabled: analysisInProgress || serviceStatus?.status !== 'healthy' })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "primary-button", disabled: analysisInProgress || !text.trim() || serviceStatus?.status !== 'healthy', children: analysisInProgress ? 'Analyzing Rhetoric...' : 'Analyze Rhetoric' }), _jsx("button", { type: "button", className: "secondary-button", onClick: handleReset, disabled: analysisInProgress || (!text && !result), children: "Reset" })] })] }), error && (_jsxs("div", { className: "error-message", children: [_jsx(FiAlertCircle, { className: "icon" }), error] })), result && (_jsxs("div", { className: "result-container", children: [_jsx("h3", { children: "Rhetorical Analysis Results" }), _jsxs("div", { className: "highlighted-text-container", children: [_jsx("h4", { children: "Identified Techniques" }), getHighlightedText()] }), _jsxs("div", { className: "rhetorical-summary", children: [_jsx("h4", { children: "Rhetorical Summary" }), _jsx("p", { children: result.summary })] }), _jsxs("div", { className: "technique-categories", children: [_jsx("h4", { children: "Technique Breakdown" }), _jsx("div", { className: "category-stats", children: result.categories.map((category, index) => (_jsxs("div", { className: "category-stat", children: [_jsx("div", { className: "category-name", style: { color: getTechniqueColor(category.name) }, children: category.name }), _jsxs("div", { className: "category-bar-container", children: [_jsx("div", { className: "category-bar", style: {
                                                        width: `${category.percentage}%`,
                                                        backgroundColor: getTechniqueColor(category.name)
                                                    } }), _jsxs("span", { className: "category-percentage", children: [category.percentage, "%"] })] })] }, index))) })] }), _jsxs("div", { className: "technique-list", children: [_jsx("h4", { children: "Detected Techniques" }), _jsx("div", { className: "technique-grid", children: result.techniques.map((technique, index) => (_jsxs("div", { className: "technique-card", children: [_jsx("div", { className: "technique-category-indicator", style: { backgroundColor: getTechniqueColor(technique.category) } }), _jsxs("div", { className: "technique-details", children: [_jsx("div", { className: "technique-name", children: technique.name }), _jsx("div", { className: "technique-category", children: technique.category }), _jsxs("div", { className: "technique-quote", children: ["\"", text.substring(technique.start_index, technique.end_index), "\""] }), _jsx("div", { className: "technique-description", children: technique.description })] })] }, index))) })] }), _jsxs("div", { className: "persuasiveness-score", children: [_jsx("h4", { children: "Overall Persuasiveness" }), _jsxs("div", { className: "score-container", children: [_jsxs("div", { className: "score-value", children: [result.persuasiveness_score.toFixed(1), "/10"] }), _jsx("div", { className: "score-bar-container", children: _jsx("div", { className: "score-bar", style: { width: `${result.persuasiveness_score * 10}%` } }) }), _jsx("div", { className: "score-label", children: getPersuasivenessLabel(result.persuasiveness_score) })] })] }), _jsxs("div", { className: "result-metadata", children: [_jsxs("div", { className: "metadata-item", children: [_jsx(FiClock, { className: "icon" }), "Processed in ", result.processing_time.toFixed(2), " seconds"] }), _jsxs("div", { className: "metadata-item", children: [_jsx(FiCpu, { className: "icon" }), "Model: ", result.model_used] })] })] }))] }));
};
const getPersuasivenessLabel = (score) => {
    if (score >= 9)
        return "Extremely Persuasive";
    if (score >= 7.5)
        return "Highly Persuasive";
    if (score >= 6)
        return "Moderately Persuasive";
    if (score >= 4.5)
        return "Somewhat Persuasive";
    if (score >= 3)
        return "Slightly Persuasive";
    return "Minimally Persuasive";
};
export default RhetoricalAnalysis;
