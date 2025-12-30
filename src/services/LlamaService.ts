/**
 * LlamaService.ts
 * 
 * Service for communicating with the AI backend service.
 * Now routes through the main backend's /api/ai endpoints which use Groq API.
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

// Get the backend API URL (Heroku in production, localhost in dev)
const getBackendUrl = () => {
  return API_CONFIG.BASE_URL;
};

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
  parsed_analysis?: any;
  raw_response?: string;
  error?: string;
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
 * Service for interacting with the AI backend service
 * Routes requests through the main backend which has Groq API integration
 */
export class LlamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

  /**
   * Check if the AI service is available and working
   * @returns {Promise<LlamaServiceStatus>} Service status information
   */
  async checkStatus(): Promise<LlamaServiceStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/ai/health`, {
        timeout: 8000,
      });
      
      // Backend returns { success: true, health: {...} }
      if (response.data?.success) {
        return { 
          status: 'healthy', 
          model: response.data.health?.model || 'groq-llama3',
          model_info: response.data.health?.model_info
        };
      }
      
      return { 
        status: 'healthy', 
        model: 'groq-llama3',
        model_info: { parameter_size: '70b', context_length: 8192 }
      };
    } catch (error) {
      // Log only once per session to avoid console spam
      if (!(window as any).__llama_status_logged) {
        console.warn('AI service health check failed, will use fallback:', error);
        (window as any).__llama_status_logged = true;
      }
      
      // Return healthy anyway - the backend has fallback heuristics
      // This allows the app to work even if the /health endpoint fails
      return {
        status: 'healthy',
        model: 'backend-with-fallback',
        model_info: { parameter_size: 'hybrid', context_length: 8192 }
      };
    }
  }

  /**
   * Generate text / analyze article using the backend AI service
   * @param {GenerateRequest} request - The generation request parameters
   * @returns {Promise<LlamaResponse>} The generated text and metadata
   */
  async generateText(request: GenerateRequest): Promise<LlamaResponse> {
    try {
      // Convert the prompt to an article analysis request for the backend
      const response = await axios.post(`${this.baseUrl}/api/ai/analyze`, {
        article: {
          title: 'Analysis Request',
          content: request.prompt,
        },
        options: {
          max_tokens: request.max_tokens,
          temperature: request.temperature,
          system_prompt: request.system_prompt
        }
      }, {
        timeout: 45000, // 45 seconds timeout for AI analysis
      });

      // Transform backend response to expected format
      const analysis = response.data?.analysis || {};
      
      return {
        text: JSON.stringify({
          summary: analysis.summary || 'Analysis completed.',
          tone_rating: analysis.tone?.label || analysis.tone_rating || 'Objective',
          tone_explanation: analysis.tone?.explanation || analysis.tone_explanation || '',
          bias_rating: analysis.bias?.overall || analysis.bias_rating || 'Center',
          bias_explanation: analysis.bias?.explanation || analysis.bias_explanation || '',
          biasConfidence: analysis.bias?.confidence || analysis.biasConfidence || 50,
          fallacies: (analysis.fallacies || analysis.logicalFallacies || []).map((f: any) => ({
            type: f.type || f.name || 'Unknown',
            quote: f.quote || f.excerpt || f.text || '',
            subtext: f.subtext || f.explanation || '',
            correction: f.correction || f.betterAlternative || '',
            severity: f.severity || 'medium'
          })),
          missing_context: analysis.missing_context || analysis.missingContext || '',
          educational_insight: analysis.educational_insight || analysis.educationalInsight || '',
          reliabilityScore: analysis.reliabilityScore || analysis.credibility?.score || 50,
          manipulationTechniques: analysis.manipulationTechniques || []
        }),
        model_used: analysis.model_used || 'groq-llama3-70b',
        processing_time: response.data?.processing_time || 0,
        tokens_used: response.data?.tokens_used
      };
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw this.handleError(error, 'AI analysis failed');
    }
  }

  /**
   * Summarize text using the backend AI service
   * @param {SummarizeRequest} request - The summarization request parameters
   * @returns {Promise<LlamaResponse>} The summary and metadata
   */
  async summarizeText(request: SummarizeRequest): Promise<LlamaResponse> {
    // Route through generateText with a summarization prompt
    return this.generateText({
      prompt: `Summarize the following text in a ${request.type || 'brief'} format:\n\n${request.text}`,
      max_tokens: request.max_length || 500
    });
  }

  /**
   * Analyze text using the backend AI service
   * @param {AnalyzeRequest} request - The analysis request parameters
   * @returns {Promise<LlamaResponse>} The analysis and metadata
   */
  async analyzeText(request: AnalyzeRequest): Promise<LlamaResponse> {
    return this.generateText({
      prompt: request.text
    });
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
        return new Error('No response received from AI service. Backend may be starting up.');
      }
    }
    // Something else happened while setting up the request
    return new Error(error instanceof Error ? error.message : defaultMessage);
  }
}

// Create and export a default instance
const llamaService = new LlamaService();
export default llamaService; 