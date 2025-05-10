/**
 * ONNX API Routes
 * 
 * This module provides routes for managing and using ONNX models
 */

const express = require('express');
const router = express.Router();
const onnxService = require('../services/onnxService');
const onnxConfig = require('../config/onnx.config');
const { authenticate } = require('../middleware/auth');

/**
 * @route GET /api/onnx/status
 * @desc Get status of all ONNX models
 * @access Public
 */
router.get('/status', (req, res) => {
  try {
    const status = onnxService.getAllModelStatus();
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route GET /api/onnx/model/:modelName/info
 * @desc Get information about a specific ONNX model
 * @access Public
 */
router.get('/model/:modelName/info', async (req, res) => {
  try {
    const { modelName } = req.params;
    
    if (!onnxConfig.models[modelName]) {
      return res.status(404).json({ success: false, error: `Model "${modelName}" not found` });
    }
    
    const modelInfo = await onnxService.getModelInfo(modelName);
    
    if (!modelInfo) {
      return res.status(404).json({ success: false, error: `Model "${modelName}" info not available` });
    }
    
    res.json({ success: true, modelInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/onnx/model/:modelName/unload
 * @desc Unload a model from memory
 * @access Admin only
 */
router.post('/model/:modelName/unload', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { modelName } = req.params;
    
    if (!onnxConfig.models[modelName]) {
      return res.status(404).json({ success: false, error: `Model "${modelName}" not found` });
    }
    
    const success = await onnxService.unloadModel(modelName);
    
    if (!success) {
      return res.status(400).json({ success: false, error: `Model "${modelName}" was not loaded or could not be unloaded` });
    }
    
    res.json({ success: true, message: `Model "${modelName}" unloaded successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/onnx/ner
 * @desc Run Named Entity Recognition inference
 * @access Public
 */
router.post('/ner', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }
    
    // This is a placeholder for the actual implementation
    // In a real implementation, you would:
    // 1. Tokenize the input text
    // 2. Convert to tensor
    // 3. Run inference with ONNX
    // 4. Process the results
    
    // Placeholder response
    res.json({
      success: true,
      message: 'NER inference with ONNX is not yet implemented',
      // In the actual implementation, you would return the entities here
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/onnx/zero-shot
 * @desc Run Zero-Shot Classification inference
 * @access Public
 */
router.post('/zero-shot', async (req, res) => {
  try {
    const { text, labels } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }
    
    if (!labels || !Array.isArray(labels) || labels.length === 0) {
      return res.status(400).json({ success: false, error: 'Labels array is required' });
    }
    
    // This is a placeholder for the actual implementation
    // In a real implementation, you would:
    // 1. Format the input for zero-shot classification
    // 2. Run inference with ONNX
    // 3. Process the results
    
    // Placeholder response
    res.json({
      success: true,
      message: 'Zero-Shot Classification with ONNX is not yet implemented',
      // In the actual implementation, you would return the classification results here
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/onnx/sentiment
 * @desc Run Sentiment Analysis inference
 * @access Public
 */
router.post('/sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }
    
    // This is a placeholder for the actual implementation
    // In a real implementation, you would:
    // 1. Tokenize the input text
    // 2. Convert to tensor
    // 3. Run inference with ONNX
    // 4. Process the sentiment results
    
    // Placeholder response
    res.json({
      success: true,
      message: 'Sentiment Analysis with ONNX is not yet implemented',
      // In the actual implementation, you would return the sentiment results here
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 