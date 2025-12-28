/**
 * Enhanced Cognitive Analysis Service
 * 
 * LLM-powered analysis service that replaces regex-based detection
 * with intelligent, context-aware logical fallacy detection.
 * 
 * Uses Groq/Llama3-70b (or compatible LLM) to output structured
 * cognitive analysis including fallacies, bias, and tone.
 */

import { LlamaService } from './LlamaService';
import { logger } from '../utils/logger';

// ============================================
// INTERFACES
// ============================================

/**
 * A single logical fallacy detected in the article
 */
export interface Fallacy {
  /** The type/name of the fallacy (e.g., "Ad Hominem", "Straw Man") */
  type: string;
  
  /** The exact text excerpt containing the fallacy */
  excerpt: string;
  
  /** Severity level of the fallacy */
  severity: 'low' | 'medium' | 'high';
  
  /** Explanation of why this is a fallacy and how it manipulates */
  explanation: string;
  
  /** What a healthy, logical argument would look like instead */
  betterAlternative: string;
}

/**
 * The complete analysis result from the LLM
 */
export interface AnalysisResult {
  /** A 2-3 sentence summary of the article's main claims and approach */
  summary: string;
  
  /** Political bias direction */
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
  
  /** Confidence in the bias assessment (1-100) */
  biasConfidence: number;
  
  /** The overall tone of the article */
  tone: string;
  
  /** Array of detected logical fallacies */
  fallacies: Fallacy[];
  
  /** Overall reliability score (0-100) */
  reliabilityScore: number;
  
  /** Key manipulation techniques used */
  manipulationTechniques: string[];
}

/**
 * Raw response structure expected from LLM
 */
interface LLMAnalysisResponse {
  summary: string;
  bias: string;
  biasConfidence: number;
  tone: string;
  fallacies: Array<{
    type: string;
    excerpt: string;
    severity: string;
    explanation: string;
    betterAlternative: string;
  }>;
  reliabilityScore: number;
  manipulationTechniques: string[];
}

// ============================================
// FALLACY TAXONOMY
// ============================================

/**
 * The taxonomy of fallacies we instruct the LLM to detect
 */
export const FALLACY_TAXONOMY = {
  // Informal Fallacies - Attacks & Deflection
  AD_HOMINEM: {
    name: 'Ad Hominem',
    description: 'Attacking the person making the argument rather than the argument itself',
    examples: [
      'You can\'t trust his economic plan - he\'s never run a business.',
      'Of course she supports that policy, she\'s a coastal elite.'
    ]
  },
  STRAW_MAN: {
    name: 'Straw Man',
    description: 'Misrepresenting someone\'s argument to make it easier to attack',
    examples: [
      'Environmentalists want to destroy all industry.',
      'Gun rights advocates don\'t care about children\'s safety.'
    ]
  },
  TU_QUOQUE: {
    name: 'Tu Quoque (Whataboutism)',
    description: 'Deflecting criticism by pointing to someone else\'s similar behavior',
    examples: [
      'You criticize our spending? What about their spending?',
      'How can they lecture us when they did the same thing?'
    ]
  },
  
  // Emotional Manipulation
  APPEAL_TO_EMOTION: {
    name: 'Appeal to Emotion',
    description: 'Using emotional manipulation instead of logical reasoning',
    examples: [
      'Think of the children who will suffer!',
      'Our brave heroes didn\'t die for this.'
    ]
  },
  APPEAL_TO_FEAR: {
    name: 'Appeal to Fear',
    description: 'Using fear to bypass rational argument',
    examples: [
      'If we don\'t act now, our way of life will be destroyed.',
      'They\'re coming for your freedom.'
    ]
  },
  
  // False Logic
  FALSE_DICHOTOMY: {
    name: 'False Dichotomy',
    description: 'Presenting only two options when more exist',
    examples: [
      'You\'re either with us or against us.',
      'We either do this or face disaster.'
    ]
  },
  SLIPPERY_SLOPE: {
    name: 'Slippery Slope',
    description: 'Claiming one action will inevitably lead to extreme consequences without evidence',
    examples: [
      'If we allow this, next they\'ll want to ban everything.',
      'Once we start down this path, there\'s no stopping.'
    ]
  },
  CIRCULAR_REASONING: {
    name: 'Circular Reasoning',
    description: 'Using the conclusion as a premise in the argument',
    examples: [
      'The Bible is true because it says so in the Bible.',
      'This policy works because it\'s effective.'
    ]
  },
  
  // Evidence Issues
  HASTY_GENERALIZATION: {
    name: 'Hasty Generalization',
    description: 'Drawing broad conclusions from limited examples',
    examples: [
      'I met two rude people from that city, so everyone there is rude.',
      'This happened twice, so it always happens.'
    ]
  },
  FALSE_CAUSE: {
    name: 'False Cause (Post Hoc)',
    description: 'Assuming correlation implies causation',
    examples: [
      'Crime rose after the policy, so the policy caused crime.',
      'He got sick after the meeting, so the meeting made him sick.'
    ]
  },
  CHERRY_PICKING: {
    name: 'Cherry Picking',
    description: 'Selecting only evidence that supports the conclusion while ignoring contradictory evidence',
    examples: [
      'Studies show X (ignoring studies that show Y).',
      'Looking only at data from favorable time periods.'
    ]
  },
  
  // Authority Issues
  APPEAL_TO_AUTHORITY: {
    name: 'Appeal to Authority',
    description: 'Using authority or expertise as the sole evidence for a claim',
    examples: [
      'Experts say... (without specifying who or their credentials)',
      'A famous person endorses this, so it must be good.'
    ]
  },
  ANONYMOUS_AUTHORITY: {
    name: 'Anonymous Authority',
    description: 'Citing unnamed sources to make claims unverifiable',
    examples: [
      'Sources close to the matter say...',
      'Insiders report that...'
    ]
  },
  
  // Bandwagon & Consensus
  BANDWAGON: {
    name: 'Bandwagon (Appeal to Popularity)',
    description: 'Arguing something is true because many people believe it',
    examples: [
      'Everyone knows this is true.',
      'Most people agree with this position.'
    ]
  }
};

