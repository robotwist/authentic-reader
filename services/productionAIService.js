/**
 * Production AI Service
 * 
 * Orchestrates AI analysis across multiple services for production deployment:
 * 1. Primary: Local Ollama (Railway)
 * 2. Fallback: Hugging Face API
 * 3. Backup: ONNX local models
 */

import axios from 'axios';
import logger from '../utils/logger.js';

class ProductionAIService {
  constructor() {
    this.primaryService = process.env.OLLAMA_SERVICE_URL || 'http://localhost:8080';
    this.fallbackService = process.env.HF_SERVICE_URL || 'http://localhost:8000';
    this.hfApiKey = process.env.HUGGING_FACE_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    
    this.analysisQueue = [];
    this.isProcessing = false;
  }

  /**
   * Perform comprehensive AI analysis with fallback strategy
   */
  async analyzeArticle(article, options = {}) {
    const {
      includeBias = true,
      includeSentiment = true,
      includeCredibility = true,
      includeFallacies = true,
      includeSummary = true,
      priority = 'normal'
    } = options;

    const analysisRequest = {
      article,
      options,
      timestamp: Date.now(),
      priority,
      attempts: 0,
      maxAttempts: 3
    };

    // Add to queue for processing
    this.analysisQueue.push(analysisRequest);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }

