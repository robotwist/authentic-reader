/**
 * AI Service
 * 
 * Media Literacy Coach service that provides interpretative value through
 * subtext analysis and neutral rewrites of manipulative content.
 * 
 * Uses Groq/Llama3 to analyze news articles and translate spin into neutral facts.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Only load dotenv in Node.js environment (not in browser)
if (typeof process !== 'undefined' && process.versions?.node) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // Load environment variables with path relative to project root
  dotenv.config({ path: join(__dirname, '..', '..', '.env') });
  console.log("🔍 Loaded API Key:", process.env.GROQ_API_KEY ? "Yes (Masked)" : "NO - MISSING");
}

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
  
  /** The exact spin text from the article */
  quote: string;
  
  /** What is the author trying to make the reader feel? */
  subtext: string;
  
  /** Rewrite the quote to be neutral and factual */
  better_alternative: string;
}

/**
 * The complete analysis result from the LLM
 */
export interface AnalysisResult {
  /** A summary of the article's core claim */
  summary: string;
  
  /** Tone rating: e.g., "Alarmist", "Cynical", "Objective", "Fawning" */
  tone_rating: string;
  
  /** Bias rating: e.g., "left", "center", "right", "center-left", "center-right" */
  bias_rating: string;
  
  /** Confidence in the analysis (0-100) */
  confidence_score: number;
  
  /** A general tip for this type of article */
  educational_insight: string;
  
  /** What critical info was left out? */
  missing_context: string;
  
  /** Array of detected logical fallacies with subtext and neutral rewrites */
  fallacies: Fallacy[];
}

/**
 * Raw response structure expected from LLM
 */
interface LLMAnalysisResponse {
  summary: string;
  tone_rating: string;
  bias_rating: string;
  confidence_score: number;
  educational_insight: string;
  missing_context: string;
  fallacies: Array<{
    type: string;
    quote: string;
    subtext: string;
    better_alternative: string;
  }>;
}

// ============================================
// SERVICE CLASS
// ============================================

