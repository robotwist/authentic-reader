import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { FiShield, FiUsers, FiMessageCircle, FiEye, FiTarget, FiAlertTriangle, FiBookOpen, FiZap } from 'react-icons/fi';
import { intellectualSelfDefenseService } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './CommunityArticleReader.css';
const CommunityArticleReader = ({ article, onBack }) => {
    const [analysis, setAnalysis] = useState(null);
    const [highlights, setHighlights] = useState([]);
    const [selectedHighlight, setSelectedHighlight] = useState(null);
    const [communityDiscussions, setCommunityDiscussions] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [regimeNarrative, setRegimeNarrative] = useState('');
    const [democracyThreats, setDemocracyThreats] = useState([]);
    const [showCommunityPanel, setShowCommunityPanel] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentType, setCommentType] = useState('bias-detection');
    const articleRef = useRef(null);
    useEffect(() => {
        analyzeArticle();
    }, [article]);
    const analyzeArticle = async () => {
        setIsAnalyzing(true);
        setAnalysisProgress(0);
        try {
            // Simulate analysis progress
            const progressInterval = setInterval(() => {
                setAnalysisProgress(prev => Math.min(prev + 10, 90));
            }, 200);
            // Get Chomsky analysis
            const chomskyAnalysis = await intellectualSelfDefenseService.generateChomskyAnalysis(article);
            setAnalysis(chomskyAnalysis);
            // Generate highlights based on analysis
            const generatedHighlights = generateAnalysisHighlights(article.content, chomskyAnalysis);
            setHighlights(generatedHighlights);
            // Extract regime narrative
            const narrative = extractRegimeNarrative(chomskyAnalysis);
            setRegimeNarrative(narrative);
            // Identify democracy threats
            const threats = identifyDemocracyThreats(chomskyAnalysis);
            setDemocracyThreats(threats);
            clearInterval(progressInterval);
            setAnalysisProgress(100);
            logger.info('Article analysis completed', { articleId: article.id, highlightsCount: generatedHighlights.length });
        }
        catch (error) {
            logger.error('Failed to analyze article:', error);
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const generateAnalysisHighlights = (content, analysis) => {
        const highlights = [];
        let highlightId = 0;
        // Analyze loaded language
        analysis.linguisticAnalysis.loadedLanguage.forEach((language, index) => {
            const sentences = content.split(/[.!?]+/);
            sentences.forEach((sentence, sentenceIndex) => {
                if (sentence.toLowerCase().includes(language.toLowerCase().split(' ')[0])) {
                    const startIndex = content.indexOf(sentence);
                    const endIndex = startIndex + sentence.length;
                    highlights.push({
                        id: `loaded-${highlightId++}`,
                        type: 'loaded-language',
                        startIndex,
                        endIndex,
                        text: sentence.trim(),
                        analysis: language,
                        chomskyTechnique: 'Linguistic Analysis - Loaded Language Detection',
                        severity: 'medium'
                    });
                }
            });
        });
        // Analyze power structures
        analysis.structuralAnalysis.powerStructures.forEach((structure, index) => {
            const keywords = ['authority', 'expert', 'official', 'government', 'institution', 'establishment'];
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const startIndex = match.index;
                    const endIndex = startIndex + match[0].length;
                    highlights.push({
                        id: `power-${highlightId++}`,
                        type: 'power-structure',
                        startIndex,
                        endIndex,
                        text: match[0],
                        analysis: structure,
                        chomskyTechnique: 'Structural Analysis - Power Structure Identification',
                        severity: 'high'
                    });
                }
            });
        });
        // Analyze bias indicators
        analysis.linguisticAnalysis.ideologicalAssumptions.forEach((assumption, index) => {
            const biasWords = ['progressive', 'conservative', 'liberal', 'traditional', 'mainstream', 'alternative'];
            biasWords.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const startIndex = match.index;
                    const endIndex = startIndex + match[0].length;
                    highlights.push({
                        id: `bias-${highlightId++}`,
                        type: 'bias',
                        startIndex,
                        endIndex,
                        text: match[0],
                        analysis: assumption,
                        chomskyTechnique: 'Ideological Analysis - Bias Detection',
                        severity: 'medium'
                    });
                }
            });
        });
        return highlights.sort((a, b) => a.startIndex - b.startIndex);
    };
    const extractRegimeNarrative = (analysis) => {
        const narratives = [];
        // Extract from structural analysis
        analysis.structuralAnalysis.manufacturingConsent.forEach(consent => {
            if (consent.includes('consent') || consent.includes('manufacturing')) {
                narratives.push(consent);
            }
        });
        // Extract from critical analysis
        analysis.criticalAnalysis.ideologicalFunction.forEach(function_ => {
            if (function_.includes('ideological') || function_.includes('function')) {
                narratives.push(function_);
            }
        });
        return narratives.join(' ') || 'Analysis suggests potential narrative manipulation through selective framing and institutional bias.';
    };
    const identifyDemocracyThreats = (analysis) => {
        const threats = [];
        // Check for power concentration
        if (analysis.structuralAnalysis.powerStructures.length > 3) {
            threats.push('High concentration of institutional power references suggests potential democratic erosion');
        }
        // Check for consent manufacturing
        if (analysis.structuralAnalysis.manufacturingConsent.length > 2) {
            threats.push('Evidence of consent manufacturing techniques that may undermine democratic participation');
        }
        // Check for alternative perspective suppression
        if (analysis.criticalAnalysis.alternativePerspectives.length < 2) {
            threats.push('Limited alternative perspectives may indicate suppression of democratic discourse');
        }
        return threats;
    };
    const handleHighlightClick = (highlight) => {
        setSelectedHighlight(highlight);
        setShowCommunityPanel(true);
    };
    const addCommunityComment = () => {
        if (!newComment.trim() || !selectedHighlight)
            return;
        const newDiscussion = {
            id: `comment-${Date.now()}`,
            userId: 'current-user', // In real app, get from auth
            userName: 'Community Member', // In real app, get from user profile
            timestamp: new Date().toISOString(),
            highlightId: selectedHighlight.id,
            comment: newComment,
            analysisType: commentType,
            upvotes: 0,
            downvotes: 0
        };
        setCommunityDiscussions(prev => [...prev, newDiscussion]);
        setNewComment('');
        logger.info('Community comment added', { highlightId: selectedHighlight.id, type: commentType });
    };
    const renderHighlightedContent = () => {
        if (!highlights.length)
            return article.content;
        let result = '';
        let lastIndex = 0;
        highlights.forEach(highlight => {
            // Add text before highlight
            result += article.content.slice(lastIndex, highlight.startIndex);
            // Add highlighted text
            const highlightClass = `highlight-${highlight.type} highlight-${highlight.severity}`;
            result += `<span class="${highlightClass}" data-highlight-id="${highlight.id}">${highlight.text}</span>`;
            lastIndex = highlight.endIndex;
        });
        // Add remaining text
        result += article.content.slice(lastIndex);
        return result;
    };
    const getHighlightIcon = (type) => {
        switch (type) {
            case 'bias': return _jsx(FiTarget, { className: "highlight-icon" });
            case 'manipulation': return _jsx(FiAlertTriangle, { className: "highlight-icon" });
            case 'regime-narrative': return _jsx(FiShield, { className: "highlight-icon" });
            case 'power-structure': return _jsx(FiZap, { className: "highlight-icon" });
            case 'loaded-language': return _jsx(FiBookOpen, { className: "highlight-icon" });
            case 'omission': return _jsx(FiEye, { className: "highlight-icon" });
            default: return _jsx(FiTarget, { className: "highlight-icon" });
        }
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#d97706';
            case 'low': return '#65a30d';
            default: return '#6b7280';
        }
    };
    return (_jsxs("div", { className: "community-article-reader", children: [_jsxs("div", { className: "reader-header", children: [_jsxs("div", { className: "header-controls", children: [onBack && (_jsx("button", { className: "back-button", onClick: onBack, children: "\u2190 Back to Course" })), _jsxs("button", { className: `community-toggle ${showCommunityPanel ? 'active' : ''}`, onClick: () => setShowCommunityPanel(!showCommunityPanel), children: [_jsx(FiUsers, {}), "Community Analysis"] })] }), _jsx("h1", { className: "article-title", children: article.title }), _jsxs("div", { className: "article-meta", children: [_jsx("span", { className: "source", children: article.source }), _jsx("span", { className: "published", children: new Date(article.publishedAt).toLocaleDateString() }), _jsx("span", { className: "category", children: article.category })] })] }), isAnalyzing && (_jsxs("div", { className: "analysis-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${analysisProgress}%` } }) }), _jsxs("p", { children: ["Applying Chomsky Analysis Techniques... ", analysisProgress, "%"] })] })), _jsxs("div", { className: "reader-content", children: [_jsx("div", { className: "article-content", children: _jsx("div", { ref: articleRef, className: "article-text", dangerouslySetInnerHTML: { __html: renderHighlightedContent() }, onClick: (e) => {
                                const target = e.target;
                                if (target.classList.contains('highlight-bias') ||
                                    target.classList.contains('highlight-manipulation') ||
                                    target.classList.contains('highlight-regime-narrative') ||
                                    target.classList.contains('highlight-power-structure') ||
                                    target.classList.contains('highlight-loaded-language') ||
                                    target.classList.contains('highlight-omission')) {
                                    const highlightId = target.getAttribute('data-highlight-id');
                                    const highlight = highlights.find(h => h.id === highlightId);
                                    if (highlight) {
                                        handleHighlightClick(highlight);
                                    }
                                }
                            } }) }), showCommunityPanel && (_jsxs("div", { className: "community-panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Community Analysis" }), _jsx("button", { className: "close-panel", onClick: () => setShowCommunityPanel(false), children: "\u00D7" })] }), selectedHighlight && (_jsxs("div", { className: "highlight-analysis", children: [_jsxs("div", { className: "highlight-info", children: [getHighlightIcon(selectedHighlight.type), _jsxs("div", { className: "highlight-details", children: [_jsx("h4", { children: selectedHighlight.chomskyTechnique }), _jsxs("p", { className: "highlight-text", children: ["\"", selectedHighlight.text, "\""] }), _jsx("p", { className: "highlight-analysis-text", children: selectedHighlight.analysis }), _jsxs("div", { className: "severity-indicator", style: { backgroundColor: getSeverityColor(selectedHighlight.severity) }, children: [selectedHighlight.severity.toUpperCase(), " SEVERITY"] })] })] }), _jsxs("div", { className: "community-discussions", children: [_jsx("h4", { children: "Community Insights" }), communityDiscussions
                                                .filter(d => d.highlightId === selectedHighlight.id)
                                                .map(discussion => (_jsxs("div", { className: "discussion-item", children: [_jsxs("div", { className: "discussion-header", children: [_jsx("span", { className: "user-name", children: discussion.userName }), _jsx("span", { className: "discussion-type", children: discussion.analysisType }), _jsx("span", { className: "discussion-time", children: new Date(discussion.timestamp).toLocaleString() })] }), _jsx("p", { className: "discussion-comment", children: discussion.comment }), _jsxs("div", { className: "discussion-votes", children: [_jsxs("button", { className: "vote-button upvote", children: ["\u2191 ", discussion.upvotes] }), _jsxs("button", { className: "vote-button downvote", children: ["\u2193 ", discussion.downvotes] })] })] }, discussion.id)))] }), _jsxs("div", { className: "add-comment", children: [_jsx("h4", { children: "Add Your Analysis" }), _jsxs("select", { value: commentType, onChange: (e) => setCommentType(e.target.value), className: "comment-type-select", children: [_jsx("option", { value: "bias-detection", children: "Bias Detection" }), _jsx("option", { value: "narrative-analysis", children: "Narrative Analysis" }), _jsx("option", { value: "power-structure", children: "Power Structure" }), _jsx("option", { value: "democracy-threat", children: "Democracy Threat" })] }), _jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Share your analysis of this highlighted text...", className: "comment-textarea" }), _jsxs("button", { onClick: addCommunityComment, disabled: !newComment.trim(), className: "add-comment-button", children: [_jsx(FiMessageCircle, {}), "Add Analysis"] })] })] }))] }))] }), analysis && (_jsxs("div", { className: "analysis-summary", children: [_jsx("h3", { children: "Intellectual Self-Defense Analysis" }), _jsxs("div", { className: "summary-section", children: [_jsx("h4", { children: "Regime Narrative Detected" }), _jsx("p", { className: "regime-narrative", children: regimeNarrative })] }), democracyThreats.length > 0 && (_jsxs("div", { className: "summary-section", children: [_jsx("h4", { children: "Democracy Threats Identified" }), _jsx("ul", { className: "democracy-threats", children: democracyThreats.map((threat, index) => (_jsx("li", { children: threat }, index))) })] })), _jsxs("div", { className: "summary-section", children: [_jsx("h4", { children: "Analysis Highlights" }), _jsxs("div", { className: "highlight-stats", children: [_jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-number", children: highlights.filter(h => h.type === 'bias').length }), _jsx("span", { className: "stat-label", children: "Bias Indicators" })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-number", children: highlights.filter(h => h.type === 'power-structure').length }), _jsx("span", { className: "stat-label", children: "Power Structures" })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-number", children: highlights.filter(h => h.type === 'loaded-language').length }), _jsx("span", { className: "stat-label", children: "Loaded Language" })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-number", children: highlights.filter(h => h.severity === 'critical').length }), _jsx("span", { className: "stat-label", children: "Critical Issues" })] })] })] })] }))] }));
};
export default CommunityArticleReader;
