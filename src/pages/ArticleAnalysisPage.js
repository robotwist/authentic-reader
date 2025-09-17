import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { aiAnalysisService } from '../services/aiAnalysisService';
import { getArticleById } from '../services/articleService';
import { logger } from '../utils/logger';
import '../styles/ArticleAnalysisPage.css';
const ArticleAnalysisPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [enhancedAnalysis, setEnhancedAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serviceStatus, setServiceStatus] = useState(null);
    useEffect(() => {
        if (id) {
            loadArticle();
            initializeService();
        }
    }, [id]);
    const initializeService = async () => {
        try {
            await aiAnalysisService.initialize();
            const status = aiAnalysisService.getServiceStatus();
            setServiceStatus(status);
            logger.info('AI Analysis Service initialized:', status);
        }
        catch (error) {
            logger.error('Failed to initialize AI service:', error);
        }
    };
    const loadArticle = async () => {
        try {
            const articleData = getArticleById(id);
            if (articleData) {
                setArticle(articleData);
                if (articleData.analysis) {
                    setEnhancedAnalysis(articleData.analysis);
                }
            }
            else {
                setError('Article not found');
            }
        }
        catch (error) {
            setError('Failed to load article');
            logger.error('Error loading article:', error);
        }
    };
    const performEnhancedAnalysis = async () => {
        if (!article)
            return;
        setLoading(true);
        setError(null);
        try {
            logger.info('Starting enhanced analysis with AI service');
            // Perform all analyses in parallel
            const [biasResult, sentimentResult, entityResult, credibilityResult] = await Promise.allSettled([
                aiAnalysisService.analyzeBias(article.content),
                aiAnalysisService.analyzeSentiment(article.content),
                aiAnalysisService.extractEntities(article.content),
                aiAnalysisService.analyzeCredibility(article.content)
            ]);
            // Generate logical fallacies and rhetorical devices
            const logicalFallacies = generateLogicalFallacies(article.content);
            const rhetoricalDevices = generateRhetoricalAnalysis(article.content);
            const analysis = {
                biasAnalysis: biasResult.status === 'fulfilled' ? biasResult.value : null,
                sentimentAnalysis: sentimentResult.status === 'fulfilled' ? sentimentResult.value : null,
                entityAnalysis: entityResult.status === 'fulfilled' ? entityResult.value : null,
                credibilityAnalysis: credibilityResult.status === 'fulfilled' ? credibilityResult.value : null,
                logicalFallacies,
                rhetoricalDevices
            };
            setEnhancedAnalysis(analysis);
            logger.info('Enhanced analysis completed successfully');
        }
        catch (error) {
            setError('Analysis failed. Please try again.');
            logger.error('Enhanced analysis failed:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const generateLogicalFallacies = (text) => {
        // Enhanced logical fallacy detection with more comprehensive analysis
        const fallacies = [];
        const lowerText = text.toLowerCase();
        // Check for common logical fallacies with more sophisticated detection
        if (lowerText.includes('experts say') || lowerText.includes('authorities agree') || lowerText.includes('scientists confirm')) {
            fallacies.push({
                type: 'Appeal to Authority',
                explanation: 'The text relies on authority figures rather than presenting concrete evidence or logical arguments. This can be problematic when the authority is not relevant to the specific claim being made.',
                excerpt: text.substring(Math.max(0, lowerText.indexOf('experts say') - 50), Math.min(text.length, lowerText.indexOf('experts say') + 100)) + '...',
                confidence: 85,
                impact: 'medium'
            });
        }
        if (lowerText.includes('either') && lowerText.includes('or') && (lowerText.includes('choice') || lowerText.includes('option'))) {
            fallacies.push({
                type: 'False Dichotomy',
                explanation: 'The text presents a situation as having only two possible outcomes or choices, when in reality there are more nuanced options available. This oversimplifies complex issues.',
                excerpt: text.substring(Math.max(0, lowerText.indexOf('either') - 50), Math.min(text.length, lowerText.indexOf('either') + 150)) + '...',
                confidence: 80,
                impact: 'high'
            });
        }
        if (lowerText.includes('everyone knows') || lowerText.includes('obviously') || lowerText.includes('clearly')) {
            fallacies.push({
                type: 'Appeal to Common Belief',
                explanation: 'The text assumes something is true because many people believe it, without providing evidence. This is a form of argumentum ad populum.',
                excerpt: text.substring(Math.max(0, lowerText.indexOf('everyone knows') - 50), Math.min(text.length, lowerText.indexOf('everyone knows') + 100)) + '...',
                confidence: 75,
                impact: 'medium'
            });
        }
        if (lowerText.includes('slippery slope') || (lowerText.includes('if we') && lowerText.includes('then') && lowerText.includes('next'))) {
            fallacies.push({
                type: 'Slippery Slope',
                explanation: 'The text suggests that a relatively small first step will inevitably lead to a chain of related events culminating in some significant impact, without demonstrating the causal connections.',
                excerpt: text.substring(Math.max(0, lowerText.indexOf('if we') - 50), Math.min(text.length, lowerText.indexOf('if we') + 200)) + '...',
                confidence: 70,
                impact: 'high'
            });
        }
        if (lowerText.includes('correlation') && lowerText.includes('causation')) {
            fallacies.push({
                type: 'Correlation vs Causation',
                explanation: 'The text may be confusing correlation with causation, suggesting that because two things happen together, one causes the other.',
                excerpt: text.substring(Math.max(0, lowerText.indexOf('correlation') - 50), Math.min(text.length, lowerText.indexOf('correlation') + 100)) + '...',
                confidence: 65,
                impact: 'medium'
            });
        }
        return fallacies;
    };
    const generateRhetoricalAnalysis = (text) => {
        // Enhanced rhetorical device detection with more comprehensive analysis
        const devices = [];
        const lowerText = text.toLowerCase();
        // Check for metaphors and analogies
        if (lowerText.includes('like') || lowerText.includes('as') || lowerText.includes('similar to')) {
            devices.push({
                type: 'Simile',
                explanation: 'The text uses explicit comparisons using "like," "as," or "similar to" to make abstract concepts more concrete and relatable.',
                examples: [text.substring(Math.max(0, lowerText.indexOf('like') - 30), Math.min(text.length, lowerText.indexOf('like') + 50))],
                frequency: (lowerText.match(/like|as|similar to/g) || []).length
            });
        }
        // Check for hyperbole and exaggeration
        if (lowerText.includes('never') || lowerText.includes('always') || lowerText.includes('everyone') || lowerText.includes('nobody') || lowerText.includes('worst') || lowerText.includes('best')) {
            devices.push({
                type: 'Hyperbole',
                explanation: 'The text uses deliberate exaggeration for emphasis or dramatic effect, often using absolute terms that may not be literally true.',
                examples: [text.substring(Math.max(0, lowerText.indexOf('never') - 30), Math.min(text.length, lowerText.indexOf('never') + 50))],
                frequency: (lowerText.match(/never|always|everyone|nobody|worst|best/g) || []).length
            });
        }
        // Check for loaded language and emotional appeals
        if (lowerText.includes('shocking') || lowerText.includes('outrageous') || lowerText.includes('amazing') || lowerText.includes('incredible') || lowerText.includes('terrible')) {
            devices.push({
                type: 'Loaded Language',
                explanation: 'The text uses emotionally charged words designed to evoke strong emotional responses from readers, potentially influencing their perception of the topic.',
                examples: [text.substring(Math.max(0, lowerText.indexOf('shocking') - 30), Math.min(text.length, lowerText.indexOf('shocking') + 50))],
                frequency: (lowerText.match(/shocking|outrageous|amazing|incredible|terrible/g) || []).length
            });
        }
        // Check for inclusive language
        if (lowerText.includes('we') || lowerText.includes('us') || lowerText.includes('our') || lowerText.includes('together')) {
            devices.push({
                type: 'Inclusive Language',
                explanation: 'The text uses "we," "us," and "our" to create a sense of shared identity and community, potentially building rapport with readers.',
                examples: [text.substring(Math.max(0, lowerText.indexOf('we ') - 30), Math.min(text.length, lowerText.indexOf('we ') + 50))],
                frequency: (lowerText.match(/we |us |our |together/g) || []).length
            });
        }
        // Check for rhetorical questions
        if (lowerText.includes('?') && (lowerText.includes('how') || lowerText.includes('why') || lowerText.includes('what'))) {
            devices.push({
                type: 'Rhetorical Questions',
                explanation: 'The text poses questions that are not meant to be answered literally, but rather to make a point or encourage readers to think about an issue.',
                examples: [text.substring(Math.max(0, lowerText.indexOf('?') - 50), Math.min(text.length, lowerText.indexOf('?') + 10))],
                frequency: (lowerText.match(/\?/g) || []).length
            });
        }
        // Check for repetition and emphasis
        const repeatedWords = lowerText.match(/\b(\w+)\b/g)?.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        if (repeatedWords) {
            const mostRepeated = Object.entries(repeatedWords)
                .filter(([word, count]) => count > 3 && word.length > 3)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);
            if (mostRepeated.length > 0) {
                devices.push({
                    type: 'Repetition',
                    explanation: 'The text uses deliberate repetition of key words or phrases to emphasize important points and make them more memorable.',
                    examples: mostRepeated.map(([word]) => `"${word}" (repeated ${repeatedWords[word]} times)`),
                    frequency: mostRepeated.reduce((sum, [, count]) => sum + count, 0)
                });
            }
        }
        return devices;
    };
    const getServiceStatusDisplay = () => {
        if (!serviceStatus)
            return null;
        const statusClass = serviceStatus.hasLlama ? 'status-available' : 'status-unavailable';
        const statusText = serviceStatus.hasLlama ? 'Llama 3.2 AI Service' : 'Local Fallback Analysis';
        const statusIcon = serviceStatus.hasLlama ?
            _jsx(FiCheckCircle, { className: "status-icon" }) :
            _jsx(FiAlertTriangle, { className: "status-icon" });
        return (_jsx("div", { className: "service-status-indicator", children: _jsxs("div", { className: statusClass, children: [statusIcon, _jsx("span", { children: statusText })] }) }));
    };
    if (error) {
        return (_jsx("div", { className: "analysis-page", children: _jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Error" }), _jsx("p", { children: error }), _jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Home"] })] }) }));
    }
    if (!article) {
        return (_jsx("div", { className: "analysis-page", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { children: "Loading article..." })] }) }));
    }
    return (_jsxs("div", { className: "analysis-page", children: [_jsxs("div", { className: "analysis-header", children: [_jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Feed"] }), _jsx("h1", { children: "Article Analysis" }), _jsxs("button", { onClick: performEnhancedAnalysis, disabled: loading, className: "analyze-button", children: [loading ? _jsx(FiRefreshCw, { className: "spinning" }) : _jsx(FiRefreshCw, {}), loading ? 'Analyzing...' : 'Re-analyze'] })] }), getServiceStatusDisplay(), _jsxs("div", { className: "article-info", children: [_jsx("h2", { children: article.title }), _jsxs("div", { className: "article-meta", children: [_jsx("span", { className: "source", children: article.source }), _jsx("span", { className: "date", children: new Date(article.publishedAt).toLocaleDateString() }), _jsx("a", { href: article.url, target: "_blank", rel: "noopener noreferrer", className: "original-link", children: "Read Original" })] })] }), _jsx("div", { className: "article-content", children: _jsx("p", { children: article.content }) }), enhancedAnalysis && (_jsxs("div", { className: "analysis-results", children: [enhancedAnalysis.credibilityAnalysis && (_jsxs("div", { className: "analysis-section", children: [_jsx("div", { className: "section-header", children: _jsxs("div", { className: "section-title", children: [_jsx(FiCheckCircle, { className: "section-icon" }), _jsx("h3", { children: "Credibility Assessment" })] }) }), _jsx("div", { className: "section-content", children: _jsxs("div", { className: "credibility-score", children: [_jsx("div", { className: "score-circle", children: _jsxs("div", { className: "score-text", children: [enhancedAnalysis.credibilityAnalysis.credibilityScore || 75, "%"] }) }), _jsxs("div", { className: "score-details", children: [_jsx("h4", { children: "Overall Credibility" }), _jsx("p", { className: "credibility-reason", children: enhancedAnalysis.credibilityAnalysis.explanation || 'Analysis of source reliability and fact-checking quality.' })] })] }) })] })), enhancedAnalysis.biasAnalysis && (_jsxs("div", { className: "analysis-section", children: [_jsx("div", { className: "section-header", children: _jsxs("div", { className: "section-title", children: [_jsx(FiAlertTriangle, { className: "section-icon" }), _jsx("h3", { children: "Bias Analysis" })] }) }), _jsx("div", { className: "section-content", children: _jsxs("div", { className: "bias-breakdown", children: [_jsxs("div", { className: "bias-dimension", children: [_jsx("span", { className: "dimension-label", children: "Overall Bias" }), _jsx("div", { className: "bias-bar", children: _jsx("div", { className: "bias-fill", style: { width: `${enhancedAnalysis.biasAnalysis.biasScore || 30}%` } }) }), _jsxs("span", { className: "bias-score", children: [enhancedAnalysis.biasAnalysis.biasScore || 30, "%"] })] }), enhancedAnalysis.biasAnalysis.biasTypes && (_jsxs("div", { className: "bias-phrases", children: [_jsx("h4", { children: "Detected Bias Types" }), _jsx("div", { className: "phrases-list", children: enhancedAnalysis.biasAnalysis.biasTypes.map((type, index) => (_jsx("span", { className: "bias-phrase", children: type }, index))) })] })), enhancedAnalysis.biasAnalysis.explanation && (_jsx("p", { className: "bias-explanation", children: enhancedAnalysis.biasAnalysis.explanation }))] }) })] })), enhancedAnalysis.logicalFallacies && enhancedAnalysis.logicalFallacies.length > 0 && (_jsxs("div", { className: "analysis-section", children: [_jsx("div", { className: "section-header", children: _jsxs("div", { className: "section-title", children: [_jsx(FiInfo, { className: "section-icon" }), _jsxs("h3", { children: ["Logical Fallacies ", _jsx("span", { className: "fallacy-count", children: enhancedAnalysis.logicalFallacies.length })] })] }) }), _jsx("div", { className: "section-content", children: _jsx("div", { className: "fallacies-list", children: enhancedAnalysis.logicalFallacies.map((fallacy, index) => (_jsxs("div", { className: "fallacy-item", children: [_jsxs("div", { className: "fallacy-header", children: [_jsx("span", { className: "fallacy-type", children: fallacy.type }), _jsxs("span", { className: `fallacy-severity ${fallacy.impact}`, children: [fallacy.impact, " impact"] })] }), _jsx("p", { children: fallacy.explanation }), _jsxs("div", { className: "fallacy-examples", children: [_jsx("span", { className: "excerpt-label", children: "Example:" }), _jsx("span", { className: "excerpt-text", children: fallacy.excerpt })] }), _jsxs("div", { className: "fallacy-confidence", children: [_jsx("span", { className: "confidence-label", children: "Confidence:" }), _jsxs("span", { className: "confidence-score", children: [fallacy.confidence, "%"] })] })] }, index))) }) })] })), enhancedAnalysis.rhetoricalDevices && enhancedAnalysis.rhetoricalDevices.length > 0 && (_jsxs("div", { className: "analysis-section", children: [_jsx("div", { className: "section-header", children: _jsxs("div", { className: "section-title", children: [_jsx(FiInfo, { className: "section-icon" }), _jsxs("h3", { children: ["Rhetorical Devices ", _jsx("span", { className: "device-count", children: enhancedAnalysis.rhetoricalDevices.length })] })] }) }), _jsx("div", { className: "section-content", children: _jsx("div", { className: "devices-list", children: enhancedAnalysis.rhetoricalDevices.map((device, index) => (_jsxs("div", { className: "device-item", children: [_jsxs("div", { className: "device-header", children: [_jsx("span", { className: "device-type", children: device.type }), _jsxs("span", { className: "device-frequency", children: ["Used ", device.frequency, " times"] })] }), _jsx("p", { children: device.explanation }), device.examples && (_jsxs("div", { className: "device-examples", children: [_jsx("span", { className: "examples-label", children: "Examples:" }), _jsx("ul", { children: device.examples.map((example, i) => (_jsx("li", { children: example }, i))) })] }))] }, index))) }) })] })), enhancedAnalysis.entityAnalysis && (_jsxs("div", { className: "analysis-section", children: [_jsx("div", { className: "section-header", children: _jsxs("div", { className: "section-title", children: [_jsx(FiInfo, { className: "section-icon" }), _jsx("h3", { children: "Key Entities & Topics" })] }) }), _jsx("div", { className: "section-content", children: _jsxs("div", { className: "network-snippets", children: [enhancedAnalysis.entityAnalysis.entities && (_jsxs("div", { className: "entities-grid", children: [_jsx("h4", { children: "Named Entities" }), _jsx("div", { className: "entities-list", children: enhancedAnalysis.entityAnalysis.entities.slice(0, 10).map((entity, index) => (_jsxs("span", { className: "entity-chip", children: [_jsx("span", { className: "entity-name", children: entity.text }), _jsx("span", { className: "entity-type", children: entity.type })] }, index))) })] })), enhancedAnalysis.entityAnalysis.keyTopics && (_jsxs("div", { className: "topics-section", children: [_jsx("h4", { children: "Key Topics" }), _jsx("div", { className: "topics-grid", children: enhancedAnalysis.entityAnalysis.keyTopics.map((topic, index) => (_jsx("span", { className: "topic-chip", children: topic }, index))) })] }))] }) })] }))] })), !enhancedAnalysis && !loading && (_jsx("div", { className: "analysis-actions", children: article && article.content.length < 300 ? (_jsxs("div", { className: "short-content-warning", children: [_jsx(FiAlertTriangle, { className: "warning-icon" }), _jsxs("p", { children: ["This article is quite short (", article.content.length, " characters). For the best analysis results, we recommend articles with at least 50 words (300 characters)."] }), _jsxs("button", { onClick: performEnhancedAnalysis, className: "analyze-button", children: [_jsx(FiRefreshCw, {}), " Analyze Anyway"] })] })) : (_jsxs("button", { onClick: performEnhancedAnalysis, className: "analyze-button", children: [_jsx(FiRefreshCw, {}), " Start AI Analysis"] })) }))] }));
};
export default ArticleAnalysisPage;
