import express from 'express';
import { DailyBriefingArticle } from '../models/index.js';

const router = express.Router();

/**
 * Helper: Determine if error is a database connection/availability issue
 * Returns true for database connection errors, false for other errors
 */
function isDatabaseError(error) {
  if (!error) return false;
  
  // Sequelize connection errors
  if (error.name === 'SequelizeConnectionError' || 
      error.name === 'SequelizeConnectionRefusedError' ||
      error.name === 'SequelizeHostNotFoundError' ||
      error.name === 'SequelizeHostNotReachableError' ||
      error.name === 'SequelizeInvalidConnectionError' ||
      error.name === 'SequelizeConnectionTimedOutError') {
    return true;
  }
  
  // Generic connection errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EHOSTUNREACH') {
    return true;
  }
  
  // Database unavailable errors
  if (error.message && (
      error.message.includes('Connection refused') ||
      error.message.includes('database') && error.message.includes('does not exist') ||
      error.message.includes('timeout') && error.message.includes('connection') ||
      error.message.includes('Unable to connect')
  )) {
    return true;
  }
  
  return false;
}

/**
 * Helper: Convert DB articles to API format
 * Transforms fallacies from JSONB to match frontend expectations
 */
function toApiFormat(articles, isArchive = false) {
  if (!articles || articles.length === 0) return null;

  const topics = {};

  for (const article of articles) {
    // Transform fallacies to match frontend structure
    // Frontend expects: analysis.manipulationAnalysis.logicalFallacies as array
    const fallaciesData = article.fallacies || {};
    let logicalFallacies = [];
    
    // Handle different possible structures of fallacies data
    if (fallaciesData.manipulationAnalysis?.logicalFallacies) {
      // Already in expected format
      logicalFallacies = fallaciesData.manipulationAnalysis.logicalFallacies;
    } else if (fallaciesData.logicalFallacies) {
      // Direct logicalFallacies array
      logicalFallacies = Array.isArray(fallaciesData.logicalFallacies) 
        ? fallaciesData.logicalFallacies 
        : [];
    } else if (Array.isArray(fallaciesData)) {
      // Fallacies is already an array
      logicalFallacies = fallaciesData;
    } else if (typeof fallaciesData === 'object') {
      // Try to extract fallacies from nested structure
      const keys = Object.keys(fallaciesData);
      if (keys.length > 0) {
        // Convert object to array format if needed
        logicalFallacies = Object.values(fallaciesData).filter(item => 
          item && typeof item === 'object' && (item.type || item.name)
        );
      }
    }

    // Build analysis object matching frontend expectations
    const analysis = {
      manipulationAnalysis: {
        logicalFallacies: logicalFallacies.map((fallacy, index) => ({
          type: fallacy.type || fallacy.name || 'Unknown',
          location: fallacy.location || fallacy.excerpt || fallacy.quote || '',
          explanation: fallacy.explanation || fallacy.description || ''
        }))
      },
      overallAssessment: {
        reliabilityScore: article.reliabilityScore || fallaciesData.overallAssessment?.reliabilityScore || null
      }
    };

    // Preserve other analysis fields if they exist
    if (fallaciesData.keySentences) {
      analysis.keySentences = fallaciesData.keySentences;
    }

    topics[article.topic] = {
      topic: article.topicLabel,
      icon: article.icon,
      article: {
        title: article.headline,
        url: article.url,
        source: article.source,
        publishDate: article.publishDate?.toISOString() || null,
        author: article.author,
        content: article.content
      },
      analysis
    };
  }

  return {
    generatedAt: articles[0]?.createdAt?.toISOString() || new Date().toISOString(),
    version: '2.0',
    isArchive,
    briefingDate: articles[0]?.briefingDate || null,
    topics
  };
}

/**
 * GET /api/daily-briefing
 * Get today's briefing from Postgres database
 */
router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dbArticles = await DailyBriefingArticle.findAll({
      where: { briefingDate: today },
      order: [['topic', 'ASC']]
    });

    if (!dbArticles || dbArticles.length === 0) {
      return res.status(404).json({ 
        error: 'Daily briefing not found',
        message: 'Daily briefing has not been generated yet.'
      });
    }

    res.json(toApiFormat(dbArticles, false));
  } catch (error) {
    console.error('Error fetching daily briefing:', error);
    
    // Return 503 (Service Unavailable) for database errors, 500 for other errors
    if (isDatabaseError(error)) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Database connection failed. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch daily briefing',
      message: error.message
    });
  }
});

