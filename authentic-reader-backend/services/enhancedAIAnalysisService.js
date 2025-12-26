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
    // Use Groq API for LLM inference
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.groqModel = 'llama3-70b-8192'; // PhD-level model
    
    this.fallbackService = process.env.HF_SERVICE_URL || 'http://localhost:8000';
    
    this.analysisCache = new Map();
    
    // Log configuration for debugging
    logger.info('EnhancedAIAnalysisService initialized:', {
      hasGroqApiKey: !!this.groqApiKey,
      groqModel: this.groqModel,
      usingGroq: !!this.groqApiKey
    });
    
    if (!this.groqApiKey) {
      logger.warn('GROQ_API_KEY not set - LLM analysis will use fallback methods');
    }
  }

  /**
   * Expert System Prompt - PhD-level expert in Logic, Literature, Rhetoric, and Cognitive Science
   * This is the full expert persona that analyzes text to protect readers from manipulation
   */
  getExpertSystemPrompt() {
    return `You are a PhD-level expert in Logic, Literature, with a love of the Classics and the Literary Canon, Biblical Ethics and Exegesis, with a love of Biblical typology, Rhetoric, and Cognitive Science, specializing in media literacy and defense against propaganda. Your sole purpose is to analyze text to protect the reader from manipulation. You are known to not tip your hand to what you believe and to have a love for people being empowered to belief and stand up for the truth.

When provided with an article or text segment, perform a deep rhetorical audit. Do not simply list fallacies; you must deconstruct the architecture of the argument.

For every distinct logical fallacy, rhetorical trick, or manipulative phrasing you detect, provide an analysis covering these five dimensions:

1. THE FALLACY (What):
   - Name the specific logical fallacy (e.g., Ad Hominem, Straw Man, Motte and Bailey, Appeal to Emotion) or cognitive bias being exploited.

2. THE MECHANISM (How):
   - Quote the specific text.
   - Explain the mechanical failure in logic. (e.g., "The author attacks the opponent's character rather than refuting the premise X.")

3. THE CONTEXT (Where/When):
   - Locate where this occurs in the flow of the argument. Is it used to open the piece to frame the mindset? Is it used in the conclusion to obscure a lack of evidence?

4. THE MOTIVE (Why/For What Purpose):
   - Analyze the author's intent. Why use this specific fallacy here?
   - Examples: "To trigger a tribal fear response," "To distract from a missing data point," "To create a false sense of urgency."

5. THE IMMUNIZATION (Defense):
   - Briefly explain how the reader can mentally "correct" this manipulation to see the raw facts (or lack thereof) underneath.

**Output Rules:**
- Tone: Clinical, objective, and empowering. You are an advisor, not a cynic.
- Format: Use clear Markdown. Use bolding for key terms.
- Threshold: Ignore minor grammatical nitpicks. Focus strictly on logic and manipulation.
- If the text is factually sound and logically valid, explicitly state that it appears free of manipulative rhetoric.`;
  }

  /**
   * PhD-Level Bias Analysis Prompt
   * Uses the expert system prompt for rhetorical analysis
   * @deprecated - Use getLogicalFallacySystemPrompt for focused fallacy analysis
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
   * Build logical fallacy analysis prompt
   * Note: System prompt is now handled separately in callAIService via getExpertSystemPrompt
   */
  getLogicalFallacyPrompt(article) {
    const content = article.content || article.description || '';
    const title = article.title || '';
    
    return `Analyze the following article for logical fallacies and provide a comprehensive analysis following the expert system guidelines:

ARTICLE TO ANALYZE:
Title: ${title}
Content: ${content}

Provide your analysis in the structured format specified in the system prompt.`;
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

      // Build the comprehensive prompt (use logical fallacy prompt for focused analysis)
      const prompt = options.focusOnFallacies 
        ? this.getLogicalFallacyPrompt(article)
        : this.getBiasAnalysisPrompt(article);
      
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
   * Call Groq API for LLM analysis
   * Uses the expert system prompt as the system message and the analysis prompt as user message
   */
  async callAIService(prompt, article) {
    try {
      // Check if Groq API key is configured
      if (!this.groqApiKey) {
        throw new Error('GROQ_API_KEY not configured. Cannot perform LLM analysis.');
      }

      const expertSystemPrompt = this.getExpertSystemPrompt();
      const articleText = article.content || article.description || '';
      const articleTitle = article.title || '';
      const articleSource = article.source?.name || article.source || 'Unknown';
      
      // Build the user message with the analysis prompt and article content
      const userMessage = `${prompt}\n\nARTICLE TO ANALYZE:\nTitle: ${articleTitle}\nSource: ${articleSource}\nContent: ${articleText}`;

      logger.info('Calling Groq API for LLM analysis...', {
        model: this.groqModel,
        articleTitle: articleTitle.substring(0, 50)
      });

      // Call Groq API
      const response = await axios.post(
        this.groqApiUrl,
        {
          model: this.groqModel,
          messages: [
            {
              role: 'system',
              content: expertSystemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.1, // Keep it analytical
          response_format: { type: 'json_object' }, // Force valid JSON
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      // Extract the response content
      const responseContent = response.data?.choices?.[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No response content from Groq API');
      }

      logger.info('Groq API response received, parsing...');

      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = typeof responseContent === 'string' 
          ? JSON.parse(responseContent) 
          : responseContent;
      } catch (parseError) {
        logger.warn('Failed to parse Groq response as JSON, attempting to extract JSON...', parseError);
        // Try to extract JSON from markdown code blocks or text
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse Groq response as JSON');
        }
      }

      // Return parsed response with service marker
      return this.parseAIResponse(parsedResponse, 'groq');

    } catch (error) {
      logger.error('Groq API call failed:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(data, service) {
    // If response is already structured JSON with expected format
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
        // If it's a different structure, try to extract what we need
        return { ...parsed, service };
      } catch (e) {
        logger.warn('Failed to parse response string as JSON:', e.message);
      }
    }

    // If we have analysis object nested, extract it
    if (data.analysis) {
      return this.parseAIResponse(data.analysis, service);
    }

    // If data is an object but doesn't have keySentences, try to structure it
    if (typeof data === 'object' && data !== null) {
      // Return the data with service marker - let the calling code handle structure
      return { ...data, service };
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

