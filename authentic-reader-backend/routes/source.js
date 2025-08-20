import express from 'express';
import * as sourceController from '../controllers/sourceController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/public', optionalAuthenticate, sourceController.getPublicSources);
router.get('/public/:id', optionalAuthenticate, sourceController.getPublicSource);

// Protected routes
router.use(authenticate);
router.get('/', sourceController.getUserSources);
router.post('/', sourceController.createSource);
router.get('/:id', sourceController.getSource);
router.put('/:id', sourceController.updateSource);
router.delete('/:id', sourceController.deleteSource);
router.post('/:id/subscribe', sourceController.subscribeToSource);
router.delete('/:id/subscribe', sourceController.unsubscribeFromSource);

export default router; 