import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import llamaService from '../services/LlamaService';
import { FiFileText, FiCpu, FiClock, FiAlertCircle, FiCheck } from 'react-icons/fi';
import '../styles/Summarizer.css';
const Summarizer = () => {
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');
    const [summaryType, setSummaryType] = useState('detailed');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processingTime, setProcessingTime] = useState(null);
    const [modelUsed, setModelUsed] = useState(null);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);
    // Check service status on component mount
    useEffect(() => {
        const checkServiceStatus = async () => {
            setStatusLoading(true);
            try {
                const status = await llamaService.checkStatus();
                setServiceStatus(status);
            }
            catch (error) {
                console.error('Failed to check service status:', error);
                setServiceStatus({
                    status: 'error',
                    model: 'unknown',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
            finally {
                setStatusLoading(false);
            }
        };
        checkServiceStatus();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) {
            setError('Please enter text to summarize');
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            setSummary('');
            setProcessingTime(null);
            setModelUsed(null);
            const request = {
                text,
                type: summaryType,
                max_length: Math.min(Math.floor(text.length * 0.25), 2000), // 25% of original, max 2000 chars
            };
            const response = await llamaService.summarizeText(request);
            setSummary(response.text);
            setProcessingTime(response.processing_time);
            setModelUsed(response.model_used);
        }
        catch (error) {
            console.error('Summarization failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to summarize text');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleReset = () => {
        setText('');
        setSummary('');
        setError(null);
        setProcessingTime(null);
        setModelUsed(null);
    };
    return (_jsxs("div", { className: "summarizer-container", children: [_jsxs("h2", { className: "summarizer-title", children: [_jsx(FiFileText, { className: "icon" }), " Text Summarizer"] }), _jsxs("div", { className: "service-status", children: [_jsx("h4", { children: "Llama Service Status" }), statusLoading ? (_jsx("p", { children: "Checking service status..." })) : serviceStatus?.status === 'healthy' ? (_jsxs("div", { className: "status-healthy", children: [_jsx(FiCheck, { className: "status-icon" }), _jsxs("span", { children: ["Service is online using ", serviceStatus.model, serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`] })] })) : (_jsxs("div", { className: "status-error", children: [_jsx(FiAlertCircle, { className: "status-icon" }), _jsxs("span", { children: ["Service is offline: ", serviceStatus?.error || 'Unknown error'] })] }))] }), _jsxs("form", { onSubmit: handleSubmit, className: "summarizer-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "text-input", children: "Text to Summarize" }), _jsx("textarea", { id: "text-input", value: text, onChange: (e) => setText(e.target.value), placeholder: "Paste your text here to generate a summary...", rows: 10, disabled: isLoading || serviceStatus?.status !== 'healthy' })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "summary-type", children: "Summary Type" }), _jsxs("select", { id: "summary-type", value: summaryType, onChange: (e) => setSummaryType(e.target.value), disabled: isLoading || serviceStatus?.status !== 'healthy', children: [_jsx("option", { value: "brief", children: "Brief (concise overview)" }), _jsx("option", { value: "detailed", children: "Detailed (comprehensive summary)" }), _jsx("option", { value: "bullet", children: "Bullet Points (key points)" }), _jsx("option", { value: "executive", children: "Executive Summary (business-oriented)" })] })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "primary-button", disabled: isLoading || !text.trim() || serviceStatus?.status !== 'healthy', children: isLoading ? 'Summarizing...' : 'Summarize Text' }), _jsx("button", { type: "button", className: "secondary-button", onClick: handleReset, disabled: isLoading || (!text && !summary), children: "Reset" })] })] }), error && (_jsxs("div", { className: "error-message", children: [_jsx(FiAlertCircle, { className: "icon" }), error] })), summary && (_jsxs("div", { className: "result-container", children: [_jsx("h3", { children: "Summary" }), _jsx("div", { className: "summary-result", children: summary }), (processingTime || modelUsed) && (_jsxs("div", { className: "result-metadata", children: [processingTime && (_jsxs("div", { className: "metadata-item", children: [_jsx(FiClock, { className: "icon" }), "Processed in ", processingTime.toFixed(2), " seconds"] })), modelUsed && (_jsxs("div", { className: "metadata-item", children: [_jsx(FiCpu, { className: "icon" }), "Model: ", modelUsed] }))] }))] }))] }));
};
export default Summarizer;
