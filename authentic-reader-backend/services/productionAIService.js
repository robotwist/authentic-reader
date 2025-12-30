/**
 * Production AI Service
 * 
 * Orchestrates AI analysis for production deployment:
 * 1. Primary: Groq API (LLM)
 * 2. Fallback: Local heuristic analysis (always available)
 * 
 * CRITICAL: Never throws errors - always returns a result so articles are saved.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (for local development)
dotenv.config({ path: join(__dirname, '..', '.env') });

import axios from 'axios';
import logger from '../utils/logger.js';

class ProductionAIService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.lastCallTime = 0;
    this.minDelayMs = 3000; // 3 seconds between Groq calls to avoid rate limits
    
    // Log initialization status
    console.log("🔍 ProductionAIService initialized:");
    console.log("  - GROQ_API_KEY:", this.groqApiKey ? "✅ Set" : "❌ Missing");
    console.log("  - GROQ_MODEL:", this.groqModel);
    console.log("  - Rate limit delay:", this.minDelayMs, "ms between calls");
  }

  /**
   * Wait to respect rate limits
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastCall;
      console.log(`  ⏳ Rate limit: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastCallTime = Date.now();
  }

  /**
   * Analyze article with AI - NEVER throws, always returns a result
   */
  async analyzeArticle(article, options = {}) {
    const articleTitle = article.title?.substring(0, 60) || 'Untitled';
    console.log(`\n📰 Analyzing: "${articleTitle}..."`);
    
    // Try Groq API first
    if (this.groqApiKey) {
      try {
        // Wait to respect rate limits
        await this.waitForRateLimit();
        
        console.log("  🤖 Attempting Groq API analysis...");
        const result = await this.tryGroqService(article, options);
        console.log("  ✅ Groq analysis successful");
        return result;
      } catch (groqError) {
        // Log the error with details
        this.logGroqError(groqError);
        
        // Fall through to basic analysis - DON'T throw
        console.log("  ⚠️  Falling back to heuristic analysis...");
      }
    } else {
      console.log("  ⚠️  No GROQ_API_KEY - using heuristic analysis");
    }
    
    // ALWAYS return basic analysis as fallback
    console.log("  🔧 Performing heuristic analysis...");
    const basicResult = this.performBasicAnalysis(article, options);
    console.log("  ✅ Heuristic analysis complete");
    return basicResult;
  }

  /**
   * Log Groq errors with detailed information
   */
  logGroqError(error) {
    const statusCode = error.response?.status;
    const errorMessage = error.message || 'Unknown error';
    const errorData = error.response?.data;
    
    console.error("❌ Groq API Failed:");
    console.error(`  - Status Code: ${statusCode || 'N/A'}`);
    console.error(`  - Error: ${errorMessage}`);
    
    if (statusCode === 429) {
      const rateLimitInfo = errorData?.error?.message || 'Rate limit exceeded';
      console.error(`  - Rate Limit Details: ${rateLimitInfo}`);
      logger.warn(`⚠️  GROQ Rate Limit (429): ${rateLimitInfo}`);
    } else if (statusCode === 401) {
      console.error("  - Auth Error: Invalid API key");
      logger.error("❌ GROQ Auth Failed: Invalid API key");
    } else if (statusCode === 500) {
      console.error("  - Server Error: Groq service unavailable");
      logger.error("❌ GROQ Server Error (500)");
    } else if (statusCode === 503) {
      console.error("  - Service Unavailable: Groq overloaded");
      logger.error("❌ GROQ Service Unavailable (503)");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error("  - Network Error: Cannot reach Groq API");
      logger.error(`❌ GROQ Network Error: ${error.code}`);
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error("  - Timeout: Request took too long");
      logger.error(`❌ GROQ Timeout: ${error.code}`);
    } else {
      logger.error(`❌ GROQ Error: ${errorMessage}`);
    }
    
    if (errorData) {
      console.error("  - Response Data:", JSON.stringify(errorData, null, 2).substring(0, 500));
    }
  }

  /**
   * Try Groq API service
   * Throws on failure - caught by analyzeArticle
   */
  async tryGroqService(article, options) {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const articleText = article.content || article.description || '';
    const title = article.title || '';
    const sourceName = article.source?.name || 'Unknown';

    // Truncate content if too long (to avoid token limits)
    const maxContentLength = 4000;
    const truncatedText = articleText.length > maxContentLength 
      ? articleText.substring(0, maxContentLength) + '...' 
      : articleText;

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
    userPrompt += `\nARTICLE TEXT:\n${truncatedText}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: this.groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
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
      summary: analysisData.summary || truncatedText.substring(0, 200),
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
  }

  /**
   * Perform basic heuristic analysis (always available, never fails)
   */
  performBasicAnalysis(article, options) {
    const text = article.content || article.description || '';
    
    return {
      summary: this.generateSummaryBasic(text),
      bias: this.analyzeBiasBasic(text),
      sentiment: this.analyzeSentimentBasic(text),
      credibility: this.analyzeCredibilityBasic(article),
      fallacies: this.detectFallaciesBasic(text),
      confidence: 0.5, // Lower confidence for heuristic analysis
      service: 'heuristic',
      timestamp: Date.now(),
      educational_insight: 'This article was analyzed using basic heuristics. AI analysis was unavailable.',
      missing_context: ''
    };
  }

  /**
   * Basic bias analysis using keyword detection
   */
  analyzeBiasBasic(text) {
    const biasIndicators = {
      political: ['democrat', 'republican', 'liberal', 'conservative', 'left-wing', 'right-wing'],
      emotional: ['amazing', 'terrible', 'shocking', 'outrageous', 'incredible', 'horrific'],
      loaded: ['obviously', 'clearly', 'undoubtedly', 'certainly', 'definitely', 'everyone knows']
    };

    const scores = {};
    const textLower = (text || '').toLowerCase();

    Object.entries(biasIndicators).forEach(([type, indicators]) => {
      scores[type] = indicators.reduce((count, indicator) => {
        return count + (textLower.split(indicator).length - 1);
      }, 0);
    });

    const totalScore = scores.political + scores.emotional + scores.loaded;
    
    return {
      scores,
      overall: totalScore > 5 ? 'high' : totalScore > 2 ? 'medium' : 'low',
      rating: 'center', // Default to center without AI analysis
      indicators: Object.entries(scores).filter(([_, count]) => count > 0)
    };
  }

  /**
   * Basic sentiment analysis using positive/negative word counts
   */
  analyzeSentimentBasic(text) {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'success', 'win', 'hope', 'progress'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'harmful', 'failure', 'lose', 'crisis', 'disaster'];
    
    const textLower = (text || '').toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (textLower.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (textLower.split(word).length - 1), 0);

    const total = positiveCount + negativeCount;
    const score = total > 0 ? (positiveCount - negativeCount) / total : 0;

    return {
      score: Math.round(score * 100) / 100,
      label: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral',
      confidence: Math.min(total / 10, 1)
    };
  }

  /**
   * Basic credibility analysis using source and content factors
   */
  analyzeCredibilityBasic(article) {
    const factors = {
      hasSource: article.source?.name ? 0.7 : 0.3,
      hasAuthor: article.author ? 0.6 : 0.4,
      hasUrl: article.link || article.url ? 0.7 : 0.4,
      contentLength: (article.content?.length || 0) > 500 ? 0.7 : 0.5
    };

    const score = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;

    return {
      score: Math.round(score * 100) / 100,
      factors,
      overall: score > 0.65 ? 'high' : score > 0.5 ? 'medium' : 'low'
    };
  }

  /**
   * Generate a basic summary from the first sentences
   */
  generateSummaryBasic(text) {
    if (!text) return 'No content available for summary.';
    
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    if (sentences.length === 0) {
      return cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
    }
    
    // Take first 2 sentences
    const summary = sentences.slice(0, 2).join('. ').trim();
    return summary + (summary.endsWith('.') ? '' : '.');
  }

  /**
   * Detect basic logical fallacies using patterns
   */
  detectFallaciesBasic(text) {
    if (!text) return [];
    
    const fallacyPatterns = {
      ad_hominem: /\b(you are|they are|he is|she is)\s+(stupid|idiot|moron|dumb|incompetent)\b/i,
      straw_man: /\b(they claim|people say|some believe)\s+that\s+.{10,}but\s+(that's|this is)\s+(not true|wrong|false)/i,
      false_dilemma: /\b(either|you must)\s+.{5,}\s+or\s+.{5,}(no other|only two)/i,
      appeal_to_emotion: /\b(think of|imagine|consider)\s+(the children|your family|innocent|victims)/i,
      hasty_generalization: /\b(all|every|always|never)\s+.{3,}\s+(are|is|will|do)\b/i
    };

    const detected = [];
    Object.entries(fallacyPatterns).forEach(([type, pattern]) => {
      if (pattern.test(text)) {
        detected.push({
          type: type.replace('_', ' '),
          confidence: 0.5,
          description: `Potential ${type.replace('_', ' ')} detected by heuristic analysis`
        });
      }
    });

    return detected;
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    return {
      services: {
        groq: !!this.groqApiKey,
        heuristic: true // Always available
      },
      groqModel: this.groqModel,
      timestamp: Date.now()
    };
  }
}

export default new ProductionAIService();
