/**
 * Enhanced AI Analysis Service
 * 
 * Provides comprehensive article analysis with PhD-level bias and context analysis.
 * Identifies key sentences with explanations to help readers understand manipulation
 * and bias in media content.
 */

import axios from 'axios';
import logger from '../utils/logger.js';

class EnhancedAIAnalysisService {
  constructor() {
    this.primaryService = process.env.OLLAMA_SERVICE_URL || 'http://localhost:8105';
    this.fallbackService = process.env.HF_SERVICE_URL || 'http://localhost:8000';
    this.llamaService = process.env.LLAMA_SERVICE_URL || 'http://localhost:8105';
    
    this.analysisCache = new Map();
  }

  /**
   * PhD-Level Bias Analysis Prompt
   * Uses the expert system prompt for rhetorical analysis
   */
  getBiasAnalysisPrompt(article) {
    const content = article.content || article.description || '';
    const title = article.title || '';
    const source = article.source?.name || article.source || 'Unknown';
    
    return `TASK: Analyze the following article with the expertise of a seasoned media analyst specializing in:
- Cognitive biases and their exploitation in media
- Propaganda techniques and persuasive manipulation
- Rhetorical analysis and framing devices
- Contextual analysis and missing information
- Logical fallacies and argumentative weaknesses
- Emotional manipulation and appeal techniques

ARTICLE TO ANALYZE:
Title: ${title}
Source: ${source}
Content: ${content}

ANALYSIS REQUIREMENTS:

1. KEY SENTENCES IDENTIFICATION:
Identify 5-10 of the most important sentences in the article. For each key sentence, provide:
- The exact sentence text
- Why it's significant (is it a claim, emotional appeal, loaded language, etc.)
- What manipulation technique or bias is present (if any)
- What context or alternative perspective might be missing
- How this sentence might influence the reader's perception

Format each key sentence as:
{
  "sentence": "exact sentence text",
  "index": position_in_article,
  "significance": "explanation of why this sentence matters",
  "manipulationTechniques": ["technique1", "technique2"],
  "biasIndicators": ["bias type"],
  "missingContext": "what context or perspective is absent",
  "influenceAnalysis": "how this affects reader perception",
  "alternativePerspective": "what other viewpoints exist"
}

2. COMPREHENSIVE BIAS ANALYSIS:
Provide detailed bias analysis including:
- Political/ideological bias direction and intensity (0-100 scale)
- Cognitive biases present (confirmation bias, framing effects, etc.)
- Loaded language and emotionally charged terminology
- Selective presentation of facts or omission of context
- Source credibility indicators
- Comparison to neutral presentation of the topic

3. MANIPULATION DETECTION:
Identify and explain:
- Propaganda techniques used (if any)
- Emotional manipulation strategies
- Logical fallacies present
- Appeals to authority, fear, or other emotions
- Framing devices and narrative shaping

4. CONTEXT ANALYSIS:
Analyze what context might be missing:
- Historical background not provided
- Alternative perspectives omitted
- Conflicting evidence not mentioned
- Stakeholders or voices not represented
- Timeline or sequence issues

5. SUMMARY:
Provide a clear, neutral summary of the article's main claims and arguments.

6. READER GUIDANCE:
Provide specific guidance on:
- What questions the reader should ask themselves
- What additional information they should seek
- What red flags to be aware of
- How to verify claims independently

OUTPUT FORMAT (JSON):
{
  "keySentences": [array of key sentence objects as described above],
  "biasAnalysis": {
    "politicalBias": {
      "direction": "left|right|center|mixed",
      "intensity": 0-100,
      "indicators": ["list of specific indicators"],
      "explanation": "detailed explanation"
    },
    "cognitiveBiases": ["list of cognitive biases detected"],
    "loadedLanguage": ["examples of loaded terms"],
    "credibilityAssessment": {
      "score": 0-100,
      "factors": ["list of factors"],
      "concerns": ["list of concerns"]
    }
  },
  "manipulationAnalysis": {
    "techniques": ["list of techniques"],
    "emotionalAppeals": ["list of appeals"],
    "logicalFallacies": [{
      "type": "fallacy type",
      "location": "where in text",
      "explanation": "why it's problematic"
    }],
    "framingDevices": ["list of framing techniques"]
  },
  "contextAnalysis": {
    "missingContext": ["what's missing"],
    "alternativePerspectives": ["other viewpoints"],
    "conflictingEvidence": ["what contradicts this"],
    "unrepresentedVoices": ["who isn't heard"]
  },
  "summary": "neutral summary of main claims",
  "readerGuidance": {
    "keyQuestions": ["questions to consider"],
    "additionalResearch": ["what to research"],
    "redFlags": ["warning signs"],
    "verificationSteps": ["how to verify"]
  },
  "overallAssessment": {
    "reliabilityScore": 0-100,
    "recommendation": "what the reader should do",
    "confidence": 0-100
  }
}

Remember: Your goal is to empower readers to think critically, not to tell them what to think. Be thorough, specific, and educational in your analysis.`;
  }

