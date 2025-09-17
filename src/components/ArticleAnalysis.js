import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import '../styles/ArticleAnalysis.css';
import { BiasType } from '../services/contentAnalysisService';
import ManipulationAnalysis from './ManipulationAnalysis';
import EmotionAnalysis from './EmotionAnalysis';
import FeedbackPanel from './FeedbackPanel';
// Helper function for getting bias type name
const getBiasTypeName = (biasType) => {
    switch (biasType) {
        case BiasType.LEFT_STRONG:
            return 'Strong Left';
        case BiasType.LEFT_MODERATE:
            return 'Moderate Left';
        case BiasType.CENTER:
            return 'Center';
        case BiasType.RIGHT_MODERATE:
            return 'Moderate Right';
        case BiasType.RIGHT_STRONG:
            return 'Strong Right';
        default:
            return 'Center';
    }
};
const ArticleAnalysis = ({ title, source, author, date, analysis, articleId = 'unknown' }) => {
    const [activeTab, setActiveTab] = useState('fallacies');
    // Helper functions for styling based on score
    const getQualityClass = (score) => {
        if (score >= 70)
            return 'high-quality';
        if (score >= 40)
            return 'medium-quality';
        return 'low-quality';
    };
    const getManipulationClass = (score) => {
        if (score >= 70)
            return 'high-manipulation';
        if (score >= 40)
            return 'medium-manipulation';
        return 'low-manipulation';
    };
    const getBiasClass = (biasType) => {
        switch (biasType) {
            case BiasType.LEFT_STRONG:
                return 'bias-left-strong';
            case BiasType.LEFT_MODERATE:
                return 'bias-left';
            case BiasType.CENTER:
                return 'bias-center';
            case BiasType.RIGHT_MODERATE:
                return 'bias-right';
            case BiasType.RIGHT_STRONG:
                return 'bias-right-strong';
            default:
                return 'bias-center';
        }
    };
    // Helper for generating bias position on the spectrum
    const getBiasPosition = (biasType) => {
        switch (biasType) {
            case BiasType.LEFT_STRONG:
                return '10%';
            case BiasType.LEFT_MODERATE:
                return '30%';
            case BiasType.CENTER:
                return '50%';
            case BiasType.RIGHT_MODERATE:
                return '70%';
            case BiasType.RIGHT_STRONG:
                return '90%';
            default:
                return '50%';
        }
    };
    // Helper for generating readable score labels
    const getQualityLabel = (score) => {
        if (score >= 70)
            return 'High';
        if (score >= 40)
            return 'Medium';
        return 'Low';
    };
    const getManipulationLabel = (score) => {
        if (score >= 70)
            return 'High Risk';
        if (score >= 40)
            return 'Medium Risk';
        return 'Low Risk';
    };
    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString)
            return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
        catch (_unused) {
            return dateString;
        }
    };
    return (_jsxs("div", { className: "article-analysis", children: [_jsxs("div", { className: "analysis-header", children: [_jsx("h2", { children: title }), _jsxs("div", { className: "source-info", children: [source && _jsx("span", { className: "source", children: source }), author && _jsxs("span", { className: "author", children: ["By ", author] }), date && _jsx("span", { className: "date", children: formatDate(date) })] })] }), _jsxs("div", { className: "analysis-scores", children: [_jsxs("div", { className: `quality-score ${getQualityClass(analysis.qualityScore * 100)}`, children: [_jsx("div", { className: "score-label", children: "Content Quality" }), _jsx("div", { className: "score-value", children: getQualityLabel(analysis.qualityScore * 100) }), _jsxs("div", { className: "score-numeric", children: [Math.round(analysis.qualityScore * 100), "/100"] })] }), _jsxs("div", { className: `manipulation-score ${getManipulationClass(analysis.manipulationScore * 100)}`, children: [_jsx("div", { className: "score-label", children: "Manipulation" }), _jsx("div", { className: "score-value", children: getManipulationLabel(analysis.manipulationScore * 100) }), _jsxs("div", { className: "score-numeric", children: [Math.round(analysis.manipulationScore * 100), "/100"] })] }), _jsxs("div", { className: `bias-indicator ${getBiasClass(analysis.biasAnalysis.type)}`, children: [_jsx("div", { className: "score-label", children: "Bias" }), _jsx("div", { className: "score-value", children: getBiasTypeName(analysis.biasAnalysis.type).replace('_', ' ') })] })] }), _jsxs("div", { className: "analysis-tabs", children: [_jsx("button", { className: `tab ${activeTab === 'fallacies' ? 'active' : ''}`, onClick: () => setActiveTab('fallacies'), children: "Logical Fallacies" }), _jsx("button", { className: `tab ${activeTab === 'bias' ? 'active' : ''}`, onClick: () => setActiveTab('bias'), children: "Bias Analysis" }), _jsx("button", { className: `tab ${activeTab === 'metrics' ? 'active' : ''}`, onClick: () => setActiveTab('metrics'), children: "Content Metrics" }), _jsx("button", { className: `tab ${activeTab === 'manipulation' ? 'active' : ''}`, onClick: () => setActiveTab('manipulation'), children: "Manipulation" }), _jsx("button", { className: `tab ${activeTab === 'emotions' ? 'active' : ''}`, onClick: () => setActiveTab('emotions'), children: "Emotions" })] }), activeTab === 'fallacies' && (_jsxs("div", { className: "fallacies-tab", children: [analysis.logicalFallacies.length > 0 ? (_jsx("ul", { className: "fallacies-list", children: analysis.logicalFallacies.map((fallacy, index) => (_jsxs("li", { className: "fallacy-item", children: [_jsx("h4", { className: "fallacy-type", children: fallacy.type.replace(/_/g, ' ') }), _jsx("p", { className: "fallacy-explanation", children: fallacy.explanation }), fallacy.excerpt && (_jsxs("blockquote", { className: "fallacy-excerpt", children: ["\"", fallacy.excerpt, "\""] })), _jsxs("div", { className: "fallacy-confidence", children: ["Confidence: ", (fallacy.confidence * 100).toFixed(0), "%"] })] }, index))) })) : (_jsx("div", { className: "no-fallacies", children: "No logical fallacies were detected in this article." })), _jsx(FeedbackPanel, { articleId: articleId, analysisType: "fallacy", originalPrediction: analysis.logicalFallacies })] })), activeTab === 'bias' && (_jsxs("div", { className: "bias-tab", children: [_jsxs("div", { className: "bias-explanation", children: [_jsx("h3", { children: "Bias Analysis" }), _jsx("p", { children: analysis.biasAnalysis.explanation }), _jsxs("p", { className: "bias-confidence", children: ["Confidence: ", (analysis.biasAnalysis.confidence * 100).toFixed(0), "%"] })] }), _jsxs("div", { className: "bias-spectrum", children: [_jsx("div", { className: "spectrum-label left", children: "Left" }), _jsx("div", { className: "spectrum-bar", children: _jsx("div", { className: "bias-marker", style: { left: getBiasPosition(analysis.biasAnalysis.type) } }) }), _jsx("div", { className: "spectrum-label right", children: "Right" })] }), _jsxs("div", { className: "bias-indicators", children: [_jsx("h4", { children: "Detected Bias Indicators" }), _jsxs("div", { className: "indicators-columns", children: [analysis.biasAnalysis?.leftIndicators?.length > 0 && (_jsxs("div", { className: "left-indicators", children: [_jsx("h5", { children: "Left-leaning Indicators" }), _jsx("ul", { children: analysis.biasAnalysis.leftIndicators.map((indicator, index) => (_jsx("li", { children: indicator }, index))) })] })), analysis.biasAnalysis?.rightIndicators?.length > 0 && (_jsxs("div", { className: "right-indicators", children: [_jsx("h5", { children: "Right-leaning Indicators" }), _jsx("ul", { children: analysis.biasAnalysis.rightIndicators.map((indicator, index) => (_jsx("li", { children: indicator }, index))) })] }))] })] }), _jsx(FeedbackPanel, { articleId: articleId, analysisType: "bias", originalPrediction: analysis.biasAnalysis })] })), activeTab === 'metrics' && (_jsxs("div", { className: "metrics-tab", children: [_jsxs("div", { className: "metrics-columns", children: [_jsxs("div", { className: "metrics-column", children: [_jsx("h3", { children: "Article Metadata" }), _jsxs("div", { className: "metric-item", children: [_jsx("div", { className: "metric-label", children: "Main Point" }), _jsx("div", { className: "metric-value", children: analysis.metadata.mainPoint })] }), _jsxs("div", { className: "metric-item", children: [_jsx("div", { className: "metric-label", children: "Agenda" }), _jsx("div", { className: "metric-value", children: analysis.metadata.agenda || 'None detected' })] }), _jsxs("div", { className: "metric-item", children: [_jsx("div", { className: "metric-label", children: "Affiliation" }), _jsx("div", { className: "metric-value", children: analysis.metadata.affiliation || 'Not detected' })] }), _jsxs("div", { className: "metric-item", children: [_jsx("div", { className: "metric-label", children: "Reading Time" }), _jsxs("div", { className: "metric-value", children: [analysis.metadata.readingTimeMinutes, " mins"] })] }), _jsxs("div", { className: "metric-item", children: [_jsx("div", { className: "metric-label", children: "Complexity" }), _jsx("div", { className: "metric-value", children: analysis.metadata.readingLevel })] }), analysis.metadata.citations && analysis.metadata.citations.length > 0 && (_jsxs("div", { className: "citations-list", children: [_jsx("h4", { children: "Citations" }), _jsx("ul", { children: analysis.metadata.citations.map((citation, index) => (_jsx("li", { children: citation }, index))) })] }))] }), _jsxs("div", { className: "metrics-column", children: [_jsxs("div", { className: "key-entities", children: [_jsx("h3", { children: "Key Entities" }), _jsx("div", { className: "entity-tags", children: analysis.metadata?.entities?.map((entity, index) => (_jsx("span", { className: "entity-tag", children: entity }, index))) })] }), _jsxs("div", { className: "sentiment-analysis", children: [_jsx("h3", { children: "Sentiment Analysis" }), analysis.sentimentAnalysis ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "metric-item", children: [_jsx("div", { className: "metric-label", children: "Overall" }), _jsxs("div", { className: "metric-value", children: [analysis.sentimentAnalysis.overall > 0 ? 'Positive' :
                                                                        analysis.sentimentAnalysis.overall < 0 ? 'Negative' : 'Neutral', ' ', "(", analysis.sentimentAnalysis.overall.toFixed(2), ")"] })] }), _jsx("div", { className: "sentiment-aspects", children: Object.entries(analysis.sentimentAnalysis.aspects).map(([aspect, score], index) => (_jsxs("div", { className: "metric-item", children: [_jsx("div", { className: "metric-label", children: aspect }), _jsxs("div", { className: "metric-value", children: [Number(score) > 0 ? 'Positive' : Number(score) < 0 ? 'Negative' : 'Neutral', ' ', "(", Number(score).toFixed(2), ")"] })] }, index))) })] })) : (_jsx("div", { className: "metric-value", children: "N/A" }))] }), _jsxs("div", { className: "emotional-appeals", children: [_jsx("h3", { children: "Emotional Appeals" }), analysis.emotionalAppeals ? (_jsx("div", { className: "emotion-bars", children: Object.entries(analysis.emotionalAppeals).map(([emotion, value], index) => (_jsxs("div", { className: "emotion-bar", children: [_jsx("div", { className: "emotion-label", children: emotion }), _jsx("div", { className: "emotion-track", children: _jsx("div", { className: "emotion-fill", style: { width: `${Number(value) * 100}%` } }) }), _jsxs("div", { className: "emotion-value", children: [(Number(value) * 100).toFixed(0), "%"] })] }, index))) })) : (_jsx("div", { className: "metric-value", children: "N/A" }))] })] })] }), _jsx(FeedbackPanel, { articleId: articleId, analysisType: "metrics", originalPrediction: analysis.metadata })] })), activeTab === 'manipulation' && (_jsxs("div", { className: "manipulation-tab", children: [_jsx(ManipulationAnalysis, { manipulationAnalysis: analysis.manipulationAnalysis }), _jsx(FeedbackPanel, { articleId: articleId, analysisType: "manipulation", originalPrediction: analysis.manipulationAnalysis })] })), activeTab === 'emotions' && (_jsxs("div", { className: "emotions-tab", children: [_jsx(EmotionAnalysis, { emotionAnalysis: analysis.emotionAnalysis, sentiment: analysis.sentiment }), _jsx(FeedbackPanel, { articleId: articleId, analysisType: "emotion", originalPrediction: {
                            emotions: analysis.emotionAnalysis,
                            sentiment: analysis.sentiment
                        } })] }))] }));
};
export default ArticleAnalysis;
