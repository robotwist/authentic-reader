import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiShield, FiAlertTriangle, FiCheckCircle, FiBarChart2, FiTarget, FiUsers, FiStar, FiInfo } from 'react-icons/fi';
import { sourceCredibilityService } from '../services/sourceCredibilityService';
import '../styles/SourceCredibilityDashboard.css';
const SourceCredibilityDashboard = ({ sourceId, onSourceSelect }) => {
    const [selectedSource, setSelectedSource] = useState(null);
    const [trendingSources, setTrendingSources] = useState({ improving: [], declining: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (sourceId) {
            loadSourceCredibility(sourceId);
        }
        loadTrendingSources();
    }, [sourceId]);
    const loadSourceCredibility = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const credibility = await sourceCredibilityService.getSourceCredibility(id);
            setSelectedSource(credibility);
        }
        catch (err) {
            setError('Failed to load source credibility data');
            console.error('Error loading source credibility:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const loadTrendingSources = async () => {
        try {
            const trends = await sourceCredibilityService.getTrendingSources();
            setTrendingSources(trends);
        }
        catch (err) {
            console.error('Error loading trending sources:', err);
        }
    };
    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 0.8)
            return '#10b981';
        if (accuracy >= 0.6)
            return '#f59e0b';
        return '#ef4444';
    };
    const getTrustScoreColor = (score) => {
        if (score >= 80)
            return '#10b981';
        if (score >= 60)
            return '#f59e0b';
        return '#ef4444';
    };
    const getBiasColor = (bias) => {
        if (bias < -0.5)
            return '#dc2626'; // Far left
        if (bias < -0.1)
            return '#ef4444'; // Left
        if (bias > 0.5)
            return '#7c3aed'; // Far right
        if (bias > 0.1)
            return '#8b5cf6'; // Right
        return '#3b82f6'; // Center
    };
    const formatPercentage = (value) => {
        return `${(value * 100).toFixed(1)}%`;
    };
    if (loading) {
        return (_jsx("div", { className: "source-credibility-dashboard", children: _jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "loader-spinner" }), _jsx("p", { children: "Loading source credibility data..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "source-credibility-dashboard", children: _jsxs("div", { className: "error-state", children: [_jsx(FiAlertTriangle, { className: "error-icon" }), _jsx("h3", { children: "Error Loading Data" }), _jsx("p", { children: error }), _jsx("button", { onClick: () => sourceId && loadSourceCredibility(sourceId), children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "source-credibility-dashboard", children: [_jsxs("div", { className: "dashboard-header", children: [_jsxs("h2", { children: [_jsx(FiShield, { className: "header-icon" }), "Source Credibility Analysis"] }), _jsx("p", { children: "Comprehensive analysis of news source reliability and accuracy" })] }), _jsxs("div", { className: "trending-sources-section", children: [_jsxs("h3", { children: [_jsx(FiTrendingUp, { className: "section-icon" }), "Trending Sources"] }), _jsxs("div", { className: "trending-grid", children: [_jsxs("div", { className: "trending-column", children: [_jsxs("h4", { children: [_jsx(FiTrendingUp, { className: "trend-icon improving" }), "Improving Credibility"] }), trendingSources.improving.length > 0 ? (_jsx("div", { className: "trending-list", children: trendingSources.improving.map((source, index) => (_jsxs("div", { className: "trending-item improving", children: [_jsxs("div", { className: "trending-info", children: [_jsx("span", { className: "source-name", children: source.sourceName }), _jsxs("span", { className: "improvement", children: ["+", (source.improvement * 100).toFixed(1), "%"] })] }), _jsx("div", { className: "trending-bar", children: _jsx("div", { className: "trending-fill improving", style: { width: `${Math.min(source.improvement * 500, 100)}%` } }) })] }, source.sourceId))) })) : (_jsx("p", { className: "no-data", children: "No sources showing significant improvement" }))] }), _jsxs("div", { className: "trending-column", children: [_jsxs("h4", { children: [_jsx(FiTrendingDown, { className: "trend-icon declining" }), "Declining Credibility"] }), trendingSources.declining.length > 0 ? (_jsx("div", { className: "trending-list", children: trendingSources.declining.map((source, index) => (_jsxs("div", { className: "trending-item declining", children: [_jsxs("div", { className: "trending-info", children: [_jsx("span", { className: "source-name", children: source.sourceName }), _jsxs("span", { className: "decline", children: ["-", (source.decline * 100).toFixed(1), "%"] })] }), _jsx("div", { className: "trending-bar", children: _jsx("div", { className: "trending-fill declining", style: { width: `${Math.min(source.decline * 500, 100)}%` } }) })] }, source.sourceId))) })) : (_jsx("p", { className: "no-data", children: "No sources showing significant decline" }))] })] })] }), selectedSource && (_jsxs("div", { className: "source-analysis-section", children: [_jsxs("h3", { children: [_jsx(FiTarget, { className: "section-icon" }), selectedSource.sourceName, " - Credibility Analysis"] }), _jsxs("div", { className: "analysis-grid", children: [_jsxs("div", { className: "analysis-card", children: [_jsxs("div", { className: "card-header", children: [_jsx(FiBarChart2, { className: "card-icon" }), _jsx("h4", { children: "Historical Accuracy" })] }), _jsxs("div", { className: "accuracy-metrics", children: [_jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Overall Accuracy" }), _jsx("span", { className: "metric-value", style: { color: getAccuracyColor(selectedSource.historicalAccuracy.overall) }, children: formatPercentage(selectedSource.historicalAccuracy.overall) })] }), _jsxs("div", { className: "timeframe-accuracy", children: [_jsxs("div", { className: "timeframe-item", children: [_jsx("span", { children: "30 Days" }), _jsx("span", { children: formatPercentage(selectedSource.historicalAccuracy.byTimeframe.last30Days) })] }), _jsxs("div", { className: "timeframe-item", children: [_jsx("span", { children: "90 Days" }), _jsx("span", { children: formatPercentage(selectedSource.historicalAccuracy.byTimeframe.last90Days) })] }), _jsxs("div", { className: "timeframe-item", children: [_jsx("span", { children: "1 Year" }), _jsx("span", { children: formatPercentage(selectedSource.historicalAccuracy.byTimeframe.lastYear) })] })] })] })] }), _jsxs("div", { className: "analysis-card", children: [_jsxs("div", { className: "card-header", children: [_jsx(FiStar, { className: "card-icon" }), _jsx("h4", { children: "Source Reputation" })] }), _jsxs("div", { className: "reputation-metrics", children: [_jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Trust Score" }), _jsxs("span", { className: "metric-value", style: { color: getTrustScoreColor(selectedSource.sourceReputation.trustScore) }, children: [selectedSource.sourceReputation.trustScore, "/100"] })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Reliability Level" }), _jsx("span", { className: `reliability-badge ${selectedSource.sourceReputation.reliabilityLevel}`, children: selectedSource.sourceReputation.reliabilityLevel })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Verification Speed" }), _jsx("span", { children: formatPercentage(selectedSource.sourceReputation.verificationSpeed) })] })] })] }), _jsxs("div", { className: "analysis-card", children: [_jsxs("div", { className: "card-header", children: [_jsx(FiTarget, { className: "card-icon" }), _jsx("h4", { children: "Bias Analysis" })] }), _jsxs("div", { className: "bias-metrics", children: [_jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Political Bias" }), _jsx("span", { className: "metric-value", style: { color: getBiasColor(selectedSource.biasAnalysis.politicalBias) }, children: selectedSource.biasAnalysis.politicalBias > 0.3 ? 'Right' :
                                                            selectedSource.biasAnalysis.politicalBias < -0.3 ? 'Left' : 'Center' })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Bias Consistency" }), _jsx("span", { children: formatPercentage(selectedSource.biasAnalysis.biasConsistency) })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Bias Trend" }), _jsx("span", { className: `trend-badge ${selectedSource.biasAnalysis.biasTrend}`, children: selectedSource.biasAnalysis.biasTrend })] })] })] }), _jsxs("div", { className: "analysis-card", children: [_jsxs("div", { className: "card-header", children: [_jsx(FiCheckCircle, { className: "card-icon" }), _jsx("h4", { children: "Fact Check Record" })] }), _jsxs("div", { className: "fact-check-metrics", children: [_jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Total Checks" }), _jsx("span", { children: selectedSource.factCheckRecord.totalChecks })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Verified Claims" }), _jsx("span", { className: "verified", children: selectedSource.factCheckRecord.verified })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "Disputed Claims" }), _jsx("span", { className: "disputed", children: selectedSource.factCheckRecord.disputed })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { className: "metric-label", children: "False Claims" }), _jsx("span", { className: "false", children: selectedSource.factCheckRecord.false })] })] })] })] }), _jsxs("div", { className: "recommendations-section", children: [_jsxs("h4", { children: [_jsx(FiInfo, { className: "section-icon" }), "Analysis & Recommendations"] }), _jsxs("div", { className: "recommendations-content", children: [_jsx("div", { className: "overall-assessment", children: _jsx("p", { className: "assessment-text", children: selectedSource.recommendations.overall }) }), _jsxs("div", { className: "recommendations-grid", children: [selectedSource.recommendations.strengths.length > 0 && (_jsxs("div", { className: "recommendation-group strengths", children: [_jsx("h5", { children: "Strengths" }), _jsx("ul", { children: selectedSource.recommendations.strengths.map((strength, index) => (_jsx("li", { children: strength }, index))) })] })), selectedSource.recommendations.weaknesses.length > 0 && (_jsxs("div", { className: "recommendation-group weaknesses", children: [_jsx("h5", { children: "Areas of Concern" }), _jsx("ul", { children: selectedSource.recommendations.weaknesses.map((weakness, index) => (_jsx("li", { children: weakness }, index))) })] })), selectedSource.recommendations.improvementSuggestions.length > 0 && (_jsxs("div", { className: "recommendation-group suggestions", children: [_jsx("h5", { children: "Improvement Suggestions" }), _jsx("ul", { children: selectedSource.recommendations.improvementSuggestions.map((suggestion, index) => (_jsx("li", { children: suggestion }, index))) })] }))] })] })] })] })), !selectedSource && (_jsxs("div", { className: "source-selection-section", children: [_jsxs("h3", { children: [_jsx(FiUsers, { className: "section-icon" }), "Select a Source for Analysis"] }), _jsx("p", { children: "Choose a news source from the trending lists above or enter a source ID to analyze its credibility." })] }))] }));
};
export default SourceCredibilityDashboard;
