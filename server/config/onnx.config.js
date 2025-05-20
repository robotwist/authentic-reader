/**
 * ONNX Runtime Configuration
 * 
 * This file contains configuration settings for ONNX Runtime integration
 * including model paths, conversion settings, and runtime options.
 */

require('dotenv').config();

// Base directory for storing ONNX models
const MODELS_BASE_DIR = process.env.ONNX_MODELS_DIR || './models/onnx';

const onnxConfig = {
  // Directory paths
  directories: {
    modelsDir: MODELS_BASE_DIR,
    cacheDir: `${MODELS_BASE_DIR}/cache`,
    tempDir: `${MODELS_BASE_DIR}/temp`,
  },
  
  // Model configurations
  models: {
    // Named Entity Recognition model
    ner: {
      onnxPath: `${MODELS_BASE_DIR}/ner-model.onnx`,
      originalModelId: 'dbmdz/bert-large-cased-finetuned-conll03-english',
      fallbackToOriginal: true,
      quantized: true,
    },
    
    // Zero-Shot Classification model
    zeroShot: {
      onnxPath: `${MODELS_BASE_DIR}/zero-shot-model.onnx`,
      originalModelId: 'facebook/bart-large-mnli',
      fallbackToOriginal: true,
      quantized: true,
    },
    
    // Sentiment Analysis model
    sentiment: {
      onnxPath: `${MODELS_BASE_DIR}/sentiment-model.onnx`,
      originalModelId: 'distilbert-base-uncased-finetuned-sst-2-english',
      fallbackToOriginal: true,
      quantized: true,
    },
  },
  
  // Runtime settings
  runtime: {
    // Number of threads for computation
    numThreads: process.env.ONNX_THREADS || 4,
    
    // Execution providers in order of preference
    // Options: 'cpu', 'cuda', 'tensorrt', 'openvino'
    executionProviders: (process.env.ONNX_EXECUTION_PROVIDERS || 'cpu')
      .split(',')
      .map(provider => provider.trim()),
    
    // Optimization level (0-3)
    optLevel: parseInt(process.env.ONNX_OPT_LEVEL || '99', 10),
    
    // Enable graph optimization
    graphOptimization: process.env.ONNX_GRAPH_OPTIMIZATION !== 'false',
    
    // Memory limit in MB
    memoryLimit: parseInt(process.env.ONNX_MEMORY_LIMIT || '0', 10),
  },
  
  // Conversion settings
  conversion: {
    // Optimization level for converted models (1-3)
    optimizationLevel: parseInt(process.env.ONNX_CONVERSION_OPT_LEVEL || '3', 10),
    
    // Quantization options
    quantization: {
      enabled: process.env.ONNX_ENABLE_QUANTIZATION !== 'false',
      format: process.env.ONNX_QUANTIZATION_FORMAT || 'QInt8',
      perChannel: process.env.ONNX_PER_CHANNEL_QUANTIZATION === 'true',
    },
    
    // Dynamic axes for input/output tensors
    dynamicAxes: true,
  },
  
  // Performance monitoring
  monitoring: {
    enableProfiling: process.env.ONNX_ENABLE_PROFILING === 'true',
    logLevel: process.env.ONNX_LOG_LEVEL || 'warning',
    enableMetrics: process.env.ONNX_ENABLE_METRICS === 'true',
  },
};

export default onnxConfig; 