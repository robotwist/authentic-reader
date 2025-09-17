import express from 'express';
import articleStockpileService from '../services/articleStockpileService.js';
import analyticsService from '../services/analyticsService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/stockpile/articles
 * @desc Get articles from stockpile with pre-analysis
 * @access Public
 */
router.get('/articles', async (req, res) => {
  try {
    const {
      limit = 50,
      categories = [],
      sources = [],
      offset = 0,
      includeAnalysis = true
    } = req.query;

    const articles = await articleStockpileService.getArticlesFromStockpile({
      limit: parseInt(limit),
      categories: categories ? categories.split(',') : [],
      sources: sources ? sources.map(s => parseInt(s)) : [],
      offset: parseInt(offset),
      includeAnalysis: includeAnalysis === 'true'
    });

    res.json({
      articles,
      total: articles.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      categories: categories ? categories.split(',') : [],
      sources: sources ? sources.map(s => parseInt(s)) : [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching articles from stockpile:', error);
    res.status(500).json({
      error: 'Failed to fetch articles from stockpile',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stockpile/status
 * @desc Get stockpile service status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = articleStockpileService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting stockpile status:', error);
    res.status(500).json({
      error: 'Failed to get stockpile status',
      message: error.message
    });
  }
});

/**
 * @route POST /api/stockpile/fetch
 * @desc Manually trigger RSS fetch and stockpile
 * @access Admin only
 */
router.post('/fetch', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Trigger manual fetch
    await articleStockpileService.fetchAndStockpile();
    
    res.json({
      message: 'Stockpile fetch triggered successfully',
      status: articleStockpileService.getStatus(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error triggering stockpile fetch:', error);
    res.status(500).json({
      error: 'Failed to trigger stockpile fetch',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/dashboard
 * @desc Get comprehensive analytics dashboard data
 * @access Public
 */
router.get('/dashboard', async (req, res) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error generating dashboard analytics:', error);
    res.status(500).json({
      error: 'Failed to generate analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/sources
 * @desc Get source distribution analytics
 * @access Public
 */
router.get('/sources', async (req, res) => {
  try {
    const sourceDistribution = await analyticsService.getSourceDistribution();
    const sourceCredibility = await analyticsService.getSourceCredibilityComparison();
    
    res.json({
      distribution: sourceDistribution,
      credibility: sourceCredibility,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating source analytics:', error);
    res.status(500).json({
      error: 'Failed to generate source analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/bias
 * @desc Get bias analysis analytics
 * @access Public
 */
router.get('/bias', async (req, res) => {
  try {
    const biasAnalysis = await analyticsService.getBiasAnalysis();
    res.json(biasAnalysis);
  } catch (error) {
    console.error('Error generating bias analytics:', error);
    res.status(500).json({
      error: 'Failed to generate bias analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/sentiment
 * @desc Get sentiment trends analytics
 * @access Public
 */
router.get('/sentiment', async (req, res) => {
  try {
    const sentimentTrends = await analyticsService.getSentimentTrends();
    res.json(sentimentTrends);
  } catch (error) {
    console.error('Error generating sentiment analytics:', error);
    res.status(500).json({
      error: 'Failed to generate sentiment analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/topics
 * @desc Get top topics and keywords analytics
 * @access Public
 */
router.get('/topics', async (req, res) => {
  try {
    const topTopics = await analyticsService.getTopTopics();
    const entityAnalysis = await analyticsService.getEntityAnalysis();
    
    res.json({
      topics: topTopics,
      entities: entityAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating topic analytics:', error);
    res.status(500).json({
      error: 'Failed to generate topic analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/credibility
 * @desc Get credibility metrics analytics
 * @access Public
 */
router.get('/credibility', async (req, res) => {
  try {
    const credibilityMetrics = await analyticsService.getCredibilityMetrics();
    res.json(credibilityMetrics);
  } catch (error) {
    console.error('Error generating credibility analytics:', error);
    res.status(500).json({
      error: 'Failed to generate credibility analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/engagement
 * @desc Get user engagement analytics
 * @access Admin only
 */
router.get('/engagement', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userEngagement = await analyticsService.getUserEngagement();
    res.json(userEngagement);
  } catch (error) {
    console.error('Error generating engagement analytics:', error);
    res.status(500).json({
      error: 'Failed to generate engagement analytics',
      message: error.message
    });
  }
});

/**
 * @route POST /api/stockpile/interaction
 * @desc Track user interaction for analysis improvement
 * @access Private
 */
router.post('/interaction', authMiddleware, async (req, res) => {
  try {
    const { articleId, interactionType, feedback } = req.body;
    
    if (!articleId || !interactionType) {
      return res.status(400).json({
        error: 'articleId and interactionType are required'
      });
    }

    await articleStockpileService.trackUserInteraction(
      articleId,
      req.user.id,
      interactionType,
      feedback
    );

    res.json({
      message: 'Interaction tracked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error tracking user interaction:', error);
    res.status(500).json({
      error: 'Failed to track interaction',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/status
 * @desc Get analytics service status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = analyticsService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting analytics status:', error);
    res.status(500).json({
      error: 'Failed to get analytics status',
      message: error.message
    });
  }
});

export default router;
