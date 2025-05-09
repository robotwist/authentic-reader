/**
 * LlamaService.ts
 * 
 * Service for communicating with the Llama 3 backend service
 */

import axios from 'axios';

const LLAMA_SERVICE_URL = import.meta.env.VITE_LLAMA_SERVICE_URL || 'http://localhost:3500';

// Types for API requests and responses
export interface GenerateRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
}

export interface SummarizeRequest {
  text: string;
  max_length?: number;
  type?: 'brief' | 'detailed' | 'bullet' | 'executive';
}

export interface AnalyzeRequest {
  text: string;
  analysis_type?: string;
}

export interface LlamaResponse {
  text: string;
  model_used: string;
  processing_time: number;
  tokens_used?: number;
}

export interface LlamaServiceStatus {
  status: 'healthy' | 'error';
  model: string;
  model_info?: {
    parameter_size?: string;
    context_length?: number;
  };
  error?: string;
}

/**
 * Service for interacting with the Llama backend service
 */
export class LlamaService {
  private baseUrl: string;

  constructor(baseUrl: string = LLAMA_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the Llama service is available and working
   * @returns {Promise<LlamaServiceStatus>} Service status information
   */
  async checkStatus(): Promise<LlamaServiceStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to connect to Llama service:', error);
      return {
        status: 'error',
        model: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate text using the Llama 3 model
   * @param {GenerateRequest} request - The generation request parameters
   * @returns {Promise<LlamaResponse>} The generated text and metadata
   */
  async generateText(request: GenerateRequest): Promise<LlamaResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/generate`, request, {
        timeout: 30000, // 30 seconds timeout for generation
      });
      return response.data;
    } catch (error) {
      console.error('Text generation failed:', error);
      throw this.handleError(error, 'Text generation failed');
    }
  }

  /**
   * Summarize text using the Llama 3 model
   * @param {SummarizeRequest} request - The summarization request parameters
   * @returns {Promise<LlamaResponse>} The summary and metadata
   */
  async summarizeText(request: SummarizeRequest): Promise<LlamaResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/summarize`, request, {
        timeout: 30000, // 30 seconds timeout for summarization
      });
      return response.data;
    } catch (error) {
      console.error('Text summarization failed:', error);
      throw this.handleError(error, 'Text summarization failed');
    }
  }

  /**
   * Analyze text using the Llama 3 model
   * @param {AnalyzeRequest} request - The analysis request parameters
   * @returns {Promise<LlamaResponse>} The analysis and metadata
   */
  async analyzeText(request: AnalyzeRequest): Promise<LlamaResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/analyze`, request, {
        timeout: 30000, // 30 seconds timeout for analysis
      });
      return response.data;
    } catch (error) {
      console.error('Text analysis failed:', error);
      throw this.handleError(error, 'Text analysis failed');
    }
  }

  /**
   * Handle errors from the API
   * @param {unknown} error - The error from axios
   * @param {string} defaultMessage - Default error message
   * @returns {Error} A formatted error
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with an error status
        const serverError = error.response.data?.error || error.response.data?.message;
        return new Error(serverError || `${defaultMessage} (Status: ${error.response.status})`);
      } else if (error.request) {
        // The request was made but no response was received
        return new Error('No response received from Llama service. Is it running?');
      }
    }
    // Something else happened while setting up the request
    return new Error(error instanceof Error ? error.message : defaultMessage);
  }
}

// Create and export a default instance
const llamaService = new LlamaService();
export default llamaService; 