class AIService {
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
        logger.info('AI Service initialized with LLM');
      } else {
        logger.warn('LLM service unavailable, will use fallback analysis');
      }
      
      return this.isAvailable;
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      this.isInitialized = true;
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Build the system prompt for the LLM
   */
  private buildSystemPrompt(): string {
    return `You are an expert Media Literacy Coach. Your goal is to interpret the subtext of news and translate spin into neutral facts.

Analyze the text and return valid JSON with this structure:
{
  "summary": "String",
  "tone_rating": "String (e.g., Alarmist, Cynical)",
  "bias_rating": "String",
  "confidence_score": Number (0-100),
  "educational_insight": "String (A general tip for this type of article)",
  "missing_context": "String (What critical info was left out?)",
  "fallacies": [
    {
      "type": "String (Name of Fallacy)",
      "quote": "String (The exact spin text)",
      "subtext": "String (What is the author trying to make the reader feel?)", 
      "better_alternative": "String (Rewrite the quote to be neutral and factual)"
    }
  ]
}

## CRITICAL INSTRUCTIONS:
1. The "better_alternative" field MUST provide a clean, boring, factual rewrite of the manipulative quote.
2. Remove all emotional language, loaded terms, and spin from the "better_alternative".
3. Focus on facts, data, and neutral language in the rewrite.
4. The "subtext" should explain the emotional manipulation or intended reader response.
5. Output ONLY valid JSON - no markdown, no preamble, no explanation.
6. The "quote" field MUST contain exact verbatim text from the article.
7. Only report fallacies you are confident about (>70% confidence).
8. If no fallacies are detected, return an empty array for "fallacies".`;
  }

  /**
   * Main analysis function - analyzes article text using LLM
   */
  async analyzeArticle(text: string, metadata?: {
    title?: string;
    source?: string;
    author?: string;
  }): Promise<AnalysisResult> {
    // Verify API Key
    const groqApiKey = typeof process !== 'undefined' && process.env ? process.env.GROQ_API_KEY : 
                      (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GROQ_API_KEY : undefined);
    console.log("🔑 Checking API Key present:", !!groqApiKey);

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
        temperature: 0.2 // Balanced temperature for consistent yet slightly more creative analysis
      });

      // Parse the response
      return this.parseResponse(response.text, text);
      
    } catch (error) {
      console.error("❌ LLM CRASHED:", error instanceof Error ? error.message : String(error));
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error("Create Response:", axiosError.response?.data);
        console.error("Response Status:", axiosError.response?.status);
        console.error("Response Headers:", axiosError.response?.headers);
      }
      if (error instanceof Error) {
        console.error("Error Stack:", error.stack);
      }
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
        tone_rating: parsed.tone_rating || 'Neutral',
        bias_rating: parsed.bias_rating || 'center',
        confidence_score: Math.max(0, Math.min(100, parsed.confidence_score || 50)),
        educational_insight: parsed.educational_insight || 'Consider multiple perspectives when reading news.',
        missing_context: parsed.missing_context || 'No missing context identified.',
        fallacies: this.validateFallacies(parsed.fallacies || [], originalText)
      };

      return result;
      
    } catch (error) {
      logger.error('Failed to parse LLM response:', error);
      throw error;
    }
  }

  /**
   * Validate that fallacy quotes actually appear in the original text
   */
  private validateFallacies(fallacies: LLMAnalysisResponse['fallacies'], originalText: string): Fallacy[] {
    const normalizedOriginal = originalText.toLowerCase();
    
    return fallacies
      .filter(f => {
        // Verify the quote exists in the original text
        if (!f.quote) return false;
        const normalizedQuote = f.quote.toLowerCase().trim();
        return normalizedOriginal.includes(normalizedQuote);
      })
      .map(f => ({
        type: f.type || 'Unknown Fallacy',
        quote: f.quote.trim(),
        subtext: f.subtext || 'This text attempts to influence the reader emotionally.',
        better_alternative: f.better_alternative || 'Present the facts without emotional manipulation.'
      }));
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
      subtext: string;
      betterAlternative: string;
    }> = [
      {
        pattern: /anonymous sources?|sources? (?:say|claim|report)|insider(?:s)? (?:say|claim)/gi,
        type: 'Anonymous Authority',
        subtext: 'Creates unverifiable claims to build authority without accountability.',
        betterAlternative: 'Cite specific, named sources with verifiable credentials.'
      },
      {
        pattern: /think of the children|won't someone think of/gi,
        type: 'Appeal to Emotion',
        subtext: 'Uses emotional manipulation to bypass rational argument.',
        betterAlternative: 'Present evidence-based analysis of the policy impact.'
      },
      {
        pattern: /either .{5,50} or .{5,50}(?:$|\.)/gi,
        type: 'False Dichotomy',
        subtext: 'Presents only two options to force a false choice.',
        betterAlternative: 'Present multiple options and nuanced perspectives.'
      },
      {
        pattern: /everyone knows|most people (?:agree|believe|think)|it's obvious that/gi,
        type: 'Bandwagon',
        subtext: 'Uses social pressure to suggest consensus without evidence.',
        betterAlternative: 'Present specific data and evidence to support claims.'
      },
      {
        pattern: /if we (?:allow|permit|let) .{5,50}, (?:then |next |soon )/gi,
        type: 'Slippery Slope',
        subtext: 'Suggests inevitable negative consequences without evidence.',
        betterAlternative: 'Present evidence-based analysis of likely outcomes.'
      }
    ];

    for (const sentence of sentences) {
      for (const { pattern, type, subtext, betterAlternative } of heuristicPatterns) {
        const match = sentence.match(pattern);
        if (match && fallacies.length < 5) {
          fallacies.push({
            type,
            quote: match[0],
            subtext,
            better_alternative: betterAlternative
          });
        }
      }
    }

    // Simple bias heuristics
    const leftIndicators = (lowerText.match(/progressive|equality|diversity|climate|social justice/g) || []).length;
    const rightIndicators = (lowerText.match(/traditional|freedom|patriot|law and order|market/g) || []).length;
    
    let biasRating = 'center';
    if (leftIndicators > rightIndicators + 2) {
      biasRating = leftIndicators > rightIndicators + 4 ? 'left' : 'center-left';
    } else if (rightIndicators > leftIndicators + 2) {
      biasRating = rightIndicators > leftIndicators + 4 ? 'right' : 'center-right';
    }

    // Tone detection
    const emotionalWords = (lowerText.match(/outrage|shocking|horrific|devastating|unprecedented|historic|critical|urgent|crisis/g) || []).length;
    const toneRating = emotionalWords > 3 ? 'Alarmist' : 
                       emotionalWords > 1 ? 'Persuasive' : 'Analytical';

    return {
      summary: `Analysis of "${metadata?.title || 'article'}" from ${metadata?.source || 'unknown source'}. This is a heuristic-based analysis; LLM analysis unavailable.`,
      tone_rating: toneRating,
      bias_rating: biasRating,
      confidence_score: 40, // Lower confidence for heuristic analysis
      educational_insight: 'This analysis uses basic heuristics. For deeper insights, verify claims with multiple sources and consider alternative perspectives.',
      missing_context: 'Heuristic analysis cannot identify missing context. Review the article for omitted information, alternative viewpoints, and counterarguments.',
      fallacies
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

export const aiService = new AIService();
export default aiService;

