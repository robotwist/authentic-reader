import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiShield, FiTag, FiTrendingUp, FiRefreshCw, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { articleService } from '../services/articleService';
import AnalysisTooltip from '../components/AnalysisTooltip';
import { processArticleDescription } from '../utils/htmlUtils';
import '../styles/BalancedFeedPage.css';
const BalancedFeedPage = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchArticles = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedArticles = await articleService.getArticles();
            setArticles(fetchedArticles);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load articles');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchArticles();
    }, []);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getCredibilityColor = (level) => {
        switch (level) {
            case 'high': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'low': return '#ef4444';
            default: return '#6b7280';
        }
    };
    const getImpactColor = (impact) => {
        switch (impact) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };
    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '#10b981';
            case 'negative': return '#ef4444';
            case 'neutral': return '#6b7280';
            default: return '#6b7280';
        }
    };
    if (loading) {
        return (_jsx("div", { className: "balanced-feed-page", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { children: "Loading curated articles..." }), _jsx("p", { className: "loading-subtitle", children: "Preparing your personalized reading experience" })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "balanced-feed-page", children: _jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Error Loading Articles" }), _jsx("p", { children: error }), _jsxs("button", { onClick: fetchArticles, className: "retry-button", children: [_jsx(FiRefreshCw, {}), " Try Again"] })] }) }));
    }
    return (_jsxs("div", { className: "balanced-feed-page", children: [_jsx("div", { className: "feed-header", children: _jsxs("div", { className: "header-content", children: [_jsx("h1", { children: "Curated News Feed" }), _jsx("p", { className: "subtitle", children: "High-quality articles with comprehensive AI analysis" }), _jsx("div", { className: "feed-controls", children: _jsxs("button", { onClick: fetchArticles, className: "refresh-button", children: [_jsx(FiRefreshCw, {}), " Refresh"] }) })] }) }), _jsx("div", { className: "articles-container", children: articles.map((article, index) => (_jsxs("article", { className: "article-card", children: [_jsxs("div", { className: "article-header", children: [_jsxs("div", { className: "source-info", children: [_jsx("span", { className: "source-badge", children: article.source }), _jsx("span", { className: "bias-category", children: "Balanced" })] }), _jsx("h2", { className: "article-title", children: _jsx(Link, { to: `/analysis/${article.articleId || index}`, state: { article }, className: "article-link", children: article.title }) }), _jsxs("div", { className: "article-meta", children: [_jsx("span", { className: "article-author", children: typeof article.author === 'string' ? article.author : 'Unknown Author' }), _jsx("span", { className: "article-date", children: formatDate(article.pubDate) })] })] }), _jsx("div", { className: "article-content", children: _jsx("p", { className: "article-description", children: (() => {
                                    const processed = processArticleDescription(article.description || '', 200);
                                    return processed.truncated;
                                })() }) }), article.analysis && (_jsxs("div", { className: "article-analysis", children: [_jsxs("div", { className: "analysis-grid", children: [_jsx(AnalysisTooltip, { title: "Reading Time", explanation: "Estimated time to read this article based on word count and complexity.", icon: _jsx(FiClock, {}), className: "metric-tooltip", children: _jsxs("div", { className: "analysis-item", children: [_jsx(FiClock, { className: "analysis-icon" }), _jsxs("span", { className: "analysis-value", children: [article.analysis.readingTime, " min"] })] }) }), _jsx(AnalysisTooltip, { title: "Credibility Score", explanation: `This article has a ${article.analysis.credibility.level} credibility rating (${Math.round(article.analysis.credibility.score * 100)}%) based on source reputation, fact-checking, citation quality, author expertise, and transparency. ${article.analysis.credibility.reason}`, icon: _jsx(FiShield, {}), className: "credibility-tooltip", children: _jsxs("div", { className: "analysis-item", children: [_jsx(FiShield, { className: "analysis-icon" }), _jsxs("span", { className: "analysis-value credibility-badge", style: { backgroundColor: getCredibilityColor(article.analysis.credibility.level) }, children: [article.analysis.credibility.level, " (", Math.round(article.analysis.credibility.score * 100), "%)"] })] }) }), article.analysis.biasAnalysis && article.analysis.biasAnalysis.direction && (_jsx(AnalysisTooltip, { title: "Enhanced Bias Analysis", explanation: `This article shows ${article.analysis.biasAnalysis.direction} bias with ${Math.round(article.analysis.biasAnalysis.confidence * 100)}% confidence. Overall bias score: ${Math.round(article.analysis.biasAnalysis.enhancedAnalysis.overallBias * 100)}%. ${article.analysis.biasAnalysis.enhancedAnalysis.biasExplanation}`, icon: _jsx(FiTag, {}), className: "bias-tooltip", children: _jsxs("div", { className: "analysis-item", children: [_jsx(FiTag, { className: "analysis-icon" }), _jsxs("span", { className: "analysis-value", children: ["Bias: ", article.analysis.biasAnalysis.direction, " (", Math.round(article.analysis.biasAnalysis.confidence * 100), "%)"] })] }) })), article.analysis.networkAnalysis && article.analysis.networkAnalysis.sentimentAnalysis && (_jsx(AnalysisTooltip, { title: "Sentiment Analysis", explanation: `Overall sentiment: ${article.analysis.networkAnalysis.sentimentAnalysis.overall} (${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.score * 100)}%). Positive: ${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.breakdown.positive * 100)}%, Negative: ${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.breakdown.negative * 100)}%, Neutral: ${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.breakdown.neutral * 100)}%`, icon: _jsx(FiTrendingUp, {}), className: "sentiment-tooltip", children: _jsxs("div", { className: "analysis-item", children: [_jsx(FiTrendingUp, { className: "analysis-icon" }), _jsx("span", { className: "analysis-value sentiment-badge", style: { backgroundColor: getSentimentColor(article.analysis.networkAnalysis.sentimentAnalysis.overall) }, children: article.analysis.networkAnalysis.sentimentAnalysis.overall })] }) }))] }), article.analysis.credibility.factors && (_jsxs("div", { className: "credibility-factors", children: [_jsxs("h4", { className: "factors-title", children: [_jsx(FiShield, { className: "icon" }), "Credibility Factors"] }), _jsxs("div", { className: "factors-grid", children: [_jsxs("div", { className: "factor-item", children: [_jsx("span", { className: "factor-label", children: "Source Reputation" }), _jsx("div", { className: "factor-bar", children: _jsx("div", { className: "factor-fill", style: {
                                                                    width: `${article.analysis.credibility.factors.sourceReputation * 100}%`,
                                                                    backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                                                                } }) }), _jsxs("span", { className: "factor-score", children: [Math.round(article.analysis.credibility.factors.sourceReputation * 100), "%"] })] }), _jsxs("div", { className: "factor-item", children: [_jsx("span", { className: "factor-label", children: "Fact Checking" }), _jsx("div", { className: "factor-bar", children: _jsx("div", { className: "factor-fill", style: {
                                                                    width: `${article.analysis.credibility.factors.factChecking * 100}%`,
                                                                    backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                                                                } }) }), _jsxs("span", { className: "factor-score", children: [Math.round(article.analysis.credibility.factors.factChecking * 100), "%"] })] }), _jsxs("div", { className: "factor-item", children: [_jsx("span", { className: "factor-label", children: "Citation Quality" }), _jsx("div", { className: "factor-bar", children: _jsx("div", { className: "factor-fill", style: {
                                                                    width: `${article.analysis.credibility.factors.citationQuality * 100}%`,
                                                                    backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                                                                } }) }), _jsxs("span", { className: "factor-score", children: [Math.round(article.analysis.credibility.factors.citationQuality * 100), "%"] })] }), _jsxs("div", { className: "factor-item", children: [_jsx("span", { className: "factor-label", children: "Author Expertise" }), _jsx("div", { className: "factor-bar", children: _jsx("div", { className: "factor-fill", style: {
                                                                    width: `${article.analysis.credibility.factors.authorExpertise * 100}%`,
                                                                    backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                                                                } }) }), _jsxs("span", { className: "factor-score", children: [Math.round(article.analysis.credibility.factors.authorExpertise * 100), "%"] })] }), _jsxs("div", { className: "factor-item", children: [_jsx("span", { className: "factor-label", children: "Transparency" }), _jsx("div", { className: "factor-bar", children: _jsx("div", { className: "factor-fill", style: {
                                                                    width: `${article.analysis.credibility.factors.transparency * 100}%`,
                                                                    backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                                                                } }) }), _jsxs("span", { className: "factor-score", children: [Math.round(article.analysis.credibility.factors.transparency * 100), "%"] })] })] })] })), article.analysis.logicalFallacies && article.analysis.logicalFallacies.length > 0 && (_jsxs("div", { className: "fallacies-section", children: [_jsxs("h4", { className: "fallacies-title", children: [_jsx(FiAlertTriangle, { className: "icon" }), "Logical Fallacies Detected (", article.analysis.logicalFallacies.length, ")"] }), _jsx("div", { className: "fallacies-grid", children: article.analysis.logicalFallacies.map((fallacy, idx) => (_jsxs("div", { className: "fallacy-card", children: [_jsxs("div", { className: "fallacy-header", children: [_jsx("span", { className: "fallacy-type", style: { backgroundColor: getImpactColor(fallacy.impact) }, children: fallacy.type }), _jsxs("span", { className: "fallacy-impact", style: { backgroundColor: getImpactColor(fallacy.impact) }, children: [fallacy.impact, " impact"] })] }), _jsx("p", { className: "fallacy-explanation", children: fallacy.explanation }), fallacy.excerpt && (_jsxs("div", { className: "fallacy-excerpt", children: [_jsx("span", { className: "excerpt-label", children: "Example:" }), _jsxs("span", { className: "excerpt-text", children: ["\"", fallacy.excerpt, "\""] })] })), _jsxs("div", { className: "fallacy-confidence", children: [_jsx("span", { className: "confidence-label", children: "Confidence:" }), _jsxs("span", { className: "confidence-score", children: [Math.round(fallacy.confidence * 100), "%"] })] })] }, idx))) })] })), article.analysis.biasAnalysis && article.analysis.biasAnalysis.enhancedAnalysis && (_jsxs("div", { className: "bias-breakdown", children: [_jsxs("h4", { className: "bias-title", children: [_jsx(FiTag, { className: "icon" }), "Bias Analysis Breakdown"] }), _jsxs("div", { className: "bias-grid", children: [_jsxs("div", { className: "bias-item", children: [_jsx("span", { className: "bias-label", children: "Language Bias" }), _jsx("div", { className: "bias-bar", children: _jsx("div", { className: "bias-fill", style: { width: `${article.analysis.biasAnalysis.enhancedAnalysis.languageBias * 100}%` } }) }), _jsxs("span", { className: "bias-score", children: [Math.round(article.analysis.biasAnalysis.enhancedAnalysis.languageBias * 100), "%"] })] }), _jsxs("div", { className: "bias-item", children: [_jsx("span", { className: "bias-label", children: "Framing Bias" }), _jsx("div", { className: "bias-bar", children: _jsx("div", { className: "bias-fill", style: { width: `${article.analysis.biasAnalysis.enhancedAnalysis.framingBias * 100}%` } }) }), _jsxs("span", { className: "bias-score", children: [Math.round(article.analysis.biasAnalysis.enhancedAnalysis.framingBias * 100), "%"] })] }), _jsxs("div", { className: "bias-item", children: [_jsx("span", { className: "bias-label", children: "Source Bias" }), _jsx("div", { className: "bias-bar", children: _jsx("div", { className: "bias-fill", style: { width: `${article.analysis.biasAnalysis.enhancedAnalysis.sourceBias * 100}%` } }) }), _jsxs("span", { className: "bias-score", children: [Math.round(article.analysis.biasAnalysis.enhancedAnalysis.sourceBias * 100), "%"] })] }), _jsxs("div", { className: "bias-item", children: [_jsx("span", { className: "bias-label", children: "Selection Bias" }), _jsx("div", { className: "bias-bar", children: _jsx("div", { className: "bias-fill", style: { width: `${article.analysis.biasAnalysis.enhancedAnalysis.selectionBias * 100}%` } }) }), _jsxs("span", { className: "bias-score", children: [Math.round(article.analysis.biasAnalysis.enhancedAnalysis.selectionBias * 100), "%"] })] })] }), _jsxs("div", { className: "bias-explanation", children: [_jsx(FiInfo, { className: "icon" }), _jsx("span", { children: article.analysis.biasAnalysis.enhancedAnalysis.biasExplanation })] })] })), article.analysis.networkAnalysis && article.analysis.networkAnalysis.topEntities && Array.isArray(article.analysis.networkAnalysis.topEntities) && article.analysis.networkAnalysis.topEntities.length > 0 && (_jsxs("div", { className: "network-snippets", children: [_jsxs("h4", { className: "network-title", children: [_jsx(FiTrendingUp, { className: "icon" }), "Key Topics & Entities"] }), _jsx("div", { className: "entities-grid", children: article.analysis.networkAnalysis.topEntities.slice(0, 4).map((e, idx) => (_jsxs("span", { className: "entity-chip", children: [_jsx("span", { className: "entity-name", children: typeof e.name === 'string' ? e.name : 'Unknown' }), _jsx("span", { className: "entity-type", children: e.type }), _jsxs("span", { className: "entity-count", children: ["(", e.count, ")"] })] }, idx))) }), article.analysis.networkAnalysis.keyTopics && (_jsxs("div", { className: "topics-section", children: [_jsx("span", { className: "topics-label", children: "Key Topics:" }), _jsx("div", { className: "topics-grid", children: article.analysis.networkAnalysis.keyTopics.slice(0, 3).map((topic, idx) => (_jsx("span", { className: "topic-chip", children: topic }, idx))) })] }))] }))] })), _jsxs("div", { className: "article-actions", children: [_jsx(Link, { to: `/analysis/${article.articleId || index}`, state: { article }, className: "analyze-button", children: "Analyze Article" }), _jsx("a", { href: article.link, target: "_blank", rel: "noopener noreferrer", className: "read-original-button", children: "Read Original" })] })] }, article.articleId || index))) }), articles.length === 0 && !loading && (_jsxs("div", { className: "no-articles", children: [_jsx("h2", { children: "No articles found" }), _jsx("p", { children: "Try refreshing the feed." })] }))] }));
};
export default BalancedFeedPage;
