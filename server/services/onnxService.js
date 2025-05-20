/**
 * ONNX Runtime Service
 * 
 * This service manages ONNX model loading, inference, and fallback to original models.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import winston from 'winston';
import { fileURLToPath } from 'url';
// Import ort statically
import * as ort from 'onnxruntime-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure default values in case config is not available
const defaultConfig = {
  directories: {
    modelsDir: './models/onnx',
    cacheDir: './models/onnx/cache',
    tempDir: './models/onnx/temp',
  },
  models: {
    ner: { onnxPath: './models/onnx/ner-model.onnx', originalModelId: 'dbmdz/bert-large-cased-finetuned-conll03-english', fallbackToOriginal: true },
    zeroShot: { onnxPath: './models/onnx/zero-shot-model.onnx', originalModelId: 'facebook/bart-large-mnli', fallbackToOriginal: true },
    sentiment: { onnxPath: './models/onnx/sentiment-model.onnx', originalModelId: 'distilbert-base-uncased-finetuned-sst-2-english', fallbackToOriginal: true }
  },
  runtime: {
    numThreads: 4,
    executionProviders: ['cpu'],
    optLevel: 3,
    graphOptimization: true,
    memoryLimit: 0
  },
  monitoring: {
    logLevel: 'info',
    enableProfiling: false,
    enableMetrics: false
  }
};

// Try to load config or use defaults
let onnxConfig;
try {
  onnxConfig = await import('../config/onnx.config.js');
  onnxConfig = onnxConfig.default;
} catch (err) {
  console.warn('ONNX config not found, using defaults');
  onnxConfig = defaultConfig;
}

// Setup logging
const logger = winston.createLogger({
  level: onnxConfig.monitoring.logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'onnx-service.log' })
  ]
});

class ONNXService {
  constructor() {
    this.sessionCache = new Map();
    this.modelStatus = new Map();
    this.initialized = false;
    // Check if 'ort' object and necessary properties exist
    this.available = !!(ort && ort.InferenceSession && ort.InferenceSession.SessionOptions);

    if (!this.available) {
      logger.warn('ONNX Runtime is not available or failed to load correctly, service will be in limited mode');
      // Log the 'ort' object for debugging if it exists but is incomplete
      if (ort) {
        logger.warn('Loaded \'ort\' object contents:', Object.keys(ort));
        if (ort.InferenceSession) {
          logger.warn('Loaded \'ort.InferenceSession\' object contents:', Object.keys(ort.InferenceSession));
        } else {
          logger.warn('ort.InferenceSession is undefined');
        }
      } else {
        logger.warn('\'ort\' object is null or undefined');
      }
      return;
    }
    
    this.initializeDirectories();
    
    try {
      // Configure ONNX runtime based on settings
      const sessionOptions = new ort.InferenceSession.SessionOptions();
      
      if (onnxConfig.runtime.graphOptimization) {
        sessionOptions.graphOptimizationLevel = onnxConfig.runtime.optLevel;
      }
      
      if (onnxConfig.runtime.numThreads > 0) {
        sessionOptions.intraOpNumThreads = onnxConfig.runtime.numThreads;
      }
      
      if (onnxConfig.monitoring.enableProfiling) {
        sessionOptions.enableProfiling = true;
      }
      
      this.sessionOptions = sessionOptions;
      this.executionProviders = onnxConfig.runtime.executionProviders;
      
      this.initialized = true;
      logger.info('ONNX Service initialized');
    } catch (err) {
      logger.error('Failed to initialize ONNX Service:', err);
      this.available = false;
    }
  }
  
  /**
   * Initialize directories needed for ONNX models
   */
  async initializeDirectories() {
    if (!this.available) return;
    
    const mkdir = promisify(fs.mkdir);
    
    for (const dir of Object.values(onnxConfig.directories)) {
      try {
        await mkdir(dir, { recursive: true });
        logger.debug(`Created directory: ${dir}`);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          logger.error(`Error creating directory ${dir}:`, err);
        }
      }
    }
  }

  /**
   * Refresh models (for after conversion)
   */
  async refreshModels() {
    if (!this.available) return false;
    
    // Simply reset the status cache
    this.modelStatus = new Map();
    return true;
  }
  
  /**
   * Check if ONNX model exists
   */
  modelExists(modelName) {
    if (!this.available) return false;
    
    try {
      const modelConfig = onnxConfig.models[modelName];
      if (!modelConfig) {
        logger.error(`No configuration found for model: ${modelName}`);
        return false;
      }
      
      return fs.existsSync(modelConfig.onnxPath);
    } catch (err) {
      logger.error(`Error checking model existence for ${modelName}:`, err);
      return false;
    }
  }
  
  /**
   * Load an ONNX model for inference
   */
  async loadModel(modelName) {
    if (!this.available) return null;
    
    try {
      // Return cached session if available
      if (this.sessionCache.has(modelName)) {
        return this.sessionCache.get(modelName);
      }
      
      const modelConfig = onnxConfig.models[modelName];
      if (!modelConfig) {
        throw new Error(`No configuration found for model: ${modelName}`);
      }
      
      // Check if model file exists
      if (!fs.existsSync(modelConfig.onnxPath)) {
        throw new Error(`ONNX model file not found: ${modelConfig.onnxPath}`);
      }
      
      logger.info(`Loading ONNX model: ${modelName} from ${modelConfig.onnxPath}`);
      
      // Load the model
      const session = await ort.InferenceSession.create(
        modelConfig.onnxPath,
        this.sessionOptions
      );
      
      // Cache the session
      this.sessionCache.set(modelName, session);
      this.modelStatus.set(modelName, { loaded: true, lastUsed: Date.now() });
      
      logger.info(`Successfully loaded ONNX model: ${modelName}`);
      return session;
    } catch (err) {
      logger.error(`Failed to load ONNX model ${modelName}:`, err);
      this.modelStatus.set(modelName, { loaded: false, error: err.message });
      return null;
    }
  }
  
  /**
   * Run inference with a specified model
   */
  async runInference(modelName, inputs) {
    if (!this.available) {
      throw new Error('ONNX Runtime is not available');
    }
    
    // Try to load model if not already loaded
    const session = await this.loadModel(modelName);
    
    if (!session) {
      throw new Error(`Could not load model: ${modelName}`);
    }
    
    try {
      // Convert inputs to tensors (simplified - would need actual conversion)
      // This is a placeholder for actual tensor conversion
      // You would need to adapt this based on your model's expectations
      const feeds = {
        input: new ort.Tensor('string', [inputs.text])
      };
      
      // Run model
      const results = await session.run(feeds);
      
      // Process results (simplified)
      // In a real implementation, you would need to convert tensor outputs
      // to usable JavaScript objects
      return {
        raw: results,
        processed: {
          // Process results based on model type
          // This is a placeholder
          result: "Results would be processed here"
        }
      };
    } catch (err) {
      logger.error(`Inference error with model ${modelName}:`, err);
      throw err;
    }
  }
  
  /**
   * Get detailed information about a model
   */
  async getModelInfo(modelName) {
    if (!this.available) return null;
    
    try {
      const modelExists = this.modelExists(modelName);
      
      if (!modelExists) {
        return null;
      }
      
      const modelConfig = onnxConfig.models[modelName];
      const status = await this.getModelStatus(modelName);
      
      return {
        name: modelName,
        path: modelConfig.onnxPath,
        originalModelId: modelConfig.originalModelId,
        fallbackEnabled: modelConfig.fallbackToOriginal,
        status
      };
    } catch (err) {
      logger.error(`Error getting model info for ${modelName}:`, err);
      return null;
    }
  }
  
  /**
   * Get status of all configured models
   */
  getAllModelStatus() {
    if (!this.available) {
      return { available: false, reason: 'ONNX Runtime not available' };
    }
    
    const status = {};
    
    // Check status for each configured model
    for (const [modelName, modelConfig] of Object.entries(onnxConfig.models)) {
      const exists = fs.existsSync(modelConfig.onnxPath);
      const loaded = this.sessionCache.has(modelName);
      
      status[modelName] = {
        exists,
        loaded,
        path: modelConfig.onnxPath,
        originalModelId: modelConfig.originalModelId,
        lastUsed: loaded ? this.modelStatus.get(modelName)?.lastUsed : null
      };
    }
    
    return status;
  }
  
  /**
   * Get status for a specific model
   */
  async getModelStatus(modelName) {
    if (!this.available) {
      return { available: false, reason: 'ONNX Runtime not available' };
    }
    
    // Get model config
    const modelConfig = onnxConfig.models[modelName];
    if (!modelConfig) {
      throw new Error(`No configuration found for model: ${modelName}`);
    }
    
    const exists = fs.existsSync(modelConfig.onnxPath);
    const loaded = this.sessionCache.has(modelName);
    
    return {
      exists,
      loaded,
      path: modelConfig.onnxPath,
      originalModelId: modelConfig.originalModelId,
      lastUsed: loaded ? this.modelStatus.get(modelName)?.lastUsed : null
    };
  }
  
  /**
   * Unload a model from memory
   */
  async unloadModel(modelName) {
    if (!this.available) return false;
    
    try {
      if (!this.sessionCache.has(modelName)) {
        logger.warn(`Model ${modelName} is not loaded, nothing to unload`);
        return false;
      }
      
      // Delete from cache (garbage collector will free memory)
      this.sessionCache.delete(modelName);
      
      if (this.modelStatus.has(modelName)) {
        const status = this.modelStatus.get(modelName);
        status.loaded = false;
        status.unloadedAt = Date.now();
        this.modelStatus.set(modelName, status);
      }
      
      logger.info(`Unloaded model ${modelName}`);
      return true;
    } catch (err) {
      logger.error(`Error unloading model ${modelName}:`, err);
      return false;
    }
  }
}

// Export singleton instance
const onnxService = new ONNXService();
export default onnxService; 