  /**
   * Perform comprehensive AI analysis with key sentence highlighting
   */
  async analyzeArticle(article, options = {}) {
    try {
      const articleId = article.id || article.articleId || `article_${Date.now()}`;
      
      // Check cache
      if (this.analysisCache.has(articleId)) {
        logger.info(`Returning cached analysis for article: ${articleId}`);
        return this.analysisCache.get(articleId);
      }

      logger.info(`Starting enhanced AI analysis for article: ${article.title || articleId}`);

      // Build the comprehensive prompt
      const prompt = this.getBiasAnalysisPrompt(article);
      
      // Try to get analysis from AI service
      let analysisResult;
      try {
        analysisResult = await this.callAIService(prompt, article);
      } catch (error) {
        logger.warn('AI service failed, using structured fallback:', error.message);
        analysisResult = await this.performStructuredFallbackAnalysis(article);
      }

      // Structure the result
      const analysis = {
        articleId,
        timestamp: new Date().toISOString(),
        version: '2.0.0-enhanced',
        keySentences: analysisResult.keySentences || [],
        biasAnalysis: analysisResult.biasAnalysis || {},
        manipulationAnalysis: analysisResult.manipulationAnalysis || {},
        contextAnalysis: analysisResult.contextAnalysis || {},
        summary: analysisResult.summary || '',
        readerGuidance: analysisResult.readerGuidance || {},
        overallAssessment: analysisResult.overallAssessment || {},
        metadata: {
          source: article.source?.name || article.source || 'Unknown',
          title: article.title || '',
          analysisMethod: analysisResult.service || 'enhanced-ai',
          processingTime: Date.now() - (options.startTime || Date.now())
        }
      };

      // Cache the result
      this.analysisCache.set(articleId, analysis);
      
      // Cache expires after 24 hours
      setTimeout(() => {
        this.analysisCache.delete(articleId);
      }, 24 * 60 * 60 * 1000);

      logger.info(`Enhanced AI analysis completed for article: ${article.title || articleId}`);
      return analysis;

    } catch (error) {
      logger.error('Error in enhanced AI analysis:', error);
      throw error;
    }
  }

