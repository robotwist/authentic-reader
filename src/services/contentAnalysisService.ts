import axios from 'axios';
import { logger } from '../utils/logger';
import { analyzeManipulativeContent, ManipulationAnalysis } from './doomscrollAnalysisService';
import { analyzeEmotions, EmotionAnalysisResult } from './emotionAnalysisService';
import {
  classifyText,
  extractEntities,
  getTextEmbeddings,
  summarizeText,
  analyzeSentiment as hfAnalyzeSentiment,
  analyzePoliticalBias,
  enhancedEntityExtraction,
  generateAdvancedSummary
} from './huggingFaceService';
import { analyzeManipulation } from './darkPatternService';

/**
 * Types of logical fallacies that can be detected
 */
export enum LogicalFallacyType {
  AD_HOMINEM = 'AD_HOMINEM',
  STRAW_MAN = 'STRAW_MAN',
  APPEAL_TO_EMOTION = 'APPEAL_TO_EMOTION',
  FALSE_DILEMMA = 'FALSE_DILEMMA',
  SLIPPERY_SLOPE = 'SLIPPERY_SLOPE',
  HASTY_GENERALIZATION = 'HASTY_GENERALIZATION',
  CIRCULAR_REASONING = 'CIRCULAR_REASONING',
  APPEAL_TO_AUTHORITY = 'APPEAL_TO_AUTHORITY',
  BANDWAGON = 'BANDWAGON',
  RED_HERRING = 'RED_HERRING',
  APPEAL_TO_IGNORANCE = 'APPEAL_TO_IGNORANCE',
  TU_QUOQUE = 'TU_QUOQUE',
  ANECDOTAL = 'ANECDOTAL',
  LOADED_QUESTION = 'LOADED_QUESTION',
  NO_TRUE_SCOTSMAN = 'NO_TRUE_SCOTSMAN',
  TEXAS_SHARPSHOOTER = 'TEXAS_SHARPSHOOTER',
  MIDDLE_GROUND = 'MIDDLE_GROUND',
  GAMBLER_FALLACY = 'GAMBLER_FALLACY',
  APPEAL_TO_NATURE = 'APPEAL_TO_NATURE',
  COMPOSITION_DIVISION = 'COMPOSITION_DIVISION'
}

/**
 * Represents detected logical fallacy in text
 */
