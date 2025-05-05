const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// Public routes with optional authentication
router.get('/source/:id', optionalAuthenticate, articleController.fetchArticlesFromSource);
router.get('/', optionalAuthenticate, articleController.getAllArticles);

// User-specific routes
router.get('/saved', authenticate, articleController.getSavedArticles);
router.post('/read', authenticate, articleController.markAsRead);
router.post('/save', authenticate, articleController.saveArticle);

// Analysis routes
router.get('/:id/analysis', optionalAuthenticate, articleController.getArticleAnalysis);
router.post('/analysis', optionalAuthenticate, articleController.createArticleAnalysis);
router.get('/guid/:guid/analysis', optionalAuthenticate, articleController.getArticleAnalysis);

// Route to fetch and extract full article content
router.get('/extract', optionalAuthenticate, articleController.extractFullArticleContent);

module.exports = router; 