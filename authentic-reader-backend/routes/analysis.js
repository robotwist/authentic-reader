import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import * as analysisController from '../controllers/analysisController.js';

const router = express.Router();

// Public routes with optional authentication
router.get('/public', optionalAuthenticate, analysisController.getPublicAnalyses);
router.get('/public/:id', optionalAuthenticate, analysisController.getPublicAnalysis);

// Protected routes
router.use(authenticate);
router.get('/', analysisController.getUserAnalyses);
router.post('/', analysisController.createAnalysis);
router.get('/:id', analysisController.getAnalysis);
router.put('/:id', analysisController.updateAnalysis);
router.delete('/:id', analysisController.deleteAnalysis);

// Analysis operations
router.post('/:id/bias', analysisController.addBiasTag);
router.delete('/:id/bias/:tagId', analysisController.removeBiasTag);
router.post('/:id/share', analysisController.shareAnalysis);
router.delete('/:id/share/:userId', analysisController.unshareAnalysis);

export default router; 