export interface LogicalFallacy {
  type: LogicalFallacyType;
  confidence: number; // 0.0 to 1.0
  explanation: string;
  excerpt: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Types of political bias
 */
export enum BiasType {
  LEFT_EXTREME = 'LEFT_EXTREME',
  LEFT_STRONG = 'LEFT_STRONG',
  LEFT_MODERATE = 'LEFT_MODERATE',
  LEFT_SLIGHT = 'LEFT_SLIGHT',
  CENTER = 'CENTER',
  RIGHT_SLIGHT = 'RIGHT_SLIGHT',
  RIGHT_MODERATE = 'RIGHT_MODERATE',
  RIGHT_STRONG = 'RIGHT_STRONG',
  RIGHT_EXTREME = 'RIGHT_EXTREME'
}

/**
 * Represents the overall political bias of an article
 */
export interface BiasAnalysis {
  type: BiasType;
  confidence: number; // 0.0 to 1.0
  explanation: string;
  leftIndicators?: string[];
  rightIndicators?: string[];
  scores?: {
    left: number;
    center: number;
    right: number;
  };
}

/**
 * Information about article structure and sources
 */
export interface ArticleMetadata {
  wordCount: number;
  readingTimeMinutes: number;
  sentenceCount: number;
  paragraphCount: number;
  externalLinks: Array<{url: string, text: string}>;
  sourceCitations: Array<{source: string, text: string}>;
  mainEntities: string[];
  keyphrases: string[];
  complexityScore: number;
  avgSentenceLength: number;
  longWordPercentage: number;
}

/**
 * Represents qualitative analysis results from zero-shot models
 */
export interface QualitativeAnalysis {
  labels: string[]; // Top detected labels above threshold
  scores: number[]; // Corresponding scores
}

/**
 * Complete content analysis result
 */
export interface ContentAnalysisResult {
  logicalFallacies: LogicalFallacy[];
  biasAnalysis: BiasAnalysis;
  metadata: ArticleMetadata;
  manipulationScore: number; // 0.0 to 1.0
  qualityScore: number; // 0.0 to 1.0
  qualitativeAnalysis?: QualitativeAnalysis; // Add optional field
  topicClassification?: TopicClassification; // New optional field for topic classification
  manipulationAnalysis?: ManipulationAnalysis; // New field for doomscroll/outrage analysis
  emotionAnalysis?: EmotionAnalysisResult; // New field for detailed emotion analysis
  sentiment?: {score: number, label: string}; // New field for dedicated sentiment analysis
  loadingState?: {
    biasAnalysis: 'complete' | 'error' | 'incomplete';
    metadataExtraction: 'complete' | 'error' | 'incomplete';
    emotionAnalysis: 'complete' | 'error' | 'incomplete';
    sentimentAnalysis: 'complete' | 'error' | 'incomplete';
    fallacyDetection: 'complete' | 'error' | 'incomplete';
    manipulationAnalysis: 'complete' | 'error' | 'incomplete';
  };
  emotionalAppeals?: { [key: string]: number };
  sentimentAnalysis?: {
    overall: number;
    aspects: { [key: string]: number };
  };
}

// Patterns that may indicate different types of logical fallacies
const fallacyPatterns = {
  [LogicalFallacyType.APPEAL_TO_AUTHORITY]: [
    /expert(s)?\s+say/i,
    /according\s+to\s+(professor|doctor|scientist|researcher|study|studies|research|expert)/i,
    /scientists\s+have\s+proven/i,
    /authorities\s+on\s+the\s+subject/i,
    /leading\s+experts\s+agree/i,
    /research\s+has\s+shown/i,
    /science\s+tells\s+us/i,
    /scholars\s+believe/i,
    /specialists\s+concur/i
  ],
  [LogicalFallacyType.APPEAL_TO_EMOTION]: [
    /think(\s+of)?\s+the\s+children/i,
    /(horrific|terrifying|devastating|heartbreaking)/i,
    /(fear|anger|outrage|sadness|grief|anxiety|panic)/i,
    /emotional\s+impact/i,
    /imagine\s+if\s+your/i,
    /how\s+would\s+you\s+feel/i,
    /tragedy\s+struck/i,
    /shocking\s+truth/i,
    /deeply\s+troubling/i,
    /outrageous/i,
    /unimaginable\s+suffering/i
  ],
  [LogicalFallacyType.STRAW_MAN]: [
    /obviously\s+they\s+think/i,
    /they\s+would\s+have\s+you\s+believe/i,
    /they\s+claim\s+that/i,
    /their\s+argument\s+boils\s+down\s+to/i,
    /it\s+sounds\s+reasonable/i,
    /they\s+suggest\s+that/i,
    /what\s+they\'re\s+really\s+saying/i,
    /they\s+think\s+that\s+.*\s+is\s+okay/i,
    /their\s+position\s+is\s+essentially/i,
    /this\s+is\s+tantamount\s+to\s+saying/i
  ],
  [LogicalFallacyType.AD_HOMINEM]: [
    /(of course|obviously)\s+.*would\s+(say|think|believe)/i,
    /typical\s+(liberal|conservative|leftist|right-wing)/i,
    /(bias|biased|unreliable|inexperienced|foolish)/i,
    /as\s+a\s+.*\s+should\s+know/i,
    /(liar|corrupt|stupid|ignorant|crazy|insane|extremist)/i,
    /has\s+a\s+history\s+of/i,
    /cannot\s+be\s+trusted/i,
    /has\s+no\s+credibility/i,
    /is\s+just\s+trying\s+to/i,
    /look\s+at\s+their\s+(background|history|record)/i
  ],
  [LogicalFallacyType.RED_HERRING]: [
    /but\s+what\s+about/i,
    /let(')?s\s+not\s+forget/i,
    /on\s+another\s+note/i,
    /speaking\s+of/i,
    /that\s+reminds\s+me/i,
    /changing\s+the\s+subject/i,
    /let's\s+look\s+at\s+something\s+else/i,
    /not\s+to\s+mention/i,
    /while\s+we're\s+on\s+the\s+topic/i,
    /this\s+brings\s+up\s+the\s+question\s+of/i
  ],
  [LogicalFallacyType.FALSE_DICHOTOMY]: [
    /either\s+.*\s+or/i,
    /only\s+two\s+choices/i,
    /there\s+is\s+no\s+middle\s+ground/i,
    /it(')?s\s+(either|neither)\s+.*\s+or/i,
    /it\s+is\s+never\s+that\s+simple/i,
    /black\s+and\s+white/i,
    /us\s+versus\s+them/i,
    /you're\s+either\s+with\s+us\s+or\s+against\s+us/i,
    /there\s+are\s+only\s+two\s+options/i,
    /we\s+must\s+choose\s+between/i
  ],
  [LogicalFallacyType.APPEAL_TO_IGNORANCE]: [
    /no\s+one\s+has\s+proven\s+otherwise/i,
    /can(')?t\s+be\s+disproven/i,
    /no\s+evidence\s+against/i,
    /absence\s+of\s+evidence/i,
    /there\'s\s+no\s+proof\s+that/i,
    /until\s+proven\s+otherwise/i,
    /it\'s\s+not\s+impossible\s+that/i,
    /you\s+can\'t\s+prove\s+it\s+didn\'t\s+happen/i,
    /lacks\s+evidence\s+to\s+the\s+contrary/i
  ],
  [LogicalFallacyType.APPEAL_TO_COMMON_SENSE]: [
    /common\s+sense/i,
    /obvious(ly)?/i,
    /any\s+reasonable\s+person/i,
    /clearly/i,
    /everyone\s+knows/i,
    /it\s+goes\s+without\s+saying/i,
    /it\s+stands\s+to\s+reason/i,
    /naturally/i,
    /of\s+course/i,
    /self-evident/i
  ],
  [LogicalFallacyType.CIRCULAR_REASONING]: [
    /because\s+it\s+is/i,
    /by\s+definition/i,
    /that\'s\s+just\s+how\s+it\s+is/i,
    /we\s+know\s+.*\s+because\s+.*\s+which\s+proves/i,
    /it\'s\s+true\s+because\s+the\s+(book|text|source)\s+says\s+so/i,
    /proves\s+itself/i,
    /the\s+(bible|scripture|quran|torah)\s+is\s+true\s+because\s+it\s+says\s+so/i
  ],
  [LogicalFallacyType.POST_HOC]: [
    /after\s+.*\s+happened,\s+.*\s+occurred/i,
    /ever\s+since\s+.*,\s+we\s+have\s+seen/i,
    /following\s+.*,\s+we\s+observed/i,
    /resulted\s+in/i,
    /caused\s+by/i,
    /because\s+of\s+this\s+change/i,
    /directly\s+led\s+to/i,
    /right\s+after\s+.*,\s+we\s+noticed/i
  ],
  [LogicalFallacyType.FALSE_EQUIVALENCE]: [
    /just\s+like/i,
    /similarly/i,
    /equally\s+bad/i,
    /no\s+different\s+than/i,
    /same\s+thing\s+as/i,
    /tantamount\s+to/i,
    /this\s+is\s+no\s+different\s+from/i,
    /can\s+be\s+compared\s+to/i
  ],
  [LogicalFallacyType.BANDWAGON]: [
    /everyone\s+is\s+doing\s+it/i,
    /most\s+people\s+agree/i,
    /popular\s+opinion/i,
    /vast\s+majority/i,
    /trend/i,
    /growing\s+consensus/i,
    /polls\s+show\s+that/i,
    /statistics\s+indicate\s+that\s+most\s+people/i,
    /widespread\s+support/i
  ],
  [LogicalFallacyType.TU_QUOQUE]: [
    /you\'re\s+one\s+to\s+talk/i,
    /look\s+who\'s\s+talking/i,
    /what\s+about\s+when\s+you/i,
    /you\'re\s+being\s+hypocritical/i,
    /you\s+do\s+the\s+same\s+thing/i,
    /you\'re\s+guilty\s+of\s+the\s+same/i,
    /practice\s+what\s+you\s+preach/i,
    /before\s+criticizing\s+others/i
  ],
  [LogicalFallacyType.LOADED_QUESTION]: [
    /when\s+did\s+you\s+stop/i,
    /how\s+long\s+have\s+you\s+been/i,
    /do\s+you\s+still/i,
    /isn\'t\s+it\s+true\s+that\s+you/i,
    /why\s+do\s+you\s+continue\s+to/i,
    /how\s+often\s+do\s+you/i,
    /wouldn\'t\s+you\s+agree\s+that/i
  ],
  [LogicalFallacyType.HASTY_GENERALIZATION]: [
    /all\s+of\s+them\s+are/i,
    /they\s+always/i,
    /every\s+single\s+time/i,
    /without\s+exception/i,
    /in\s+every\s+case/i,
    /never\s+once\s+has/i,
    /universally/i,
    /invariably/i,
    /one\s+hundred\s+percent/i
  ],
  [LogicalFallacyType.SLIPPERY_SLOPE]: [
    /will\s+lead\s+to/i,
    /opens\s+the\s+door\s+to/i,
    /first\s+step\s+toward/i,
    /gateway\s+to/i,
    /eventually\s+result\s+in/i,
    /slippery\s+slope/i,
    /once\s+we\s+allow\s+.*,\s+what\'s\s+next/i,
    /where\s+will\s+it\s+end/i,
    /before\s+you\s+know\s+it/i
  ],
  [LogicalFallacyType.HISTORICAL_ANALOGY]: [
    /just\s+like\s+(hitler|nazis|stalin|communist|dictator)/i,
    /reminiscent\s+of\s+(nazi|soviet|fascist)/i,
    /similar\s+to\s+what\s+happened\s+in/i,
    /history\s+repeating\s+itself/i,
    /same\s+thing\s+happened\s+in/i,
    /reminds\s+me\s+of\s+when/i,
    /parallels\s+with/i,
    /echoes\s+of/i
  ]
};

/**
 * Detects logical fallacies in the given text
 */
export function detectLogicalFallacies(text: string): LogicalFallacy[] {
  const fallacies: LogicalFallacy[] = [];
  const sentences = splitIntoSentences(text);
  
  sentences.forEach((sentence, sentenceIndex) => {
    let startIndex = text.indexOf(sentence);
    let endIndex = startIndex + sentence.length;
    
    Object.entries(fallacyPatterns).forEach(([fallacyType, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(sentence)) {
          const match = sentence.match(pattern);
          if (match) {
            fallacies.push({
              type: fallacyType as LogicalFallacyType,
              confidence: calculateFallacyConfidence(sentence, pattern),
              explanation: getFallacyExplanation(fallacyType as LogicalFallacyType),
              excerpt: sentence,
              startIndex,
              endIndex
            });
          }
        }
      });
    });
  });
  
  return fallacies;
}

/**
 * Calculate confidence score for a fallacy detection
 */
function calculateFallacyConfidence(sentence: string, pattern: RegExp): number {
  // This is a simplified version - in a real implementation, this would be more sophisticated
  // potentially using NLP models or contextual analysis
  const match = sentence.match(pattern);
  if (!match) return 0.5; // Base confidence
  
  // More specific matches get higher confidence
  if (match[0].length > 10) return 0.8;
  return 0.65;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // This is a simplified implementation - a real one would handle more cases
  return text.split(/[.!?]\s+/);
}

/**
 * Get explanation for a type of fallacy
 */
function getFallacyExplanation(type: LogicalFallacyType): string {
  const explanations = {
    [LogicalFallacyType.APPEAL_TO_AUTHORITY]: 
      "Appeal to Authority: Using an authority figure's opinion to support an argument, rather than evidence or logical reasoning.",
    [LogicalFallacyType.APPEAL_TO_EMOTION]: 
      "Appeal to Emotion: Manipulating emotions to win an argument rather than using logical reasoning.",
    [LogicalFallacyType.STRAW_MAN]: 
      "Straw Man: Misrepresenting someone's argument to make it easier to attack.",
    [LogicalFallacyType.AD_HOMINEM]: 
      "Ad Hominem: Attacking the person instead of addressing their argument.",
    [LogicalFallacyType.RED_HERRING]: 
      "Red Herring: Introducing an irrelevant topic to divert attention from the original issue.",
    [LogicalFallacyType.FALSE_DICHOTOMY]: 
      "False Dichotomy: Presenting only two options when others exist.",
    [LogicalFallacyType.APPEAL_TO_IGNORANCE]: 
      "Appeal to Ignorance: Claiming something is true because it hasn't been proven false.",
    [LogicalFallacyType.APPEAL_TO_COMMON_SENSE]: 
      "Appeal to Common Sense: Arguing that a claim must be true because it seems like 'common sense'.",
    [LogicalFallacyType.CIRCULAR_REASONING]: 
      "Circular Reasoning: Making an argument where the conclusion is included in the premise.",
    [LogicalFallacyType.POST_HOC]: 
      "Post Hoc: Assuming that because one event followed another, the first caused the second.",
    [LogicalFallacyType.FALSE_EQUIVALENCE]: 
      "False Equivalence: Comparing two things as if they're equivalent when they're not.",
    [LogicalFallacyType.BANDWAGON]: 
      "Bandwagon: Appealing to popularity as evidence for a claim's validity.",
    [LogicalFallacyType.TU_QUOQUE]: 
      "Tu Quoque: Avoiding criticism by turning it back on the accuser.",
    [LogicalFallacyType.LOADED_QUESTION]: 
      "Loaded Question: Asking a question that contains an assumption that the person answering would find difficult to challenge.",
    [LogicalFallacyType.SLIPPERY_SLOPE]: 
      "Slippery Slope: Arguing that a small first step will inevitably lead to a chain of related events culminating in some significant (usually negative) effect.",
    [LogicalFallacyType.HISTORICAL_ANALOGY]: 
      "Faulty Historical Analogy: Assuming that because two events share some similarities, the outcome or characteristics of one will apply to the other, often ignoring key differences in context."
  };
  
  return explanations[type] || "Unknown fallacy type";
}

/**
 * List of bias indicators for different political orientations
 */
const biasIndicators = {
  left: [
    // Original terms
    "social justice", "equity", "progressive", "systemic", "marginalized", 
    "privilege", "diversity", "inclusion", "universal healthcare", "climate crisis",
    "gun control", "reproductive rights", "income inequality",
    
    // Additional left bias indicators
    "structural racism", "economic justice", "gender equality", "living wage",
    "wealth tax", "Medicare for all", "green new deal", "corporate greed",
    "worker's rights", "police reform", "defund", "abolish", "colonialism",
    "imperialism", "democratic socialism", "cancel culture", "microaggression",
    "intersectionality", "patriarchy", "toxic masculinity", "gender neutral",
    "pronouns", "climate emergency", "environmental justice", "corporate welfare",
    "tax the rich", "pro-choice", "safe space", "trigger warning", "housing crisis",
    "public option", "affordable housing", "undocumented immigrants", "migrant rights",
    "LGBTQ+ rights", "reparations", "voter suppression", "prison reform", "exploitation",
    "wage gap", "BIPOC", "anti-racist", "food insecurity", "gentrification",
    "white privilege", "cultural appropriation", "indigenous rights", "sanctuary city",
    "gender inequality", "class struggle", "social safety net", "carbon footprint"
  ],
  right: [
    // Original terms
    "traditional values", "personal responsibility", "free market", "law and order",
    "patriotic", "constitutional", "religious freedom", "border security", 
    "fiscal responsibility", "small government", "family values", "national security",
    "second amendment", 
    
    // Additional right bias indicators
    "pro-life", "states' rights", "job creators", "school choice", "deregulation",
    "lower taxes", "welfare reform", "American exceptionalism", "strong military",
    "voter ID", "tough on crime", "constitutional carry", "balanced budget",
    "illegal immigration", "America first", "radical left", "indoctrination",
    "deep state", "big government", "government overreach", "socialism", "marxism",
    "freedom of speech", "gun rights", "silent majority", "parental rights",
    "critical race theory", "woke", "cancel culture", "western values",
    "Christian values", "law enforcement", "military service", "assimilation",
    "individual liberty", "taxpayer money", "small business", "self-defense",
    "unborn", "sanctity of life", "secure border", "illegal alien",
    "merit-based", "traditional marriage", "energy independence", "private healthcare",
    "entrepreneurship", "self-reliance", "free speech", "capital punishment",
    "radical agenda", "globalist", "liberal elites", "hard-working Americans"
  ]
};

// Add a simple cache for expensive operations
const cache = {
  biasAnalysis: new Map<string, BiasAnalysis>(),
  entityExtraction: new Map<string, string[]>(),
  summarization: new Map<string, string>(),
  emotions: new Map<string, EmotionAnalysisResult>(),
  sentiment: new Map<string, {score: number, label: string}>(),
  
  // Simple hash function for cache keys
  getKey(text: string): string {
    // Create a simple hash based on the first 100 chars and length
    const sample = text.slice(0, 100);
    const length = text.length;
    return `${sample}_${length}`;
  }
};

/**
 * Analyzes bias in an article text using advanced ML model with caching
 * @param text The article text to analyze
 * @returns Analysis of political bias including dominant bias type and confidence
 */
export async function analyzeBias(text: string): Promise<BiasAnalysis> {
  try {
    // Check cache first
    const cacheKey = cache.getKey(text);
    if (cache.biasAnalysis.has(cacheKey)) {
      console.log('📊 [analyzeBias] Using cached result');
      return cache.biasAnalysis.get(cacheKey)!;
    }
    
    console.log('📊 [analyzeBias] Starting ML-based bias analysis for text length:', text.length);
    
    // Use advanced ML model to analyze bias
    const biasResult = await analyzePoliticalBias(text);
    console.log('📊 [analyzeBias] ML model results:', biasResult);
    
    // Map the model's score to our bias types
    const biasStrength = biasResult.confidence;
    let biasType: BiasType;
    let leftIndicators: string[] = [];
    let rightIndicators: string[] = [];
    let explanation: string = '';
    
    if (biasResult.label === 'left') {
      // Determine strength of left bias
      if (biasStrength > 0.8) {
        biasType = BiasType.LEFT_EXTREME;
        explanation = "The content shows extremely strong left-leaning bias.";
      } else if (biasStrength > 0.6) {
        biasType = BiasType.LEFT_STRONG;
        explanation = "The content shows strong left-leaning bias.";
      } else if (biasStrength > 0.4) {
        biasType = BiasType.LEFT_MODERATE;
        explanation = "The content shows moderate left-leaning bias.";
      } else {
        biasType = BiasType.LEFT_SLIGHT;
        explanation = "The content shows slight left-leaning bias.";
      }
      
      // Extract some sample indicators
      // In a real implementation, we would extract actual indicators from the text
      leftIndicators = extractBiasIndicators(text, 'left');
    } 
    else if (biasResult.label === 'right') {
      // Determine strength of right bias
      if (biasStrength > 0.8) {
        biasType = BiasType.RIGHT_EXTREME;
        explanation = "The content shows extremely strong right-leaning bias.";
      } else if (biasStrength > 0.6) {
        biasType = BiasType.RIGHT_STRONG;
        explanation = "The content shows strong right-leaning bias.";
      } else if (biasStrength > 0.4) {
        biasType = BiasType.RIGHT_MODERATE;
        explanation = "The content shows moderate right-leaning bias.";
      } else {
        biasType = BiasType.RIGHT_SLIGHT;
        explanation = "The content shows slight right-leaning bias.";
      }
      
      // Extract some sample indicators
      rightIndicators = extractBiasIndicators(text, 'right');
    } 
    else {
      biasType = BiasType.CENTER;
      explanation = "The content appears to be politically balanced or neutral.";
    }
    
    console.log(`📊 [analyzeBias] ML Analysis Result: ${biasType} with ${biasStrength.toFixed(2)} confidence`);
    
    const result = {
      type: biasType,
      confidence: biasStrength,
      explanation,
      leftIndicators,
      rightIndicators,
      scores: {
        left: biasResult.left,
        center: biasResult.center,
        right: biasResult.right
      }
    };
    
    // Cache the result
    cache.biasAnalysis.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error in advanced bias analysis:', error);
    
    // Fall back to the basic keyword-based analysis in case of failure
    return fallbackBiasAnalysis(text);
  }
}

/**
 * Extract bias indicators from text based on political leaning
 * This is a helper function for the analyzeBias function
 */
function extractBiasIndicators(text: string, leaning: 'left' | 'right'): string[] {
  const indicators: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Get bias indicator terms based on political leaning
  const terms = leaning === 'left' ? biasIndicators.left : biasIndicators.right;
  
  // Find matches in the text
  terms.forEach(term => {
    const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      indicators.push(`${term} (${matches.length})`);
    }
  });
  
  // Sort by frequency (assuming format "term (count)")
  return indicators
    .sort((a, b) => {
      const countA = parseInt(a.match(/\((\d+)\)$/)?.[1] || '0');
      const countB = parseInt(b.match(/\((\d+)\)$/)?.[1] || '0');
      return countB - countA;
    })
    .slice(0, 10); // Return top 10 indicators
}

/**
 * Legacy fallback bias analysis using keyword matching
 * Only used if the ML-based analysis fails
 */
function fallbackBiasAnalysis(text: string): BiasAnalysis {
  const lowerText = text.toLowerCase();
  let leftScore = 0;
  let rightScore = 0;
  let leftKeywordsFound: string[] = [];
  let rightKeywordsFound: string[] = [];
  
  console.log('📊 [fallbackBiasAnalysis] Using keyword-based fallback analysis');
  
  // Count bias indicators
  biasIndicators.left.forEach(term => {
    const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      leftScore += matches.length;
      leftKeywordsFound.push(`${term} (${matches.length})`);
    }
  });
  
