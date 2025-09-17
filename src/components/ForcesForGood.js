import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiShield, FiBookOpen, FiTarget, FiSearch, FiStar, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { democracyForcesService } from '../services/democracyForcesService';
import { logger } from '../utils/logger';
import './ForcesForGood.css';
const ForcesForGood = ({ onArticleSelect }) => {
    const [forces, setForces] = useState([]);
    const [exemplaryArticles, setExemplaryArticles] = useState([]);
    const [trustFeatures, setTrustFeatures] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('forces');
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            // Load democracy forces
            const allForces = democracyForcesService.getDemocracyForces();
            setForces(allForces);
            // Load trust-building features
            const features = democracyForcesService.getTrustBuildingFeatures();
            setTrustFeatures(features);
            // Load exemplary articles
            const articles = await democracyForcesService.searchExemplaryArticles('democracy');
            setExemplaryArticles(articles);
            logger.info('Forces for good data loaded', {
                forcesCount: allForces.length,
                articlesCount: articles.length,
                featuresCount: features.length
            });
        }
        catch (error) {
            logger.error('Failed to load forces for good data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSearch = async () => {
        if (!searchQuery.trim())
            return;
        try {
            setLoading(true);
            const articles = await democracyForcesService.searchExemplaryArticles(searchQuery, selectedCategory);
            setExemplaryArticles(articles);
            setActiveTab('articles');
        }
        catch (error) {
            logger.error('Failed to search exemplary articles:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredForces = forces.filter(force => {
        const categoryMatch = selectedCategory === 'all' || force.category === selectedCategory;
        const typeMatch = selectedType === 'all' || force.type === selectedType;
        return categoryMatch && typeMatch;
    });
    const getTrustScore = (force) => {
        return Math.round(Object.values(force.trustworthiness).reduce((a, b) => a + b, 0) / 5);
    };
    const getTrustColor = (score) => {
        if (score >= 90)
            return '#10b981'; // Green
        if (score >= 80)
            return '#f59e0b'; // Yellow
        if (score >= 70)
            return '#f97316'; // Orange
        return '#ef4444'; // Red
    };
    const getTrustIcon = (score) => {
        if (score >= 90)
            return _jsx(FiCheckCircle, { className: "trust-icon high" });
        if (score >= 80)
            return _jsx(FiStar, { className: "trust-icon medium" });
        return _jsx(FiAlertCircle, { className: "trust-icon low" });
    };
    const handleArticleSelect = (article) => {
        if (onArticleSelect) {
            onArticleSelect(article);
        }
        logger.info('Exemplary article selected', { articleId: article.id, source: article.source.name });
    };
    if (loading) {
        return (_jsx("div", { className: "forces-for-good", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("h2", { children: "Loading Forces for Good..." }), _jsx("p", { children: "Identifying democracy-promoting organizations and exemplary journalism" })] }) }));
    }
    return (_jsxs("div", { className: "forces-for-good", children: [_jsxs("div", { className: "forces-header", children: [_jsx("h1", { children: "\uD83D\uDEE1\uFE0F Forces for Good" }), _jsx("p", { className: "subtitle", children: "Organizations and media that promote democracy, individual freedoms, and exemplary journalism" })] }), _jsxs("div", { className: "search-filters", children: [_jsxs("div", { className: "search-bar", children: [_jsx("input", { type: "text", placeholder: "Search for exemplary articles...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSearch() }), _jsx("button", { onClick: handleSearch, className: "search-button", children: _jsx(FiSearch, {}) })] }), _jsxs("div", { className: "filters", children: [_jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Categories" }), _jsx("option", { value: "journalism", children: "Journalism" }), _jsx("option", { value: "activism", children: "Activism" }), _jsx("option", { value: "education", children: "Education" }), _jsx("option", { value: "legal", children: "Legal" }), _jsx("option", { value: "technology", children: "Technology" }), _jsx("option", { value: "research", children: "Research" }), _jsx("option", { value: "community", children: "Community" })] }), _jsxs("select", { value: selectedType, onChange: (e) => setSelectedType(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "media", children: "Media" }), _jsx("option", { value: "organization", children: "Organization" }), _jsx("option", { value: "individual", children: "Individual" }), _jsx("option", { value: "institution", children: "Institution" }), _jsx("option", { value: "movement", children: "Movement" })] })] })] }), _jsxs("div", { className: "tabs", children: [_jsxs("button", { className: `tab ${activeTab === 'forces' ? 'active' : ''}`, onClick: () => setActiveTab('forces'), children: [_jsx(FiShield, {}), "Democracy Forces (", filteredForces.length, ")"] }), _jsxs("button", { className: `tab ${activeTab === 'articles' ? 'active' : ''}`, onClick: () => setActiveTab('articles'), children: [_jsx(FiBookOpen, {}), "Exemplary Articles (", exemplaryArticles.length, ")"] }), _jsxs("button", { className: `tab ${activeTab === 'trust' ? 'active' : ''}`, onClick: () => setActiveTab('trust'), children: [_jsx(FiTarget, {}), "Trust Building (", trustFeatures.length, ")"] })] }), _jsxs("div", { className: "content", children: [activeTab === 'forces' && (_jsx("div", { className: "forces-grid", children: filteredForces.map(force => {
                            const trustScore = getTrustScore(force);
                            const trustColor = getTrustColor(trustScore);
                            return (_jsxs("div", { className: "force-card", children: [_jsxs("div", { className: "force-header", children: [_jsx("h3", { children: force.name }), _jsxs("div", { className: "trust-score", style: { color: trustColor }, children: [getTrustIcon(trustScore), _jsxs("span", { children: [trustScore, "%"] })] })] }), _jsxs("div", { className: "force-meta", children: [_jsx("span", { className: "force-type", children: force.type }), _jsx("span", { className: "force-category", children: force.category }), force.location && _jsx("span", { className: "force-location", children: force.location })] }), _jsx("p", { className: "force-description", children: force.description }), _jsxs("div", { className: "force-mission", children: [_jsx("strong", { children: "Mission:" }), " ", force.mission] }), _jsxs("div", { className: "democratic-values", children: [_jsx("strong", { children: "Democratic Values:" }), _jsx("div", { className: "values-list", children: force.democraticValues.map(value => (_jsx("span", { className: "value-tag", children: value }, value))) })] }), _jsxs("div", { className: "trustworthiness-breakdown", children: [_jsx("h4", { children: "Trustworthiness Breakdown:" }), _jsxs("div", { className: "trust-metrics", children: [_jsxs("div", { className: "metric", children: [_jsx("span", { children: "Transparency" }), _jsx("div", { className: "metric-bar", children: _jsx("div", { className: "metric-fill", style: { width: `${force.trustworthiness.transparency}%` } }) }), _jsxs("span", { children: [force.trustworthiness.transparency, "%"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Accountability" }), _jsx("div", { className: "metric-bar", children: _jsx("div", { className: "metric-fill", style: { width: `${force.trustworthiness.accountability}%` } }) }), _jsxs("span", { children: [force.trustworthiness.accountability, "%"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Independence" }), _jsx("div", { className: "metric-bar", children: _jsx("div", { className: "metric-fill", style: { width: `${force.trustworthiness.independence}%` } }) }), _jsxs("span", { children: [force.trustworthiness.independence, "%"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Accuracy" }), _jsx("div", { className: "metric-bar", children: _jsx("div", { className: "metric-fill", style: { width: `${force.trustworthiness.accuracy}%` } }) }), _jsxs("span", { children: [force.trustworthiness.accuracy, "%"] })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { children: "Public Service" }), _jsx("div", { className: "metric-bar", children: _jsx("div", { className: "metric-fill", style: { width: `${force.trustworthiness.publicService}%` } }) }), _jsxs("span", { children: [force.trustworthiness.publicService, "%"] })] })] })] }), _jsxs("div", { className: "force-examples", children: [_jsx("h4", { children: "Exemplary Actions:" }), _jsx("ul", { children: force.examples.democraticActions.slice(0, 3).map((action, index) => (_jsx("li", { children: action }, index))) })] }), _jsxs("div", { className: "force-actions", children: [force.website && (_jsx("a", { href: force.website, target: "_blank", rel: "noopener noreferrer", className: "action-button primary", children: "Visit Website" })), _jsx("button", { className: "action-button secondary", onClick: () => {
                                                    setSearchQuery(force.name);
                                                    handleSearch();
                                                }, children: "Find Articles" })] })] }, force.id));
                        }) })), activeTab === 'articles' && (_jsx("div", { className: "articles-list", children: exemplaryArticles.map(article => (_jsxs("div", { className: "article-card", children: [_jsxs("div", { className: "article-header", children: [_jsx("h3", { children: article.title }), _jsxs("div", { className: "article-source", children: [_jsx("span", { className: "source-name", children: article.source.name }), _jsx("span", { className: "source-type", children: article.source.type })] })] }), _jsx("p", { className: "article-content", children: article.content }), _jsxs("div", { className: "quality-indicators", children: [_jsx("h4", { children: "Quality Indicators:" }), _jsx("div", { className: "indicators-grid", children: Object.entries(article.qualityIndicators).map(([key, value]) => (_jsxs("div", { className: `indicator ${value ? 'positive' : 'negative'}`, children: [_jsx(FiCheckCircle, { className: value ? 'positive' : 'negative' }), _jsx("span", { children: key.replace(/([A-Z])/g, ' $1').toLowerCase() })] }, key))) })] }), _jsxs("div", { className: "democratic-values", children: [_jsx("h4", { children: "Democratic Values:" }), _jsx("div", { className: "values-list", children: article.democraticValues.map(value => (_jsx("span", { className: "value-tag", children: value }, value))) })] }), _jsxs("div", { className: "community-rating", children: [_jsx("h4", { children: "Community Rating:" }), _jsxs("div", { className: "rating-metrics", children: [_jsxs("div", { className: "rating-metric", children: [_jsx("span", { children: "Trustworthiness" }), _jsx("div", { className: "rating-bar", children: _jsx("div", { className: "rating-fill", style: { width: `${article.communityRating.trustworthiness}%` } }) }), _jsxs("span", { children: [article.communityRating.trustworthiness, "%"] })] }), _jsxs("div", { className: "rating-metric", children: [_jsx("span", { children: "Democratic Value" }), _jsx("div", { className: "rating-bar", children: _jsx("div", { className: "rating-fill", style: { width: `${article.communityRating.democraticValue}%` } }) }), _jsxs("span", { children: [article.communityRating.democraticValue, "%"] })] }), _jsxs("div", { className: "rating-metric", children: [_jsx("span", { children: "Public Service" }), _jsx("div", { className: "rating-bar", children: _jsx("div", { className: "rating-fill", style: { width: `${article.communityRating.publicService}%` } }) }), _jsxs("span", { children: [article.communityRating.publicService, "%"] })] }), _jsxs("div", { className: "rating-metric", children: [_jsx("span", { children: "Accuracy" }), _jsx("div", { className: "rating-bar", children: _jsx("div", { className: "rating-fill", style: { width: `${article.communityRating.accuracy}%` } }) }), _jsxs("span", { children: [article.communityRating.accuracy, "%"] })] })] })] }), _jsxs("div", { className: "article-actions", children: [_jsx("button", { className: "action-button primary", onClick: () => handleArticleSelect(article), children: "Read Full Article" }), _jsx("a", { href: article.url, target: "_blank", rel: "noopener noreferrer", className: "action-button secondary", children: "Visit Source" })] })] }, article.id))) })), activeTab === 'trust' && (_jsx("div", { className: "trust-features", children: trustFeatures.map(feature => (_jsxs("div", { className: "trust-feature-card", children: [_jsxs("div", { className: "feature-header", children: [_jsx("h3", { children: feature.title }), _jsx("span", { className: "feature-type", children: feature.type })] }), _jsx("p", { className: "feature-description", children: feature.description }), _jsxs("div", { className: "feature-examples", children: [_jsx("h4", { children: "Examples:" }), _jsx("ul", { children: feature.examples.map((example, index) => (_jsx("li", { children: example }, index))) })] }), _jsxs("div", { className: "verification-methods", children: [_jsx("h4", { children: "How to Verify:" }), _jsx("ul", { children: feature.verificationMethods.map((method, index) => (_jsx("li", { children: method }, index))) })] })] }, feature.id))) }))] })] }));
};
export default ForcesForGood;
