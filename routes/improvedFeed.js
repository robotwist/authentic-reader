import express from 'express';
import jsonArticleService from '../services/jsonArticleService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Improved Balanced Feed Endpoint
 * 
 * This endpoint provides a balanced view of news from multiple sources
 * with comprehensive analysis and filtering capabilities.
 */

// Get balanced feed with analysis
router.get('/balanced-feed', async (req, res) => {
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

    logger.info('Fetching balanced feed', { 
      limit, 
      offset, 
      categories, 
      sources, 
      biasRatings,
      search 
    });

    // Parse array parameters
    const parsedCategories = categories && typeof categories === 'string' ? categories.split(',') : [];
    const parsedSources = sources && typeof sources === 'string' ? sources.split(',') : [];
    const parsedBiasRatings = biasRatings && typeof biasRatings === 'string' ? biasRatings.split(',') : [];

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      categories: parsedCategories,
      sources: parsedSources,
      biasRatings: parsedBiasRatings,
      includeAnalysis: includeAnalysis === 'true'
    };

    let result;
    
    if (search) {
      // Search articles
      result = await jsonArticleService.searchArticles(search, filters);
    } else {
      // Get filtered articles
      result = await jsonArticleService.getArticles(filters);
    }

    // Add metadata
    const response = {
      articles: result.articles || result,
      metadata: {
        total: result.total || result.length,
        hasMore: result.hasMore || false,
        limit: filters.limit,
        offset: filters.offset,
        filters: {
          categories: parsedCategories,
          sources: parsedSources,
          biasRatings: parsedBiasRatings
        },
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching balanced feed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balanced feed',
      message: error.message 
    });
  }
});

// Get sources
router.get('/sources', async (req, res) => {
  try {
    const sources = jsonArticleService.getSources();
    res.json({ sources });
  } catch (error) {
    logger.error('Error fetching sources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sources',
      message: error.message 
    });
  }
});

// Get single article with analysis
router.get('/article/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await jsonArticleService.getArticleById(id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ 
      error: 'Failed to fetch article',
      message: error.message 
    });
  }
});

// Analyze article
router.post('/article/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await jsonArticleService.getArticleById(id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const analysis = await jsonArticleService.analyzeArticle(article);
    res.json({ analysis });
  } catch (error) {
    logger.error('Error analyzing article:', error);
    res.status(500).json({ 
      error: 'Failed to analyze article',
      message: error.message 
    });
  }
});

// Search articles
router.get('/search', async (req, res) => {
  try {
    const { q: query, ...filters } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await jsonArticleService.searchArticles(query, filters);
    res.json({ 
      articles: results,
      query,
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error searching articles:', error);
    res.status(500).json({ 
      error: 'Failed to search articles',
      message: error.message 
    });
  }
});

// Get service statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await jsonArticleService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      message: error.message 
    });
  }
});

// Refresh articles from all sources
router.post('/refresh', async (req, res) => {
  try {
    logger.info('Manual refresh requested');
    
    // Fetch fresh articles
    const articles = await jsonArticleService.fetchAllArticles({
      maxArticlesPerSource: 10,
      includeAnalysis: true
    });
    
    res.json({ 
      message: 'Articles refreshed successfully',
      count: articles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error refreshing articles:', error);
    res.status(500).json({ 
      error: 'Failed to refresh articles',
      message: error.message 
    });
  }
});

export default router;
