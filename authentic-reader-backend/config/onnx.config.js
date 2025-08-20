/**
 * ONNX Configuration
 * 
 * This file configures the ONNX runtime settings for machine learning models.
 */

const config = {
  directories: {
    modelsDir: './models/onnx',
    cacheDir: './models/onnx/cache',
    tempDir: './models/onnx/temp',
  },
  models: {
    // Models will be downloaded on first use if not present
    ner: { 
      onnxPath: './models/onnx/ner-model.onnx', 
      originalModelId: 'dbmdz/bert-large-cased-finetuned-conll03-english', 
      fallbackToOriginal: true 
    },
    sentiment: { 
      onnxPath: './models/onnx/sentiment-model.onnx', 
      originalModelId: 'distilbert-base-uncased-finetuned-sst-2-english', 
      fallbackToOriginal: true 
    }
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

export default config; 