  biasIndicators.right.forEach(term => {
    const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      rightScore += matches.length;
      rightKeywordsFound.push(`${term} (${matches.length})`);
    }
  });
  
  console.log(`📊 [fallbackBiasAnalysis] Scores - Left: ${leftScore}, Right: ${rightScore}`);

  // Calculate bias type and confidence
  if (leftScore === 0 && rightScore === 0) {
    return {
      type: BiasType.CENTER,
      confidence: 0.5,
      explanation: "No strong indicators of political bias were detected.",
      leftIndicators: [],
      rightIndicators: []
    };
  }
  
  const totalScore = leftScore + rightScore;
  const biasDirection = leftScore > rightScore ? 'left' : 'right';
  const biasStrength = Math.abs(leftScore - rightScore) / totalScore;
  
  // Determine bias type based on direction and strength
  let biasType: BiasType;
  if (biasDirection === 'left') {
    if (biasStrength > 0.75) biasType = BiasType.LEFT_EXTREME;
    else if (biasStrength > 0.5) biasType = BiasType.LEFT_STRONG;
    else if (biasStrength > 0.25) biasType = BiasType.LEFT_MODERATE;
    else biasType = BiasType.LEFT_SLIGHT;
  } else {
    if (biasStrength > 0.75) biasType = BiasType.RIGHT_EXTREME;
    else if (biasStrength > 0.5) biasType = BiasType.RIGHT_STRONG;
    else if (biasStrength > 0.25) biasType = BiasType.RIGHT_MODERATE;
    else biasType = BiasType.RIGHT_SLIGHT;
  }
  
  // Generate explanation
  let explanation = '';
  if (biasDirection === 'left') {
    explanation = `This content shows ${getBiasStrengthLabel(biasStrength)} indicators of left-leaning bias.`;
  } else {
    explanation = `This content shows ${getBiasStrengthLabel(biasStrength)} indicators of right-leaning bias.`;
  }
  
  return {
    type: biasType,
    confidence: biasStrength,
    explanation,
    leftIndicators: leftKeywordsFound.slice(0, 10),
    rightIndicators: rightKeywordsFound.slice(0, 10),
    scores: {
      left: leftScore / (leftScore + rightScore),
      center: 0,
      right: rightScore / (leftScore + rightScore)
    }
  };
}

