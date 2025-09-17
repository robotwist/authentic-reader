import { useState, useEffect, useCallback } from 'react';
import { improvedArticleService } from '../services/improvedArticleService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
export function useImprovedArticles() {
    const [articles, setArticles] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilters, setActiveFilters] = useState({});
    const [stats, setStats] = useState(null);
    const { isLoggedIn } = useAuth();
    // Load sources on mount
    useEffect(() => {
        loadSources();
    }, []);
    // Load articles on mount and when filters change
    useEffect(() => {
        loadArticles();
    }, [activeFilters]);
    // Load sources
    const loadSources = useCallback(async () => {
        try {
            const response = await improvedArticleService.getSources();
            setSources(response.sources);
            logger.info('Loaded sources:', response.sources.length);
        }
        catch (error) {
            logger.error('Error loading sources:', error);
            setError(error);
        }
    }, []);
    // Load articles
    const loadArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await improvedArticleService.getArticles({
                limit: activeFilters.limit || 50,
                offset: activeFilters.offset || 0,
                categories: activeFilters.categories,
                sources: activeFilters.sources,
                biasRatings: activeFilters.biasRatings,
                includeAnalysis: true
            });
            setArticles(response.articles);
            logger.info('Loaded articles:', response.articles.length);
        }
        catch (error) {
            logger.error('Error loading articles:', error);
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }, [activeFilters]);
    // Refresh articles
    const refreshArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await improvedArticleService.refreshArticles();
            logger.info('Refreshed articles:', response.count);
            // Reload articles after refresh
            await loadArticles();
        }
        catch (error) {
            logger.error('Error refreshing articles:', error);
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }, [loadArticles]);
    // Get article by ID
    const getArticleById = useCallback(async (id) => {
        try {
            const article = await improvedArticleService.getArticleById(id);
            return article;
        }
        catch (error) {
            logger.error('Error fetching article by ID:', error);
            return null;
        }
    }, []);
    // Mark article as read (placeholder - would need backend support)
    const markAsRead = useCallback(async (id) => {
        try {
            // This would need to be implemented in the backend
            logger.info('Marking article as read:', id);
        }
        catch (error) {
            logger.error('Error marking article as read:', error);
        }
    }, []);
    // Mark article as saved (placeholder - would need backend support)
    const markAsSaved = useCallback(async (id) => {
        try {
            // This would need to be implemented in the backend
            logger.info('Marking article as saved:', id);
        }
        catch (error) {
            logger.error('Error marking article as saved:', error);
        }
    }, []);
    // Filter articles
    const filterArticles = useCallback(async (filters) => {
        setActiveFilters(prev => ({ ...prev, ...filters }));
    }, []);
    // Analyze article
    const analyzeArticle = useCallback(async (article) => {
        try {
            const response = await improvedArticleService.analyzeArticle(article.id);
            return response.analysis;
        }
        catch (error) {
            logger.error('Error analyzing article:', error);
            throw error;
        }
    }, []);
    // Get analysis for article
    const getAnalysis = useCallback(async (articleId) => {
        try {
            const article = await improvedArticleService.getArticleById(articleId);
            return article?.analysis || null;
        }
        catch (error) {
            logger.error('Error getting analysis:', error);
            return null;
        }
    }, []);
    // Sort articles
    const sortArticles = useCallback((sortBy) => {
        setArticles(prev => {
            const sorted = [...prev];
            switch (sortBy) {
                case 'date':
                    sorted.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
                    break;
                case 'title':
                    sorted.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'source':
                    sorted.sort((a, b) => a.source.name.localeCompare(b.source.name));
                    break;
                case 'credibility':
                    sorted.sort((a, b) => {
                        const aScore = a.analysis?.credibility?.score || 0;
                        const bScore = b.analysis?.credibility?.score || 0;
                        return bScore - aScore;
                    });
                    break;
                default:
                    break;
            }
            return sorted;
        });
    }, []);
    // Search articles
    const searchArticles = useCallback(async (query) => {
        try {
            setLoading(true);
            setError(null);
            const response = await improvedArticleService.searchArticles(query, {
                limit: activeFilters.limit || 50,
                offset: activeFilters.offset || 0,
                categories: activeFilters.categories,
                sources: activeFilters.sources,
                biasRatings: activeFilters.biasRatings
            });
            setArticles(response.articles);
            setActiveFilters(prev => ({ ...prev, searchQuery: query }));
            logger.info('Searched articles:', response.articles.length);
        }
        catch (error) {
            logger.error('Error searching articles:', error);
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }, [activeFilters]);
    // Get balanced articles
    const getBalancedArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await improvedArticleService.getBalancedArticles({
                limit: activeFilters.limit || 50,
                includeAnalysis: true
            });
            setArticles(response.articles);
            setActiveFilters(prev => ({
                ...prev,
                biasRatings: ['center', 'center-left', 'center-right'],
                searchQuery: undefined
            }));
            logger.info('Loaded balanced articles:', response.articles.length);
        }
        catch (error) {
            logger.error('Error loading balanced articles:', error);
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }, [activeFilters]);
    // Get high credibility articles
    const getHighCredibilityArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await improvedArticleService.getHighCredibilityArticles({
                limit: activeFilters.limit || 50,
                includeAnalysis: true
            });
            setArticles(response.articles);
            setActiveFilters(prev => ({
                ...prev,
                sources: ['NPR', 'BBC News', 'Reuters', 'Associated Press', 'Wall Street Journal', 'New York Times', 'The Guardian', 'The Economist'],
                searchQuery: undefined
            }));
            logger.info('Loaded high credibility articles:', response.articles.length);
        }
        catch (error) {
            logger.error('Error loading high credibility articles:', error);
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }, [activeFilters]);
    // Get trending articles
    const getTrendingArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await improvedArticleService.getTrendingArticles({
                limit: activeFilters.limit || 20,
                includeAnalysis: true
            });
            setArticles(response.articles);
            setActiveFilters(prev => ({
                ...prev,
                searchQuery: undefined
            }));
            logger.info('Loaded trending articles:', response.articles.length);
        }
        catch (error) {
            logger.error('Error loading trending articles:', error);
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }, [activeFilters]);
    // Load stats
    useEffect(() => {
        const loadStats = async () => {
            try {
                const statsData = await improvedArticleService.getStats();
                setStats(statsData);
            }
            catch (error) {
                logger.error('Error loading stats:', error);
            }
        };
        loadStats();
    }, []);
    return {
        articles,
        sources,
        loading,
        error,
        refreshArticles,
        getArticleById,
        markAsRead,
        markAsSaved,
        filterArticles,
        activeFilters,
        analyzeArticle,
        getAnalysis,
        sortArticles,
        searchArticles,
        getBalancedArticles,
        getHighCredibilityArticles,
        getTrendingArticles,
        stats
    };
}
