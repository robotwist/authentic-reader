import { HF_CONFIG } from '../config/huggingFaceConfig';
import { logger } from '../utils/logger';

/**
 * Response from Hugging Face emotion analysis model
 * Example: [{"label":"joy","score":0.9}]
 */
export interface HFEmotionResponse {
  label: string;
  score: number;
}

/**
 * Response from Hugging Face sentiment analysis model
 * Example: [{"label":"POSITIVE","score":0.9}]
 */
export interface HFSentimentResponse {
  label: string;
  score: number;
}

/**
 * Generic interface for Hugging Face API responses
 */
export interface HFApiResponse<T> {
  data: T;
  status: number;
  success: boolean;
  error?: string;
}

/**
 * Cache entry type
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Service for interacting with Hugging Face Inference API
 */
class HuggingFaceService {
  private apiToken: string;
  private baseUrl: string;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheTtl: number = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor() {
    this.apiToken = HF_CONFIG.API_TOKEN;
    this.baseUrl = HF_CONFIG.INFERENCE_API_URL;
    
    // Log warning if API token is missing
    if (!this.apiToken) {
      logger.warn('Hugging Face API token is missing. API calls may fail.');
    }
  }
  
  /**
   * Make a request to the Hugging Face Inference API
   */
  private async makeRequest<T>(
    modelId: string, 
    payload: any, 
    retries = HF_CONFIG.REQUEST.MAX_RETRIES
  ): Promise<HFApiResponse<T>> {
    const url = `${this.baseUrl}/${modelId}`;
    
    try {
      logger.debug(`Making request to HF model: ${modelId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HF_CONFIG.REQUEST.TIMEOUT_MS);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limiting (model is loading)
      if (response.status === 503 && retries > 0) {
        logger.info(`Model ${modelId} is loading, retrying in ${HF_CONFIG.REQUEST.RETRY_DELAY_MS}ms (${retries} retries left)`);
        
        // Wait before retrying
        await new Promise(r => setTimeout(r, HF_CONFIG.REQUEST.RETRY_DELAY_MS));
        
        // Retry the request with decremented retry count
        return this.makeRequest<T>(modelId, payload, retries - 1);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`HF API Error (${response.status}): ${errorText}`);
        
        return {
          data: null as any,
          status: response.status,
          success: false,
          error: errorText
        };
      }
      
      const data = await response.json();
      
      return {
        data,
        status: response.status,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error calling HF API for model ${modelId}:`, error);
      
      // If error is AbortError, it's a timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          data: null as any,
          status: 408, // Request Timeout
          success: false,
          error: 'Request timed out'
        };
      }
      
      return {
        data: null as any,
        status: 500,
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Generate a cache key for a request
   */
  private generateCacheKey(modelId: string, text: string): string {
    // Truncate long texts for the cache key
    const truncatedText = text.length > 100 
      ? text.substring(0, 100) 
      : text;
      
    return `${modelId}:${truncatedText}`;
  }
  
  /**
   * Get cached response if available
   */
  private getCachedResponse<T>(modelId: string, text: string): T | null {
    const key = this.generateCacheKey(modelId, text);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.cacheTtl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Cache a response
   */
  private cacheResponse<T>(modelId: string, text: string, data: T): void {
    const key = this.generateCacheKey(modelId, text);
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  /**
   * Break long text into manageable chunks
   */
  private chunkText(text: string, maxLength = HF_CONFIG.REQUEST.MAX_INPUT_LENGTH): string[] {
    if (text.length <= maxLength) return [text];
    
    // Try to split at sentence boundaries
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  /**
   * Analyze emotions using the Hugging Face emotion model
   */
  async analyzeEmotions(text: string): Promise<HFApiResponse<HFEmotionResponse[]>> {
    // Check cache first
    const cachedResult = this.getCachedResponse<HFApiResponse<HFEmotionResponse[]>>(
      HF_CONFIG.MODELS.EMOTION, 
      text
    );
    
    if (cachedResult) {
      logger.debug('Using cached emotion analysis results');
      return cachedResult;
    }
    
    // For long texts, only use the first chunk
    const chunks = this.chunkText(text);
    logger.debug(`Analyzing emotions in text (${text.length} chars, ${chunks.length} chunks)`);
    
    // Use the first chunk for emotion analysis (most representative)
    const result = await this.makeRequest<HFEmotionResponse[]>(
      HF_CONFIG.MODELS.EMOTION, 
      { inputs: chunks[0] }
    );
    
    // Cache successful results
    if (result.success) {
      this.cacheResponse(HF_CONFIG.MODELS.EMOTION, text, result);
    }
    
    return result;
  }
  
  /**
   * Analyze sentiment using the Hugging Face sentiment model
   */
  async analyzeSentiment(text: string): Promise<HFApiResponse<HFSentimentResponse[]>> {
    // Check cache first
    const cachedResult = this.getCachedResponse<HFApiResponse<HFSentimentResponse[]>>(
      HF_CONFIG.MODELS.SENTIMENT, 
      text
    );
    
    if (cachedResult) {
      logger.debug('Using cached sentiment analysis results');
      return cachedResult;
    }
    
    // For long texts, only use the first chunk
    const chunks = this.chunkText(text);
    logger.debug(`Analyzing sentiment in text (${text.length} chars, ${chunks.length} chunks)`);
    
    // Use the first chunk for sentiment analysis
    const result = await this.makeRequest<HFSentimentResponse[]>(
      HF_CONFIG.MODELS.SENTIMENT, 
      { inputs: chunks[0] }
    );
    
    // Cache successful results
    if (result.success) {
      this.cacheResponse(HF_CONFIG.MODELS.SENTIMENT, text, result);
    }
    
    return result;
  }
  
  /**
   * Check if text contains toxic content
   */
  async analyzeToxicity(text: string): Promise<HFApiResponse<any>> {
    // Check cache first
    const cachedResult = this.getCachedResponse<HFApiResponse<any>>(
      HF_CONFIG.MODELS.TOXICITY, 
      text
    );
    
    if (cachedResult) {
      logger.debug('Using cached toxicity analysis results');
      return cachedResult;
    }
    
    // For long texts, only use the first chunk
    const chunks = this.chunkText(text);
    logger.debug(`Analyzing toxicity in text (${text.length} chars, ${chunks.length} chunks)`);
    
    // Use the first chunk for toxicity analysis
    const result = await this.makeRequest<any>(
      HF_CONFIG.MODELS.TOXICITY, 
      { inputs: chunks[0] }
    );
    
    // Cache successful results
    if (result.success) {
      this.cacheResponse(HF_CONFIG.MODELS.TOXICITY, text, result);
    }
    
    return result;
  }
}

// Export a singleton instance
export const huggingFaceService = new HuggingFaceService(); 