/**
 * Helper function to get a descriptive label for bias strength
 */
function getBiasStrengthLabel(strength: number): string {
  if (strength > 0.75) return 'very strong';
  if (strength > 0.5) return 'strong';
  if (strength > 0.25) return 'moderate';
  return 'slight';
}

/**
 * Extract metadata from an article
 * Enhanced with ML-based entity extraction and summarization
 * Now with caching for better performance
 */
export async function extractMetadata(html: string, text: string): Promise<ArticleMetadata> {
  try {
    // Validate input
  if (!text || typeof text !== 'string') {
    console.warn('Empty or invalid text passed to extractMetadata');
      text = '';
  }
  
  if (!html || typeof html !== 'string') {
    console.warn('Empty or invalid HTML passed to extractMetadata');
      html = '';
  }
  
  console.log('📊 [extractMetadata] Analyzing text length: ', text.length, ', HTML length:', html.length);
  console.log('📊 [extractMetadata] Text snippet:', text.substring(0, 100) + "...");
  
    // Basic text statistics
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    
    // Reading time (average adult reads ~200-250 words per minute)
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    
    // Sentence count
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const sentenceCount = sentences.length;
    
    // Paragraph count
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    const paragraphCount = paragraphs.length;
    
    // Extract links from HTML
    const externalLinks: string[] = [];
    if (html) {
      try {
        // Simple regex to extract links - a full implementation would use proper HTML parsing
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
        while ((match = linkRegex.exec(html)) !== null) {
          const link = match[1];
          if (link && link.startsWith('http') && !externalLinks.includes(link)) {
            externalLinks.push(link);
          }
        }
      } catch (e) {
        console.error('Error extracting links:', e);
      }
    }
    
    // Use enhanced entity extraction for better results - with caching
    const entityResult = await cachedEntityExtraction(text);
    const entities = [...entityResult.keyPeople, ...entityResult.keyOrganizations, ...entityResult.keyLocations];
    
    // Calculate reading complexity using Flesch-Kincaid Grade Level
    const totalSyllables = countSyllables(text);
    const wordsPerSentence = wordCount / Math.max(1, sentenceCount);
    const syllablesPerWord = totalSyllables / Math.max(1, wordCount);
    
    const fleschKincaidGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
    const gradeLevel = Math.max(0, Math.min(Math.round(fleschKincaidGrade), 18));
    
    let readingLevel = 'Medium';
    if (gradeLevel <= 6) readingLevel = 'Elementary';
    else if (gradeLevel <= 9) readingLevel = 'Middle School';
    else if (gradeLevel <= 12) readingLevel = 'High School';
    else if (gradeLevel <= 15) readingLevel = 'College';
    else readingLevel = 'Graduate';
    
    // Extract main point using advanced summarization - with caching
    const mainPoint = await cachedSummaryGeneration(text, 100);
    
    // Attempt to detect agenda and affiliation - this would normally use more advanced NLP
    // For now, we use simple heuristics as a placeholder
    let agenda = '';
    let affiliation = '';
    
    // Very basic agenda detection based on repeated phrases in the first paragraph
  if (paragraphs.length > 0) {
      const firstParagraph = paragraphs[0];
      const phrases = extractKeyPhrases(firstParagraph, 3);
      if (phrases.length > 0) {
        agenda = phrases[0];
      }
    }
    
    // Try to detect affiliation based on entities and bias
    const biasAnalysis = await analyzeBias(text);
    if (biasAnalysis.type !== BiasType.CENTER && entityResult.keyOrganizations.length > 0) {
      // Simple heuristic linking organizations to political leaning
      affiliation = entityResult.keyOrganizations[0];
    }
    
    // Find citations in the text - this is a simple approximation
    const citationRegex = /\(\s*\d{4}\s*\)|\[\s*\d+\s*\]|et al\./gi;
    const citationMatches = text.match(citationRegex) || [];
    const citations = Array.from(new Set(citationMatches)).slice(0, 10);
    
    return {
      wordCount,
      readingTimeMinutes,
      sentenceCount,
      paragraphCount,
      externalLinks,
      sourceCitations: citations,
      mainEntities: entities.slice(0, 10),
      entities: entities,
      keyphrases: extractKeyPhrases(text, 5),
      mainPoint,
      agenda,
      affiliation,
      readingLevel,
      complexityScore: gradeLevel / 18, // Normalize to 0-1
      avgSentenceLength: wordsPerSentence,
      longWordPercentage: countLongWords(text) / Math.max(1, wordCount)
    };
  } catch (error) {
    console.error('Error in extractMetadata:', error);
    return {
      wordCount: 0,
      readingTimeMinutes: 1,
      sentenceCount: 0,
      paragraphCount: 0,
      externalLinks: [],
      sourceCitations: [],
      mainEntities: [],
      entities: [],
      keyphrases: [],
      mainPoint: 'Unable to determine main point.',
      agenda: '',
      affiliation: '',
      readingLevel: 'Unknown',
      complexityScore: 0.5,
      avgSentenceLength: 0,
      longWordPercentage: 0
    };
  }
}

// --- NLP Service Integration ---

// Make this configurable via environment variables in a real deployment!
// !! WARNING: Running this service client-side is not recommended !!
// Hardcoding for now as 'process' is not defined in the browser.
const NLP_SERVICE_URL = 'http://localhost:8001'; 
// const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8001'; 

// Interface for the expected response from the Python zero-shot endpoint
interface ZeroShotResponse {
    sequence: string;
    labels: string[];
    scores: number[];
}

