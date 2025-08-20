/**
 * ONNX Controller
 * 
 * Handles API routes for ONNX model inference and management.
 */
import onnxService from '../services/onnxService.js';

/**
 * Analyze sentiment of the provided text using ONNX runtime
 */
export const analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required for sentiment analysis' 
      });
    }
    
    // Check if the ONNX service is available
    if (!onnxService.available) {
      return res.status(503).json({ 
        success: false, 
        error: 'ONNX runtime is not available' 
      });
    }
    
    // Prepare inputs for the model
    const inputs = {
      text: text
    };
    
    // Run inference
    const result = await onnxService.runInference('sentiment', inputs);
    
    res.json({
      success: true,
      sentiment: result
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
};

/**
 * Extract named entities from the provided text using ONNX runtime
 */
export const extractEntities = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required for entity extraction' 
      });
    }
    
    // Check if the ONNX service is available
    if (!onnxService.available) {
      return res.status(503).json({ 
        success: false, 
        error: 'ONNX runtime is not available' 
      });
    }
    
    // Prepare inputs for the model
    const inputs = {
      text: text
    };
    
    // Run inference
    const result = await onnxService.runInference('ner', inputs);
    
    res.json({
      success: true,
      entities: result
    });
  } catch (error) {
    console.error('Entity extraction error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to extract entities',
      message: error.message
    });
  }
};

/**
 * Perform zero-shot classification on the provided text using ONNX runtime
 */
export const zeroShotClassification = async (req, res) => {
  try {
    const { text, labels } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required for classification' 
      });
    }
    
    if (!labels || !Array.isArray(labels) || labels.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Labels array is required for classification' 
      });
    }
    
    // Check if the ONNX service is available
    if (!onnxService.available) {
      return res.status(503).json({ 
        success: false, 
        error: 'ONNX runtime is not available' 
      });
    }
    
    // Prepare inputs for the model
    const inputs = {
      text: text,
      labels: labels
    };
    
    // Run inference
    const result = await onnxService.runInference('zeroShot', inputs);
    
    res.json({
      success: true,
      classifications: result
    });
  } catch (error) {
    console.error('Zero-shot classification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform classification',
      message: error.message
    });
  }
};

/**
 * Get a list of all available ONNX models
 */
export const getAvailableModels = async (req, res) => {
  try {
    // Check if the ONNX service is available
    if (!onnxService.available) {
      return res.status(503).json({ 
        success: false, 
        error: 'ONNX runtime is not available' 
      });
    }
    
    const models = onnxService.getAllModelStatus();
    
    res.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error getting available models:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get available models',
      message: error.message
    });
  }
};

/**
 * Get information about a specific ONNX model
 */
export const getModelInfo = async (req, res) => {
  try {
    const { modelName } = req.params;
    
    if (!modelName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model name is required' 
      });
    }
    
    // Check if the ONNX service is available
    if (!onnxService.available) {
      return res.status(503).json({ 
        success: false, 
        error: 'ONNX runtime is not available' 
      });
    }
    
    const modelInfo = await onnxService.getModelInfo(modelName);
    
    if (!modelInfo) {
      return res.status(404).json({ 
        success: false, 
        error: `Model "${modelName}" not found or info not available` 
      });
    }
    
    res.json({
      success: true,
      modelInfo
    });
  } catch (error) {
    console.error(`Error getting model info for ${req.params.modelName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get model information',
      message: error.message
    });
  }
}; 