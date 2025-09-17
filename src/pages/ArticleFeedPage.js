import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { processArticleDescription } from '../utils/htmlUtils';
import '../styles/ArticleFeedPage.css';
const ArticleFeedPage = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSource, setCurrentSource] = useState('npr');
    const navigate = useNavigate();
    // Default RSS sources
    const defaultSources = [
        { id: 'npr', name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
        { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
        { id: 'reuters', name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews' },
        { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
    ];
    const fetchArticles = async (sourceId) => {
        setLoading(true);
        setError(null);
        try {
            const source = defaultSources.find(s => s.id === sourceId);
            if (!source) {
                throw new Error('Source not found');
            }
            const response = await fetch(`http://localhost:3000/api/rss?url=${encodeURIComponent(source.url)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch articles');
            }
            const data = await response.json();
            setArticles(data.items || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load articles');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchArticles(currentSource);
    }, [currentSource]);
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
    if (loading) {
        return (_jsx("div", { className: "article-feed-page", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { children: "Loading articles..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "article-feed-page", children: _jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Error Loading Articles" }), _jsx("p", { children: error }), _jsx("button", { onClick: () => fetchArticles(currentSource), className: "retry-button", children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "article-feed-page", role: "main", "aria-label": "Article feed", children: [_jsxs("div", { className: "feed-header", children: [_jsxs("div", { className: "source-selector", children: [_jsx("label", { htmlFor: "source-select", className: "sr-only", children: "Select news source" }), _jsx("select", { id: "source-select", value: currentSource, onChange: (e) => setCurrentSource(e.target.value), className: "source-select", "aria-label": "Select news source", children: defaultSources.map(source => (_jsx("option", { value: source.id, children: source.name }, source.id))) })] }), _jsxs("div", { className: "feed-info", children: [_jsx("h1", { children: "Latest Articles" }), _jsxs("p", { "aria-live": "polite", children: [articles.length, " articles loaded"] })] })] }), _jsx("div", { className: "articles-container", role: "feed", "aria-label": "Articles list", children: articles.map((article, index) => (_jsxs("article", { className: "article-card", role: "article", children: [_jsxs("div", { className: "article-header", children: [_jsx("h2", { className: "article-title", children: _jsx(Link, { to: `/analysis/${article.articleId || index}`, state: { article }, className: "article-link", "aria-describedby": `article-${index}-meta`, children: article.title }) }), _jsxs("div", { className: "article-meta", id: `article-${index}-meta`, children: [_jsx("span", { className: "article-author", "aria-label": "Author", children: article.author }), _jsx("span", { className: "article-date", "aria-label": "Publication date", children: formatDate(article.pubDate) })] })] }), _jsx("div", { className: "article-content", children: _jsx("p", { className: "article-description", children: (() => {
                                    const processed = processArticleDescription(article.description || '', 200);
                                    return processed.truncated;
                                })() }) }), article.analysis && (_jsxs("div", { className: "article-analysis", role: "region", "aria-label": "Content analysis", children: [_jsx("div", { className: "analysis-header", children: _jsx("h3", { children: "Content Analysis" }) }), _jsxs("div", { className: "analysis-grid", role: "list", children: [_jsxs("div", { className: "analysis-item", role: "listitem", children: [_jsx("span", { className: "analysis-label", children: "Reading Time:" }), _jsxs("span", { className: "analysis-value", children: [article.analysis.readingTime, " min"] })] }), _jsxs("div", { className: "analysis-item", role: "listitem", children: [_jsx("span", { className: "analysis-label", children: "Word Count:" }), _jsx("span", { className: "analysis-value", children: article.analysis.wordCount })] }), _jsxs("div", { className: "analysis-item", role: "listitem", children: [_jsx("span", { className: "analysis-label", children: "Credibility:" }), _jsx("span", { className: "analysis-value credibility-badge", style: { backgroundColor: getCredibilityColor(typeof article.analysis.credibility.level === 'string'
                                                            ? article.analysis.credibility.level
                                                            : typeof article.analysis.credibility.level === 'object'
                                                                ? (article.analysis.credibility.level.level ||
                                                                    article.analysis.credibility.level.type ||
                                                                    'unknown')
                                                                : 'unknown') }, "aria-label": `Credibility level: ${typeof article.analysis.credibility.level === 'string'
                                                        ? article.analysis.credibility.level
                                                        : typeof article.analysis.credibility.level === 'object'
                                                            ? (article.analysis.credibility.level.level ||
                                                                article.analysis.credibility.level.type ||
                                                                'unknown')
                                                            : 'unknown'}`, children: typeof article.analysis.credibility.level === 'string'
                                                        ? article.analysis.credibility.level
                                                        : typeof article.analysis.credibility.level === 'object'
                                                            ? (article.analysis.credibility.level.level ||
                                                                article.analysis.credibility.level.type ||
                                                                JSON.stringify(article.analysis.credibility.level))
                                                            : 'Unknown' })] }), _jsxs("div", { className: "analysis-item", role: "listitem", children: [_jsx("span", { className: "analysis-label", children: "Topics:" }), _jsx("span", { className: "analysis-value", children: article.analysis.keyTopics.join(', ') })] })] }), article.analysis.summary && (_jsxs("div", { className: "analysis-summary", children: [_jsx("h4", { children: "Summary" }), _jsx("p", { children: article.analysis.summary })] })), _jsx("div", { className: "analysis-credibility", children: _jsxs("p", { className: "credibility-reason", children: [_jsx("strong", { children: "Why this rating:" }), " ", article.analysis.credibility.reason] }) })] })), _jsx("div", { className: "article-actions", children: _jsx(Link, { to: `/analysis/${article.articleId || index}`, state: { article }, className: "read-button", "aria-label": `Read full article: ${article.title}`, children: "Read Full Article" }) })] }, article.articleId || index))) }), articles.length === 0 && !loading && (_jsxs("div", { className: "no-articles", role: "status", "aria-live": "polite", children: [_jsx("h2", { children: "No articles found" }), _jsx("p", { children: "Try selecting a different source or check your connection." })] }))] }));
};
export default ArticleFeedPage;
