/**
 * Smart AI Analysis Service
 * 
 * This service automatically chooses between:
 * - Llama 3.2 (local development) - Fast, free, no API limits
 * - Hugging Face (deployed) - Cloud-based, reliable
 */

import { huggingFaceService } from './huggingFaceService';
import { LlamaService } from './LlamaService';
import { logger } from '../utils/logger';

// Configuration
const LLAMA_SERVICE_URL = import.meta.env.VITE_LLAMA_SERVICE_URL || 'http://localhost:8105';
const HF_API_TOKEN = import.meta.env.VITE_HF_API_TOKEN || '';

// Determine environment
const isLocalDevelopment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};

const isDeployed = () => {
  return window.location.hostname.includes('netlify.app') ||
         window.location.hostname.includes('vercel.app') ||
         window.location.hostname.includes('github.io') ||
         window.location.hostname.includes('herokuapp.com');
};

// Service selection logic
const getPreferredService = async () => {
  // If we're in local development and have Llama service available, use it
  if (isLocalDevelopment()) {
    try {
      const response = await fetch(`${LLAMA_SERVICE_URL}/health`);
      if (response.ok) {
        const health = await response.json();
        if (health.ready) {
          logger.info('Using Llama 3.2 service for local development');
          return 'llama';
        }
      }
    } catch (error) {
      logger.warn('Llama service not available, falling back to Hugging Face');
    }
  }
  
  // If we have HF token, use Hugging Face
  if (HF_API_TOKEN) {
    logger.info('Using Hugging Face service for deployed environment');
    return 'huggingface';
  }
  
  // Fallback to local heuristics
  logger.warn('No AI services available, using local fallbacks');
  return 'fallback';
};

// Initialize services
const llamaService = new LlamaService();

// Main analysis service
export class AIAnalysisService {
  private serviceType: 'llama' | 'huggingface' | 'fallback' | null = null;
  
  async initialize() {
    this.serviceType = await getPreferredService();
    logger.info(`AI Analysis Service initialized with: ${this.serviceType}`);
  }
  
  async analyzeBias(text: string) {
    await this.ensureInitialized();
    
    switch (this.serviceType) {
      case 'llama':
        return await this.analyzeBiasWithLlama(text);
      case 'huggingface':
        return await this.analyzeBiasWithHF(text);
      case 'fallback':
        return await this.analyzeBiasFallback(text);
      default:
        throw new Error('No AI service available');
    }
  }
  
  async analyzeSentiment(text: string) {
    await this.ensureInitialized();
    
    switch (this.serviceType) {
      case 'llama':
        return await this.analyzeSentimentWithLlama(text);
      case 'huggingface':
        return await this.analyzeSentimentWithHF(text);
      case 'fallback':
        return await this.analyzeSentimentFallback(text);
      default:
        throw new Error('No AI service available');
    }
  }
  
  async extractEntities(text: string) {
    await this.ensureInitialized();
    
    switch (this.serviceType) {
      case 'llama':
        return await this.extractEntitiesWithLlama(text);
      case 'huggingface':
        return await this.extractEntitiesWithHF(text);
      case 'fallback':
        return await this.extractEntitiesFallback(text);
      default:
        throw new Error('No AI service available');
    }
  }
  
  async analyzeCredibility(text: string) {
    await this.ensureInitialized();
    
    switch (this.serviceType) {
      case 'llama':
        return await this.analyzeCredibilityWithLlama(text);
      case 'huggingface':
        return await this.analyzeCredibilityWithHF(text);
      case 'fallback':
        return await this.analyzeCredibilityFallback(text);
      default:
        throw new Error('No AI service available');
    }
  }
  