    return this.performAnalysis(analysisRequest);
  }

  /**
   * Process analysis queue with priority handling
   */
  async processQueue() {
    if (this.isProcessing || this.analysisQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.analysisQueue.length > 0) {
      const request = this.analysisQueue.shift();
      
      try {
        await this.performAnalysis(request);
      } catch (error) {
        logger.error('Analysis failed:', error);
        request.attempts++;
        
        if (request.attempts < request.maxAttempts) {
          // Retry with exponential backoff
          setTimeout(() => {
            this.analysisQueue.unshift(request);
          }, Math.pow(2, request.attempts) * 1000);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Perform analysis with service fallback
   */
  async performAnalysis(request) {
    const { article, options } = request;
    
    try {
      // Try primary service (Ollama) first
      const result = await this.tryPrimaryService(article, options);
      return result;
    } catch (primaryError) {
      logger.warn('Primary service failed, trying fallback:', primaryError.message);
      
      try {
        // Try fallback service (Hugging Face)
        const result = await this.tryFallbackService(article, options);
        return result;
      } catch (fallbackError) {
        logger.warn('Fallback service failed, using basic analysis:', fallbackError.message);
        
        // Use basic local analysis as last resort
        return this.performBasicAnalysis(article, options);
      }
    }
  }

  /**
   * Try primary AI service (Ollama)
   */
  async tryPrimaryService(article, options) {
    const response = await axios.post(`${this.primaryService}/analyze`, {
      text: article.content || article.description,
      title: article.title,
      source: article.source?.name,
      options
    }, {
      timeout: 30000 // 30 second timeout
    });

    return this.formatAnalysisResult(response.data, 'ollama');
  }

  /**
   * Try fallback service (Hugging Face)
   */
  async tryFallbackService(article, options) {
    const response = await axios.post(`${this.fallbackService}/analyze`, {
      text: article.content || article.description,
      title: article.title,
      source: article.source?.name,
      options
    }, {
      timeout: 20000 // 20 second timeout
    });

    return this.formatAnalysisResult(response.data, 'huggingface');
  }

  /**
   * Perform basic local analysis
   */
  async performBasicAnalysis(article, options) {
    const text = article.content || article.description || '';
    
    return {
      bias: this.analyzeBiasBasic(text),
      sentiment: this.analyzeSentimentBasic(text),
      credibility: this.analyzeCredibilityBasic(article),
      summary: this.generateSummaryBasic(text),
      fallacies: this.detectFallaciesBasic(text),
      confidence: 0.6,
      service: 'basic',
      timestamp: Date.now()
    };
  }

  /**
   * Format analysis result consistently
   */
  formatAnalysisResult(data, service) {
    return {
      bias: data.bias || data.biasAnalysis || {},
      sentiment: data.sentiment || data.sentimentAnalysis || {},
      credibility: data.credibility || data.credibilityAssessment || {},
      summary: data.summary || data.generatedSummary || '',
      fallacies: data.fallacies || data.logicalFallacies || [],
      confidence: data.confidence || 0.8,
      service,
      timestamp: Date.now()
    };
  }

  /**
   * Basic bias analysis
   */
  analyzeBiasBasic(text) {
    const biasIndicators = {
      political: ['democrat', 'republican', 'liberal', 'conservative', 'left', 'right'],
      emotional: ['amazing', 'terrible', 'shocking', 'outrageous', 'incredible'],
      loaded: ['obviously', 'clearly', 'undoubtedly', 'certainly', 'definitely']
    };

    const scores = {};
    const textLower = text.toLowerCase();

    Object.entries(biasIndicators).forEach(([type, indicators]) => {
      scores[type] = indicators.reduce((count, indicator) => {
        return count + (textLower.split(indicator).length - 1);
      }, 0);
    });

    return {
      scores,
      overall: scores.political + scores.emotional + scores.loaded > 5 ? 'high' : 'low',
      indicators: Object.entries(scores).filter(([_, count]) => count > 0)
    };
  }

  /**
   * Basic sentiment analysis
   */
  analyzeSentimentBasic(text) {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'success', 'win'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'harmful', 'failure', 'lose'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (textLower.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (textLower.split(word).length - 1), 0);

    const total = positiveCount + negativeCount;
    const score = total > 0 ? (positiveCount - negativeCount) / total : 0;

    return {
      score,
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      confidence: Math.min(total / 10, 1)
    };
  }

  /**
   * Basic credibility analysis
   */
  analyzeCredibilityBasic(article) {
    const factors = {
      sourceReliability: article.source?.reliability === 'high' ? 0.8 : 0.5,
      authorCredentials: article.author ? 0.6 : 0.3,
      factualAccuracy: 0.5, // Default neutral
      transparency: article.url ? 0.7 : 0.4,
      bias: article.source?.biasRating === 'center' ? 0.8 : 0.6
    };

    const score = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;

    return {
      score,
      factors,
      overall: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low'
    };
  }

  /**
   * Generate basic summary
   */
  generateSummaryBasic(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const firstSentence = sentences[0]?.trim();
    const lastSentence = sentences[sentences.length - 1]?.trim();
    
    return firstSentence && lastSentence ? 
      `${firstSentence}. ${lastSentence}.` : 
      text.substring(0, 200) + '...';
  }

  /**
   * Detect basic logical fallacies
   */
  detectFallaciesBasic(text) {
    const fallacyPatterns = {
      ad_hominem: /\b(you are|they are|he is|she is)\s+(stupid|idiot|moron|dumb)\b/i,
      straw_man: /\b(they say|people claim|some argue)\s+that\s+(.+)but\s+(that's not true|that's wrong)/i,
      false_dilemma: /\b(either|or|you must|you have to)\s+(.+)or\s+(.+)there is no other way/i,
      appeal_to_emotion: /\b(think of|imagine|consider)\s+(the children|your family|innocent people)/i
    };

    const detected = [];
    Object.entries(fallacyPatterns).forEach(([type, pattern]) => {
      if (pattern.test(text)) {
        detected.push({
          type,
          confidence: 0.6,
          description: `Potential ${type.replace('_', ' ')} detected`
        });
      }
    });

    return detected;
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const services = {
      primary: await this.checkServiceHealth(this.primaryService),
      fallback: await this.checkServiceHealth(this.fallbackService),
      basic: true // Always available
    };

    return {
      services,
      queueLength: this.analysisQueue.length,
      isProcessing: this.isProcessing,
      timestamp: Date.now()
    };
  }

  /**
   * Check individual service health
   */
  async checkServiceHealth(serviceUrl) {
    try {
      const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new ProductionAIService();
