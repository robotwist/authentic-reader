/**
 * AI Analysis Routes
 * 
 * Provides endpoints for AI-powered article analysis in production
 */

import express from 'express';
import productionAIService from '../services/productionAIService.js';
import industryLeadingAnalysisService from '../services/industryLeadingAnalysisService.js';
import crossSourceComparisonService from '../services/crossSourceComparisonService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/analyze
 * Analyze article with AI services
 */
router.post('/analyze', async (req, res) => {
  try {
    const { article, options = {} } = req.body;

    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article data is required',
        message: 'Please provide article with title and content'
      });
    }

    logger.info('Starting AI analysis for article:', article.title);

    const analysis = await productionAIService.analyzeArticle(article, options);

    res.json({
      success: true,
      analysis,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('AI analysis failed:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/ai/analyze-deep
 * Industry-leading comprehensive article analysis
 * Returns detailed analysis with logic scores, claim verification, etc.
 */
router.post('/analyze-deep', async (req, res) => {
  try {
    const { article, format = 'full' } = req.body;

    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article data is required',
        message: 'Please provide article with title and content'
      });
    }

    logger.info('Starting DEEP analysis for article:', article.title);

    const fullAnalysis = await industryLeadingAnalysisService.analyzeArticle(article);
    
    // Return in requested format
    const analysis = format === 'legacy' 
      ? industryLeadingAnalysisService.toLegacyFormat(fullAnalysis)
      : fullAnalysis;

    res.json({
      success: true,
      analysis,
      analysis_type: 'industry-leading',
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Deep analysis failed:', error);
    res.status(500).json({
      error: 'Deep analysis failed',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/ai/compare-sources
 * Cross-source comparison: See how different sources cover the same story
 * 
 * This is a KEY industry-leading feature that shows readers:
 * - How left/right/center sources frame the same story
 * - What each source emphasizes or omits
 * - Which source is most balanced
 */
router.post('/compare-sources', async (req, res) => {
  try {
    const { article, keywords } = req.body;

    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article data is required',
        message: 'Please provide article with title and content'
      });
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        error: 'Keywords required',
        message: 'Please provide at least one keyword to find related coverage'
      });
    }

    logger.info('Starting cross-source comparison for:', article.title);

    const comparison = await crossSourceComparisonService.compareStoryCoverage(article, keywords);

    res.json({
      success: true,
      comparison,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Cross-source comparison failed:', error);
    res.status(500).json({
      error: 'Cross-source comparison failed',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/ai/analyze-batch
 * Analyze multiple articles in batch
 */
router.post('/analyze-batch', async (req, res) => {
  try {
    const { articles, options = {} } = req.body;

    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        error: 'Articles array is required',
        message: 'Please provide an array of articles to analyze'
      });
    }

    logger.info(`Starting batch analysis for ${articles.length} articles`);

    const analyses = await Promise.allSettled(
      articles.map(article => productionAIService.analyzeArticle(article, options))
    );

    const results = analyses.map((result, index) => ({
      articleId: articles[index].id,
      success: result.status === 'fulfilled',
      analysis: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      results,
      summary: {
        total: articles.length,
        successful: successCount,
        failed: articles.length - successCount
      },
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Batch analysis failed:', error);
    res.status(500).json({
      error: 'Batch analysis failed',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/ai/health
 * Get AI services health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await productionAIService.getHealthStatus();

    res.json({
      success: true,
      health,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/ai/models
 * Get available AI models and their status
 */
router.get('/models', async (req, res) => {
  try {
    const models = {
      primary: {
        name: 'Ollama Llama 3:8b',
        status: 'available',
        capabilities: ['text-generation', 'summarization', 'analysis', 'bias-detection']
      },
      fallback: {
        name: 'Hugging Face Transformers',
        status: 'available',
        capabilities: ['classification', 'ner', 'sentiment-analysis']
      },
      basic: {
        name: 'Local ONNX Models',
        status: 'available',
        capabilities: ['basic-analysis', 'pattern-matching']
      }
    };

    res.json({
      success: true,
      models,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Models info failed:', error);
    res.status(500).json({
      error: 'Failed to get models info',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/ai/compare
 * Compare multiple articles using AI
 */
router.post('/compare', async (req, res) => {
  try {
    const { articles, comparisonType = 'bias' } = req.body;

    if (!Array.isArray(articles) || articles.length < 2) {
      return res.status(400).json({
        error: 'At least 2 articles required for comparison',
        message: 'Please provide an array of 2 or more articles'
      });
    }

    logger.info(`Starting ${comparisonType} comparison for ${articles.length} articles`);

    // Analyze each article first
    const analyses = await Promise.allSettled(
      articles.map(article => productionAIService.analyzeArticle(article))
    );

    const successfulAnalyses = analyses
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    if (successfulAnalyses.length < 2) {
      return res.status(400).json({
        error: 'Insufficient successful analyses for comparison',
        message: 'At least 2 articles must be successfully analyzed'
      });
    }

    // Perform comparison based on type
    let comparison;
    switch (comparisonType) {
      case 'bias':
        comparison = this.compareBias(successfulAnalyses);
        break;
      case 'sentiment':
        comparison = this.compareSentiment(successfulAnalyses);
        break;
      case 'credibility':
        comparison = this.compareCredibility(successfulAnalyses);
        break;
      default:
        comparison = this.compareGeneral(successfulAnalyses);
    }

    res.json({
      success: true,
      comparison,
      type: comparisonType,
      articlesCount: successfulAnalyses.length,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Comparison failed:', error);
    res.status(500).json({
      error: 'Comparison failed',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * Compare bias across articles
 */
function compareBias(analyses) {
  const biasScores = analyses.map((analysis, index) => ({
    articleIndex: index,
    bias: analysis.bias?.overall || 'unknown',
    confidence: analysis.confidence || 0
  }));

  return {
    type: 'bias',
    scores: biasScores,
    summary: {
      mostBiased: biasScores.reduce((max, current) => 
        current.confidence > max.confidence ? current : max),
      leastBiased: biasScores.reduce((min, current) => 
        current.confidence < min.confidence ? current : max),
      averageConfidence: biasScores.reduce((sum, score) => sum + score.confidence, 0) / biasScores.length
    }
  };
}

/**
 * Compare sentiment across articles
 */
function compareSentiment(analyses) {
  const sentimentScores = analyses.map((analysis, index) => ({
    articleIndex: index,
    sentiment: analysis.sentiment?.label || 'neutral',
    score: analysis.sentiment?.score || 0,
    confidence: analysis.sentiment?.confidence || 0
  }));

  return {
    type: 'sentiment',
    scores: sentimentScores,
    summary: {
      mostPositive: sentimentScores.reduce((max, current) => 
        current.score > max.score ? current : max),
      mostNegative: sentimentScores.reduce((min, current) => 
        current.score < min.score ? current : min),
      averageScore: sentimentScores.reduce((sum, score) => sum + score.score, 0) / sentimentScores.length
    }
  };
}

/**
 * Compare credibility across articles
 */
function compareCredibility(analyses) {
  const credibilityScores = analyses.map((analysis, index) => ({
    articleIndex: index,
    credibility: analysis.credibility?.overall || 'unknown',
    score: analysis.credibility?.score || 0
  }));

  return {
    type: 'credibility',
    scores: credibilityScores,
    summary: {
      mostCredible: credibilityScores.reduce((max, current) => 
        current.score > max.score ? current : max),
      leastCredible: credibilityScores.reduce((min, current) => 
        current.score < min.score ? current : min),
      averageScore: credibilityScores.reduce((sum, score) => sum + score.score, 0) / credibilityScores.length
    }
  };
}

/**
 * General comparison across all metrics
 */
function compareGeneral(analyses) {
  return {
    type: 'general',
    bias: compareBias(analyses),
    sentiment: compareSentiment(analyses),
    credibility: compareCredibility(analyses),
    summary: {
      totalArticles: analyses.length,
      averageConfidence: analyses.reduce((sum, analysis) => sum + (analysis.confidence || 0), 0) / analyses.length
    }
  };
}

export default router;
