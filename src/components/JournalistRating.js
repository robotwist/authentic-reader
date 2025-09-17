import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiUser, FiTrendingUp, FiTrendingDown, FiClock, FiBarChart2, FiActivity } from 'react-icons/fi';
import '../styles/JournalistRating.css';
const JournalistRating = ({ journalistName, sourceName, onClose }) => {
    const [journalists, setJournalists] = useState([]);
    const [selectedJournalist, setSelectedJournalist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('credibility');
    useEffect(() => {
        loadJournalistData();
    }, []);
    const loadJournalistData = async () => {
        setIsLoading(true);
        try {
            // Simulate loading journalist data
            const mockJournalists = [
                {
                    name: "Sarah Johnson",
                    source: "Reuters",
                    articlesCount: 45,
                    averageBias: 2.1,
                    credibilityScore: 8.7,
                    biasTrend: 'stable',
                    lastArticleDate: "2024-01-20",
                    topTopics: ["Politics", "Economy", "Technology"],
                    writingStyle: {
                        objectivity: 8.5,
                        sensationalism: 1.2,
                        factChecking: 9.1,
                        sourceDiversity: 8.8
                    },
                    recentArticles: [
                        { title: "Federal Reserve Announces New Policy", date: "2024-01-20", biasScore: 1.8, credibilityScore: 8.9 },
                        { title: "Tech Industry Faces Regulatory Changes", date: "2024-01-18", biasScore: 2.3, credibilityScore: 8.6 },
                        { title: "Climate Policy Implementation Begins", date: "2024-01-15", biasScore: 2.1, credibilityScore: 8.7 }
                    ]
                },
                {
                    name: "Michael Chen",
                    source: "BBC News",
                    articlesCount: 38,
                    averageBias: 2.8,
                    credibilityScore: 8.2,
                    biasTrend: 'decreasing',
                    lastArticleDate: "2024-01-19",
                    topTopics: ["International", "Science", "Health"],
                    writingStyle: {
                        objectivity: 7.8,
                        sensationalism: 2.1,
                        factChecking: 8.4,
                        sourceDiversity: 7.9
                    },
                    recentArticles: [
                        { title: "Global Health Initiative Launched", date: "2024-01-19", biasScore: 2.5, credibilityScore: 8.3 },
                        { title: "Scientific Breakthrough in Renewable Energy", date: "2024-01-16", biasScore: 3.1, credibilityScore: 8.1 },
                        { title: "International Trade Agreement Reached", date: "2024-01-13", biasScore: 2.9, credibilityScore: 8.2 }
                    ]
                },
                {
                    name: "Alex Rodriguez",
                    source: "Fox News",
                    articlesCount: 52,
                    averageBias: 7.2,
                    credibilityScore: 5.8,
                    biasTrend: 'increasing',
                    lastArticleDate: "2024-01-20",
                    topTopics: ["Politics", "Business", "Culture"],
                    writingStyle: {
                        objectivity: 4.2,
                        sensationalism: 7.8,
                        factChecking: 6.1,
                        sourceDiversity: 4.5
                    },
                    recentArticles: [
                        { title: "Political Opposition Criticizes New Policy", date: "2024-01-20", biasScore: 7.8, credibilityScore: 5.5 },
                        { title: "Business Leaders Express Concerns", date: "2024-01-17", biasScore: 6.9, credibilityScore: 6.2 },
                        { title: "Cultural Shift in American Society", date: "2024-01-14", biasScore: 7.5, credibilityScore: 5.7 }
                    ]
                },
                {
                    name: "Emily Watson",
                    source: "MSNBC",
                    articlesCount: 41,
                    averageBias: 6.8,
                    credibilityScore: 6.2,
                    biasTrend: 'stable',
                    lastArticleDate: "2024-01-20",
                    topTopics: ["Politics", "Social Issues", "Environment"],
                    writingStyle: {
                        objectivity: 4.8,
                        sensationalism: 6.2,
                        factChecking: 7.1,
                        sourceDiversity: 5.8
                    },
                    recentArticles: [
                        { title: "Progressive Policy Gains Support", date: "2024-01-20", biasScore: 7.1, credibilityScore: 6.0 },
                        { title: "Social Justice Movement Continues", date: "2024-01-17", biasScore: 6.5, credibilityScore: 6.4 },
                        { title: "Environmental Protection Measures", date: "2024-01-14", biasScore: 6.9, credibilityScore: 6.2 }
                    ]
                },
                {
                    name: "David Kim",
                    source: "Associated Press",
                    articlesCount: 67,
                    averageBias: 1.9,
                    credibilityScore: 9.1,
                    biasTrend: 'stable',
                    lastArticleDate: "2024-01-20",
                    topTopics: ["Breaking News", "Politics", "International"],
                    writingStyle: {
                        objectivity: 9.2,
                        sensationalism: 0.8,
                        factChecking: 9.4,
                        sourceDiversity: 9.0
                    },
                    recentArticles: [
                        { title: "Breaking: Major Policy Announcement", date: "2024-01-20", biasScore: 1.7, credibilityScore: 9.2 },
                        { title: "International Summit Concludes", date: "2024-01-18", biasScore: 2.1, credibilityScore: 9.0 },
                        { title: "Economic Data Released", date: "2024-01-15", biasScore: 1.9, credibilityScore: 9.1 }
                    ]
                }
            ];
            setJournalists(mockJournalists);
            // If a specific journalist is requested, find them
            if (journalistName) {
                const found = mockJournalists.find(j => j.name.toLowerCase().includes(journalistName.toLowerCase()));
                if (found)
                    setSelectedJournalist(found);
            }
        }
        catch (error) {
            console.error('Failed to load journalist data:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const getBiasColor = (bias) => {
        if (bias <= 3)
            return 'var(--success-color)';
        if (bias <= 5)
            return 'var(--warning-color)';
        return 'var(--error-color)';
    };
    const getCredibilityColor = (score) => {
        if (score >= 8)
            return 'var(--success-color)';
        if (score >= 6)
            return 'var(--warning-color)';
        return 'var(--error-color)';
    };
    const getBiasTrendIcon = (trend) => {
        switch (trend) {
            case 'increasing': return _jsx(FiTrendingUp, { className: "trend-up" });
            case 'decreasing': return _jsx(FiTrendingDown, { className: "trend-down" });
            default: return _jsx(FiActivity, { className: "trend-stable" });
        }
    };
    const filteredJournalists = journalists.filter(journalist => journalist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journalist.source.toLowerCase().includes(searchTerm.toLowerCase()));
    const sortedJournalists = [...filteredJournalists].sort((a, b) => {
        switch (sortBy) {
            case 'bias': return a.averageBias - b.averageBias;
            case 'credibility': return b.credibilityScore - a.credibilityScore;
            case 'articles': return b.articlesCount - a.articlesCount;
            default: return 0;
        }
    });
    if (isLoading) {
        return (_jsx("div", { className: "journalist-rating-container", children: _jsxs("div", { className: "loading-spinner", children: [_jsx(FiActivity, { className: "spinner" }), _jsx("p", { children: "Loading journalist ratings..." })] }) }));
    }
    return (_jsxs("div", { className: "journalist-rating-container", children: [_jsxs("div", { className: "journalist-rating-header", children: [_jsxs("h2", { children: [_jsx(FiUser, { className: "header-icon" }), "Journalist Bias & Credibility Ratings"] }), _jsx("p", { children: "Track journalist performance and bias patterns over time" })] }), _jsxs("div", { className: "journalist-rating-controls", children: [_jsx("div", { className: "search-box", children: _jsx("input", { type: "text", placeholder: "Search journalists or sources...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "search-input" }) }), _jsxs("div", { className: "sort-controls", children: [_jsx("label", { children: "Sort by:" }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "sort-select", children: [_jsx("option", { value: "credibility", children: "Credibility (High to Low)" }), _jsx("option", { value: "bias", children: "Bias (Low to High)" }), _jsx("option", { value: "articles", children: "Article Count" })] })] })] }), _jsx("div", { className: "journalist-grid", children: sortedJournalists.map((journalist) => (_jsxs("div", { className: "journalist-card", onClick: () => setSelectedJournalist(journalist), children: [_jsxs("div", { className: "journalist-header", children: [_jsxs("div", { className: "journalist-info", children: [_jsx("h3", { children: journalist.name }), _jsx("span", { className: "source-name", children: journalist.source })] }), _jsxs("div", { className: "journalist-stats", children: [_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-label", children: "Bias" }), _jsx("span", { className: "stat-value bias-score", style: { color: getBiasColor(journalist.averageBias) }, children: journalist.averageBias.toFixed(1) })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-label", children: "Credibility" }), _jsx("span", { className: "stat-value credibility-score", style: { color: getCredibilityColor(journalist.credibilityScore) }, children: journalist.credibilityScore.toFixed(1) })] })] })] }), _jsxs("div", { className: "journalist-details", children: [_jsxs("div", { className: "detail-row", children: [_jsx(FiBarChart2, {}), _jsxs("span", { children: [journalist.articlesCount, " articles"] })] }), _jsxs("div", { className: "detail-row", children: [_jsx(FiClock, {}), _jsxs("span", { children: ["Last: ", new Date(journalist.lastArticleDate).toLocaleDateString()] })] }), _jsxs("div", { className: "detail-row", children: [getBiasTrendIcon(journalist.biasTrend), _jsxs("span", { children: ["Bias trend: ", journalist.biasTrend] })] })] }), _jsxs("div", { className: "journalist-topics", children: [_jsx("strong", { children: "Top Topics:" }), _jsx("div", { className: "topic-tags", children: journalist.topTopics.slice(0, 3).map(topic => (_jsx("span", { className: "topic-tag", children: topic }, topic))) })] })] }, journalist.name))) }), selectedJournalist && (_jsx("div", { className: "journalist-detail-modal", children: _jsxs("div", { className: "modal-content", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h3", { children: selectedJournalist.name }), _jsx("button", { onClick: () => setSelectedJournalist(null), className: "close-btn", children: "\u00D7" })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("div", { className: "detail-section", children: [_jsx("h4", { children: "Overall Performance" }), _jsxs("div", { className: "performance-grid", children: [_jsxs("div", { className: "performance-item", children: [_jsx("span", { className: "label", children: "Average Bias" }), _jsxs("span", { className: "value", style: { color: getBiasColor(selectedJournalist.averageBias) }, children: [selectedJournalist.averageBias.toFixed(1), "/10"] })] }), _jsxs("div", { className: "performance-item", children: [_jsx("span", { className: "label", children: "Credibility Score" }), _jsxs("span", { className: "value", style: { color: getCredibilityColor(selectedJournalist.credibilityScore) }, children: [selectedJournalist.credibilityScore.toFixed(1), "/10"] })] }), _jsxs("div", { className: "performance-item", children: [_jsx("span", { className: "label", children: "Articles Analyzed" }), _jsx("span", { className: "value", children: selectedJournalist.articlesCount })] })] })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h4", { children: "Writing Style Analysis" }), _jsxs("div", { className: "style-metrics", children: [_jsxs("div", { className: "metric", children: [_jsx("span", { children: "Objectivity" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${selectedJournalist.writingStyle.objectivity * 10}%` } }) }), _jsxs("span", { children: [selectedJournalist.writingStyle.objectivity.toFixed(1), "/10"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Fact Checking" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${selectedJournalist.writingStyle.factChecking * 10}%` } }) }), _jsxs("span", { children: [selectedJournalist.writingStyle.factChecking.toFixed(1), "/10"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Source Diversity" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${selectedJournalist.writingStyle.sourceDiversity * 10}%` } }) }), _jsxs("span", { children: [selectedJournalist.writingStyle.sourceDiversity.toFixed(1), "/10"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Sensationalism" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill sensationalism", style: { width: `${selectedJournalist.writingStyle.sensationalism * 10}%` } }) }), _jsxs("span", { children: [selectedJournalist.writingStyle.sensationalism.toFixed(1), "/10"] })] })] })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h4", { children: "Recent Articles" }), _jsx("div", { className: "recent-articles", children: selectedJournalist.recentArticles.map((article, index) => (_jsxs("div", { className: "article-item", children: [_jsx("div", { className: "article-title", children: article.title }), _jsxs("div", { className: "article-meta", children: [_jsx("span", { children: new Date(article.date).toLocaleDateString() }), _jsxs("span", { className: "bias-score", style: { color: getBiasColor(article.biasScore) }, children: ["Bias: ", article.biasScore.toFixed(1)] }), _jsxs("span", { className: "credibility-score", style: { color: getCredibilityColor(article.credibilityScore) }, children: ["Credibility: ", article.credibilityScore.toFixed(1)] })] })] }, index))) })] })] })] }) }))] }));
};
export default JournalistRating;