  // Llama-specific methods
  private async analyzeBiasWithLlama(text: string) {
    try {
      const prompt = `Analyze this text for bias and return a JSON response with the following structure:
{
  "overallBias": "low|medium|high",
  "biasScore": 0-100,
  "biasTypes": ["political", "gender", "racial", "economic"],
  "explanation": "Detailed explanation of bias found",
  "biasedPhrases": ["phrase1", "phrase2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Text to analyze: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 500,
        temperature: 0.3
      });
      
      return this.parseLlamaResponse(response.result);
    } catch (error) {
      logger.error('Llama bias analysis failed:', error);
      throw error;
    }
  }
  
  private async analyzeSentimentWithLlama(text: string) {
    try {
      const prompt = `Analyze the sentiment of this text and return a JSON response:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0-100,
  "emotions": ["joy", "sadness", "anger", "fear", "surprise"],
  "explanation": "Why this sentiment was detected"
}

Text: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 300,
        temperature: 0.2
      });
      
      return this.parseLlamaResponse(response.result);
    } catch (error) {
      logger.error('Llama sentiment analysis failed:', error);
      throw error;
    }
  }
  
  private async extractEntitiesWithLlama(text: string) {
    try {
      const prompt = `Extract named entities from this text and return a JSON response:
{
  "entities": [
    {"text": "entity name", "type": "PERSON|ORG|LOC|MISC", "confidence": 0-100}
  ],
  "keyTopics": ["topic1", "topic2"],
  "summary": "Brief summary of main entities found"
}

Text: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 400,
        temperature: 0.1
      });
      
      return this.parseLlamaResponse(response.result);
    } catch (error) {
      logger.error('Llama entity extraction failed:', error);
      throw error;
    }
  }
  
  private async analyzeCredibilityWithLlama(text: string) {
    try {
      const prompt = `Assess the credibility of this text and return a JSON response:
{
  "credibilityScore": 0-100,
  "credibilityLevel": "high|medium|low",
  "factors": {
    "sourceReputation": 0-100,
    "factChecking": 0-100,
    "citationQuality": 0-100,
    "authorExpertise": 0-100,
    "transparency": 0-100
  },
  "explanation": "Detailed credibility assessment",
  "recommendations": ["recommendation1", "recommendation2"]
}

Text: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 500,
        temperature: 0.2
      });
      
      return this.parseLlamaResponse(response.result);
    } catch (error) {
      logger.error('Llama credibility analysis failed:', error);
      throw error;
    }
  }
  
  // Hugging Face methods
  private async analyzeBiasWithHF(text: string) {
    return await huggingFaceService.analyzeBias(text);
  }
  
  private async analyzeSentimentWithHF(text: string) {
    return await huggingFaceService.analyzeSentiment(text);
  }
  
  private async extractEntitiesWithHF(text: string) {
    return await huggingFaceService.extractEntities(text);
  }
  
  private async analyzeCredibilityWithHF(text: string) {
    return await huggingFaceService.analyzeCredibility(text);
  }
  
  // Fallback methods (heuristic-based)
  private async analyzeBiasFallback(text: string) {
    // Simple heuristic-based bias detection
    const biasIndicators = {
      political: ['liberal', 'conservative', 'democrat', 'republican', 'left-wing', 'right-wing'],
      gender: ['man', 'woman', 'male', 'female', 'he', 'she'],
      racial: ['race', 'ethnic', 'black', 'white', 'hispanic', 'asian'],
      economic: ['rich', 'poor', 'wealthy', 'poverty', 'class']
    };
    
    const foundBias = [];
    let biasScore = 0;
    
    Object.entries(biasIndicators).forEach(([type, indicators]) => {
      const count = indicators.filter(indicator => 
        text.toLowerCase().includes(indicator.toLowerCase())
      ).length;
      if (count > 0) {
        foundBias.push(type);
        biasScore += count * 10;
      }
    });
    
    return {
      overallBias: biasScore > 50 ? 'high' : biasScore > 20 ? 'medium' : 'low',
      biasScore: Math.min(biasScore, 100),
      biasTypes: foundBias,
      explanation: `Detected ${foundBias.length} types of potential bias`,
      biasedPhrases: [],
      recommendations: ['Consider multiple perspectives', 'Verify claims with sources']
    };
  }
  
  private async analyzeSentimentFallback(text: string) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'worst'];
    
    const positiveCount = positiveWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    const negativeCount = negativeWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    
    let sentiment = 'neutral';
    let confidence = 50;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(50 + (positiveCount - negativeCount) * 10, 90);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(50 + (negativeCount - positiveCount) * 10, 90);
    }
    
    return {
      sentiment,
      confidence,
      emotions: [],
      explanation: `Based on ${positiveCount} positive and ${negativeCount} negative words`
    };
  }
  
  private async extractEntitiesFallback(text: string) {
    // Simple entity extraction using capitalization patterns
    const words = text.split(/\s+/);
    const entities = [];
    
    words.forEach(word => {
      if (word.length > 2 && /^[A-Z]/.test(word)) {
        entities.push({
          text: word.replace(/[^\w]/g, ''),
          type: 'MISC',
          confidence: 60
        });
      }
    });
    
    return {
      entities: entities.slice(0, 10), // Limit to 10 entities
      keyTopics: [],
      summary: `Found ${entities.length} potential entities`
    };
  }
  
  private async analyzeCredibilityFallback(text: string) {
    // Simple credibility heuristics
    const hasCitations = /\d{4}|\([^)]+\)|\[[^\]]+\]/.test(text);
    const hasQuotes = /"[^"]*"/.test(text);
    const hasNumbers = /\d+/.test(text);
    
    let credibilityScore = 50;
    if (hasCitations) credibilityScore += 20;
    if (hasQuotes) credibilityScore += 15;
    if (hasNumbers) credibilityScore += 15;
    
    return {
      credibilityScore: Math.min(credibilityScore, 100),
      credibilityLevel: credibilityScore > 70 ? 'high' : credibilityScore > 40 ? 'medium' : 'low',
      factors: {
        sourceReputation: 50,
        factChecking: hasCitations ? 70 : 30,
        citationQuality: hasCitations ? 60 : 20,
        authorExpertise: 50,
        transparency: hasQuotes ? 60 : 40
      },
      explanation: 'Basic credibility assessment based on text features',
      recommendations: ['Verify sources', 'Check multiple perspectives']
    };
  }
  
  // Helper methods
  private async ensureInitialized() {
    if (!this.serviceType) {
      await this.initialize();
    }
  }
  
  private parseLlamaResponse(response: string) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('Failed to parse Llama response:', error);
      throw new Error('Invalid response format from AI service');
    }
  }
  
  // Get current service status
  getServiceStatus() {
    return {
      serviceType: this.serviceType,
      isLocal: isLocalDevelopment(),
      isDeployed: isDeployed(),
      hasLlama: this.serviceType === 'llama',
      hasHF: this.serviceType === 'huggingface',
      isFallback: this.serviceType === 'fallback'
    };
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
