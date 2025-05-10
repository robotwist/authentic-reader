/**
 * ONNX Runtime Service
 * 
 * This service manages ONNX model loading, inference, and fallback to original models.
 */

const fs = require('fs');
const path = require('path');
let ort;

try {
  ort = require('onnxruntime-node');
} catch (err) {
  console.warn('ONNX Runtime not available: ', err.message);
  console.warn('ONNX functionality will be disabled');
  ort = null;
}

const { promisify } = require('util');
const winston = require('winston');

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
  onnxConfig = require('../config/onnx.config');
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
    this.available = !!ort;
    
    if (!this.available) {
      logger.warn('ONNX Runtime is not available, service will be in limited mode');
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
   * Run inference with an ONNX model
   */
  async runInference(modelName, inputs) {
    if (!this.available) return { fallback: true, error: 'ONNX Runtime not available' };
    
    try {
      const session = await this.loadModel(modelName);
      if (!session) {
        throw new Error(`Failed to load model: ${modelName}`);
      }
      
      logger.debug(`Running inference with model: ${modelName}`);
      
      // Start timing for performance metrics
      const startTime = Date.now();
      
      // Run inference
      const results = await session.run(inputs);
      
      // Calculate inference time
      const inferenceTime = Date.now() - startTime;
      logger.debug(`Inference completed in ${inferenceTime}ms`);
      
      // Track metrics if enabled
      if (onnxConfig.monitoring.enableMetrics) {
        // Implement your metrics tracking here
      }
      
      return { results, inferenceTime };
    } catch (err) {
      logger.error(`Inference error with model ${modelName}:`, err);
      
      // Check if fallback is enabled for this model
      const modelConfig = onnxConfig.models[modelName];
      if (modelConfig && modelConfig.fallbackToOriginal) {
        logger.info(`Falling back to original model for: ${modelName}`);
        // Return a flag to indicate fallback should be used
        return { fallback: true, error: err.message };
      }
      
      throw err;
    }
  }
  
  /**
   * Get model input/output information
   */
  async getModelInfo(modelName) {
    if (!this.available) return null;
    
    try {
      const session = await this.loadModel(modelName);
      if (!session) {
        throw new Error(`Failed to load model: ${modelName}`);
      }
      
      return {
        inputNames: session.inputNames,
        outputNames: session.outputNames,
        modelMetadata: session.modelData?.metadata || {}
      };
    } catch (err) {
      logger.error(`Error getting model info for ${modelName}:`, err);
      return null;
    }
  }
  
  /**
   * Get status of all models
   */
  getAllModelStatus() {
    if (!this.available) {
      return {
        status: 'unavailable',
        message: 'ONNX Runtime is not available'
      };
    }
    
    const status = {};
    for (const [modelName, modelConfig] of Object.entries(onnxConfig.models)) {
      const modelStatus = this.modelStatus.get(modelName) || { loaded: false };
      const exists = fs.existsSync(modelConfig.onnxPath);
      
      status[modelName] = {
        ...modelStatus,
        exists,
        path: modelConfig.onnxPath,
        originalModel: modelConfig.originalModelId,
      };
    }
    return status;
  }
  
  /**
   * Get status of a specific model
   */
  async getModelStatus(modelName) {
    if (!this.available) {
      return {
        status: 'unavailable',
        message: 'ONNX Runtime is not available'
      };
    }
    
    const modelConfig = onnxConfig.models[modelName];
    if (!modelConfig) {
      return { exists: false, error: `Model ${modelName} not configured` };
    }
    
    const modelStatus = this.modelStatus.get(modelName) || { loaded: false };
    const exists = fs.existsSync(modelConfig.onnxPath);
    
    return {
      ...modelStatus,
      exists,
      path: modelConfig.onnxPath,
      originalModel: modelConfig.originalModelId,
    };
  }
  
  /**
   * Unload a model to free memory
   */
  async unloadModel(modelName) {
    if (!this.available) return false;
    
    if (this.sessionCache.has(modelName)) {
      logger.info(`Unloading model: ${modelName}`);
      try {
        // In ONNX Runtime, we just delete the session and let garbage collection handle it
        this.sessionCache.delete(modelName);
        this.modelStatus.set(modelName, { loaded: false, lastUnloaded: Date.now() });
        return true;
      } catch (err) {
        logger.error(`Error unloading model ${modelName}:`, err);
        return false;
      }
    }
    return false;
  }
}

// Create a singleton instance
const onnxService = new ONNXService();

module.exports = onnxService; 