// Interface for entity response from the NER endpoint
interface NEREntity {
  entity: string;
  type: string;
  score: number;
  start: number;
  end: number;
}

interface GroupedEntity {
  entity: string;
  type: string;
  count: number;
  mentions: NEREntity[];
}

interface NERResponse {
  entities: NEREntity[];
  grouped_entities: Record<string, GroupedEntity[]>;
}

/**
 * Calls the Python NLP service to perform zero-shot classification.
 * @param text The text to analyze.
 * @param candidateLabels The list of labels to classify against.
 * @returns The ZeroShotResponse or null if an error occurs.
 */
async function performZeroShotAnalysis(text: string, candidateLabels: string[]): Promise<ZeroShotResponse | null> {
  if (!NLP_SERVICE_URL) {
    console.error('NLP service URL not configured.');
    return null;
  }
  
  const endpoint = `${NLP_SERVICE_URL}/analyze/zero-shot/`;
  const payload = { text, candidate_labels: candidateLabels };
  
  console.log(`🚀 Calling Zero-Shot NLP: ${endpoint} with ${candidateLabels.length} labels for text length ${text.length}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Add a timeout (e.g., 30 seconds)
      signal: AbortSignal.timeout(30000) 
    });

    console.log(`✅ Zero-Shot Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Zero-Shot NLP Error ${response.status}: ${errorText}`);
      return null;
    }
    
    const result: ZeroShotResponse = await response.json();
    console.log(`✅ Zero-Shot NLP Success. Top label: ${result.labels[0]} (Score: ${result.scores[0]?.toFixed(3)})`);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to fetch from Zero-Shot NLP endpoint:', error);
    return null;
  }
}

/**
 * Calls the Python NLP service to perform Named Entity Recognition (NER).
 * @param text The text to analyze.
 * @returns The NERResponse or null if an error occurs.
 */
async function performEntityRecognition(text: string): Promise<NERResponse | null> {
  if (!NLP_SERVICE_URL) {
    console.error('NLP service URL not configured.');
    return null;
  }
  
  const endpoint = `${NLP_SERVICE_URL}/analyze/entities`;
  const payload = { text };

  console.log(`🚀 Calling NER NLP: ${endpoint} for text length ${text.length}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Add a timeout (e.g., 60 seconds for potentially longer NER)
      signal: AbortSignal.timeout(60000) 
    });

    console.log(`✅ NER Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ NER NLP Error ${response.status}: ${errorText}`);
      return null;
    }
    
    const result: NERResponse = await response.json();
    console.log(`✅ NER NLP Success. Found ${result.entities.length} entities.`);
    return result;

  } catch (error) {
    console.error('❌ Failed to fetch from NER NLP endpoint:', error);
    return null;
  }
}

/**
 * Analyze text specifically for sentiment (positive/negative/neutral)
 */
export async function analyzeSentiment(text: string): Promise<{score: number, label: string}> {
  try {
    // First try to use HuggingFace for sentiment analysis
    const response = await hfAnalyzeSentiment(text);
    
    if (response.success && response.data && response.data.length > 0) {
      const sentimentResult = response.data[0];
      
      // Convert label to lowercase for consistency
      const label = sentimentResult.label.toLowerCase();
      
      // Convert score to a -1 to 1 range where -1 is negative, 1 is positive
      let score = sentimentResult.score;
      if (label === 'negative') {
        score = -score;
      } else if (label === 'neutral') {
        score = 0;
      }
      
      return { 
        score, 
        label: label === 'positive' ? 'positive' : 
               label === 'negative' ? 'negative' : 'neutral' 
      };
    }
    
    // If HuggingFace fails, fallback to keyword-based approach
    console.info('Falling back to keyword-based sentiment analysis');
    
    const sentimentWords = {
      positive: [
        'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
        'terrific', 'outstanding', 'superb', 'brilliant', 'awesome', 'fabulous',
        'impressive', 'exceptional', 'marvelous', 'splendid', 'remarkable',
        'love', 'happy', 'joy', 'delight', 'pleased', 'glad', 'enjoy',
        'beneficial', 'positive', 'success', 'win', 'triumph', 'achieve'
      ],
      negative: [
        'bad', 'terrible', 'awful', 'horrible', 'dreadful', 'poor', 'appalling',
        'atrocious', 'inferior', 'inadequate', 'unacceptable', 'disappointing',
        'hate', 'dislike', 'angry', 'sad', 'upset', 'unhappy', 'miserable',
        'unfortunate', 'tragic', 'dire', 'grim', 'bleak', 'severe', 'serious',
        'negative', 'problem', 'issue', 'trouble', 'fail', 'disaster', 'crisis'
      ]
    };
     
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
     
    // Check for positive words
    for (const word of sentimentWords.positive) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex) || [];
      positiveCount += matches.length;
    }
     
    // Check for negative words
    for (const word of sentimentWords.negative) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex) || [];
      negativeCount += matches.length;
    }
     
    // Calculate sentiment score (-1 to 1 range)
    const total = positiveCount + negativeCount;
    let score = 0;
     
    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
    }
     
    // Determine sentiment label
    let label = 'neutral';
    if (score > 0.1) {
      label = 'positive';
    } else if (score < -0.1) {
      label = 'negative';
    }
     
    return { score, label };
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    return { score: 0, label: 'neutral' };
  }
}

/**
 * Main function to analyze content and produce a comprehensive analysis
 * Updated to use ML-based approaches for better results
 * Now with caching for better performance
 */
