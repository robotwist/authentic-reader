import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiType } from 'react-icons/fi';
import SentimentAnalysisDashboard from '../components/SentimentAnalysisDashboard';
import '../styles/SentimentAnalysisPage.css';
const SentimentAnalysisPage = () => {
    const navigate = useNavigate();
    const [inputText, setInputText] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const handleAnalysisComplete = (data) => {
        console.log('Sentiment analysis completed:', data);
        // You could save the results, show notifications, etc.
    };
    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            setIsInputVisible(false);
        }
    };
    return (_jsxs("div", { className: "sentiment-analysis-page", children: [_jsxs("div", { className: "page-header", children: [_jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Home"] }), _jsxs("div", { className: "header-actions", children: [_jsxs("button", { onClick: () => setIsInputVisible(!isInputVisible), className: "action-button", children: [_jsx(FiType, {}), " Add Text"] }), _jsxs("button", { className: "action-button", children: [_jsx(FiUpload, {}), " Upload File"] })] })] }), isInputVisible && (_jsx("div", { className: "text-input-modal", children: _jsxs("div", { className: "modal-content", children: [_jsx("h3", { children: "Enter Text for Sentiment Analysis" }), _jsxs("form", { onSubmit: handleTextSubmit, children: [_jsx("textarea", { value: inputText, onChange: (e) => setInputText(e.target.value), placeholder: "Paste or type the text you want to analyze for sentiment...", rows: 8, className: "text-input" }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { type: "button", onClick: () => setIsInputVisible(false), className: "cancel-btn", children: "Cancel" }), _jsx("button", { type: "submit", className: "analyze-btn", disabled: !inputText.trim(), children: "Analyze Sentiment" })] })] })] }) })), _jsx(SentimentAnalysisDashboard, { text: inputText, onAnalysisComplete: handleAnalysisComplete })] }));
};
export default SentimentAnalysisPage;
