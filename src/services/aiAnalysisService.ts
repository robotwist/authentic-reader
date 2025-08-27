/**
 * Llama AI Analysis Service
 * 
 * This service uses Llama 3.2 for all AI analysis tasks.
 * Works for both local development and deployed environments.
 */

import { LlamaService } from './LlamaService';
import { logger } from '../utils/logger';

// Configuration
const LLAMA_SERVICE_URL = import.meta.env.VITE_LLAMA_SERVICE_URL || 
  (isLocalDevelopment() ? 'http://localhost:8105' : 'https://your-llama-service.railway.app');

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
  // Always try Llama first
  try {
    const response = await fetch(`${LLAMA_SERVICE_URL}/health`);
    if (response.ok) {
      const health = await response.json();
      if (health.ready) {
        logger.info('Using Llama 3.2 service');
        return 'llama';
      }
    }
  } catch (error) {
    logger.warn('Llama service not available, using fallback');
  }
  
  // Fallback to local heuristics
  logger.warn('No AI services available, using local fallbacks');
  return 'fallback';
};

// Initialize services
const llamaService = new LlamaService();

// Main analysis service
export class AIAnalysisService {
  private serviceType: 'llama' | 'fallback' | null = null;
  
  async initialize() {
    this.serviceType = await getPreferredService();
    logger.info(`AI Analysis Service initialized with: ${this.serviceType}`);
  }
  
  async analyzeBias(text: string) {
    await this.ensureInitialized();
    
    switch (this.serviceType) {
      case 'llama':
        return await this.analyzeBiasWithLlama(text);
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
      case 'fallback':
        return await this.analyzeCredibilityFallback(text);
      default:
        throw new Error('No AI service available');
    }
  }
  
  // Llama-specific methods
  private async analyzeBiasWithLlama(text: string) {
    try {
      const prompt = `You are an expert media analyst specializing in bias detection and critical thinking. Analyze the following text for various types of bias and provide a comprehensive, articulate analysis.

Please examine the text for:
1. Political bias (liberal/conservative leanings, partisan language)
2. Gender bias (stereotyping, unequal representation)
3. Racial/ethnic bias (stereotyping, discriminatory language)
4. Economic bias (class-based assumptions, wealth bias)
5. Confirmation bias (selective evidence, cherry-picking)
6. Framing bias (how issues are presented)
7. Source bias (reliability of sources cited)

Return a detailed JSON response with this structure:
{
  "overallBias": "low|medium|high",
  "biasScore": 0-100,
  "biasTypes": ["political", "gender", "racial", "economic", "confirmation", "framing"],
  "explanation": "Provide a comprehensive 3-4 sentence analysis explaining the types of bias detected, specific examples from the text, and how they might influence reader perception. Be articulate and detailed.",
  "biasedPhrases": ["specific biased phrases or sentences from the text"],
  "recommendations": ["3-4 specific recommendations for more balanced reporting or critical reading"],
  "detailedAnalysis": {
    "politicalBias": "Detailed analysis of political leanings and partisan language",
    "genderBias": "Analysis of gender representation and stereotyping",
    "racialBias": "Analysis of racial/ethnic bias and stereotyping",
    "economicBias": "Analysis of class-based assumptions and wealth bias",
    "sourceReliability": "Assessment of source credibility and potential conflicts of interest"
  }
}

Text to analyze: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 800,
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
      const prompt = `You are an expert in emotional intelligence and sentiment analysis. Provide a comprehensive analysis of the emotional content and sentiment of the following text.

Analyze for:
1. Overall sentiment (positive, negative, neutral, or mixed)
2. Emotional intensity and complexity
3. Specific emotions present (joy, sadness, anger, fear, surprise, disgust, trust, anticipation)
4. Emotional manipulation techniques
5. Tone and mood shifts
6. Emotional appeals to the reader

Return a detailed JSON response with this structure:
{
  "sentiment": "positive|negative|neutral|mixed",
  "confidence": 0-100,
  "emotions": ["joy", "sadness", "anger", "fear", "surprise", "disgust", "trust", "anticipation"],
  "explanation": "Provide a comprehensive 3-4 sentence analysis explaining the emotional content, tone, and how emotions are used to influence the reader. Be articulate and insightful.",
  "emotionalIntensity": "low|medium|high",
  "toneAnalysis": "Detailed analysis of the overall tone and mood",
  "emotionalAppeals": ["specific emotional appeals or manipulation techniques used"],
  "moodShifts": "Analysis of any changes in emotional tone throughout the text",
  "readerImpact": "How the emotional content might affect different types of readers"
}

Text: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 600,
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
      const prompt = `You are an expert in information extraction and content analysis. Extract and analyze the key entities, topics, and themes from the following text.

Please identify:
1. Named entities (people, organizations, locations, dates, events)
2. Key topics and themes
3. Important concepts and ideas
4. Relationships between entities
5. Context and significance of each entity

Return a detailed JSON response with this structure:
{
  "entities": [
    {
      "text": "entity name",
      "type": "PERSON|ORG|LOC|DATE|EVENT|CONCEPT",
      "confidence": 0-100,
      "significance": "Brief explanation of why this entity is important",
      "context": "How this entity relates to the main topic"
    }
  ],
  "keyTopics": ["main topics discussed in the text"],
  "themes": ["underlying themes and patterns"],
  "summary": "Provide a comprehensive 3-4 sentence summary of the main entities, topics, and their significance. Be articulate and insightful.",
  "relationships": "Analysis of how different entities and topics relate to each other",
  "contextualAnalysis": "How the entities and topics fit into broader social, political, or cultural contexts"
}

Text: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 700,
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
      const prompt = `You are an expert fact-checker and credibility analyst with deep knowledge of media literacy and information verification. Provide a comprehensive assessment of the credibility and reliability of the following text.

Evaluate the text for:
1. Source reputation and authority
2. Fact-checking quality and accuracy
3. Citation quality and transparency
4. Author expertise and credentials
5. Transparency about methodology and sources
6. Potential conflicts of interest
7. Logical consistency and reasoning
8. Evidence quality and relevance

Return a detailed JSON response with this structure:
{
  "credibilityScore": 0-100,
  "credibilityLevel": "high|medium|low",
  "factors": {
    "sourceReputation": 0-100,
    "factChecking": 0-100,
    "citationQuality": 0-100,
    "authorExpertise": 0-100,
    "transparency": 0-100,
    "logicalConsistency": 0-100,
    "evidenceQuality": 0-100
  },
  "explanation": "Provide a comprehensive 4-5 sentence analysis explaining the credibility assessment, specific strengths and weaknesses, and overall reliability. Be articulate and detailed.",
  "recommendations": ["3-4 specific recommendations for verifying claims or improving credibility"],
  "detailedAssessment": {
    "strengths": "Specific credible aspects of the text",
    "weaknesses": "Specific credibility concerns or red flags",
    "verificationNeeded": "Claims that require additional verification",
    "sourceAnalysis": "Detailed analysis of source reliability and potential biases",
    "methodologyAssessment": "Evaluation of research methods and analytical approach"
  },
  "confidenceLevel": "high|medium|low",
  "verificationPriority": "high|medium|low"
}

Text: "${text}"`;

      const response = await llamaService.generate({
        prompt,
        max_tokens: 900,
        temperature: 0.2
      });
      
      return this.parseLlamaResponse(response.result);
    } catch (error) {
      logger.error('Llama credibility analysis failed:', error);
      throw error;
    }
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
      isFallback: this.serviceType === 'fallback'
    };
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
