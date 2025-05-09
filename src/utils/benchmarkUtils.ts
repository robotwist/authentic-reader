/**
 * Benchmark utilities for Authentic Reader NLP processing
 */

import axios from 'axios';

// URL of the NLP service
const NLP_SERVICE_URL = import.meta.env.VITE_NLP_SERVICE_URL || 'http://localhost:8000';

/**
 * Interface for benchmark results
 */
export interface BenchmarkResult {
  zero_shot: {
    huggingface: {
      available: boolean;
      time?: number;
    };
    onnx: {
      available: boolean;
      time?: number;
    };
    speedup?: number;
  };
  ner: {
    huggingface: {
      available: boolean;
      time?: number;
    };
    onnx: {
      available: boolean;
      time?: number;
    };
    speedup?: number;
  };
}

/**
 * Run a benchmark comparing ONNX vs Hugging Face performance
 * @param text Text to analyze
 * @param labels Labels for zero-shot classification
 * @returns Benchmark results
 */
export async function runBenchmark(
  text: string, 
  labels: string[] = ['positive', 'negative', 'neutral']
): Promise<BenchmarkResult> {
  try {
    const response = await axios.post(`${NLP_SERVICE_URL}/benchmark`, {
      text,
      candidate_labels: labels
    });
    
    return response.data;
  } catch (error) {
    console.error('Benchmark failed:', error);
    throw new Error('Failed to run NLP benchmark');
  }
}

/**
 * Format benchmark results for display
 * @param results Benchmark results
 * @returns Formatted results string
 */
export function formatBenchmarkResults(results: BenchmarkResult): string {
  const lines: string[] = [];
  
  lines.push('# NLP Performance Benchmark');
  lines.push('');
  
  // Zero-shot results
  lines.push('## Zero-Shot Classification');
  if (results.zero_shot.huggingface.available && results.zero_shot.onnx.available) {
    lines.push('');
    lines.push('| Engine | Time (ms) |');
    lines.push('|--------|-----------|');
    lines.push(`| Hugging Face | ${(results.zero_shot.huggingface.time || 0) * 1000}ms |`);
    lines.push(`| ONNX Runtime | ${(results.zero_shot.onnx.time || 0) * 1000}ms |`);
    lines.push('');
    
    if (results.zero_shot.speedup) {
      lines.push(`**Speedup: ${results.zero_shot.speedup.toFixed(2)}x faster with ONNX**`);
    }
  } else {
    lines.push('');
    lines.push('One or both engines not available for testing.');
  }
  
  // NER results
  lines.push('');
  lines.push('## Named Entity Recognition');
  if (results.ner.huggingface.available && results.ner.onnx.available) {
    lines.push('');
    lines.push('| Engine | Time (ms) |');
    lines.push('|--------|-----------|');
    lines.push(`| Hugging Face | ${(results.ner.huggingface.time || 0) * 1000}ms |`);
    lines.push(`| ONNX Runtime | ${(results.ner.onnx.time || 0) * 1000}ms |`);
    lines.push('');
    
    if (results.ner.speedup) {
      lines.push(`**Speedup: ${results.ner.speedup.toFixed(2)}x faster with ONNX**`);
    }
  } else {
    lines.push('');
    lines.push('One or both engines not available for testing.');
  }
  
  return lines.join('\n');
}

/**
 * Get the health status of the NLP service
 * @returns Health status information
 */
export async function getNLPServiceHealth(): Promise<any> {
  try {
    const response = await axios.get(`${NLP_SERVICE_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Failed to get NLP service health:', error);
    return {
      status: 'unavailable',
      error: 'Failed to connect to NLP service'
    };
  }
} 