import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import '../styles/FeedContainer.css';
import ArticleCard from './ArticleCard';
import FilterPanel from './FilterPanel';
import SubjectGuide from './SubjectGuide';
import SearchSortBar from './SearchSortBar';
import ArticleAnalysis from './ArticleAnalysis';
import { useArticles } from '../hooks/useArticles';
import { useAuth } from '../contexts/AuthContext';
import { compareGuids, extractGuidString } from '../utils/guidUtils';
import { logger } from '../utils/logger';
const FeedContainer = ({ isInitialized = true, qualityFilters = {
    muteOutrage: false,
    blockDoomscroll: false,
    darkMode: false
}, onQualityFilterChange }) => {
    const { isLoggedIn } = useAuth();
    const { articles, sources, loading, error, refreshArticles, markAsRead, markAsSaved, getFullArticle, filterArticles, activeFilters, analyzeArticle, sortArticles: sortArticlesHook, searchArticles: searchArticlesHook } = useArticles();
    const [showSubjectGuide, setShowSubjectGuide] = useState(false);
    const [currentSort, setCurrentSort] = useState('date');
    const [analysisState, setAnalysisState] = useState({
        isOpen: false,
        articleId: null,
        articleTitle: '',
        articleSource: '',
        analysis: null
    });
    // Add state for analysis errors
    const [analysisError, setAnalysisError] = useState(null);
    // Apply content quality filters based on parent component preferences
    const [displayedArticles, setDisplayedArticles] = useState([]);
    // MOVED OUTSIDE CONDITIONAL: loading time state
    const [loadingTime, setLoadingTime] = useState(0);
    // MOVED OUTSIDE CONDITIONAL: loading time effect
    useEffect(() => {
        let intervalId = null;
        // Only start the interval if we're in loading state with no articles
        if (loading && articles.length === 0) {
            intervalId = setInterval(() => {
                setLoadingTime(prev => prev + 1);
            }, 1000);
        }
        else {
            // Reset loading time when not in loading state
            setLoadingTime(0);
        }
        return () => {
            if (intervalId)
                clearInterval(intervalId);
        };
    }, [loading, articles.length]);
    // Debug loading state
    useEffect(() => {
        console.log("⚡ FeedContainer loading state changed:", loading);
        console.log("⚡ Articles length:", articles.length);
        console.log("⚡ Sources length:", sources.length);
    }, [loading, articles.length, sources.length]);
    useEffect(() => {
        if (!articles.length)
            return;
        const filtered = [...articles];
        // Apply quality filters - in the future this will use backend filtering
        if (qualityFilters.muteOutrage || qualityFilters.blockDoomscroll) {
            // For now, we'll just show all articles as we transition to the backend
            // Later, we'll implement this with the backend API
        }
        setDisplayedArticles(filtered);
    }, [articles, qualityFilters]);
    // Handle filter preferences changes
    const handleFilterPreferencesChange = (preferences) => {
        if (onQualityFilterChange) {
            onQualityFilterChange(preferences);
        }
    };
    // Function to handle tag/category filtering
    const applyFilters = (filters) => {
        const sourceFilters = filters.filter(f => sources.some(source => source.name === f));
        // Category filters (non-source filters)
        const categoryFilters = filters.filter(f => !sources.some(source => source.name === f));
        // Apply filters to the articles
        filterArticles({
            sources: sourceFilters.length > 0 ? sourceFilters : undefined,
            categories: categoryFilters.length > 0 ? categoryFilters : undefined
        });
    };
    // Handle search
    const handleSearch = (query) => {
        searchArticlesHook(query);
    };
    // Handle sort
    const handleSort = (sortBy) => {
        setCurrentSort(sortBy);
        sortArticlesHook(sortBy);
    };
    // Handle article analysis - now receives the full article object
    const handleAnalyzeArticle = async (article) => {
        const articleId = extractGuidString(article.guid || article.link || '');
        logger.info('📊 handleAnalyzeArticle called with GUID:', articleId);
        if (!articleId) {
            logger.error('❌ No valid GUID/Link/URL found for analysis');
            setAnalysisError('Could not identify article for analysis');
            return;
        }
        // Clear any previous error
        setAnalysisError(null);
        try {
            // Call the hook's analyzeArticle function, which now handles caching and fetching
            logger.info(`📊 Requesting analysis for: ${article.title} (ID: ${articleId})`);
            const analysis = await analyzeArticle(article); // Type assertion to match expected type
            if (!analysis) {
                logger.error(`❌ Analysis returned null/undefined for article ${articleId}`);
                setAnalysisError('Analysis could not be completed.');
                return;
            }
            logger.info(`📊 Analysis complete for ${articleId}, showing modal.`);
            // Extract the source name, handling both string and object cases
            const sourceName = typeof article.source === 'string'
                ? article.source
                : article.source?.name || 'Unknown Source';
            // Show the analysis modal
            setAnalysisState({
                isOpen: true,
                articleId, // Use the extracted GUID
                articleTitle: article.title,
                articleSource: sourceName,
                articleAuthor: article.author,
                articleDate: article.publishDate,
                analysis
            });
        }
        catch (error) { // Use unknown instead of any
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            logger.error(`❌ Error analyzing article ${articleId}:`, error);
            setAnalysisError(`Analysis failed: ${errorMessage}`);
        }
    };
    // Close analysis modal
    const handleCloseAnalysis = () => {
        setAnalysisState(prev => ({
            ...prev,
            isOpen: false
        }));
    };
    // Force reset loading if it's been more than 15 seconds
    const handleForceReset = () => {
        console.log("⚠️ Emergency loading reset triggered");
        // Update this to use your actual method to reset loading state
        // This assumes there's a setLoading function from useArticles
        if (loading) {
            // We don't have direct access to setLoading, so you may need to 
            // add a resetLoading function to your useArticles hook
            refreshArticles().catch(e => console.error("Error refreshing articles:", e));
        }
    };
    // Extract unique categories from all articles
    const allCategories = Array.from(new Set(articles.flatMap(article => article.categories ? article.categories.map(c => c.toLowerCase()) : []))).filter(Boolean);
    // Extract source names for filtering
    const sourceNames = sources.map(source => source.name);
    if (!isInitialized) {
        return (_jsx("div", { className: "feed-container", children: _jsxs("div", { className: "loader", children: [_jsx("div", { className: "loader-spinner" }), _jsx("p", { children: "Initializing Authentic Reader..." })] }) }));
    }
    // Show loading state (now uses the loadingTime state that's defined at the top level)
    if (loading && articles.length === 0) {
        return (_jsx("div", { className: "feed-container", children: _jsxs("div", { className: "loader", children: [_jsx("div", { className: "loader-spinner" }), _jsxs("p", { children: ["Loading articles... ", loadingTime > 10 ? `(${loadingTime}s)` : ''] }), loadingTime > 15 && (_jsxs("div", { className: "emergency-reset", children: [_jsx("p", { children: "Loading seems to be taking longer than expected." }), _jsx("button", { className: "reset-button", onClick: handleForceReset, children: "Reset Loading State" })] }))] }) }));
    }
    // Show error state
    if (error && articles.length === 0) {
        return (_jsx("div", { className: "feed-container", children: _jsxs("div", { className: "error-message", children: [_jsx("h3", { children: "Error loading articles" }), _jsx("p", { children: error.message }), _jsx("button", { className: "refresh-button", onClick: () => refreshArticles(), children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "feed-container", children: [_jsxs("div", { className: "feed-header", children: [_jsx("h2", { children: "Your Personalized Feed" }), _jsx("p", { children: "Content from sources you trust, filtered for what matters to you" }), _jsx("div", { className: "feed-actions", children: _jsx("button", { className: "refresh-button", onClick: () => refreshArticles(), disabled: loading, children: loading ? 'Refreshing...' : 'Refresh Articles' }) })] }), showSubjectGuide && sources.length > 0 && (_jsx(SubjectGuide, { topics: [], sources: sources.map(s => ({
                    id: typeof s.id === 'number' ? s.id : 0,
                    name: s.name,
                    reliability: 8,
                    bias: 'center',
                    organizations: []
                })), title: "Your Sources & Topic Analysis" })), _jsx(SearchSortBar, { onSearch: handleSearch, onSort: handleSort, currentSort: currentSort }), _jsxs("div", { className: "feed-content", children: [_jsxs("aside", { className: "filter-sidebar", children: [_jsx(FilterPanel, { activeFilters: [
                                    ...(activeFilters.sources || []),
                                    ...(activeFilters.categories || [])
                                ], contentTypes: sourceNames, categories: allCategories, onFilterChange: applyFilters, qualityFilters: {
                                    muteOutrage: qualityFilters.muteOutrage,
                                    blockDoomscroll: qualityFilters.blockDoomscroll
                                }, onQualityFilterChange: handleFilterPreferencesChange, availableSources: sourceNames, availableCategories: allCategories, initialFilters: {
                                    sources: activeFilters.sources || [],
                                    categories: activeFilters.categories || []
                                } }), _jsx("div", { className: "subject-guide-toggle", children: _jsxs("button", { onClick: () => setShowSubjectGuide(!showSubjectGuide), className: "toggle-guide-btn", children: [showSubjectGuide ? 'Hide' : 'Show', " Source Analysis"] }) })] }), _jsxs("div", { className: "articles-grid", children: [loading && !articles.length ? (_jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "loader-spinner" }), _jsx("p", { children: "Loading articles for you..." })] })) : error ? (_jsxs("div", { className: "error-state", children: [_jsx("h3", { children: "Error Loading Articles" }), _jsx("p", { children: error.message || 'Unknown error' }), _jsx("button", { onClick: handleForceReset, children: "Try Again" })] })) : displayedArticles.length > 0 ? (displayedArticles.map((article, index) => {
                                // Generate a unique key for each article
                                const keyValue = article.id !== undefined ? String(article.id) :
                                    article.guid ? extractGuidString(article.guid) :
                                        article.url ? `${article.url}-${index}` :
                                            `article-${index}-${Math.random().toString(36).substring(2, 15)}`;
                                // Use the compareGuids function to demonstrate usage (removing unused error)
                                if (article.guid && articles.length > 1 && index > 0) {
                                    // Compare adjacent articles to check for duplicates - important for UX
                                    const prevGuid = articles[index - 1].guid;
                                    if (article.guid && prevGuid && typeof article.guid === 'string' && typeof prevGuid === 'string') {
                                        const isDuplicate = compareGuids(article.guid, prevGuid);
                                        if (isDuplicate) {
                                            logger.debug('Duplicate article detected by GUID comparison');
                                        }
                                    }
                                }
                                return (_jsx(ArticleCard, { article: article, onRead: markAsRead, onSave: markAsSaved, onGetFullContent: getFullArticle, onAnalyze: () => handleAnalyzeArticle(article) }, keyValue));
                            })) : (_jsxs("div", { className: "no-articles", children: [_jsx("h3", { children: "No articles found" }), _jsx("p", { children: "Try adjusting your filters or refresh to load new content." }), _jsx("button", { className: "refresh-button", onClick: refreshArticles, children: "Refresh Articles" })] })), loading && articles.length > 0 && (_jsxs("div", { className: "loading-more", children: [_jsx("div", { className: "loader-spinner" }), _jsx("p", { children: "Loading more articles..." })] }))] })] }), analysisState.isOpen && analysisState.analysis && (_jsx("div", { className: "analysis-modal-overlay", children: _jsxs("div", { className: "analysis-modal", children: [_jsx("button", { className: "close-modal-btn", onClick: handleCloseAnalysis, "aria-label": "Close analysis", children: "\u00D7" }), _jsx(ArticleAnalysis, { title: analysisState.articleTitle, source: analysisState.articleSource, author: analysisState.articleAuthor, date: analysisState.articleDate, analysis: analysisState.analysis, articleId: analysisState.articleId || 'unknown' })] }) })), analysisError && (_jsx("div", { className: "error-toast", children: _jsxs("div", { className: "error-toast-content", children: [_jsx("span", { className: "error-icon", children: "\u26A0\uFE0F" }), _jsx("p", { children: analysisError }), _jsx("button", { className: "close-toast-btn", onClick: () => setAnalysisError(null), "aria-label": "Close error message", children: "\u00D7" })] }) }))] }));
};
export default FeedContainer;