// ============================================
// SERVICE CLASS
// ============================================

class EnhancedCognitiveAnalysisService {
  private llamaService: LlamaService;
  private isInitialized: boolean = false;
  private isAvailable: boolean = false;

  constructor() {
    this.llamaService = new LlamaService();
  }

  /**
   * Initialize and check if LLM service is available
   */
  async initialize(): Promise<boolean> {
    try {
      const status = await this.llamaService.checkStatus();
      this.isAvailable = status.status === 'healthy';
      this.isInitialized = true;
      
      if (this.isAvailable) {
        logger.info('Enhanced Cognitive Analysis Service initialized with LLM');
      } else {
        logger.warn('LLM service unavailable, will use fallback analysis');
      }
      
      return this.isAvailable;
    } catch (error) {
      logger.error('Failed to initialize Enhanced Cognitive Analysis Service:', error);
      this.isInitialized = true;
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Build the system prompt for the LLM
   */
  private buildSystemPrompt(): string {
    const fallacyList = Object.values(FALLACY_TAXONOMY)
      .map(f => `- ${f.name}: ${f.description}`)
      .join('\n');

    return `You are an expert Logic Analyst and Media Literacy Specialist. Your job is to analyze news articles for logical fallacies, bias, and manipulation techniques.

## YOUR TASK
Analyze the provided article text and detect:
1. Logical fallacies (with exact quotes)
2. Political bias and direction
3. Overall tone and rhetorical approach
4. Manipulation techniques employed

## FALLACY TAXONOMY
Look specifically for these fallacy types:
${fallacyList}

## OUTPUT FORMAT
You MUST output ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence summary of the article's main claims and rhetorical approach",
  "bias": "left" | "center-left" | "center" | "center-right" | "right",
  "biasConfidence": 1-100,
  "tone": "single word or short phrase describing tone (e.g., 'Alarmist', 'Analytical', 'Neutral', 'Persuasive', 'Inflammatory')",
  "fallacies": [
    {
      "type": "Exact fallacy name from taxonomy",
      "excerpt": "The EXACT quote from the article (must be verbatim text that appears in the article)",
      "severity": "low" | "medium" | "high",
      "explanation": "Why this is a fallacy and how it attempts to manipulate the reader",
      "betterAlternative": "How a logical, fair argument would present this point"
    }
  ],
  "reliabilityScore": 0-100,
  "manipulationTechniques": ["List of manipulation techniques used, e.g., 'emotional language', 'anonymous sources', 'loaded framing'"]
}

## CRITICAL RULES
1. Output ONLY the JSON object - no preamble, no markdown, no explanation
2. The "excerpt" field MUST contain exact verbatim text from the article
3. Only report fallacies you are confident about (>70% confidence)
4. If no fallacies are detected, return an empty array for "fallacies"
5. Be specific in explanations - don't use generic language
6. The "betterAlternative" should show what fair journalism would look like`;
  }

  /**
   * Main analysis function - analyzes article text using LLM
   */
  async analyzeArticle(text: string, metadata?: {
    title?: string;
    source?: string;
    author?: string;
  }): Promise<AnalysisResult> {
    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If LLM is not available, use fallback
    if (!this.isAvailable) {
      return this.fallbackAnalysis(text, metadata);
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      
      // Build the user prompt with article context
      let userPrompt = '';
      if (metadata?.title) {
        userPrompt += `TITLE: ${metadata.title}\n`;
      }
      if (metadata?.source) {
        userPrompt += `SOURCE: ${metadata.source}\n`;
      }
      if (metadata?.author) {
        userPrompt += `AUTHOR: ${metadata.author}\n`;
      }
      userPrompt += `\nARTICLE TEXT:\n${text}`;

      // Call the LLM
      const response = await this.llamaService.generateText({
        prompt: userPrompt,
        system_prompt: systemPrompt,
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for consistent, accurate analysis
      });

      // Parse the response
      return this.parseResponse(response.text, text);
      
    } catch (error) {
      logger.error('LLM analysis failed, using fallback:', error);
      return this.fallbackAnalysis(text, metadata);
    }
  }

  /**
   * Parse LLM response into structured AnalysisResult
   */
  private parseResponse(responseText: string, originalText: string): AnalysisResult {
    try {
      // Try to extract JSON from the response
      let jsonStr = responseText.trim();
      
      // Handle markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // Find JSON object
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      const parsed: LLMAnalysisResponse = JSON.parse(jsonStr);

      // Validate and normalize the response
      const result: AnalysisResult = {
        summary: parsed.summary || 'Analysis completed.',
        bias: this.normalizeBias(parsed.bias),
        biasConfidence: Math.max(0, Math.min(100, parsed.biasConfidence || 50)),
        tone: parsed.tone || 'Neutral',
        reliabilityScore: Math.max(0, Math.min(100, parsed.reliabilityScore || 50)),
        manipulationTechniques: Array.isArray(parsed.manipulationTechniques) 
          ? parsed.manipulationTechniques 
          : [],
        fallacies: this.validateFallacies(parsed.fallacies || [], originalText)
      };

      return result;
      
    } catch (error) {
      logger.error('Failed to parse LLM response:', error);
      throw error;
    }
  }

  /**
   * Normalize bias string to valid enum value
   */
  private normalizeBias(bias: string): AnalysisResult['bias'] {
    const normalized = (bias || '').toLowerCase().trim();
    
    if (normalized.includes('left') && !normalized.includes('center')) {
      return 'left';
    }
    if (normalized.includes('center-left') || normalized.includes('center left')) {
      return 'center-left';
    }
    if (normalized.includes('center-right') || normalized.includes('center right')) {
      return 'center-right';
    }
    if (normalized.includes('right') && !normalized.includes('center')) {
      return 'right';
    }
    return 'center';
  }

  /**
   * Validate that fallacy excerpts actually appear in the original text
   */
  private validateFallacies(fallacies: LLMAnalysisResponse['fallacies'], originalText: string): Fallacy[] {
    const normalizedOriginal = originalText.toLowerCase();
    
    return fallacies
      .filter(f => {
        // Verify the excerpt exists in the original text
        if (!f.excerpt) return false;
        const normalizedExcerpt = f.excerpt.toLowerCase().trim();
        return normalizedOriginal.includes(normalizedExcerpt);
      })
      .map(f => ({
        type: f.type || 'Unknown Fallacy',
        excerpt: f.excerpt.trim(),
        severity: this.normalizeSeverity(f.severity),
        explanation: f.explanation || 'This argument contains a logical flaw.',
        betterAlternative: f.betterAlternative || 'Present evidence-based reasoning without manipulation.'
      }));
  }

  /**
   * Normalize severity to valid enum value
   */
  private normalizeSeverity(severity: string): Fallacy['severity'] {
    const normalized = (severity || '').toLowerCase().trim();
    if (normalized === 'high') return 'high';
    if (normalized === 'low') return 'low';
    return 'medium';
  }

  /**
   * Fallback analysis when LLM is unavailable
   * Uses heuristics but returns same interface
   */
  private fallbackAnalysis(text: string, metadata?: {
    title?: string;
    source?: string;
    author?: string;
  }): AnalysisResult {
    logger.warn('Using fallback heuristic analysis');

    const fallacies: Fallacy[] = [];
    const lowerText = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Simple heuristic detection
    const heuristicPatterns: Array<{
      pattern: RegExp;
      type: string;
      severity: Fallacy['severity'];
    }> = [
      {
        pattern: /anonymous sources?|sources? (?:say|claim|report)|insider(?:s)? (?:say|claim)/gi,
        type: 'Anonymous Authority',
        severity: 'medium'
      },
      {
        pattern: /think of the children|won't someone think of/gi,
        type: 'Appeal to Emotion',
        severity: 'high'
      },
      {
        pattern: /either .{5,50} or .{5,50}(?:$|\.)/gi,
        type: 'False Dichotomy',
        severity: 'medium'
      },
      {
        pattern: /everyone knows|most people (?:agree|believe|think)|it's obvious that/gi,
        type: 'Bandwagon',
        severity: 'low'
      },
      {
        pattern: /if we (?:allow|permit|let) .{5,50}, (?:then |next |soon )/gi,
        type: 'Slippery Slope',
        severity: 'medium'
      }
    ];

    for (const sentence of sentences) {
      for (const { pattern, type, severity } of heuristicPatterns) {
        const match = sentence.match(pattern);
        if (match && fallacies.length < 5) {
          fallacies.push({
            type,
            excerpt: match[0],
            severity,
            explanation: `This phrase may indicate a ${type} fallacy. Manual verification recommended.`,
            betterAlternative: 'Present claims with verifiable evidence and named sources.'
          });
        }
      }
    }

    // Simple bias heuristics
    const leftIndicators = (lowerText.match(/progressive|equality|diversity|climate|social justice/g) || []).length;
    const rightIndicators = (lowerText.match(/traditional|freedom|patriot|law and order|market/g) || []).length;
    
    let bias: AnalysisResult['bias'] = 'center';
    if (leftIndicators > rightIndicators + 2) {
      bias = leftIndicators > rightIndicators + 4 ? 'left' : 'center-left';
    } else if (rightIndicators > leftIndicators + 2) {
      bias = rightIndicators > leftIndicators + 4 ? 'right' : 'center-right';
    }

    // Tone detection
    const emotionalWords = (lowerText.match(/outrage|shocking|horrific|devastating|unprecedented|historic|critical|urgent|crisis/g) || []).length;
    const tone = emotionalWords > 3 ? 'Alarmist' : 
                 emotionalWords > 1 ? 'Persuasive' : 'Analytical';

    return {
      summary: `Analysis of "${metadata?.title || 'article'}" from ${metadata?.source || 'unknown source'}. This is a heuristic-based analysis; LLM analysis unavailable.`,
      bias,
      biasConfidence: 40, // Lower confidence for heuristic analysis
      tone,
      fallacies,
      reliabilityScore: Math.max(30, 70 - (fallacies.length * 10)),
      manipulationTechniques: fallacies.map(f => f.type)
    };
  }

  /**
   * Get service status
   */
  getStatus(): { initialized: boolean; available: boolean } {
    return {
      initialized: this.isInitialized,
      available: this.isAvailable
    };
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const enhancedCognitiveAnalysisService = new EnhancedCognitiveAnalysisService();
export default enhancedCognitiveAnalysisService;