export async function analyzeContent(content: string): Promise<ContentAnalysisResult> {
  try {
    // Safely handle content input - ensure we have a string
    if (!content) {
      console.warn('Empty content passed to analyzeContent');
      content = '';
    }
    
    // For debugging
    console.log('🔬 analyzeContent called with content length:', content.length);
    
    // For plain text, we'll create a simple HTML wrapper
    let html = content;
    let plainText = content;
    
    // Try to determine if the input is HTML
    if (content.includes('<') && content.includes('>')) {
      console.log('🔬 Content appears to be HTML, attempting to parse');
      try {
        // Check if DOMParser is available (won't be in some environments)
        if (typeof DOMParser !== 'undefined') {
          // Safely parse HTML content
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          plainText = doc.body ? (doc.body.textContent || '') : '';
          console.log('🔬 Extracted plain text of length:', plainText.length);
        } else {
          // If DOMParser is not available (server-side or older browsers)
          console.log('🔬 DOMParser not available, using regex fallback');
          plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } catch (htmlError) {
        console.error('Error parsing HTML content:', htmlError);
        // Fall back to a basic HTML tag stripping
        plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log('🔬 Used fallback HTML parsing, extracted length:', plainText.length);
      }
      
      // Final safety check - if plainText is still empty but content exists
      if (!plainText && content) {
        console.log('🔬 Plain text extraction failed, using original content');
        plainText = content;
      }
    } else {
      // If it looks like plain text, create HTML from it
      html = `<div>${content.split('\n').map(line => `<p>${line}</p>`).join('')}</div>`;
    }
    
    // If text is too short, add a note about limited analysis
    let limitedAnalysis = false;
    if (plainText.length < 100) {
      console.warn('Content is very short for analysis:', plainText.length, 'characters');
      limitedAnalysis = true;
    }
    
    // Extract metadata - wrap in try/catch to prevent failures
    let metadata: ArticleMetadata;
    try {
      metadata = await extractMetadata(html, plainText);
    } catch (metadataError) {
      console.error('Error extracting metadata:', metadataError);
      metadata = {
        wordCount: plainText.split(/\s+/).filter(Boolean).length,
        readingTimeMinutes: Math.max(1, Math.ceil(plainText.length / 1000)),
        sentenceCount: plainText.split(/[.!?]+/).filter(Boolean).length,
        paragraphCount: plainText.split(/\n\s*\n/).filter(Boolean).length,
        externalLinks: [],
        sourceCitations: [],
        mainEntities: [],
        keyphrases: [],
        complexityScore: 0,
        avgSentenceLength: 0,
        longWordPercentage: 0
      };
    }
    
    // Analyze emotions with error handling
    let emotionAnalysis: EmotionAnalysisResult = {
      emotions: {},
      dominantEmotion: 'neutral',
      emotionalTone: 'neutral',
      emotionalIntensity: 0
    };
    try {
      emotionAnalysis = await cachedEmotionAnalysis(plainText);
      console.log('🔬 Emotion analysis complete with dominant emotion:', emotionAnalysis.dominantEmotion);
    } catch (emotionError) {
      console.error('Error in emotion analysis:', emotionError);
    }
    
    // Analyze sentiment with error handling
    let sentiment = {
      score: 0,
      label: 'neutral'
    };
    try {
      sentiment = await cachedSentimentAnalysis(plainText);
      console.log('🔬 Sentiment analysis complete with result:', sentiment.label, sentiment.score);
    } catch (sentimentError) {
      console.error('Error in sentiment analysis:', sentimentError);
    }
    
    // Analyze bias with error handling
    let biasAnalysis: BiasAnalysis;
    try {
      biasAnalysis = await analyzeBias(plainText);
      console.log('🔬 Bias analysis complete with type:', biasAnalysis.type);
    } catch (biasError) {
      console.error('Error in bias analysis:', biasError);
      biasAnalysis = {
        type: BiasType.CENTER,
        confidence: 0.5,
        explanation: 'Unable to determine political bias due to an error in analysis.'
      };
    }
    
    // Detect logical fallacies with error handling
    let logicalFallacies: LogicalFallacy[] = [];
    try {
      logicalFallacies = detectLogicalFallacies(plainText);
      console.log('🔬 Logical fallacy detection complete, found:', logicalFallacies.length);
    } catch (fallacyError) {
      console.error('Error detecting logical fallacies:', fallacyError);
    }
    
    // Analyze manipulation tactics with error handling
    let manipulationAnalysis;
    try {
      const darkPatternAnalysis = await analyzeManipulation(plainText);
      console.log('🔬 Manipulation analysis complete');
      
      // Create a compatible manipulationAnalysis structure
      manipulationAnalysis = {
        doomscroll: {
          isDoomscroll: darkPatternAnalysis.score > 0.5,
          doomscrollScore: darkPatternAnalysis.score,
          doomscrollTopics: darkPatternAnalysis.techniques,
          doomscrollExplanation: darkPatternAnalysis.explanation
        },
        outrageBait: {
          isOutrageBait: darkPatternAnalysis.score > 0.6,
          outrageBaitScore: darkPatternAnalysis.score,
          outrageBaitTriggers: darkPatternAnalysis.techniques,
          outrageBaitExplanation: darkPatternAnalysis.explanation
        },
        manipulativeTactics: darkPatternAnalysis.techniques,
        recommendedAction: darkPatternAnalysis.score > 0.5 
          ? "Consider if this content uses manipulation techniques to influence your thinking."
          : "This content appears to have few manipulative elements.",
        educationalSummary: darkPatternAnalysis.explanation
      };
    } catch (manipulationError) {
      console.error('Error in manipulation analysis:', manipulationError);
      manipulationAnalysis = {
        doomscroll: {
          isDoomscroll: false,
          doomscrollScore: 0.1,
          doomscrollTopics: [],
          doomscrollExplanation: 'Unable to analyze doomscroll content due to an error.'
        },
        outrageBait: {
          isOutrageBait: false,
          outrageBaitScore: 0.1,
          outrageBaitTriggers: [],
          outrageBaitExplanation: 'Unable to analyze outrage bait content due to an error.'
        },
        manipulativeTactics: [],
        recommendedAction: 'Unable to provide recommendations due to an analysis error.',
        educationalSummary: 'Unable to analyze manipulation techniques due to an error.'
      };
    }
    
    // Calculate quality score based on metrics
    const qualityScore = calculateQualityScore(
      plainText, 
      logicalFallacies, 
      biasAnalysis,
      manipulationAnalysis ? manipulationAnalysis.score : 0.1
    );
    console.log('🔬 Content quality score:', qualityScore);
    
    // Calculate manipulation score (inverse of quality with weighting)
    const manipulationScore = manipulationAnalysis ? manipulationAnalysis.score : 0.1;
    console.log('🔬 Content manipulation score:', manipulationScore);
    
    // Generate emotional appeals model (this can be enhanced in the future)
    const emotionalAppeals = generateEmotionalAppealsModel(plainText, emotionAnalysis);
    
    // Generate sentiment analysis model
    const sentimentAnalysis = generateSentimentAnalysis(plainText, sentiment);
    
    // Add loading indicators for UI feedback
    const addLoadingIndicators = (result: ContentAnalysisResult) => {
      result.loadingState = {
        biasAnalysis: 'complete',
        metadataExtraction: 'complete',
        emotionAnalysis: 'complete',
        sentimentAnalysis: 'complete',
        fallacyDetection: 'complete',
        manipulationAnalysis: 'complete'
      };
      return result;
    };
    
    // Final result
    const result: ContentAnalysisResult = {
      qualityScore,
      manipulationScore,
      limitedAnalysis,
      biasAnalysis,
      logicalFallacies, 
      manipulationAnalysis,
      emotionAnalysis,
      sentiment,
      metadata,
      emotionalAppeals,
      sentimentAnalysis
    };
    
    return addLoadingIndicators(result);
  } catch (error) {
    console.error('Error in content analysis:', error);
    // Return a minimal result rather than failing completely
    return {
      qualityScore: 0.5,
      manipulationScore: 0.5,
      limitedAnalysis: true,
        biasAnalysis: {
            type: BiasType.CENTER,
        confidence: 0.5,
        explanation: 'Unable to analyze bias due to an error.'
        },
      logicalFallacies: [],
        metadata: {
            wordCount: 0,
        readingTimeMinutes: 1,
            sentenceCount: 0,
            paragraphCount: 0,
            externalLinks: [],
            sourceCitations: [],
            mainEntities: [],
            keyphrases: [],
        complexityScore: 0.5,
            avgSentenceLength: 0,
            longWordPercentage: 0
        },
      emotionalAppeals: {},
      sentimentAnalysis: {
        overall: 0,
        aspects: {}
      },
      loadingState: {
        biasAnalysis: 'error',
        metadataExtraction: 'error',
        emotionAnalysis: 'error',
        sentimentAnalysis: 'error',
        fallacyDetection: 'error',
        manipulationAnalysis: 'error'
      }
    };
  }
}

/**
 * Advanced search function for finding articles with specific criteria
 */
export interface SearchCriteria {
  text?: string;
  author?: string;
  sources?: string[];
  dateRange?: { start: Date, end: Date };
  tags?: string[];
  fallacyTypes?: LogicalFallacyType[];
  biasTypes?: BiasType[];
  manipulationScoreRange?: { min: number, max: number };
  qualityScoreRange?: { min: number, max: number };
}

/**
 * Sort options for article lists
 */
export enum SortOption {
  NEWEST_FIRST = 'newest',
  OLDEST_FIRST = 'oldest',
  HIGHEST_QUALITY = 'quality',
  MOST_FALLACIES = 'fallacies',
  STRONGEST_BIAS = 'bias',
  MOST_CITATIONS = 'citations',
  LONGEST_READ = 'length',
  SHORTEST_READ = 'short'
}

/**
 * Get the sort function for a given sort option
 */
export function getSortFunction(option: SortOption) {
  switch (option) {
    case SortOption.NEWEST_FIRST:
      return (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    case SortOption.OLDEST_FIRST:
      return (a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
    case SortOption.HIGHEST_QUALITY:
      return (a, b) => b.analysis.qualityScore - a.analysis.qualityScore;
    case SortOption.MOST_FALLACIES:
      return (a, b) => b.analysis.logicalFallacies.length - a.analysis.logicalFallacies.length;
    case SortOption.STRONGEST_BIAS:
      return (a, b) => b.analysis.biasAnalysis.confidence - a.analysis.biasAnalysis.confidence;
    case SortOption.MOST_CITATIONS:
      return (a, b) => b.analysis.metadata.sourceCitations.length - a.analysis.metadata.sourceCitations.length;
    case SortOption.LONGEST_READ:
      return (a, b) => b.analysis.metadata.readingTimeMinutes - a.analysis.metadata.readingTimeMinutes;
    case SortOption.SHORTEST_READ:
      return (a, b) => a.analysis.metadata.readingTimeMinutes - b.analysis.metadata.readingTimeMinutes;
    default:
      return (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  }
}

/**
 * Split text into manageable chunks for NLP analysis
 * This helps with processing longer texts and gets more context for each analysis
 */
function splitIntoAnalysisChunks(text: string, maxChunkLength: number = 500): string[] {
  // If text is short enough, just return it as a single chunk
  if (text.length <= maxChunkLength) {
    return [text];
  }
  
  // Split into paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // If we have very few paragraphs, use sentences instead
  if (paragraphs.length <= 2) {
    const sentences = splitIntoSentences(text);
    return combineIntoChunks(sentences, maxChunkLength);
  }
  
  // Otherwise, combine paragraphs into reasonable chunks
  return combineIntoChunks(paragraphs, maxChunkLength);
}

/**
 * Combine text segments into chunks of reasonable size
 */
function combineIntoChunks(segments: string[], maxChunkLength: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const segment of segments) {
    // If adding this segment would make the chunk too large, start a new chunk
    if (currentChunk.length + segment.length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = segment;
    } else {
      // Otherwise add to current chunk with a space
      if (currentChunk.length > 0) {
        currentChunk += ' ';
      }
      currentChunk += segment;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Analyze text chunks for fallacies using zero-shot classification
 */
async function analyzeTextChunksForFallacies(
  chunks: string[], 
  fallacyLabels: string[]
): Promise<ZeroShotResponse[]> {
  // If no chunks, return empty array
  if (!chunks.length) return [];
  
  try {
    // Use Promise.all to process all chunks in parallel
    const results = await Promise.all(
      chunks.map(chunk => performZeroShotAnalysis(chunk, fallacyLabels))
    );
    
    // Filter out any null results
    return results.filter(result => result !== null) as ZeroShotResponse[];
  } catch (error) {
    console.error('Error analyzing chunks for fallacies:', error);
    return [];
  }
}

// --- Add topic classification labels ---
const topicLabels = [
  "Politics",
  "Business",
  "Technology",
  "Health",
  "Science",
  "Environment",
  "Education",
  "Sports",
  "Entertainment",
  "World News",
  "Opinion",
  "Culture"
];

// Add topic classification to the content analysis interface
export interface TopicClassification {
  mainTopic: string;
  score: number;
  relatedTopics: Array<{topic: string, score: number}>;
}

/**
 * Counts syllables in a text
 * @param text The text to count syllables in
 * @returns The number of syllables
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  
  for (const word of words) {
    // Remove non-alphabetic characters
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (!cleanWord) continue;
    
    // Count vowel groups
    const vowelGroups = cleanWord.match(/[aeiouy]+/g) || [];
    let syllables = vowelGroups.length;
    
    // Adjust for common patterns
    // Silent 'e' at the end
    if (cleanWord.endsWith('e') && syllables > 1) {
      syllables--;
    }
    
    // Words ending with 'le' or 'les'
    if ((cleanWord.endsWith('le') || cleanWord.endsWith('les')) && 
        cleanWord.length > 2 && 
        !['a', 'e', 'i', 'o', 'u', 'y'].includes(cleanWord.charAt(cleanWord.length - 3))) {
      syllables++;
    }
    
    // Ensure at least one syllable per word
    syllables = Math.max(1, syllables);
    count += syllables;
  }
  
  return count;
}

/**
 * Counts "long words" (>6 characters) in text
 * @param text The text to analyze
 * @returns Number of long words
 */
function countLongWords(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  return words.filter(word => word.replace(/[^a-z]/g, '').length > 6).length;
}

/**
 * Extracts key phrases from text
 * @param text The text to extract phrases from
 * @param maxPhrases Maximum number of phrases to extract
 * @returns Array of key phrases
 */
function extractKeyPhrases(text: string, maxPhrases: number = 5): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const phrases: string[] = [];
  
  // If there are no sentences, return empty array
  if (sentences.length === 0) return [];
  
  // First sentence is often a key phrase
  if (sentences[0].length > 10 && sentences[0].length < 150) {
    phrases.push(sentences[0].trim());
  }
  
  // Look for sentences with trigger phrases that indicate importance
  const importantPhraseMarkers = [
    /\b(key|important|significant|critical|essential|main|primary|crucial)\b/i,
    /\b(found|discovered|revealed|showed|concluded|determined)\b/i,
    /\b(according to the (?:study|research|analysis|report|data|survey|poll))\b/i
  ];
  
  for (const sentence of sentences) {
    // Skip if too short or too long
    if (sentence.length < 30 || sentence.length > 150 || phrases.includes(sentence.trim())) {
      continue;
    }
    
    // Check if sentence contains any important markers
    const hasImportantMarker = importantPhraseMarkers.some(marker => marker.test(sentence));
    
    if (hasImportantMarker) {
      phrases.push(sentence.trim());
    }
    
    // Stop once we have enough phrases
    if (phrases.length >= maxPhrases) break;
  }
  
  // If we don't have enough phrases, add more sentences
  if (phrases.length < maxPhrases) {
    for (const sentence of sentences) {
      if (sentence.length >= 40 && 
          sentence.length <= 120 && 
          !phrases.includes(sentence.trim())) {
        phrases.push(sentence.trim());
      }
      
      if (phrases.length >= maxPhrases) break;
    }
  }
  
  return phrases;
}

/**
 * Generates an emotional appeals model based on text content and emotion analysis
 * @param text The text to analyze
 * @param emotionAnalysis The emotion analysis results
 * @returns Object mapping emotional appeals to their intensity
 */
function generateEmotionalAppealsModel(text: string, emotionAnalysis: EmotionAnalysisResult): Record<string, number> {
  const emotionalAppeals: Record<string, number> = {};
  
  // Use the emotion analysis results as a base
  if (emotionAnalysis && emotionAnalysis.emotions) {
    // Map emotions to emotional appeals
    Object.entries(emotionAnalysis.emotions).forEach(([emotion, intensity]) => {
      switch (emotion.toLowerCase()) {
        case 'fear':
          emotionalAppeals['fear'] = intensity;
          break;
        case 'anger':
          emotionalAppeals['outrage'] = intensity;
          break;
        case 'joy':
          emotionalAppeals['happiness'] = intensity;
          break;
        case 'sadness':
          emotionalAppeals['sympathy'] = intensity;
          break;
        case 'surprise':
          emotionalAppeals['curiosity'] = intensity;
          break;
        case 'disgust':
          emotionalAppeals['disgust'] = intensity;
          break;
        // Add more mappings as needed
      }
    });
  }
  
  // Look for additional emotional appeals in the text
  // These are simple keyword-based heuristics that could be improved
  const patternSets = [
    { 
      name: 'urgency', 
      patterns: ['urgent', 'immediately', 'hurry', 'limited time', 'act now', 'deadline'],
      foundCount: 0
    },
    { 
      name: 'exclusivity', 
      patterns: ['exclusive', 'limited', 'only', 'select', 'special access', 'invitation'],
      foundCount: 0
    },
    { 
      name: 'authority', 
      patterns: ['expert', 'research', 'study', 'professor', 'doctor', 'scientist', 'official'],
      foundCount: 0
    },
    { 
      name: 'scarcity', 
      patterns: ['rare', 'limited supply', 'won\'t last', 'while supplies last', 'running out'],
      foundCount: 0
    }
  ];
  
  // Simple pattern matching for additional emotional appeals
  const lowerText = text.toLowerCase();
  patternSets.forEach(patternSet => {
    patternSet.patterns.forEach(pattern => {
      if (lowerText.includes(pattern.toLowerCase())) {
        patternSet.foundCount++;
      }
    });
    
    // Calculate intensity based on pattern matches
    if (patternSet.foundCount > 0) {
      const maxMatches = patternSet.patterns.length;
      emotionalAppeals[patternSet.name] = Math.min(1.0, patternSet.foundCount / (maxMatches * 0.7));
    }
  });
  
  return emotionalAppeals;
}

/**
 * Generates a sentiment analysis model from text and sentiment results
 * @param text The text to analyze
 * @param sentiment The sentiment analysis results
 * @returns Structured sentiment analysis with overall score and aspect-specific scores
 */
function generateSentimentAnalysis(text: string, sentiment: {score: number, label: string}): {
  overall: number;
  aspects: Record<string, number>;
} {
  // Convert sentiment score from 0-1 to -1 to 1 scale if needed
  let overallScore = sentiment.score;
  if (sentiment.label === 'positive' && overallScore > 0.5) {
    overallScore = 0.5 + (overallScore - 0.5);
  } else if (sentiment.label === 'negative' && overallScore > 0.5) {
    overallScore = -1 * (0.5 + (overallScore - 0.5));
  } else if (sentiment.label === 'neutral') {
    overallScore = 0;
  } else if (sentiment.label === 'negative') {
    overallScore = -overallScore;
  }
  
  // Initialize aspect sentiments
  const aspects: Record<string, number> = {};
  
  // Define aspects we want to analyze
  const aspectPatterns = [
    { name: 'facts', patterns: ['fact', 'statistic', 'data', 'evidence', 'study', 'research'] },
    { name: 'opinions', patterns: ['believe', 'think', 'feel', 'suggest', 'argue', 'claim'] },
    { name: 'tone', patterns: ['should', 'must', 'need to', 'have to', 'required', 'necessary'] }
  ];
  
  // Calculate sentiment for each aspect
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  aspectPatterns.forEach(aspect => {
    let aspectScore = 0;
    let matchCount = 0;
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Check if sentence contains aspect patterns
      const containsAspect = aspect.patterns.some(pattern => 
        lowerSentence.includes(pattern)
      );
      
      if (containsAspect) {
        matchCount++;
        
        // Apply simple sentiment analysis for the sentence
        let sentenceScore = 0;
        
        // Simple heuristic: positive words add positive sentiment
        const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'helpful'];
        positiveWords.forEach(word => {
          if (lowerSentence.includes(word)) sentenceScore += 0.2;
        });
        
        // Negative words add negative sentiment
        const negativeWords = ['bad', 'poor', 'negative', 'harmful', 'dangerous', 'concerning'];
        negativeWords.forEach(word => {
          if (lowerSentence.includes(word)) sentenceScore -= 0.2;
        });
        
        // Cap the score at -1 to 1
        sentenceScore = Math.max(-1, Math.min(1, sentenceScore));
        
        // Add to aspect score
        aspectScore += sentenceScore;
      }
    });
    
    // Calculate average aspect score
    if (matchCount > 0) {
      aspects[aspect.name] = aspectScore / matchCount;
    } else {
      aspects[aspect.name] = 0; // Neutral if no matches
    }
  });
  
  return {
    overall: overallScore,
    aspects
  };
}

/**
 * Calculates a quality score based on various content metrics
 * @param text The content text
 * @param logicalFallacies Detected logical fallacies
 * @param biasAnalysis Bias analysis results
 * @param manipulationScore Manipulation score
 * @returns Quality score between 0 and 1
 */
function calculateQualityScore(
  text: string, 
  logicalFallacies: LogicalFallacy[], 
  biasAnalysis: BiasAnalysis,
  manipulationScore: number
): number {
  // Start with a baseline score
  let score = 0.7; // Default to moderately good
  
  // Text length factor - longer articles typically have more depth
  const textLength = text.length;
  if (textLength < 500) {
    score -= 0.1; // Penalize very short content
  } else if (textLength > 3000) {
    score += 0.1; // Reward longer, more in-depth content
  }
  
  // Penalty for logical fallacies
  const fallacyCount = logicalFallacies.length;
  score -= fallacyCount * 0.05; // Each fallacy reduces score by 0.05
  
  // Bias factor - extreme bias reduces quality
  if (biasAnalysis.type === BiasType.CENTER) {
    score += 0.1; // Reward balanced content
  } else if (
    biasAnalysis.type === BiasType.LEFT_SLIGHT || 
    biasAnalysis.type === BiasType.RIGHT_SLIGHT
  ) {
    score -= 0.05; // Slight bias has minimal impact
  } else if (
    biasAnalysis.type === BiasType.LEFT_MODERATE || 
    biasAnalysis.type === BiasType.RIGHT_MODERATE
  ) {
    score -= 0.1; // Moderate bias has more impact
  } else if (
    biasAnalysis.type === BiasType.LEFT_STRONG || 
    biasAnalysis.type === BiasType.RIGHT_STRONG
  ) {
    score -= 0.2; // Strong bias significantly reduces quality
  } else {
    score -= 0.3; // Extreme bias greatly reduces quality
  }
  
  // Manipulation factor - manipulative content is lower quality
  score -= manipulationScore * 0.3;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Cached version of emotion analysis to improve performance
 * @param text Text to analyze
 * @returns Emotion analysis result
 */
async function cachedEmotionAnalysis(text: string): Promise<EmotionAnalysisResult> {
  const cacheKey = cache.getKey(text);
  
  // Check if we have a cached result
  if (cache.emotions.has(cacheKey)) {
    logger.debug('Using cached emotion analysis result');
    return cache.emotions.get(cacheKey)!;
  }
  
  try {
    // Perform the actual emotion analysis
    logger.debug('Performing fresh emotion analysis');
    const result = await analyzeEmotions(text);
    
    // Cache the result
    cache.emotions.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('Error in emotion analysis:', error);
    // Return a default emotion analysis if there's an error
    return {
      emotions: {
        neutral: 0.8,
        joy: 0.05,
        sadness: 0.05,
        anger: 0.05,
        fear: 0.05
      },
      dominantEmotion: 'neutral'
    };
  }
}

/**
 * Cached version of sentiment analysis to improve performance
 * @param text Text to analyze
 * @returns Sentiment analysis result
 */
async function cachedSentimentAnalysis(text: string): Promise<{score: number, label: string}> {
  const cacheKey = cache.getKey(text);
  
  // Check if we have a cached result
  if (cache.sentiment.has(cacheKey)) {
    logger.debug('Using cached sentiment analysis result');
    return cache.sentiment.get(cacheKey)!;
  }
  
  try {
    // Perform the actual sentiment analysis
    logger.debug('Performing fresh sentiment analysis');
    const result = await analyzeSentiment(text);
    
    // Cache the result
    cache.sentiment.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('Error in sentiment analysis:', error);
    // Return a default sentiment analysis if there's an error
    return {
      score: 0.5,
      label: 'neutral'
    };
  }
}

/**
 * Cached version of entity extraction to improve performance
 * @param text Text to analyze for entities
 * @returns Array of main entities found in the text
 */
async function cachedEntityExtraction(text: string): Promise<string[]> {
  const cacheKey = cache.getKey(text);
  
  // Check if we have a cached result
  if (cache.entityExtraction.has(cacheKey)) {
    logger.debug('Using cached entity extraction result');
    return cache.entityExtraction.get(cacheKey)!;
  }
  
  try {
    // Perform the actual entity extraction
    logger.debug('Performing fresh entity extraction');
    
    // Use enhanced entity extraction if available, fallback to basic extraction
    let entities: string[] = [];
    try {
      const enhancedResult = await enhancedEntityExtraction(text);
      
      // Get the pre-categorized entities from the result
      const people = enhancedResult.keyPeople || [];
      const organizations = enhancedResult.keyOrganizations || [];
      const locations = enhancedResult.keyLocations || [];
      
      // Combine into a single array, prioritizing by type
      entities = [...people, ...organizations, ...locations];
      
      // Remove duplicates and limit to top entities
      entities = [...new Set(entities)].slice(0, 10);
    } catch (enhancedError) {
      logger.error('Enhanced entity extraction failed, using fallback:', enhancedError);
      
      // Fallback to basic extraction
      const nerResponse = await performEntityRecognition(text);
      if (nerResponse && nerResponse.grouped_entities) {
        // Collect all entity names
        const allEntities: Array<{entity: string, type: string, count: number}> = [];
        Object.values(nerResponse.grouped_entities).forEach(group => {
          group.forEach(e => {
            allEntities.push({
              entity: e.entity,
              type: e.type,
              count: e.count
            });
          });
        });
        
        // Sort by frequency and get top entities
        entities = allEntities
          .sort((a, b) => b.count - a.count)
          .map(e => e.entity)
          .slice(0, 10);
      }
    }
    
    // Cache the result
    cache.entityExtraction.set(cacheKey, entities);
    return entities;
  } catch (error) {
    logger.error('Error in entity extraction:', error);
    // Return an empty array if there's an error
    return [];
  }
}

/**
 * Cached version of summary generation to improve performance
 * @param text Text to summarize
 * @returns Summary of the main point of the text
 */
async function cachedSummaryGeneration(text: string): Promise<string> {
  const cacheKey = cache.getKey(text);
  
  // Check if we have a cached result
  if (cache.summarization.has(cacheKey)) {
    logger.debug('Using cached summary generation result');
    return cache.summarization.get(cacheKey)!;
  }
  
  try {
    // Perform the actual summarization
    logger.debug('Performing fresh summary generation');
    
    // Try advanced summarization first, fallback to basic summarization
    let summary = '';
    try {
      summary = await generateAdvancedSummary(text, 1);
    } catch (advancedError) {
      logger.error('Advanced summarization failed, using fallback:', advancedError);
      
      // Fallback to basic summarization
      summary = await summarizeText(text, 1);
    }
    
    // Cache the result
    cache.summarization.set(cacheKey, summary);
    return summary;
  } catch (error) {
    logger.error('Error in summary generation:', error);
    
    // Return a simple excerpt if there's an error
    const excerpt = text.substring(0, 100) + '...';
    return `Content excerpt: ${excerpt}`;
  }
} 