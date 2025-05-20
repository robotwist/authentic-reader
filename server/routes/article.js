import express from 'express';
import * as articleController from '../controllers/articleController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/public', optionalAuthenticate, articleController.getPublicArticles);
router.get('/public/:id', optionalAuthenticate, articleController.getPublicArticle);

// Protected routes
router.use(authenticate);
router.get('/', articleController.getUserArticles);
router.post('/', articleController.createArticle);
router.get('/bookmarks', articleController.getBookmarkedArticles);
router.get('/:id', articleController.getArticle);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.post('/:id/bookmark', articleController.bookmarkArticle);
router.delete('/:id/bookmark', articleController.removeBookmark);

export default router; 