import express from 'express';
import { fetchAndProcessFeeds, getLatestArticles } from '../services/rss-service.js';
import { ArticleModel, SourceModel } from '../models/index.js';

const router = express.Router();

// Get latest articles
router.get('/', async (req, res) => {
  try {
    const articles = await ArticleModel.findAll({
      include: [{
        model: SourceModel,
        attributes: ['name', 'bias', 'reliability']
      }],
      order: [['pubDate', 'DESC']],
      limit: 50
    });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await ArticleModel.findByPk(req.params.id, {
      include: [{
        model: SourceModel,
        attributes: ['name', 'bias', 'reliability']
      }]
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Trigger RSS feed processing
router.post('/fetch', async (req, res) => {
  try {
    const newArticles = await fetchAndProcessFeeds();
    res.json({
      message: 'RSS feeds processed successfully',
      newArticles: newArticles.length
    });
  } catch (error) {
    console.error('Error processing RSS feeds:', error);
    res.status(500).json({ error: 'Failed to process RSS feeds' });
  }
});

export default router; 