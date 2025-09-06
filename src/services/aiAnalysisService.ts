/**
 * Llama AI Analysis Service
 * 
 * This service uses Llama 3.2 for all AI analysis tasks.
 * Works for both local development and deployed environments.
 */

import { LlamaService } from './LlamaService';
import { logger } from '../utils/logger';

// Determine environment
const isLocalDevelopment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};

// Configuration
const LLAMA_SERVICE_URL = import.meta.env.VITE_LLAMA_SERVICE_URL || 
  (isLocalDevelopment() ? 'http://localhost:8105' : 'https://web-production-2e12d.up.railway.app');

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
      // Use enhanced Chomsky-inspired prompt
      const { enhancedPromptService } = await import('./enhancedPromptService');
      
      const article = { content: text, title: 'Article Analysis', source: 'Unknown' };
      const prompt = enhancedPromptService.generateStructuralAnalysisPrompt(article, {
        userLevel: 'intermediate',
        analysisDepth: 'deep',
        focusAreas: ['bias', 'power', 'institutional'],
        learningObjectives: ['bias detection', 'critical thinking', 'media literacy']
      });
      
      const enhancedPrompt = `${prompt.systemPrompt}

${prompt.userPrompt}

FOCUS SPECIFICALLY ON BIAS ANALYSIS:
- Political bias and partisan framing
- Economic bias and class assumptions  
- Institutional bias and power structures
- Linguistic bias and loaded language
- Source bias and credibility issues

Provide specific examples from the text and explain how each type of bias might influence reader perception.`;

      const response = await llamaService.generate({
        prompt: enhancedPrompt,
        max_tokens: 1000,
        temperature: 0.2
      });
      
      return await this.parseLlamaResponse(response.result, { content: text, title: 'Bias Analysis' });
    } catch (error) {
      logger.error('Llama bias analysis failed:', error);
      throw error;
    }
  }
  
  private async analyzeSentimentWithLlama(text: string) {
    try {
      // Use enhanced linguistic analysis prompt
      const { enhancedPromptService } = await import('./enhancedPromptService');
      
      const article = { content: text, title: 'Article Analysis', source: 'Unknown' };
      const prompt = enhancedPromptService.generateLinguisticAnalysisPrompt(article, {
        userLevel: 'intermediate',
        analysisDepth: 'deep',
        focusAreas: ['sentiment', 'emotion', 'linguistic'],
        learningObjectives: ['emotional intelligence', 'linguistic analysis', 'manipulation detection']
      });
      
      const enhancedPrompt = `${prompt.systemPrompt}

${prompt.userPrompt}

FOCUS SPECIFICALLY ON EMOTIONAL AND SENTIMENT ANALYSIS:
- Overall sentiment and emotional tone
- Emotional manipulation techniques
- Linguistic devices used to influence emotions
- How language choices shape emotional responses
- Reader impact and emotional appeals

Provide specific examples from the text and explain how linguistic choices create emotional effects.`;

      const response = await llamaService.generate({
        prompt: enhancedPrompt,
        max_tokens: 800,
        temperature: 0.2
      });
      
      return await this.parseLlamaResponse(response.result, { content: text, title: 'Sentiment Analysis' });
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
      
      return await this.parseLlamaResponse(response.result, { content: text, title: 'Entity Extraction' });
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
      
      return await this.parseLlamaResponse(response.result, { content: text, title: 'Credibility Analysis' });
    } catch (error) {
      logger.error('Llama credibility analysis failed:', error);
      throw error;
    }
  }
  
  // Enhanced fallback methods with educational value
  private async analyzeBiasFallback(text: string) {
    // Enhanced heuristic-based bias detection with educational insights
    const biasIndicators = {
      political: ['liberal', 'conservative', 'democrat', 'republican', 'left-wing', 'right-wing', 'progressive', 'traditional'],
      gender: ['man', 'woman', 'male', 'female', 'he', 'she', 'masculine', 'feminine'],
      racial: ['race', 'ethnic', 'black', 'white', 'hispanic', 'asian', 'minority', 'majority'],
      economic: ['rich', 'poor', 'wealthy', 'poverty', 'class', 'corporate', 'business', 'market'],
      institutional: ['expert', 'official', 'authority', 'establishment', 'mainstream', 'institution']
    };
    
    const foundBias = [];
    let biasScore = 0;
    const biasDetails = {};
    
    Object.entries(biasIndicators).forEach(([type, indicators]) => {
      const foundIndicators = indicators.filter(indicator => 
        text.toLowerCase().includes(indicator.toLowerCase())
      );
      if (foundIndicators.length > 0) {
        foundBias.push(type);
        biasDetails[type] = foundIndicators;
        biasScore += foundIndicators.length * 10;
      }
    });
    
    return {
      overallBias: biasScore > 50 ? 'high' : biasScore > 20 ? 'medium' : 'low',
      biasScore: Math.min(biasScore, 100),
      biasTypes: foundBias,
      explanation: `Enhanced heuristic analysis detected ${foundBias.length} types of potential bias: ${foundBias.join(', ')}. This analysis helps identify bias patterns but should be supplemented with deeper critical analysis.`,
      biasedPhrases: this.extractBiasedPhrases(text, Object.values(biasIndicators).flat()),
      recommendations: [
        'Look for alternative perspectives on this topic',
        'Examine the source and potential conflicts of interest',
        'Consider what information might be omitted',
        'Question the framing and language choices used',
        'Seek out grassroots or non-institutional sources'
      ],
      educationalInsights: {
        biasPatterns: 'This analysis demonstrates how language choices can reveal underlying biases',
        criticalQuestions: [
          'What perspective is privileged in this content?',
          'What alternative viewpoints are missing?',
          'How might institutional interests influence this framing?'
        ],
        learningObjectives: [
          'Develop awareness of bias indicators in media',
          'Learn to identify multiple types of bias',
          'Practice critical questioning of content sources'
        ]
      },
      detailedAnalysis: biasDetails
    };
  }
  
  private extractBiasedPhrases(text: string, biasWords: string[]): string[] {
    const phrases: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      for (const word of biasWords) {
        if (sentence.toLowerCase().includes(word.toLowerCase())) {
          phrases.push(sentence.trim());
          break; // Only add each sentence once
        }
      }
    }
    
    return phrases.slice(0, 5); // Limit to 5 examples
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
  
  private async parseLlamaResponse(response: string, article?: any) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate response quality if we have article context
      if (article) {
        const { responseValidationService } = await import('./responseValidationService');
        const validation = responseValidationService.validateChomskyAnalysis(response, article);
        
        if (!validation.isValid) {
          logger.warn('Response validation failed:', validation.errors);
          // Return enhanced fallback if validation fails
          return responseValidationService.generateFallbackResponse(article, validation.errors.join(', '));
        }
        
        // Return enhanced response if validation passes
        return validation.enhancedResponse || parsed;
      }
      
      return parsed;
    } catch (error) {
      logger.error('Failed to parse Llama response:', error);
      
      // Generate fallback response if parsing fails
      if (article) {
        const { responseValidationService } = await import('./responseValidationService');
        return responseValidationService.generateFallbackResponse(article, 'JSON parsing failed');
      }
      
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
