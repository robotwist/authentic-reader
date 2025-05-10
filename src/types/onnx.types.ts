/**
 * ONNX-related type definitions
 */

/**
 * Types of models that can be converted to ONNX
 */
export enum ConvertibleModels {
  NER = 'ner',
  ZERO_SHOT = 'zeroShot',
  SENTIMENT = 'sentiment',
}

/**
 * ONNX Model conversion request
 */
export interface ModelConversionRequest {
  modelType: ConvertibleModels | string;
  modelId: string;
  quantize?: boolean;
  optimizationLevel?: number;
}

/**
 * ONNX Model conversion response
 */
export interface ModelConversionResponse {
  success: boolean;
  modelType: string;
  originalModel: string;
  onnxPath: string;
  conversionTime: number;
  error?: string;
}

/**
 * ONNX Model status
 */
export interface ONNXModelStatus {
  loaded: boolean;
  exists: boolean;
  path: string;
  originalModel: string;
  lastUsed?: number;
  error?: string;
}

/**
 * ONNX Model information
 */
export interface ONNXModelInfo {
  inputNames: string[];
  outputNames: string[];
  inputShapes: Record<string, number[]>;
  outputShapes: Record<string, number[]>;
  modelMetadata: {
    description?: string;
    graphName?: string;
    domain?: string;
    version?: number;
    producerName?: string;
    producerVersion?: string;
  };
}

/**
 * ONNX Runtime configuration
 */
export interface ONNXRuntimeConfig {
  threadsCount?: number;
  executionProviders?: string[];
  memoryLimit?: number;
  optimizationLevel?: number;
  enableProfiling?: boolean;
  enableMemoryPattern?: boolean;
  enableCpuMemArena?: boolean;
  enableGraphOptimization?: boolean;
  logLevel?: 'verbose' | 'info' | 'warning' | 'error' | 'fatal';
  logSeverityLevel?: number;
}

/**
 * NER Result from ONNX model
 */
export interface ONNXNERResult {
  text: string;
  type: string;
  score: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Zero-shot classification result from ONNX model
 */
export interface ONNXZeroShotResult {
  label: string;
  score: number;
}

/**
 * Sentiment analysis result from ONNX model
 */
export interface ONNXSentimentResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  details?: {
    positive: number;
    negative: number;
    neutral: number;
  };
} 