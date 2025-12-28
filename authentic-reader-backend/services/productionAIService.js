/**
 * Production AI Service
 * 
 * Orchestrates AI analysis across multiple services for production deployment:
 * 1. Primary: Local Ollama (Railway)
 * 2. Fallback: Hugging Face API
 * 3. Backup: ONNX local models
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables immediately with correct path
dotenv.config({ path: join(__dirname, '..', '.env') });
console.log("🔍 Loaded API Key:", process.env.GROQ_API_KEY ? "Yes (Masked)" : "NO - MISSING");

import axios from 'axios';
import logger from '../utils/logger.js';

class ProductionAIService {
  constructor() {
    this.primaryService = process.env.OLLAMA_SERVICE_URL || 'http://localhost:8080';
    this.fallbackService = process.env.HF_SERVICE_URL || 'http://localhost:8000';
    this.hfApiKey = process.env.HUGGING_FACE_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    
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
    
    // Verify API Keys
    console.log("🔑 Checking API Keys:");
    console.log("  - GROQ_API_KEY:", !!process.env.GROQ_API_KEY);
    console.log("  - HUGGING_FACE_API_KEY:", !!this.hfApiKey);
    console.log("  - OPENAI_API_KEY:", !!this.openaiApiKey);
    console.log("  - Primary Service URL:", this.primaryService);
    console.log("  - Fallback Service URL:", this.fallbackService);
    
    try {
      // Try Groq API first (if API key is available)
      if (this.groqApiKey) {
        try {
          const result = await this.tryGroqService(article, options);
          return result;
        } catch (groqError) {
          // If it's a rate limit error, log it clearly and fall through to fallback
          if (groqError.message?.includes('rate limit')) {
            logger.warn('⚠️  GROQ rate limit reached. Falling back to alternative service.');
          }
          throw groqError; // Re-throw to trigger fallback chain
        }
      }
      
      // Fallback to Ollama if Groq not available
      const result = await this.tryPrimaryService(article, options);
      return result;
    } catch (primaryError) {
      const isRateLimit = primaryError.message?.includes('rate limit') || 
                         (primaryError.response && primaryError.response.status === 429);
      
      if (isRateLimit) {
        logger.warn('⚠️  Rate limit encountered. Attempting fallback service...');
      } else {
        console.error("❌ PRIMARY SERVICE CRASHED:", primaryError.message);
        if (primaryError.response) {
          console.error("  Response Status:", primaryError.response.status);
          console.error("  Response Data:", JSON.stringify(primaryError.response.data, null, 2));
          console.error("  Response Headers:", primaryError.response.headers);
        }
        if (primaryError.request) {
          console.error("  Request made but no response received");
          console.error("  Request URL:", primaryError.config?.url);
        }
        if (primaryError.stack) {
          console.error("  Stack:", primaryError.stack);
        }
      }
      logger.warn('Primary service failed, trying fallback:', primaryError.message);
      
      try {
        // Try fallback service (Hugging Face)
        const result = await this.tryFallbackService(article, options);
        return result;
      } catch (fallbackError) {
        console.error("❌ FALLBACK SERVICE CRASHED:", fallbackError.message);
        if (fallbackError.response) {
          console.error("  Response Status:", fallbackError.response.status);
          console.error("  Response Data:", JSON.stringify(fallbackError.response.data, null, 2));
        }
        if (fallbackError.request) {
          console.error("  Request made but no response received");
          console.error("  Request URL:", fallbackError.config?.url);
        }
        logger.warn('Fallback service failed, using basic analysis:', fallbackError.message);
        
        // Use basic local analysis as last resort
        return this.performBasicAnalysis(article, options);
      }
    }
  }

  /**
   * Try Groq API service (Primary LLM)
   * Includes rate limit handling with retry logic
   */
  async tryGroqService(article, options, retryCount = 0) {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const maxRetries = 3;
    const baseDelay = 60000; // 60 seconds base delay for rate limits

    try {
      const articleText = article.content || article.description || '';
      const title = article.title || '';
      const sourceName = article.source?.name || 'Unknown';

      // Build the system prompt for analysis
      const systemPrompt = `You are an expert Media Literacy Coach. Analyze the news article and return valid JSON with this structure:
{
  "summary": "String - A concise summary of the article's core claim",
  "tone_rating": "String (e.g., Alarmist, Cynical, Objective, Fawning)",
  "bias_rating": "String (e.g., left, center, right, center-left, center-right)",
  "confidence_score": Number (0-100),
  "educational_insight": "String - A general tip for this type of article",
  "missing_context": "String - What critical info was left out?",
  "fallacies": [
    {
      "type": "String - Name of Fallacy",
      "quote": "String - The exact spin text from article",
      "subtext": "String - What is the author trying to make the reader feel?",
      "better_alternative": "String - Rewrite the quote to be neutral and factual"
    }
  ]
}

CRITICAL: Output ONLY valid JSON - no markdown, no preamble.`;

      // Build user prompt
      let userPrompt = '';
      if (title) userPrompt += `TITLE: ${title}\n`;
      if (sourceName) userPrompt += `SOURCE: ${sourceName}\n`;
      userPrompt += `\nARTICLE TEXT:\n${articleText}`;

      // Reduce max_tokens on retry to lower token usage when rate limited
      const maxTokens = retryCount > 0 ? 1500 : 2000;

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Groq response');
      }

      // Parse JSON response
      let analysisData;
      try {
        analysisData = JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('Could not parse Groq response as JSON');
        }
      }

      // Format the response to match expected structure
      return {
        summary: analysisData.summary || articleText.substring(0, 200),
        bias: {
          overall: analysisData.bias_rating || 'center',
          rating: analysisData.bias_rating || 'center'
        },
        sentiment: {
          label: analysisData.tone_rating || 'neutral',
          score: analysisData.confidence_score ? analysisData.confidence_score / 100 : 0.5
        },
        credibility: {
          overall: 'medium',
          score: analysisData.confidence_score ? analysisData.confidence_score / 100 : 0.5
        },
        fallacies: analysisData.fallacies || [],
        confidence: analysisData.confidence_score ? analysisData.confidence_score / 100 : 0.8,
        service: 'groq',
        timestamp: Date.now(),
        educational_insight: analysisData.educational_insight || '',
        missing_context: analysisData.missing_context || ''
      };
    } catch (error) {
      // Handle rate limit errors (429) with retry logic
      if (error.response && error.response.status === 429) {
        const rateLimitInfo = error.response.data?.error || {};
        const limitType = rateLimitInfo.message?.includes('TPM') ? 'TPM (Tokens Per Minute)' : 
                         rateLimitInfo.message?.includes('RPM') ? 'RPM (Requests Per Minute)' : 
                         'Rate Limit';
        
        logger.warn(`⚠️  GROQ Rate Limit Hit (${limitType}):`, rateLimitInfo.message || 'Rate limit exceeded');
        
        if (retryCount < maxRetries) {
          // Exponential backoff: 60s, 120s, 180s
          const delay = baseDelay * (retryCount + 1);
          logger.info(`⏳ Retrying GROQ request in ${delay / 1000}s (attempt ${retryCount + 1}/${maxRetries})...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.tryGroqService(article, options, retryCount + 1);
        } else {
          logger.error(`❌ GROQ Rate Limit: Max retries (${maxRetries}) exceeded. Falling back to alternative service.`);
          throw new Error(`GROQ rate limit exceeded after ${maxRetries} retries: ${rateLimitInfo.message || 'Rate limit exceeded'}`);
        }
      }
      
      // Log other errors
      console.error("❌ GROQ SERVICE ERROR:");
      console.error("  Error Message:", error.message);
      if (error.response) {
        console.error("  Response Status:", error.response.status);
        console.error("  Response Data:", JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Try primary AI service (Ollama)
   */
  async tryPrimaryService(article, options) {
    try {
      const response = await axios.post(`${this.primaryService}/analyze`, {
        text: article.content || article.description,
        title: article.title,
        source: article.source?.name,
        options
      }, {
        timeout: 30000 // 30 second timeout
      });

      return this.formatAnalysisResult(response.data, 'ollama');
    } catch (error) {
      console.error("❌ PRIMARY SERVICE ERROR DETAILS:");
      console.error("  URL:", `${this.primaryService}/analyze`);
      console.error("  Error Message:", error.message);
      if (error.response) {
        console.error("  Response Status:", error.response.status);
        console.error("  Response Data:", JSON.stringify(error.response.data, null, 2));
      }
      if (error.request) {
        console.error("  No response received - service may be down");
      }
      throw error;
    }
  }

  /**
   * Try fallback service (Hugging Face)
   */
  async tryFallbackService(article, options) {
    try {
      const response = await axios.post(`${this.fallbackService}/analyze`, {
        text: article.content || article.description,
        title: article.title,
        source: article.source?.name,
        options
      }, {
        timeout: 20000 // 20 second timeout
      });

      return this.formatAnalysisResult(response.data, 'huggingface');
    } catch (error) {
      console.error("❌ FALLBACK SERVICE ERROR DETAILS:");
      console.error("  URL:", `${this.fallbackService}/analyze`);
      console.error("  Error Message:", error.message);
      if (error.response) {
        console.error("  Response Status:", error.response.status);
        console.error("  Response Data:", JSON.stringify(error.response.data, null, 2));
      }
      if (error.request) {
        console.error("  No response received - service may be down");
      }
      throw error;
    }
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
