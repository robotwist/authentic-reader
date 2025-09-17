import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed React Icons import - using text-based indicators instead
import { intellectualSelfDefenseService } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './IntellectualSelfDefense.css';
const IntellectualSelfDefense = ({ onArticleSelect }) => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState(null);
    useEffect(() => {
        loadTodaysArticles();
    }, []);
    const loadTodaysArticles = async () => {
        try {
            setLoading(true);
            logger.info('Loading today\'s intellectual self defense course...');
            console.log('Loading today\'s intellectual self defense course...');
            const todaysArticles = await intellectualSelfDefenseService.getTodaysArticles();
            console.log('Articles received from service:', {
                count: todaysArticles?.length || 0,
                articles: todaysArticles?.map(a => ({ id: a.id, title: a.title })) || []
            });
            logger.info('Articles received from service:', {
                count: todaysArticles?.length || 0,
                articles: todaysArticles?.map(a => ({ id: a.id, title: a.title })) || []
            });
            if (todaysArticles && todaysArticles.length > 0) {
                setArticles(todaysArticles);
                console.log(`Successfully loaded ${todaysArticles.length} articles for deep analysis`);
                logger.info(`Successfully loaded ${todaysArticles.length} articles for deep analysis`);
            }
            else {
                console.warn('No articles loaded - this may indicate a service issue');
                logger.warn('No articles loaded - this may indicate a service issue');
                // Set empty array to prevent errors
                setArticles([]);
            }
        }
        catch (error) {
            console.error('Failed to load intellectual self defense course:', error);
            logger.error('Failed to load intellectual self defense course:', error);
            // Set empty array to prevent errors
            setArticles([]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleArticleSelect = (article) => {
        console.log('Article selected:', article);
        console.log('Article ID:', article.id);
        const encodedId = encodeURIComponent(article.id);
        console.log('Navigating to:', `/article/${encodedId}`);
        setSelectedArticle(article);
        if (onArticleSelect) {
            onArticleSelect(article);
        }
        // Navigate to the article reader page
        navigate(`/article/${encodedId}`);
    };
    const getImportanceColor = (importance) => {
        switch (importance) {
            case 'critical': return '#ff4757';
            case 'significant': return '#ffa502';
            case 'notable': return '#2ed573';
            default: return '#747d8c';
        }
    };
    const getImportanceText = (importance) => {
        switch (importance) {
            case 'critical': return 'CRITICAL';
            case 'significant': return 'SIGNIFICANT';
            case 'notable': return 'NOTABLE';
            default: return 'STANDARD';
        }
    };
    const getComplexityColor = (level) => {
        switch (level) {
            case 'profound': return '#8e44ad';
            case 'deep': return '#3498db';
            case 'intermediate': return '#f39c12';
            case 'surface': return '#95a5a6';
            default: return '#95a5a6';
        }
    };
    if (loading) {
        return (_jsx("div", { className: "daily-deep-dive", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("h3", { children: "Preparing Your Intellectual Self Defense Course" }), _jsx("p", { children: "Curating high-quality articles for critical thinking training" })] }) }));
    }
    if (articles.length === 0) {
        return (_jsx("div", { className: "daily-deep-dive", children: _jsxs("div", { className: "error-container", children: [_jsx("div", { className: "error-text", children: "WARNING" }), _jsx("h2", { children: "Course Temporarily Unavailable" }), _jsx("p", { children: "We are having trouble loading today's articles. This could be due to:" }), _jsxs("ul", { children: [_jsx("li", { children: "Network connectivity issues" }), _jsx("li", { children: "Backend service maintenance" }), _jsx("li", { children: "Analysis service temporarily unavailable" })] }), _jsx("button", { className: "retry-button", onClick: loadTodaysArticles, children: "Try Again" }), _jsxs("p", { className: "fallback-info", children: ["In the meantime, you can explore our ", _jsx("a", { href: "/forces-for-good", children: "Forces for Good" }), " section or use the search feature to find other content."] })] }) }));
    }
    return (_jsxs("div", { className: "daily-deep-dive", children: [_jsxs("div", { className: "deep-dive-header", children: [_jsx("h1", { children: "Intellectual Self Defense Course" }), _jsx("p", { className: "subtitle", children: "Your daily training in critical thinking and media literacy" }), _jsxs("div", { className: "header-stats", children: [_jsxs("span", { className: "stat", children: [articles.length, " Articles"] }), _jsx("span", { className: "stat", children: "Expert Analysis" }), _jsx("span", { className: "stat", children: "Critical Thinking" })] })] }), _jsxs("div", { className: "deep-dive-content", children: [_jsx("div", { className: "articles-grid", children: articles.map((article) => (_jsxs("div", { className: `article-card ${selectedArticle?.id === article.id ? 'selected' : ''}`, onClick: () => handleArticleSelect(article), children: [_jsxs("div", { className: "article-header", children: [_jsxs("div", { className: "article-meta", children: [_jsx("span", { className: "source", children: article.source }), _jsx("span", { className: "category", children: article.category })] }), _jsx("div", { className: "article-importance", children: _jsx("span", { className: "importance-badge", style: { backgroundColor: getImportanceColor(article.importance) }, children: getImportanceText(article.importance) }) })] }), _jsx("h3", { className: "article-title", children: article.title }), _jsxs("div", { className: "analysis-preview", children: [_jsx("div", { className: "complexity-indicator", children: _jsx("span", { className: "complexity-badge", style: { backgroundColor: getComplexityColor(article.chomskyAnalysis.intellectualDepth.complexityLevel) }, children: article.chomskyAnalysis.intellectualDepth.complexityLevel }) }), _jsxs("div", { className: "depth-scores", children: [_jsxs("div", { className: "score-item", children: [_jsx("span", { className: "score-label", children: "Analytical Depth" }), _jsx("div", { className: "score-bar", children: _jsx("div", { className: "score-fill", style: { width: `${article.chomskyAnalysis.intellectualDepth.analyticalDepth * 10}%` } }) }), _jsxs("span", { className: "score-value", children: [article.chomskyAnalysis.intellectualDepth.analyticalDepth, "/10"] })] }), _jsxs("div", { className: "score-item", children: [_jsx("span", { className: "score-label", children: "Critical Thinking" }), _jsx("div", { className: "score-bar", children: _jsx("div", { className: "score-fill", style: { width: `${article.chomskyAnalysis.intellectualDepth.criticalThinking * 10}%` } }) }), _jsxs("span", { className: "score-value", children: [article.chomskyAnalysis.intellectualDepth.criticalThinking, "/10"] })] }), _jsxs("div", { className: "score-item", children: [_jsx("span", { className: "score-label", children: "Intellectual Rigor" }), _jsx("div", { className: "score-bar", children: _jsx("div", { className: "score-fill", style: { width: `${article.chomskyAnalysis.intellectualDepth.intellectualRigor * 10}%` } }) }), _jsxs("span", { className: "score-value", children: [article.chomskyAnalysis.intellectualDepth.intellectualRigor, "/10"] })] })] })] }), _jsxs("div", { className: "key-insights", children: [_jsx("h4", { children: "Key Insights" }), _jsx("ul", { children: article.chomskyAnalysis.synthesis.keyInsights.slice(0, 2).map((insight, index) => (_jsx("li", { children: insight }, `${article.id}-insight-${index}`))) })] }), _jsx("div", { className: "selection-reason", children: _jsxs("p", { children: [_jsx("strong", { children: "Selection Reason:" }), " ", article.selectionReason] }) })] }, article.id))) }), selectedArticle && (_jsxs("div", { className: "analysis-detail", children: [_jsxs("div", { className: "analysis-header", children: [_jsx("h2", { children: selectedArticle.title }), _jsx("div", { className: "analysis-summary", children: _jsxs("div", { className: "intellectual-metrics", children: [_jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Complexity" }), _jsx("span", { className: "metric-value", style: { color: getComplexityColor(selectedArticle.chomskyAnalysis.intellectualDepth.complexityLevel) }, children: selectedArticle.chomskyAnalysis.intellectualDepth.complexityLevel })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Analytical Depth" }), _jsxs("span", { className: "metric-value", children: [selectedArticle.chomskyAnalysis.intellectualDepth.analyticalDepth, "/10"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Critical Thinking" }), _jsxs("span", { className: "metric-value", children: [selectedArticle.chomskyAnalysis.intellectualDepth.criticalThinking, "/10"] })] })] }) })] }), _jsxs("div", { className: "analysis-content", children: [_jsxs("div", { className: "analysis-section", children: [_jsx("h3", { children: "Key Insights" }), _jsx("ul", { className: "insights-list", children: selectedArticle.chomskyAnalysis.synthesis.keyInsights.map((insight, index) => (_jsx("li", { children: insight }, `${selectedArticle.id}-insight-${index}`))) })] }), _jsxs("div", { className: "analysis-section", children: [_jsx("h3", { children: "Critical Analysis" }), _jsxs("div", { className: "critical-points", children: [_jsxs("div", { className: "critical-subsection", children: [_jsx("h4", { children: "What's Not Being Said" }), _jsx("ul", { children: selectedArticle.chomskyAnalysis.criticalAnalysis.whatIsNotSaid.slice(0, 2).map((item, index) => (_jsx("li", { children: item }, `${selectedArticle.id}-not-said-${index}`))) })] }), _jsxs("div", { className: "critical-subsection", children: [_jsx("h4", { children: "Power Structures" }), _jsx("ul", { children: selectedArticle.chomskyAnalysis.structuralAnalysis.powerStructures.slice(0, 2).map((item, index) => (_jsx("li", { children: item }, `${selectedArticle.id}-power-${index}`))) })] })] })] }), _jsxs("div", { className: "analysis-section", children: [_jsx("h3", { children: "Intellectual Significance" }), _jsx("p", { className: "significance-text", children: selectedArticle.chomskyAnalysis.synthesis.intellectualSignificance })] }), _jsxs("div", { className: "read-full-article", children: [_jsx("button", { className: "read-article-button", onClick: () => handleArticleSelect(selectedArticle), children: "Read Full Article with Interactive Analysis \u2192" }), _jsx("p", { className: "read-description", children: "Click to read the complete article with interactive Chomsky-level analysis, highlighting, and community discussion features." })] })] })] }))] })] }));
};
export default IntellectualSelfDefense;
