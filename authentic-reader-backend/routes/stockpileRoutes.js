import express from 'express';
import articleStockpileService from '../services/articleStockpileService.js';
import { apiLimiter, analysisLimiter } from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Get all articles with filtering and pagination
 * GET /api/stockpile/articles
 */
router.get('/articles', apiLimiter, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      categories = [],
      sources = [],
      biasRatings = [],
      includeAnalysis = true,
      search = ''
    } = req.query;

    // Parse array parameters
    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      categories: Array.isArray(categories) ? categories : categories.split(',').filter(Boolean),
      sources: Array.isArray(sources) ? sources : sources.split(',').filter(Boolean),
      biasRatings: Array.isArray(biasRatings) ? biasRatings : biasRatings.split(',').filter(Boolean),
      includeAnalysis: includeAnalysis === 'true',
      searchQuery: search
    };

    const result = await articleStockpileService.getArticles(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles'
    });
  }
});

/**
 * Get article by ID
 * GET /api/stockpile/articles/:id
 */
router.get('/articles/:id', apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await articleStockpileService.getArticleById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    logger.error('Error getting article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article'
    });
  }
});

/**
 * Get service statistics
 * GET /api/stockpile/stats
 */
router.get('/stats', apiLimiter, async (req, res) => {
  try {
    const stats = await articleStockpileService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * Get sources
 * GET /api/stockpile/sources
 */
router.get('/sources', apiLimiter, async (req, res) => {
  try {
    const sources = articleStockpileService.getSources();
    
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    logger.error('Error getting sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sources'
    });
  }
});

/**
 * Force refresh all articles
 * POST /api/stockpile/refresh
 */
router.post('/refresh', analysisLimiter, async (req, res) => {
  try {
    logger.info('Force refresh requested via API');
    const result = await articleStockpileService.forceRefresh();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in force refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh articles'
    });
  }
});

/**
 * Get analysis queue status
 * GET /api/stockpile/queue
 */
router.get('/queue', apiLimiter, async (req, res) => {
  try {
    const queueStatus = articleStockpileService.getAnalysisQueueStatus();
    
    res.json({
      success: true,
      data: queueStatus
    });
  } catch (error) {
    logger.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue status'
    });
  }
});

/**
 * Clear analysis queue
 * DELETE /api/stockpile/queue
 */
router.delete('/queue', analysisLimiter, async (req, res) => {
  try {
    const result = articleStockpileService.clearAnalysisQueue();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error clearing queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear queue'
    });
  }
});

/**
 * Search articles
 * GET /api/stockpile/search
 */
router.get('/search', apiLimiter, async (req, res) => {
  try {
    const { q: query, ...filters } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchFilters = {
      limit: parseInt(filters.limit) || 50,
      offset: parseInt(filters.offset) || 0,
      categories: Array.isArray(filters.categories) ? filters.categories : filters.categories?.split(',').filter(Boolean) || [],
      sources: Array.isArray(filters.sources) ? filters.sources : filters.sources?.split(',').filter(Boolean) || [],
      biasRatings: Array.isArray(filters.biasRatings) ? filters.biasRatings : filters.biasRatings?.split(',').filter(Boolean) || [],
      includeAnalysis: filters.includeAnalysis === 'true',
      searchQuery: query
    };

    const result = await articleStockpileService.getArticles(searchFilters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error searching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search articles'
    });
  }
});

/**
 * Get recent articles
 * GET /api/stockpile/recent
 */
router.get('/recent', apiLimiter, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const result = await articleStockpileService.getArticles({
      limit: parseInt(limit),
      offset: 0,
      includeAnalysis: true
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting recent articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent articles'
    });
  }
});

/**
 * Get articles by category
 * GET /api/stockpile/category/:category
 */
router.get('/category/:category', apiLimiter, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await articleStockpileService.getArticles({
      limit: parseInt(limit),
      offset: parseInt(offset),
      categories: [category],
      includeAnalysis: true
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting articles by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles by category'
    });
  }
});

/**
 * Get articles by source
 * GET /api/stockpile/source/:source
 */
router.get('/source/:source', apiLimiter, async (req, res) => {
  try {
    const { source } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await articleStockpileService.getArticles({
      limit: parseInt(limit),
      offset: parseInt(offset),
      sources: [source],
      includeAnalysis: true
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting articles by source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles by source'
    });
  }
});

export default router;
