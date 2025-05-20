/**
 * Admin routes for ONNX model management
 */
import express from 'express';
import { adminRequired } from '../../middleware/auth.js';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import winston from 'winston';
import onnxService from '../../services/onnxService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'onnx-admin-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * @route POST /api/admin/onnx/convert
 * @desc Convert a Hugging Face model to ONNX format
 * @access Private (Admin only)
 */
router.post('/convert', async (req, res) => {
  try {
    const { modelType, modelId, quantize = true, optimizationLevel = 3 } = req.body;

    // Validate required fields
    if (!modelType || !modelId) {
      return res.status(400).json({
        success: false,
        message: 'Model type and model ID are required'
      });
    }

    // Validate model type
    const validModelTypes = ['ner', 'zeroShot', 'sentiment'];
    if (!validModelTypes.includes(modelType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid model type. Must be one of: ${validModelTypes.join(', ')}`
      });
    }

    // Validate optimization level
    if (optimizationLevel < 0 || optimizationLevel > 3) {
      return res.status(400).json({
        success: false,
        message: 'Optimization level must be between 0 and 3'
      });
    }

    logger.info(`Starting conversion of ${modelId} to ONNX format as ${modelType} model`);

    // Start the conversion process
    const scriptPath = path.join(__dirname, '../../tools/convertToONNX.js');
    
    // Prepare arguments for the conversion script
    const args = [
      scriptPath,
      '--model-type', modelType,
      '--model-id', modelId,
      '--optimization-level', optimizationLevel.toString()
    ];
    
    if (quantize) {
      args.push('--quantize');
    }
    
    logger.debug(`Executing conversion script with args: ${args.join(' ')}`);
    
    // Send an initial response that the process has started
    res.status(202).json({
      success: true,
      message: 'Model conversion started',
      status: 'processing',
      modelId,
      modelType
    });
    
    // Execute the conversion script
    const conversionProcess = spawn('node', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdoutData = '';
    let stderrData = '';
    
    // Collect stdout data
    conversionProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      logger.debug(`Conversion stdout: ${data.toString().trim()}`);
    });
    
    // Collect stderr data
    conversionProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      logger.error(`Conversion stderr: ${data.toString().trim()}`);
    });
    
    // Handle process completion
    conversionProcess.on('close', async (code) => {
      if (code === 0) {
        logger.info(`Successfully converted ${modelId} to ONNX format`);
        
        // Refresh the ONNX service to recognize the new model
        try {
          await onnxService.refreshModels();
        } catch (refreshError) {
          logger.error('Error refreshing ONNX models after conversion:', refreshError);
        }
      } else {
        logger.error(`Model conversion failed with code ${code}`);
        logger.error(`Error output: ${stderrData}`);
      }
    });
  } catch (error) {
    logger.error('Error in model conversion route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during model conversion',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/onnx/models
 * @desc Get all ONNX models with detailed information
 * @access Private (Admin only)
 */
router.get('/models', async (req, res) => {
  try {
    const modelStatus = await onnxService.getAllModelStatus();
    
    // Get detailed info for each model
    const modelsWithDetails = {};
    for (const [modelName, status] of Object.entries(modelStatus)) {
      if (status.exists) {
        try {
          const modelInfo = await onnxService.getModelInfo(modelName);
          modelsWithDetails[modelName] = {
            ...status,
            info: modelInfo
          };
        } catch (infoError) {
          modelsWithDetails[modelName] = {
            ...status,
            info: null,
            infoError: infoError.message
          };
        }
      } else {
        modelsWithDetails[modelName] = status;
      }
    }
    
    res.json({
      success: true,
      models: modelsWithDetails
    });
  } catch (error) {
    logger.error('Error getting ONNX models:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving ONNX models',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/admin/onnx/models/:modelName
 * @desc Delete an ONNX model
 * @access Private (Admin only)
 */
router.delete('/models/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    
    // Check if model exists
    const modelExists = await onnxService.modelExists(modelName);
    if (!modelExists) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelName} not found`
      });
    }
    
    // Unload the model if it's loaded
    try {
      await onnxService.unloadModel(modelName);
    } catch (unloadError) {
      logger.warn(`Error unloading model ${modelName}:`, unloadError);
      // Continue with deletion even if unloading fails
    }
    
    // Delete the model file
    const modelStatus = await onnxService.getModelStatus(modelName);
    await fs.unlink(modelStatus.path);
    
    // Refresh the ONNX service to update model status
    await onnxService.refreshModels();
    
    res.json({
      success: true,
      message: `Model ${modelName} deleted successfully`
    });
  } catch (error) {
    logger.error(`Error deleting ONNX model ${req.params.modelName}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting ONNX model',
      error: error.message
    });
  }
});

export default router; 