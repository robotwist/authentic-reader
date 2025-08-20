/**
 * ONNX API Routes
 * Routes for accessing ONNX inference services
 */
import express from 'express';
import { optionalAuthenticate } from '../middleware/auth.js';
import * as onnxController from '../controllers/onnxController.js';

const router = express.Router();

// All routes support optional authentication
router.use(optionalAuthenticate);

// Analysis endpoints
router.post('/analyze/sentiment', onnxController.analyzeSentiment);
router.post('/analyze/entities', onnxController.extractEntities);
router.post('/analyze/zero-shot', onnxController.zeroShotClassification);

// Model information endpoints
router.get('/models', onnxController.getAvailableModels);
router.get('/models/:modelName', onnxController.getModelInfo);

export default router; 