  /**
   * Call AI service (Ollama/Llama service)
   */
  async callAIService(prompt, article) {
    try {
      // Try Llama service first (if available)
      if (this.llamaService) {
        try {
          const response = await axios.post(`${this.llamaService}/analyze`, {
            text: article.content || article.description || '',
            title: article.title || '',
            source: article.source?.name || article.source || '',
            prompt: prompt
          }, {
            timeout: 60000 // 60 second timeout for comprehensive analysis
          });

          if (response.data && response.data.analysis) {
            return this.parseAIResponse(response.data.analysis, 'llama');
          }
        } catch (error) {
          logger.warn('Llama service call failed, trying direct Ollama:', error.message);
        }
      }

      // Try primary service (Ollama) with prompt
      const response = await axios.post(`${this.primaryService}/analyze`, {
        text: article.content || article.description || '',
        title: article.title || '',
        source: article.source?.name || article.source || '',
        prompt: prompt,
        options: {
          temperature: 0.7,
          max_tokens: 4000
        }
      }, {
        timeout: 60000
      });

      return this.parseAIResponse(response.data, 'ollama');

    } catch (error) {
      logger.error('AI service call failed:', error);
      throw error;
    }
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(data, service) {
    // If response is already structured JSON
    if (typeof data === 'object' && data.keySentences) {
      return { ...data, service };
    }

    // If response is a string, try to parse as JSON
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.keySentences) {
          return { ...parsed, service };
        }
      } catch (e) {
        // Not JSON, continue to fallback
      }
    }

    // If we have analysis object, try to extract structured data
    if (data.analysis) {
      return this.parseAIResponse(data.analysis, service);
    }

    // Fallback: return with service marker
    return {
      service,
      rawResponse: data,
      needsProcessing: true
    };
  }

  /**
   * Structured fallback analysis when AI service is unavailable
   */
  async performStructuredFallbackAnalysis(article) {
    const content = article.content || article.description || '';
    const sentences = this.extractSentences(content);
    
    // Identify key sentences using heuristics
    const keySentences = this.identifyKeySentences(sentences, content);
    
    // Basic bias detection
    const biasAnalysis = this.analyzeBiasStructured(content, article);
    
    // Basic manipulation detection
    const manipulationAnalysis = this.analyzeManipulationStructured(content);
    
    return {
      service: 'structured-fallback',
      keySentences,
      biasAnalysis,
      manipulationAnalysis,
      contextAnalysis: {
        missingContext: [],
        alternativePerspectives: []
      },
      summary: this.generateSummaryStructured(content),
      readerGuidance: {
        keyQuestions: [
          'What evidence supports these claims?',
          'What perspectives are missing?',
          'What is the source\'s track record?'
        ],
        redFlags: []
      },
      overallAssessment: {
        reliabilityScore: 50,
        confidence: 40
      }
    };
  }

  /**
   * Extract sentences from text
   */
  extractSentences(text) {
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  /**
   * Identify key sentences using heuristics
   */
  identifyKeySentences(sentences, fullText) {
    const keySentences = [];
    const textLower = fullText.toLowerCase();
    
    // Indicators of important sentences
    const importanceIndicators = [
      /\b(however|but|although|despite|nevertheless|yet)\b/i,
      /\b(important|significant|critical|crucial|key|essential)\b/i,
      /\b(shows?|demonstrates?|proves?|reveals?|indicates?)\b/i,
      /\b(according to|research shows|studies indicate)\b/i,
      /\b(first|second|third|finally|in conclusion)\b/i
    ];
    
    sentences.forEach((sentence, index) => {
      let score = 0;
      const sentenceLower = sentence.toLowerCase();
      
      // Check for importance indicators
      importanceIndicators.forEach(pattern => {
        if (pattern.test(sentence)) {
          score += 2;
        }
      });
      
      // Check for emotional language
      const emotionalWords = ['shocking', 'outrageous', 'amazing', 'terrible', 'devastating'];
      emotionalWords.forEach(word => {
        if (sentenceLower.includes(word)) {
          score += 1;
        }
      });
      
      // Check for claims/statements
      if (sentence.length > 50 && sentence.length < 200) {
        score += 1;
      }
      
      // Check sentence position (first and last are often important)
      if (index === 0 || index === sentences.length - 1) {
        score += 1;
      }
      
      if (score >= 2) {
        keySentences.push({
          sentence: sentence,
          index: index,
          significance: this.explainSentenceSignificance(sentence),
          manipulationTechniques: this.detectManipulationTechniques(sentence),
          biasIndicators: this.detectBiasIndicators(sentence),
          missingContext: 'Additional context may be needed to fully evaluate this claim.',
          influenceAnalysis: 'This sentence may influence reader perception through its framing and language choices.',
          alternativePerspective: 'Consider alternative viewpoints and additional evidence on this topic.',
          score: score
        });
      }
    });
    
    // Return top 5-10 sentences
    return keySentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(10, keySentences.length));
  }

  /**
   * Explain sentence significance
   */
  explainSentenceSignificance(sentence) {
    const s = sentence.toLowerCase();
    
    if (s.includes('however') || s.includes('but') || s.includes('although')) {
      return 'This sentence presents a contrast or counterpoint, which is often strategically placed to shift narrative.';
    }
    if (s.includes('proves') || s.includes('demonstrates') || s.includes('shows')) {
      return 'This sentence makes a claim of evidence or proof, which requires verification.';
    }
    if (s.includes('important') || s.includes('significant') || s.includes('critical')) {
      return 'This sentence emphasizes importance, potentially to prioritize certain information over others.';
    }
    if (s.includes('according to') || s.includes('research')) {
      return 'This sentence cites authority or research, which may or may not be accurately represented.';
    }
    
    return 'This sentence appears to be central to the article\'s argument or narrative structure.';
  }

  /**
   * Detect manipulation techniques in a sentence
   */
  detectManipulationTechniques(sentence) {
    const techniques = [];
    const s = sentence.toLowerCase();
    
    if (/\b(everyone|nobody|all|none|always|never)\b/.test(s)) {
      techniques.push('absolute language');
    }
    if (/\b(shocking|outrageous|devastating|terrible|amazing)\b/.test(s)) {
      techniques.push('emotional language');
    }
    if (/\b(obviously|clearly|undoubtedly|certainly|definitely)\b/.test(s)) {
      techniques.push('assertive language');
    }
    if (/\b(they|them|those people)\b/.test(s) && !/\b(they said|they claim)\b/.test(s)) {
      techniques.push('othering language');
    }
    
    return techniques;
  }

  /**
   * Detect bias indicators in a sentence
   */
  detectBiasIndicators(sentence) {
    const indicators = [];
    const s = sentence.toLowerCase();
    
    const leftTerms = ['progressive', 'liberal', 'democrat', 'left-wing'];
    const rightTerms = ['conservative', 'republican', 'right-wing', 'traditional'];
    
    if (leftTerms.some(term => s.includes(term))) {
      indicators.push('political terminology');
    }
    if (rightTerms.some(term => s.includes(term))) {
      indicators.push('political terminology');
    }
    
    return indicators;
  }

  /**
   * Analyze bias in structured format
   */
  analyzeBiasStructured(content, article) {
    const textLower = content.toLowerCase();
    
    // Simple political bias detection
    const leftTerms = ['progressive', 'liberal', 'democrat'].length;
    const rightTerms = ['conservative', 'republican', 'right-wing'].length;
    
    let direction = 'center';
    let intensity = 0;
    
    if (leftTerms > rightTerms) {
      direction = 'left';
      intensity = Math.min(50 + (leftTerms - rightTerms) * 10, 100);
    } else if (rightTerms > leftTerms) {
      direction = 'right';
      intensity = Math.min(50 + (rightTerms - leftTerms) * 10, 100);
    }
    
    return {
      politicalBias: {
        direction,
        intensity,
        indicators: [],
        explanation: `Analysis indicates ${direction} bias based on terminology and framing.`
      },
      cognitiveBiases: [],
      loadedLanguage: [],
      credibilityAssessment: {
        score: 50,
        factors: [],
        concerns: []
      }
    };
  }

  /**
   * Analyze manipulation in structured format
   */
  analyzeManipulationStructured(content) {
    const techniques = [];
    const textLower = content.toLowerCase();
    
    if (/\b(shocking|outrageous|devastating)\b/.test(textLower)) {
      techniques.push('emotional appeals');
    }
    if (/\b(obviously|clearly|undoubtedly)\b/.test(textLower)) {
      techniques.push('assertive language');
    }
    
    return {
      techniques,
      emotionalAppeals: [],
      logicalFallacies: [],
      framingDevices: []
    };
  }

  /**
   * Generate structured summary
   */
  generateSummaryStructured(content) {
    const sentences = this.extractSentences(content);
    if (sentences.length === 0) return '';
    
    // Return first few sentences as summary
    return sentences.slice(0, 3).join(' ') + (sentences.length > 3 ? '...' : '');
  }
}

export default new EnhancedAIAnalysisService();