/**
 * GET /api/daily-briefing/latest
 * Get the most recent briefing from DB
 */
router.get('/latest', async (req, res) => {
  try {
    // Get the most recent date
    const latestArticle = await DailyBriefingArticle.findOne({
      order: [['briefingDate', 'DESC']]
    });

    if (!latestArticle) {
      return res.status(404).json({ 
        error: 'No briefings found',
        message: 'No daily briefings have been saved yet.'
      });
    }

    // Get all articles for that date
    const articles = await DailyBriefingArticle.findAll({
      where: { briefingDate: latestArticle.briefingDate },
      order: [['topic', 'ASC']]
    });

    res.json(toApiFormat(articles, false));
  } catch (error) {
    console.error('Error fetching latest briefing:', error);
    
    // Return 503 (Service Unavailable) for database errors, 500 for other errors
    if (isDatabaseError(error)) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Database connection failed. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch latest briefing',
      message: error.message
    });
  }
});

/**
 * GET /api/daily-briefing/archive
 * Get list of available archive dates
 */
router.get('/archive', async (req, res) => {
  try {
    const results = await DailyBriefingArticle.findAll({
      attributes: ['briefingDate'],
      group: ['briefingDate'],
      order: [['briefingDate', 'DESC']],
      raw: true
    });

    const dates = results.map(r => ({
      date: r.briefingDate,
      formatted: new Date(r.briefingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }));

    res.json({
      count: dates.length,
      dates
    });
  } catch (error) {
    console.error('Error fetching archive dates:', error);
    
    // Return 503 (Service Unavailable) for database errors, 500 for other errors
    if (isDatabaseError(error)) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Database connection failed. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch archive',
      message: error.message
    });
  }
});

/**
 * GET /api/daily-briefing/archive/:date
 * Get briefing for a specific date
 */
router.get('/archive/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    const articles = await DailyBriefingArticle.findAll({
      where: { briefingDate: date },
      order: [['topic', 'ASC']]
    });

    if (!articles || articles.length === 0) {
      return res.status(404).json({
        error: 'Briefing not found',
        message: `No briefing found for ${date}`
      });
    }

    res.json(toApiFormat(articles, true));
  } catch (error) {
    console.error('Error fetching archive briefing:', error);
    
    // Return 503 (Service Unavailable) for database errors, 500 for other errors
    if (isDatabaseError(error)) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Database connection failed. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch archive briefing',
      message: error.message
    });
  }
});

/**
 * POST /api/daily-briefing/save
 * Save today's briefing to the database (called by worker/cron)
 */
router.post('/save', async (req, res) => {
  try {
    const briefingData = req.body;

    if (!briefingData || !briefingData.topics) {
      return res.status(400).json({
        error: 'Invalid briefing data',
        message: 'Request body must contain topics object'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const results = [];

    for (const [topicKey, topicData] of Object.entries(briefingData.topics)) {
      // Upsert each article
      const [article, created] = await DailyBriefingArticle.upsert({
        briefingDate: today,
        topic: topicKey,
        topicLabel: topicData.topic,
        icon: topicData.icon,
        headline: topicData.article?.title || 'Untitled',
        source: topicData.article?.source || 'Unknown',
        author: topicData.article?.author || null,
        url: topicData.article?.url || null,
        content: topicData.article?.content || '',
        publishDate: topicData.article?.publishDate ? new Date(topicData.article.publishDate) : null,
        fallacies: topicData.analysis || {},
        reliabilityScore: topicData.analysis?.overallAssessment?.reliabilityScore || null
      });

      results.push({ topic: topicKey, created });
    }

    res.json({
      success: true,
      message: `Saved ${results.length} articles for ${today}`,
      results
    });
  } catch (error) {
    console.error('Error saving briefing:', error);
    
    // Return 503 (Service Unavailable) for database errors, 500 for other errors
    if (isDatabaseError(error)) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Database connection failed. Unable to save briefing.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to save briefing',
      message: error.message
    });
  }
});

export default router;

