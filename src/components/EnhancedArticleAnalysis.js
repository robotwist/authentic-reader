import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiTarget, FiShield, FiTrendingUp, FiActivity, FiX, FiEye, FiBarChart, FiAward, FiClock } from 'react-icons/fi';
import comprehensiveAnalysisService from '../services/comprehensiveAnalysisService';
import '../styles/EnhancedArticleAnalysis.css';
const EnhancedArticleAnalysis = ({ article, isOpen, onClose }) => {
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const performAnalysisCallback = React.useCallback(async () => {
        if (!article.title && !article.content && !article.summary) {
            setError('No content available for analysis');
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        try {
            console.log('🚀 Starting comprehensive article analysis...');
            const comprehensiveResult = await comprehensiveAnalysisService.analyzeArticle(article, {
                includeAI: true,
                includeFallacies: true,
                includeBias: true,
                includeCredibility: true,
                includeReadability: true,
                includeFactChecking: true
            });
            setAnalysis(comprehensiveResult);
            console.log('✅ Analysis complete:', comprehensiveResult);
            // Debug: Check for potential object rendering issues
            console.log('🔍 Analysis structure check:');
            console.log('- logicalFallacies:', typeof comprehensiveResult.logicalFallacies);
            console.log('- biasAnalysis:', typeof comprehensiveResult.biasAnalysis);
            console.log('- credibility:', typeof comprehensiveResult.credibility);
            console.log('- readability:', typeof comprehensiveResult.readability);
        }
        catch (err) {
            console.error('❌ Analysis error:', err);
            setError(err instanceof Error ? err.message : 'Analysis failed');
        }
        finally {
            setIsAnalyzing(false);
        }
    }, [article]);
    useEffect(() => {
        if (isOpen && article && !analysis) {
            performAnalysisCallback();
        }
    }, [isOpen, article, analysis, performAnalysisCallback]);
    // Helper functions for UI display
    const getBiasLevelText = (score) => {
        if (score < 30)
            return 'Very Low';
        if (score < 50)
            return 'Low';
        if (score < 70)
            return 'Moderate';
        if (score < 90)
            return 'High';
        return 'Very High';
    };
    const getBiasLevelColor = (score) => {
        if (score < 30)
            return '#28a745';
        if (score < 50)
            return '#5cb85c';
        if (score < 70)
            return '#ffc107';
        if (score < 90)
            return '#fd7e14';
        return '#dc3545';
    };
    const getEmotionColor = (emotion) => {
        const colors = {
            fear: '#ff6b6b',
            anger: '#ff4757',
            hope: '#2ed573',
            disgust: '#a55eea',
            sadness: '#5352ed',
            joy: '#ffa726'
        };
        return colors[emotion] || '#6c757d';
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "enhanced-article-analysis-overlay", children: _jsxs("div", { className: "enhanced-article-analysis-modal", children: [_jsxs("div", { className: "analysis-header", children: [_jsxs("div", { className: "header-content", children: [_jsxs("h2", { children: [_jsx(FiShield, { className: "header-icon" }), "Advanced Article Analysis"] }), _jsxs("p", { children: ["Comprehensive analysis of \"", article.title, "\""] })] }), _jsx("button", { onClick: onClose, className: "close-button", children: _jsx(FiX, {}) })] }), isAnalyzing && (_jsxs("div", { className: "loading-section", children: [_jsx(FiActivity, { className: "spinner" }), _jsx("h3", { children: "Analyzing Article..." }), _jsx("p", { children: "Running comprehensive analysis including bias detection, logical fallacies, and credibility assessment..." })] })), error && (_jsxs("div", { className: "error-section", children: [_jsx(FiAlertTriangle, { className: "error-icon" }), _jsx("h3", { children: "Analysis Error" }), _jsx("p", { children: error })] })), analysis && analysis.logicalFallacies && analysis.biasAnalysis && analysis.credibility && analysis.readability && (_jsxs("div", { className: "analysis-content", children: [_jsxs("div", { className: "analysis-tabs", children: [_jsxs("button", { className: `tab-button ${activeTab === 'overview' ? 'active' : ''}`, onClick: () => setActiveTab('overview'), children: [_jsx(FiInfo, { className: "tab-icon" }), "Overview"] }), _jsxs("button", { className: `tab-button ${activeTab === 'fallacies' ? 'active' : ''}`, onClick: () => setActiveTab('fallacies'), children: [_jsx(FiAlertTriangle, { className: "tab-icon" }), "Fallacies (", analysis.logicalFallacies?.fallacies?.length || 0, ")"] }), _jsxs("button", { className: `tab-button ${activeTab === 'bias' ? 'active' : ''}`, onClick: () => setActiveTab('bias'), children: [_jsx(FiTarget, { className: "tab-icon" }), "Bias Analysis"] }), _jsxs("button", { className: `tab-button ${activeTab === 'credibility' ? 'active' : ''}`, onClick: () => setActiveTab('credibility'), children: [_jsx(FiShield, { className: "tab-icon" }), "Credibility (", Math.round(analysis.credibility?.score || 0), ")"] }), _jsxs("button", { className: `tab-button ${activeTab === 'readability' ? 'active' : ''}`, onClick: () => setActiveTab('readability'), children: [_jsx(FiEye, { className: "tab-icon" }), "Readability"] })] }), _jsxs("div", { className: "tab-content", children: [activeTab === 'overview' && (_jsxs("div", { className: "overview-tab", children: [_jsxs("div", { className: "quality-score-section", children: [_jsxs("div", { className: "quality-score-header", children: [_jsx(FiAward, { className: "section-icon" }), _jsx("h3", { children: "Overall Quality Assessment" })] }), _jsxs("div", { className: "quality-score-display", children: [_jsx("div", { className: `grade-badge grade-${(analysis.overallQuality?.grade || 'c').toLowerCase()}`, children: analysis.overallQuality?.grade || 'C' }), _jsxs("div", { className: "quality-details", children: [_jsxs("div", { className: "quality-score", children: [analysis.overallQuality?.score || 0, "/100"] }), _jsx("div", { className: "quality-summary", children: typeof analysis.overallQuality?.summary === 'string' ? analysis.overallQuality.summary : 'No summary available' })] })] })] }), _jsxs("div", { className: "quick-summary", children: [_jsxs("div", { className: "summary-header", children: [_jsx(FiBarChart, { className: "summary-icon" }), _jsx("h3", { children: "Key Metrics" })] }), _jsxs("div", { className: "summary-grid", children: [_jsxs("div", { className: "summary-item", children: [_jsx("span", { className: "label", children: "Bias Level:" }), _jsx("span", { className: "value", style: { color: getBiasLevelColor(analysis.biasAnalysis?.scores?.overall || 0) }, children: getBiasLevelText(analysis.biasAnalysis?.scores?.overall || 0) })] }), _jsxs("div", { className: "summary-item", children: [_jsx("span", { className: "label", children: "Credibility:" }), _jsxs("span", { className: "value", style: { color: (analysis.credibility?.score || 0) > 70 ? '#28a745' : (analysis.credibility?.score || 0) > 50 ? '#ffc107' : '#dc3545' }, children: [Math.round(analysis.credibility?.score || 0), "/100"] })] }), _jsxs("div", { className: "summary-item", children: [_jsx("span", { className: "label", children: "Logical Issues:" }), _jsx("span", { className: "value", children: analysis.logicalFallacies?.fallacies?.length || 0 })] }), _jsxs("div", { className: "summary-item", children: [_jsx("span", { className: "label", children: "Reading Level:" }), _jsxs("span", { className: "value", children: ["Grade ", analysis.readability?.gradeLevel || 'N/A'] })] }), _jsxs("div", { className: "summary-item", children: [_jsx("span", { className: "label", children: "Reading Time:" }), _jsxs("span", { className: "value", children: [analysis.readability?.readingTime || 0, " min"] })] }), _jsxs("div", { className: "summary-item", children: [_jsx("span", { className: "label", children: "Claims Detected:" }), _jsx("span", { className: "value", children: analysis.factChecking?.claimsDetected || 0 })] })] })] }), _jsxs("div", { className: "recommendations-section", children: [_jsxs("div", { className: "recommendations-header", children: [_jsx(FiTrendingUp, { className: "section-icon" }), _jsx("h3", { children: "Key Recommendations" })] }), _jsx("div", { className: "recommendations-content", children: analysis.recommendations?.forReaders && analysis.recommendations.forReaders.length > 0 && (_jsxs("div", { className: "recommendation-category", children: [_jsx("h4", { children: "For Readers:" }), _jsx("ul", { children: analysis.recommendations.forReaders.slice(0, 3).map((rec, index) => (_jsx("li", { children: typeof rec === 'string' ? rec : 'Recommendation item' }, index))) })] })) })] })] })), activeTab === 'fallacies' && (_jsx("div", { className: "fallacies-tab", children: _jsxs("div", { className: "analysis-section", children: [_jsxs("div", { className: "section-header", children: [_jsx(FiAlertTriangle, { className: "section-icon" }), _jsx("h3", { children: "Logical Fallacies Analysis" }), _jsxs("div", { className: "fallacy-score", children: ["Score: ", analysis.logicalFallacies?.overallScore || 0, "/100"] })] }), (analysis.logicalFallacies?.fallacies?.length || 0) > 0 ? (_jsx("div", { className: "fallacies-list", children: (analysis.logicalFallacies?.fallacies || []).map((fallacy, index) => (_jsxs("div", { className: `fallacy-item severity-${fallacy.severity}`, children: [_jsxs("div", { className: "fallacy-header", children: [_jsx("span", { className: "fallacy-name", children: fallacy.name }), _jsxs("div", { className: "fallacy-meta", children: [_jsx("span", { className: `severity-badge severity-${fallacy.severity}`, children: fallacy.severity }), _jsxs("span", { className: "confidence-badge", children: [Math.round(fallacy.confidence * 100), "% confidence"] })] })] }), _jsx("p", { className: "fallacy-description", children: fallacy.description || 'No description available' }), _jsxs("div", { className: "fallacy-explanation", children: [_jsx("strong", { children: "Why this matters:" }), " ", fallacy.explanation || 'No explanation available'] }), fallacy.examples && fallacy.examples.length > 0 && (_jsxs("div", { className: "fallacy-examples", children: [_jsx("strong", { children: "Examples found:" }), _jsx("ul", { children: fallacy.examples.map((example, i) => (_jsx("li", { children: typeof example === 'string' ? example : JSON.stringify(example) }, i))) })] })), fallacy.counterargument && (_jsxs("div", { className: "counterargument", children: [_jsx("strong", { children: "Counter-approach:" }), " ", typeof fallacy.counterargument === 'string' ? fallacy.counterargument : 'No counter-approach available'] }))] }, index))) })) : (_jsxs("div", { className: "no-fallacies", children: [_jsx(FiCheckCircle, { className: "success-icon" }), _jsx("p", { children: "No significant logical fallacies detected. The argumentation appears sound." })] }))] }) })), activeTab === 'bias' && (_jsx("div", { className: "bias-tab", children: _jsxs("div", { className: "analysis-section", children: [_jsxs("div", { className: "section-header", children: [_jsx(FiTarget, { className: "section-icon" }), _jsx("h3", { children: "Multi-Dimensional Bias Analysis" }), _jsxs("div", { className: "neutrality-score", children: ["Neutrality: ", analysis.biasAnalysis?.summary?.neutralityScore || 0, "/100"] })] }), _jsxs("div", { className: "bias-dimension", children: [_jsx("h4", { children: "Political Bias" }), _jsxs("div", { className: "political-bias-display", children: [_jsxs("div", { className: "bias-spectrum", children: [_jsx("span", { className: "spectrum-label left", children: "Left" }), _jsx("div", { className: "spectrum-bar", children: _jsx("div", { className: "spectrum-indicator", style: { left: `${analysis.biasAnalysis?.scores?.political?.leftRight || 50}%` } }) }), _jsx("span", { className: "spectrum-label right", children: "Right" })] }), _jsxs("div", { className: "bias-confidence", children: ["Confidence: ", Math.round((analysis.biasAnalysis?.scores?.political?.confidence || 0) * 100), "%"] })] })] }), _jsxs("div", { className: "bias-dimension", children: [_jsx("h4", { children: "Emotional Bias" }), _jsx("div", { className: "emotional-bias-grid", children: Object.entries(analysis.biasAnalysis.scores.emotional || {}).map(([emotion, score]) => {
                                                            if (emotion === 'overall')
                                                                return null;
                                                            const numericScore = typeof score === 'number' ? score : 0;
                                                            return (_jsxs("div", { className: "emotion-item", children: [_jsx("span", { className: "emotion-label", children: emotion.charAt(0).toUpperCase() + emotion.slice(1) }), _jsx("div", { className: "emotion-bar", children: _jsx("div", { className: "emotion-fill", style: {
                                                                                width: `${numericScore}%`,
                                                                                backgroundColor: getEmotionColor(emotion)
                                                                            } }) }), _jsx("span", { className: "emotion-score", children: Math.round(numericScore) })] }, emotion));
                                                        }) })] })] }) })), activeTab === 'credibility' && (_jsx("div", { className: "credibility-tab", children: _jsxs("div", { className: "analysis-section", children: [_jsxs("div", { className: "section-header", children: [_jsx(FiShield, { className: "section-icon" }), _jsx("h3", { children: "Credibility Assessment" }), _jsx("div", { className: "credibility-score-display", children: _jsxs("div", { className: `credibility-score ${(analysis.credibility?.score || 0) > 70 ? 'high' : (analysis.credibility?.score || 0) > 50 ? 'medium' : 'low'}`, children: [Math.round(analysis.credibility?.score || 0), "/100"] }) })] }), _jsxs("div", { className: "credibility-factors", children: [_jsx("h4", { children: "Assessment Factors" }), _jsx("div", { className: "factors-grid", children: Object.entries(analysis.credibility.factors || {}).map(([factor, score]) => {
                                                            const numericScore = typeof score === 'number' ? score : 0;
                                                            return (_jsxs("div", { className: "factor-item", children: [_jsx("span", { className: "factor-label", children: factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }), _jsx("div", { className: "factor-bar", children: _jsx("div", { className: "factor-fill", style: {
                                                                                width: `${numericScore}%`,
                                                                                backgroundColor: numericScore > 70 ? '#28a745' : numericScore > 50 ? '#ffc107' : '#dc3545'
                                                                            } }) }), _jsx("span", { className: "factor-score", children: Math.round(numericScore) })] }, factor));
                                                        }) })] }), analysis.credibility.strengths && analysis.credibility.strengths.length > 0 && (_jsxs("div", { className: "credibility-strengths", children: [_jsx("h4", { children: "Strengths" }), _jsx("ul", { children: analysis.credibility.strengths.map((strength, index) => (_jsxs("li", { className: "strength-item", children: [_jsx(FiCheckCircle, { className: "strength-icon" }), typeof strength === 'string' ? strength : 'Assessment item'] }, index))) })] })), analysis.credibility.warnings && analysis.credibility.warnings.length > 0 && (_jsxs("div", { className: "credibility-warnings", children: [_jsx("h4", { children: "Concerns" }), _jsx("ul", { children: analysis.credibility.warnings.map((warning, index) => (_jsxs("li", { className: "warning-item", children: [_jsx(FiAlertTriangle, { className: "warning-icon" }), typeof warning === 'string' ? warning : 'Assessment item'] }, index))) })] }))] }) })), activeTab === 'readability' && (_jsx("div", { className: "readability-tab", children: _jsxs("div", { className: "analysis-section", children: [_jsxs("div", { className: "section-header", children: [_jsx(FiEye, { className: "section-icon" }), _jsx("h3", { children: "Readability Analysis" }), _jsxs("div", { className: "reading-time", children: [_jsx(FiClock, { className: "time-icon" }), analysis.readability?.readingTime || 0, " min read"] })] }), _jsxs("div", { className: "readability-metrics", children: [_jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Grade Level" }), _jsx("span", { className: "metric-value", children: analysis.readability?.gradeLevel || 'N/A' })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Complexity" }), _jsx("span", { className: `metric-value complexity-${analysis.readability?.complexity || 'moderate'}`, children: (analysis.readability?.complexity || 'moderate').replace(/_/g, ' ') })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Word Count" }), _jsx("span", { className: "metric-value", children: (analysis.readability?.wordCount || 0).toLocaleString() })] })] }), _jsxs("div", { className: "fact-checking-section", children: [_jsx("h4", { children: "Fact-Checking Indicators" }), _jsxs("div", { className: "fact-check-metrics", children: [_jsxs("div", { className: "fact-metric", children: [_jsx("span", { className: "metric-label", children: "Claims Detected" }), _jsx("span", { className: "metric-value", children: analysis.factChecking?.claimsDetected || 0 })] }), _jsxs("div", { className: "fact-metric", children: [_jsx("span", { className: "metric-label", children: "External Links" }), _jsx("span", { className: "metric-value", children: analysis.factChecking?.externalLinksCount || 0 })] }), _jsxs("div", { className: "fact-metric", children: [_jsx("span", { className: "metric-label", children: "Sources Provided" }), _jsx("span", { className: `metric-value ${analysis.factChecking?.sourcesProvided ? 'positive' : 'negative'}`, children: analysis.factChecking?.sourcesProvided ? 'Yes' : 'No' })] })] })] })] }) }))] })] }))] }) }));
};
export default EnhancedArticleAnalysis;
