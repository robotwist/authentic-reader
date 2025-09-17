/**
 * Improved Article Service
 *
 * This service provides enhanced article retrieval and analysis
 * using the improved backend API with JSON storage.
 */
class ImprovedArticleService {
    constructor() {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    }
    /**
     * Get articles from the balanced feed
     */
    async getArticles(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.limit)
                params.append('limit', options.limit.toString());
            if (options.offset)
                params.append('offset', options.offset.toString());
            if (options.categories?.length)
                params.append('categories', options.categories.join(','));
            if (options.sources?.length)
                params.append('sources', options.sources.join(','));
            if (options.biasRatings?.length)
                params.append('biasRatings', options.biasRatings.join(','));
            if (options.includeAnalysis !== undefined)
                params.append('includeAnalysis', options.includeAnalysis.toString());
            const response = await fetch(`${this.baseUrl}/feed/balanced-feed?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching articles:', error);
            throw error;
        }
    }
    /**
     * Search articles
     */
    async searchArticles(query, options = {}) {
        try {
            const params = new URLSearchParams();
            params.append('q', query);
            if (options.limit)
                params.append('limit', options.limit.toString());
            if (options.offset)
                params.append('offset', options.offset.toString());
            if (options.categories?.length)
                params.append('categories', options.categories.join(','));
            if (options.sources?.length)
                params.append('sources', options.sources.join(','));
            if (options.biasRatings?.length)
                params.append('biasRatings', options.biasRatings.join(','));
            const response = await fetch(`${this.baseUrl}/feed/search?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error searching articles:', error);
            throw error;
        }
    }
    /**
     * Get a single article by ID
     */
    async getArticleById(id) {
        try {
            const response = await fetch(`${this.baseUrl}/feed/article/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Article not found');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching article:', error);
            throw error;
        }
    }
    /**
     * Analyze an article
     */
    async analyzeArticle(id) {
        try {
            const response = await fetch(`${this.baseUrl}/feed/article/${id}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error analyzing article:', error);
            throw error;
        }
    }
    /**
     * Get available sources
     */
    async getSources() {
        try {
            const response = await fetch(`${this.baseUrl}/feed/sources`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching sources:', error);
            throw error;
        }
    }
    /**
     * Get service statistics
     */
    async getStats() {
        try {
            const response = await fetch(`${this.baseUrl}/feed/stats`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }
    /**
     * Refresh articles from all sources
     */
    async refreshArticles() {
        try {
            const response = await fetch(`${this.baseUrl}/feed/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error refreshing articles:', error);
            throw error;
        }
    }
    /**
     * Get articles by category
     */
    async getArticlesByCategory(category, options = {}) {
        return this.getArticles({
            ...options,
            categories: [category]
        });
    }
    /**
     * Get articles by source
     */
    async getArticlesBySource(source, options = {}) {
        return this.getArticles({
            ...options,
            sources: [source]
        });
    }
    /**
     * Get articles by bias rating
     */
    async getArticlesByBiasRating(biasRating, options = {}) {
        return this.getArticles({
            ...options,
            biasRatings: [biasRating]
        });
    }
    /**
     * Get balanced articles (mix of different bias ratings)
     */
    async getBalancedArticles(options = {}) {
        return this.getArticles({
            ...options,
            biasRatings: ['center', 'center-left', 'center-right']
        });
    }
    /**
     * Get trending articles (most recent)
     */
    async getTrendingArticles(options = {}) {
        return this.getArticles({
            ...options,
            limit: options.limit || 20
        });
    }
    /**
     * Get high-credibility articles
     */
    async getHighCredibilityArticles(options = {}) {
        return this.getArticles({
            ...options,
            sources: ['NPR', 'BBC News', 'Reuters', 'Associated Press', 'Wall Street Journal', 'New York Times', 'The Guardian', 'The Economist']
        });
    }
}
export const improvedArticleService = new ImprovedArticleService();
export default improvedArticleService;
