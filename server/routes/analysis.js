import express from 'express';
import { analyzeArticle, analyzeUnanalyzedArticles } from '../services/analysis-service.js';
import { ArticleAnalysisModel } from '../models/index.js';

const router = express.Router();

// Get analysis for a specific article
router.get('/article/:id', async (req, res) => {
  try {
    const analysis = await ArticleAnalysisModel.findOne({
      where: { articleId: req.params.id }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Analyze a specific article
router.post('/article/:id', async (req, res) => {
  try {
    const analysis = await analyzeArticle(req.params.id);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing article:', error);
    res.status(500).json({ error: 'Failed to analyze article' });
  }
});

// Analyze all unanalyzed articles
router.post('/batch', async (req, res) => {
  try {
    const results = await analyzeUnanalyzedArticles();
    res.json({
      message: 'Batch analysis completed',
      analyzedCount: results.length
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({ error: 'Failed to perform batch analysis' });
  }
});

// Placeholder analysis routes
router.post('/text', (req, res) => {
  res.json({ message: 'Text analysis endpoint (placeholder)' });
});

router.post('/article', (req, res) => {
  res.json({ message: 'Article analysis endpoint (placeholder)' });
});

export default router; 