import axios from 'axios';
import { logger } from '../utils/logger';
import { analyzeManipulativeContent, ManipulationAnalysis } from './doomscrollAnalysisService';
import { analyzeEmotions, EmotionAnalysisResult, emotionAnalysisService } from './emotionAnalysisService';
import { huggingFaceService } from './huggingFaceService';

/**
 * Types of logical fallacies that can be detected
 */
export enum LogicalFallacyType {
  // Appeal-based fallacies
  APPEAL_TO_AUTHORITY = 'appeal_to_authority',
  APPEAL_TO_EMOTION = 'appeal_to_emotion',
  APPEAL_TO_IGNORANCE = 'appeal_to_ignorance',
  APPEAL_TO_COMMON_SENSE = 'appeal_to_common_sense',
  
  // Argument structure fallacies
  STRAW_MAN = 'straw_man',
  AD_HOMINEM = 'ad_hominem',
  FALSE_DICHOTOMY = 'false_dichotomy',
  HASTY_GENERALIZATION = 'hasty_generalization',
  RED_HERRING = 'red_herring',
  SLIPPERY_SLOPE = 'slippery_slope',
  
  // Other common fallacies
  CIRCULAR_REASONING = 'circular_reasoning',
  POST_HOC = 'post_hoc',
  FALSE_EQUIVALENCE = 'false_equivalence',
  BANDWAGON = 'bandwagon',
  TU_QUOQUE = 'tu_quoque',
  LOADED_QUESTION = 'loaded_question',
  HISTORICAL_ANALOGY = 'historical_analogy'
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
  LEFT_EXTREME = 'left_extreme',
  LEFT_STRONG = 'left_strong',
  LEFT_MODERATE = 'left_moderate',
  LEFT_SLIGHT = 'left_slight',
  CENTER = 'center',
  RIGHT_SLIGHT = 'right_slight',
  RIGHT_MODERATE = 'right_moderate',
  RIGHT_STRONG = 'right_strong',
  RIGHT_EXTREME = 'right_extreme'
}

/**
 * Represents the overall political bias of an article
 */
export interface BiasAnalysis {
  type: BiasType;
  confidence: number; // 0.0 to 1.0
  explanation: string;
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

/**
 * Analyze political bias in the article text
 */
export function analyzeBias(text: string): BiasAnalysis {
  const lowerText = text.toLowerCase();
  let leftScore = 0;
  let rightScore = 0;
  let leftKeywordsFound: string[] = [];
  let rightKeywordsFound: string[] = [];
  
  console.log('📊 [analyzeBias] Analyzing text snippet:', lowerText.substring(0, 100) + "..."); // Log start of text
  
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
  
  console.log(`📊 [analyzeBias] Scores - Left: ${leftScore}, Right: ${rightScore}`);
  console.log(`📊 [analyzeBias] Left keywords found: ${leftKeywordsFound.slice(0, 5).join(", ")}${leftKeywordsFound.length > 5 ? ` and ${leftKeywordsFound.length - 5} more` : ""}`);
  console.log(`📊 [analyzeBias] Right keywords found: ${rightKeywordsFound.slice(0, 5).join(", ")}${rightKeywordsFound.length > 5 ? ` and ${rightKeywordsFound.length - 5} more` : ""}`);

  // Calculate bias type and confidence
  if (leftScore === 0 && rightScore === 0) {
    return {
      type: BiasType.CENTER,
      confidence: 0.5,
      explanation: "No strong indicators of political bias were detected."
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
  
  // Account for text length - require minimum keyword density for confidence
  const textLength = text.length;
  const keywordDensity = totalScore / (textLength / 100); // Keywords per 100 chars
  let confidenceAdjustment = 0;
  
  if (keywordDensity < 0.2) {
    confidenceAdjustment = -0.2; // Low density reduces confidence
  } else if (keywordDensity > 0.5) {
    confidenceAdjustment = 0.1; // High density increases confidence
  }
  
  const confidenceScore = Math.min(biasStrength + 0.3 + confidenceAdjustment, 0.95);
  
  console.log(`📊 [analyzeBias] Determined Type: ${biasType}, Strength: ${biasStrength.toFixed(3)}, Density: ${keywordDensity.toFixed(3)}, Confidence: ${confidenceScore.toFixed(3)}`);
  return {
    type: biasType,
    confidence: confidenceScore,
    explanation: generateBiasExplanation(biasType, biasStrength, biasDirection === 'left' ? leftKeywordsFound : rightKeywordsFound)
  };
}

/**
 * Generate explanation for bias analysis
 */
function generateBiasExplanation(biasType: BiasType, strength: number, keywords: string[] = []): string {
  const strengthText = strength > 0.75 ? "strong" : 
                     strength > 0.5 ? "moderate" : 
                     strength > 0.25 ? "slight" : "very slight";
  
  // Format the top keywords for the explanation
  const topKeywords = keywords.length > 0 
    ? `Common terms found include: ${keywords.slice(0, 5).join(", ")}${keywords.length > 5 ? ` and ${keywords.length - 5} more` : ""}.`
    : '';
  
  switch (biasType) {
    case BiasType.CENTER:
      return "The content appears to be politically balanced without strong indicators of bias.";
    case BiasType.LEFT_EXTREME:
      return `The content shows extremely strong indicators of left-leaning political bias, consistently using language and framing associated with progressive viewpoints. ${topKeywords} The article may present progressive policies without acknowledging criticisms or alternative perspectives.`;
    case BiasType.LEFT_STRONG:
      return `The content shows strong indicators of left-leaning political bias, predominantly using language and framing associated with progressive viewpoints. ${topKeywords} The article emphasizes progressive perspectives.`;
    case BiasType.LEFT_MODERATE:
      return `The content shows moderate indicators of left-leaning political bias, using language and framing commonly associated with progressive viewpoints. ${topKeywords}`;
    case BiasType.LEFT_SLIGHT:
      return `The content shows slight indicators of left-leaning political bias, occasionally using language and framing associated with progressive viewpoints. ${topKeywords}`;
    case BiasType.RIGHT_EXTREME:
      return `The content shows extremely strong indicators of right-leaning political bias, consistently using language and framing associated with conservative viewpoints. ${topKeywords} The article may present conservative policies without acknowledging criticisms or alternative perspectives.`;
    case BiasType.RIGHT_STRONG:
      return `The content shows strong indicators of right-leaning political bias, predominantly using language and framing associated with conservative viewpoints. ${topKeywords} The article emphasizes conservative perspectives.`;
    case BiasType.RIGHT_MODERATE:
      return `The content shows moderate indicators of right-leaning political bias, using language and framing commonly associated with conservative viewpoints. ${topKeywords}`;
    case BiasType.RIGHT_SLIGHT:
      return `The content shows slight indicators of right-leaning political bias, occasionally using language and framing associated with conservative viewpoints. ${topKeywords}`;
    default:
      return "Unable to determine political bias orientation.";
  }
}

/**
 * Extract metadata from article content
 */
export function extractMetadata(html: string, text: string): ArticleMetadata {
  // Ensure we have text to parse
  if (!text || typeof text !== 'string') {
    text = '';
    console.warn('Empty or invalid text passed to extractMetadata');
  }
  
  // Ensure we have html to parse
  if (!html || typeof html !== 'string') {
    html = text ? `<div>${text}</div>` : '<div></div>';
    console.warn('Empty or invalid HTML passed to extractMetadata');
  }
  
  console.log('📊 [extractMetadata] Analyzing text length: ', text.length, ', HTML length:', html.length);
  console.log('📊 [extractMetadata] Text snippet:', text.substring(0, 100) + "...");
  
  // Parse HTML using the browser's DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  console.log('📊 [extractMetadata] HTML parsed. Doc body exists:', !!doc.body);
  
  // Calculate basic text metrics
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = splitIntoSentences(text);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const readingTime = Math.ceil(words.length / 200); // Avg reading speed of 200 wpm
  console.log(`📊 [extractMetadata] Counts - Words: ${words.length}, Sentences: ${sentences.length}, Paragraphs: ${paragraphs.length}`);
  
  // Extract links
  const linkElements = doc.querySelectorAll('a');
  const links = Array.from(linkElements)
    .map(a => ({
      url: a.getAttribute('href') || '',
      text: a.textContent || ''
    }))
    .filter(link => {
      // More sophisticated link filtering
      // Filter out empty, anchor links, and common navigation links
      if (!link.url || link.url.startsWith('#')) return false;
      if (/^\s*(home|about|contact|login|signup|register|privacy|terms)\s*$/i.test(link.text)) return false;
      return true;
    });
  console.log(`📊 [extractMetadata] Found ${linkElements.length} <a> tags, Filtered to ${links.length} external links.`);
  // Log the first few URLs
  if (links.length > 0) {
    console.log(`📊 [extractMetadata] Sample links: ${links.slice(0, 3).map(l => l.url).join(', ')}${links.length > 3 ? '...' : ''}`);
  }
  
  // Extract potential citations
  const sourceCitations = [];
  const citationPatterns = [
    /\b(?:according to|cited by|source[s]?:|reference[s]?:)\s+([^,.]+)/gi,
    /\(([^)]+(?:19|20)\d{2}[^)]*)\)/g, // Capture parenthetical citations with years
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+\((?:19|20)\d{2}\)/g // Author (Year) format
  ];
  
  let citationMatchCount = 0;
  for (const pattern of citationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      citationMatchCount++;
      sourceCitations.push({
        source: match[1].trim(),
        text: match[0]
      });
    }
  }
  console.log(`📊 [extractMetadata] Found ${citationMatchCount} potential citations via regex.`);
  if (sourceCitations.length > 0) {
    console.log(`📊 [extractMetadata] Sample citations: ${sourceCitations.slice(0, 3).map(c => c.source).join(', ')}${sourceCitations.length > 3 ? '...' : ''}`);
  }
  
  // Enhanced entity extraction - organizations, people, locations
  const entities: Record<string, string[]> = {
    people: [],
    organizations: [],
    locations: []
  };
  
  // People pattern - First Last, titles + names, etc.
  const peoplePatterns = [
    /\b((?:Mr|Mrs|Ms|Dr|Prof|President|Senator|Governor|Rep)\.\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g,
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})\b(?:\s+(?:said|says|claimed|stated|announced|argued))/g
  ];
  
  // Organizations pattern - multiple capitalized words, Inc., Corp., etc.
  const orgPatterns = [
    /\b([A-Z][a-z]*(?:\s[A-Z][a-z]*){1,5}(?:\s(?:Inc|Corp|LLC|Ltd|Co|Association|Institute|University|College|School|Agency|Department|Committee))?)\b/g,
    /\b([A-Z][A-Z]+)\b/g // Acronyms
  ];
  
  // Locations pattern - cities, countries, etc.
  const locationPatterns = [
    /\b(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\b(?!\s+(?:University|College|Institute|School))/g,
    /\b(North|South|East|West|New|San|Los|Las)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g
  ];
  
  // Extract entities
  for (const pattern of peoplePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 3 && !entities.people.includes(match[1].trim())) {
        entities.people.push(match[1].trim());
      }
    }
  }
  
  for (const pattern of orgPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const org = match[1].trim();
      // Filter out common false positives 
      if (org && org.length > 3 && 
          !/^(The|This|That|These|Those|It|He|She|They|We|You|I|A|An)$/.test(org) && 
          !entities.organizations.includes(org)) {
        entities.organizations.push(org);
      }
    }
  }
  
  for (const pattern of locationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const location = match[1] ? match[1].trim() : (match[2] ? match[1] + ' ' + match[2] : '');
      if (location && location.length > 3 && !entities.locations.includes(location)) {
        entities.locations.push(location);
      }
    }
  }
  
  // Create a combined list of primary entities
  let mainEntities: string[] = [];
  
  // Add people first (usually the most important entities)
  mainEntities = mainEntities.concat(entities.people);
  
  // Add organizations second
  mainEntities = mainEntities.concat(entities.organizations);
  
  // Add locations third
  mainEntities = mainEntities.concat(entities.locations);
  
  // Limit to top 15 entities
  mainEntities = mainEntities.slice(0, 15);
  
  console.log(`📊 [extractMetadata] Entities - People: ${entities.people.length}, Organizations: ${entities.organizations.length}, Locations: ${entities.locations.length}`);
  console.log(`📊 [extractMetadata] Top entities: ${mainEntities.slice(0, 5).join(', ')}${mainEntities.length > 5 ? '...' : ''}`);
  
  // Extract key phrases - look for important sentences based on position and content
  const keyphrases: string[] = [];
  
  // First paragraph sentences are often important
  if (paragraphs.length > 0) {
    const firstParaSentences = splitIntoSentences(paragraphs[0]);
    if (firstParaSentences.length > 0) {
      keyphrases.push(firstParaSentences[0]);
    }
  }
  
  // Look for sentences with entities or important signaling phrases
  const importantPhraseMarkers = [
    /\b(key|important|significant|critical|essential|main|primary|crucial)\b/i,
    /\b(found|discovered|revealed|showed|concluded|determined)\b/i,
    /\b(according to the (?:study|research|analysis|report|data|survey|poll))\b/i
  ];
  
  for (const sentence of sentences) {
    // Skip if too short or too long
    if (sentence.length < 30 || sentence.length > 150) continue;
    
    // Check if sentence contains any important markers
    const hasImportantMarker = importantPhraseMarkers.some(marker => marker.test(sentence));
    
    // Check if it has named entities
    const hasNamedEntity = mainEntities.some(entity => sentence.includes(entity));
    
    // If either condition is met and we haven't already added it
    if ((hasImportantMarker || hasNamedEntity) && !keyphrases.includes(sentence)) {
      keyphrases.push(sentence);
      
      // Stop once we have enough key phrases
      if (keyphrases.length >= 5) break;
    }
  }
  
  // Ensure we have at least a few keyphrases
  if (keyphrases.length < 3 && sentences.length > 3) {
    // Add sentences with the right length that aren't already included
    for (const sentence of sentences) {
      if (sentence.length >= 50 && sentence.length <= 150 && !keyphrases.includes(sentence)) {
        keyphrases.push(sentence);
        if (keyphrases.length >= 3) break;
      }
    }
  }
  
  console.log(`📊 [extractMetadata] Extracted ${keyphrases.length} keyphrases.`);
  if (keyphrases.length > 0) {
    console.log(`📊 [extractMetadata] First keyphrase: "${keyphrases[0].substring(0, 60)}..."`);
  }
  
  // Additional metric: Complexity estimation
  const longWords = words.filter(word => word.length > 6).length;
  const longWordPercentage = words.length > 0 ? (longWords / words.length) * 100 : 0;
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  
  // Use Flesch-Kincaid as a simple complexity measure
  // Formula: 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
  // We'll approximate syllables as word length / 3
  const approximateSyllables = words.reduce((total, word) => total + Math.max(1, Math.ceil(word.length / 3)), 0);
  const syllablesPerWord = words.length > 0 ? approximateSyllables / words.length : 0;
  const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * syllablesPerWord);
  
  console.log(`📊 [extractMetadata] Complexity - Long words: ${longWordPercentage.toFixed(1)}%, Avg sentence length: ${avgSentenceLength.toFixed(1)} words, Readability score: ${readabilityScore.toFixed(1)}`);
  
  // Log the final object before returning
  const finalMetadata = {
    wordCount: words.length,
    readingTimeMinutes: readingTime,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    externalLinks: links,
    sourceCitations,
    mainEntities,
    keyphrases,
    complexityScore: Math.max(0, Math.min(100, 100 - readabilityScore)), // Convert to 0-100 scale
    avgSentenceLength: avgSentenceLength,
    longWordPercentage: longWordPercentage
  };

  return finalMetadata;
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
 * Analyzes the emotional content of text
 * @param text The text to analyze
 * @returns Emotion analysis results
 */
export async function analyzeEmotions(text: string): Promise<EmotionAnalysisResult> {
  try {
    // Use the new emotion analysis service for modern AI-based analysis
    return await emotionAnalysisService.analyzeEmotions(text);
  } catch (error) {
    console.error('Error in emotion analysis:', error);
    return {
      emotions: [],
      dominantEmotion: null,
      emotionalAppeal: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyze text specifically for sentiment (positive/negative/neutral)
 */
export async function analyzeSentiment(text: string): Promise<{score: number, label: string}> {
  try {
    // First try to use HuggingFace for sentiment analysis
    const response = await huggingFaceService.analyzeSentiment(text);
    
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
 * Perform complete content analysis on article
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
      metadata = extractMetadata(html, plainText);
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
    
    // Detect logical fallacies using REGEX - wrap in try/catch
    let logicalFallacies: LogicalFallacy[];
    try {
      logicalFallacies = detectLogicalFallacies(plainText);
    } catch (fallacyError) {
      console.error('Error detecting fallacies:', fallacyError);
      logicalFallacies = [];
    }
    
    // Analyze political bias using keywords - wrap in try/catch
    let biasAnalysis: BiasAnalysis;
    try {
      biasAnalysis = analyzeBias(plainText);
    } catch (biasError) {
      console.error('Error analyzing bias:', biasError);
      biasAnalysis = {
        type: BiasType.CENTER,
        confidence: 0,
        explanation: limitedAnalysis ? 
          'Limited content available for bias analysis' : 
          'Error occurred during bias analysis'
      };
    }
    
    // --- Enhance Fallacy Detection with Zero-Shot NLP ---
    const zeroShotFallacyLabels = Object.values(LogicalFallacyType);

    // Split text into meaningful chunks for better analysis
    const textChunks = splitIntoAnalysisChunks(plainText);
    console.log(`🔬 Analyzing ${textChunks.length} text chunks for fallacies and bias`);
    
    // Use Promise.all to run all analyses in parallel (fallacies, bias, entities, and topics)
    const [fallacyResults, biasStyleResults, entityResults, topicResults] = await Promise.all([
      // Analyze fallacies in chunks
      analyzeTextChunksForFallacies(textChunks, zeroShotFallacyLabels),
      
      // Analyze bias/framing separately
      performZeroShotAnalysis(plainText, [
        "Emotionally Charged Language",
        "Biased Framing", 
        "Objective Tone",
        "Subjective Tone", 
        "Propaganda Technique",
        "Balanced Perspective"
      ]),
      
      // Extract entities using NER
      performEntityRecognition(plainText),
      
      // Classify article topics
      performZeroShotAnalysis(plainText, topicLabels)
    ]);
    
    // Process fallacy results if we got them
    if (fallacyResults && fallacyResults.length > 0) {
      console.log(`🔬 Processing ${fallacyResults.length} fallacy detection results`);
      
      // Process and add ML-detected fallacies
      for (const result of fallacyResults) {
        if (!result) continue;
        
        const threshold = 0.4; // Lowered threshold based on previous test
        result.labels.forEach((label, index) => {
          const score = result.scores[index];
          if (score >= threshold) {
            const fallacyType = label as LogicalFallacyType;
            
            // Avoid adding duplicates if regex already found this type
            const alreadyExists = logicalFallacies.some(f => f.type === fallacyType);
            
            if (!alreadyExists) {
              console.log(`✅ Adding ML-detected fallacy: ${fallacyType} (Score: ${score.toFixed(3)})`);
              logicalFallacies.push({
                type: fallacyType, 
                confidence: score,
                explanation: getFallacyExplanation(fallacyType) + " (Detected via ML model)",
                excerpt: result.sequence.substring(0, 250) + (result.sequence.length > 250 ? "..." : ""),
                startIndex: -1, // Mark as unknown
                endIndex: -1,   // Mark as unknown
              });
            } else {
              console.log(`ℹ️ Skipping ML-detected fallacy (already found by regex): ${fallacyType}`);
            }
          }
        });
      }
    } else {
      console.warn("⚠️ No results received from zero-shot fallacy analysis.");
    }

    // Process bias/style results
    let qualitativeAnalysisResult: QualitativeAnalysis | undefined = undefined;
    if (biasStyleResults) {
      const threshold = 0.3;
      console.log(`🔬 Processing ${biasStyleResults.labels.length} zero-shot bias/framing results with threshold ${threshold}...`);
      const topLabels: string[] = [];
      const topScores: number[] = [];

      biasStyleResults.labels.forEach((label, index) => {
        const score = biasStyleResults.scores[index];
        if (score >= threshold) {
          console.log(`✅ Adding qualitative analysis label: ${label} (Score: ${score.toFixed(3)})`);
          topLabels.push(label);
          topScores.push(score);
        }
      });

      if (topLabels.length > 0) {
        qualitativeAnalysisResult = { labels: topLabels, scores: topScores };
      }
    } else {
       console.warn("⚠️ No results received from zero-shot bias/framing analysis.");
    }

    // Process entity results if we got them
    // This will enhance our metadata with better entity recognition
    if (entityResults) {
      console.log(`🔬 Processing NER results. Found ${entityResults.entities.length} entity mentions.`);
      
      // Override the mainEntities in metadata with the NER results if available
      try {
        const entityTypes = Object.keys(entityResults.grouped_entities);
        console.log(`✅ Entity types detected: ${entityTypes.join(', ')}`);
        
        let mainEntities: string[] = [];
        
        // First add PER (Person) entities which are typically most important
        if (entityResults.grouped_entities['PER']) {
          const personEntities = entityResults.grouped_entities['PER']
            .sort((a, b) => b.count - a.count) // Sort by mention count
            .map(e => e.entity);
          console.log(`✅ Found ${personEntities.length} person entities`);
          mainEntities = mainEntities.concat(personEntities);
        }
        
        // Then add ORG (Organization) entities
        if (entityResults.grouped_entities['ORG']) {
          const orgEntities = entityResults.grouped_entities['ORG']
            .sort((a, b) => b.count - a.count)
            .map(e => e.entity);
          console.log(`✅ Found ${orgEntities.length} organization entities`);
          mainEntities = mainEntities.concat(orgEntities);
        }
        
        // Then add LOC (Location) entities
        if (entityResults.grouped_entities['LOC']) {
          const locEntities = entityResults.grouped_entities['LOC']
            .sort((a, b) => b.count - a.count)
            .map(e => e.entity);
          console.log(`✅ Found ${locEntities.length} location entities`);
          mainEntities = mainEntities.concat(locEntities);
        }
        
        // Add other entity types if needed
        // Limit to top entities with high confidence
        mainEntities = mainEntities.slice(0, 15);
        
        if (mainEntities.length > 0) {
          // Replace the regex-based entities with ML-detected ones
          metadata.mainEntities = mainEntities;
          console.log(`✅ Updated metadata with ${mainEntities.length} ML-detected entities`);
        }
      } catch (entityError) {
        console.error('Error processing NER results:', entityError);
        // Don't replace the entities if there was an error
      }
    } else {
      console.warn("⚠️ No results received from NER analysis. Using regex-based entity extraction only.");
    }

    // Process topic classification results
    let topicClassificationResult: TopicClassification | undefined = undefined;
    if (topicResults) {
      console.log(`🔬 Processing topic classification results with ${topicResults.labels.length} topics`);
      
      // Find the highest scoring topic
      const labelScores = topicResults.labels.map((label, index) => ({
        topic: label,
        score: topicResults.scores[index]
      }));
      
      // Sort by score in descending order
      labelScores.sort((a, b) => b.score - a.score);
      
      // Get the main topic (highest score) and related topics (next highest scores)
      const mainTopic = labelScores[0];
      const relatedTopics = labelScores.slice(1, 4);  // Get next 3 highest topics
      
      console.log(`✅ Main topic: ${mainTopic.topic} (Score: ${mainTopic.score.toFixed(3)})`);
      console.log(`✅ Related topics: ${relatedTopics.map(t => `${t.topic} (${t.score.toFixed(3)})`).join(', ')}`);
      
      topicClassificationResult = {
        mainTopic: mainTopic.topic,
        score: mainTopic.score,
        relatedTopics: relatedTopics
      };
    } else {
      console.warn("⚠️ No results received from topic classification.");
    }

    // --- Refine Bias Analysis with Qualitative Data ---
    let adjustedBiasAnalysis = { ...biasAnalysis }; // Start with keyword-based analysis
    let qualitativeFactorsNote = "";

    if (qualitativeAnalysisResult) {
      const objectivityScore = qualitativeAnalysisResult.scores[
        qualitativeAnalysisResult.labels.findIndex(
          label => label === "Objective Tone" || label === "Balanced Perspective"
        )
      ] || 0;

      const biasedFramingScore = qualitativeAnalysisResult.scores[
        qualitativeAnalysisResult.labels.findIndex(
          label => label === "Biased Framing"
        )
      ] || 0;
      
      const emotionalScore = qualitativeAnalysisResult.scores[
        qualitativeAnalysisResult.labels.findIndex(
          label => label === "Emotionally Charged Language"
        )
      ] || 0;

      console.log(`📊 Qualitative factors - Objectivity: ${objectivityScore.toFixed(3)}, Biased Framing: ${biasedFramingScore.toFixed(3)}, Emotional: ${emotionalScore.toFixed(3)}`);

      // Adjust bias based on objectivity
      if (objectivityScore > 0.6 && adjustedBiasAnalysis.type !== BiasType.CENTER) {
        // High objectivity reduces confidence in keyword-based bias
        adjustedBiasAnalysis.confidence = Math.max(0.1, adjustedBiasAnalysis.confidence * (1 - objectivityScore * 0.75)); 
        qualitativeFactorsNote += ` High objectivity detected (Score: ${objectivityScore.toFixed(2)}), reducing confidence in keyword bias.`;
        // If confidence drops very low, consider it CENTER
        if (adjustedBiasAnalysis.confidence < 0.25) {
           adjustedBiasAnalysis.type = BiasType.CENTER;
           qualitativeFactorsNote += ` Bias shifted to Center due to low confidence after objectivity adjustment.`;
        }
      } 
      // Adjust bias based on framing and emotion if not already CENTER
      else if (adjustedBiasAnalysis.type !== BiasType.CENTER && (biasedFramingScore > 0.5 || emotionalScore > 0.6)) {
         // High biased framing or emotion increases confidence
         const adjustmentFactor = Math.max(biasedFramingScore, emotionalScore * 0.8);
         adjustedBiasAnalysis.confidence = Math.min(0.95, adjustedBiasAnalysis.confidence + adjustmentFactor * 0.3);
         qualitativeFactorsNote += ` Confidence increased due to biased framing/emotional language (Scores: Framing=${biasedFramingScore.toFixed(2)}, Emotional=${emotionalScore.toFixed(2)}).`;
      }
      // Handle cases where keywords showed CENTER but ML shows bias
      else if (adjustedBiasAnalysis.type === BiasType.CENTER && biasedFramingScore > 0.6) {
          // If keyword analysis was center, but framing is biased, assign a slight bias
          // We don't know the direction, so we might need a new 'UNCLEAR' bias type or just note it.
          // For now, let's just add a note.
          qualitativeFactorsNote += ` Note: Keyword analysis indicated Center, but ML detected strong biased framing (Score: ${biasedFramingScore.toFixed(2)}).`;
          // Or potentially assign a slight bias type if we could determine directionality from framing analysis in the future.
      }

      // Update explanation if adjustments were made
      if (qualitativeFactorsNote) {
          adjustedBiasAnalysis.explanation += qualitativeFactorsNote;
          console.log(`📊 Bias analysis adjusted based on qualitative factors.`);
      }
    }

    // --- Calculate Final Scores ---
    // Calculate a more comprehensive manipulation score based on multiple factors
    // Start with fallacy-based manipulation
    const fallacyCount = logicalFallacies.length;
    const fallacyFactor = Math.min(fallacyCount / 5, 1); // Cap at 1.0 for 5+ fallacies
    
    // Factor in bias strength 
    const biasStrength = adjustedBiasAnalysis ? 
      (adjustedBiasAnalysis.type === BiasType.CENTER ? 0 : adjustedBiasAnalysis.confidence) : 0;
    
    // Factor in emotional language from qualitative analysis
    let emotionalLanguageFactor = 0;
    if (qualitativeAnalysisResult) {
      // Check for emotionally charged language
      const emotionalIdx = qualitativeAnalysisResult.labels.findIndex(
        label => label === "Emotionally Charged Language"
      );
      if (emotionalIdx >= 0) {
        emotionalLanguageFactor = qualitativeAnalysisResult.scores[emotionalIdx];
      }
      
      // Check for propaganda techniques
      const propagandaIdx = qualitativeAnalysisResult.labels.findIndex(
        label => label === "Propaganda Technique"
      );
      if (propagandaIdx >= 0) {
        emotionalLanguageFactor = Math.max(
          emotionalLanguageFactor,
          qualitativeAnalysisResult.scores[propagandaIdx]
        );
      }
    }
    
    // Opinion pieces are more naturally biased, so consider the topic
    let topicAdjustment = 0;
    if (topicClassificationResult && topicClassificationResult.mainTopic === "Opinion") {
      topicAdjustment = -0.1; // Reduce manipulation score for opinion pieces
    }
    
    // Calculate the final manipulation score with weights for each factor
    const manipulationScore = Math.max(0, Math.min(1, 
      (fallacyFactor * 0.5) +          // 50% weight to logical fallacies
      (biasStrength * 0.3) +           // 30% weight to bias strength
      (emotionalLanguageFactor * 0.2) + // 20% weight to emotional language
      topicAdjustment                   // Topic-based adjustment
    ));
    
    console.log(`🔬 Manipulation score components - Fallacies: ${fallacyFactor.toFixed(2)}, Bias: ${biasStrength.toFixed(2)}, Emotional: ${emotionalLanguageFactor.toFixed(2)}`);
    console.log(`🔬 Final manipulation score: ${manipulationScore.toFixed(2)}`);
    
    // Calculate a more comprehensive quality score
    // Consider: citations, word count, complexity, objectivity, balanced perspective
    const citationFactor = Math.min((metadata?.sourceCitations?.length || 0) / 3, 1);
    const wordCountFactor = Math.min((metadata?.wordCount || 0) / 500, 1);
    
    // Factor in objective tone from qualitative analysis
    let objectivityFactor = 0;
    if (qualitativeAnalysisResult) {
      const objectiveIdx = qualitativeAnalysisResult.labels.findIndex(
        label => label === "Objective Tone"
      );
      if (objectiveIdx >= 0) {
        objectivityFactor = qualitativeAnalysisResult.scores[objectiveIdx];
      }
      
      const balancedIdx = qualitativeAnalysisResult.labels.findIndex(
        label => label === "Balanced Perspective"
      );
      if (balancedIdx >= 0) {
        objectivityFactor = Math.max(
          objectivityFactor,
          qualitativeAnalysisResult.scores[balancedIdx]
        );
      }
    }
    
    // Calculate the final quality score with weights for each factor
    const qualityScore = Math.max(0, Math.min(1,
      (citationFactor * 0.3) +              // 30% weight to citations
      (wordCountFactor * 0.2) +             // 20% weight to length/depth
      (objectivityFactor * 0.2) +           // 20% weight to objectivity
      ((1 - manipulationScore) * 0.3)       // 30% weight to lack of manipulation
    ));
    
    console.log(`🔬 Quality score components - Citations: ${citationFactor.toFixed(2)}, Length: ${wordCountFactor.toFixed(2)}, Objectivity: ${objectivityFactor.toFixed(2)}`);
    console.log(`🔬 Final quality score: ${qualityScore.toFixed(2)}`);

    // Perform manipulation analysis (doomscroll and outrage bait detection)
    console.log('🔬 Performing manipulation analysis (doomscroll and outrage detection)');
    const manipulationAnalysis = analyzeManipulativeContent(plainText);
    console.log(`🔬 Manipulation analysis complete - Doomscroll score: ${manipulationAnalysis.doomscroll.doomscrollScore.toFixed(2)}, Outrage score: ${manipulationAnalysis.outrageBait.outrageBaitScore.toFixed(2)}`);

    // Perform enhanced emotion analysis with Hugging Face integration
    console.log('🔬 Performing advanced emotion analysis with Hugging Face integration');
    const emotionAnalysis = await analyzeEmotions(plainText);

    // Log information with type safety for the new emotionAnalysis structure
    if (emotionAnalysis.success && emotionAnalysis.dominantEmotion) {
      console.log(`🔬 Emotion analysis complete - Dominant emotion: ${emotionAnalysis.dominantEmotion.type}, Emotional appeal: ${emotionAnalysis.emotionalAppeal.toFixed(1)}%`);
    } else {
      console.log(`🔬 Emotion analysis failed or returned no results: ${emotionAnalysis.error || 'No dominant emotion detected'}`);
    }

    // Perform dedicated sentiment analysis (also with Hugging Face if available)
    console.log('🔬 Performing sentiment analysis with Hugging Face integration');
    const sentiment = await analyzeSentiment(plainText);
    console.log(`🔬 Sentiment analysis complete - Score: ${sentiment.score.toFixed(2)}, Label: ${sentiment.label}`);

    console.log('🔬 Analysis completed successfully (incl. ML attempt)');
    
    return {
      logicalFallacies, 
      biasAnalysis: adjustedBiasAnalysis, // Use the adjusted bias analysis
      metadata,
      manipulationScore, 
      qualityScore,
      qualitativeAnalysis: qualitativeAnalysisResult,
      topicClassification: topicClassificationResult,
      manipulationAnalysis, // Add the new manipulation analysis
      emotionAnalysis,      // Add the new emotion analysis
      sentiment             // Add dedicated sentiment analysis
    };
  } catch (error) {
    console.error('FATAL Error during content analysis pipeline:', error);
    return {
        logicalFallacies: [],
        biasAnalysis: {
            type: BiasType.CENTER,
            confidence: 0,
            explanation: 'Analysis could not be completed due to a fatal error'
        },
        metadata: {
            wordCount: 0,
            readingTimeMinutes: 0,
            sentenceCount: 0,
            paragraphCount: 0,
            externalLinks: [],
            sourceCitations: [],
            mainEntities: [],
            keyphrases: [],
            complexityScore: 0,
            avgSentenceLength: 0,
            longWordPercentage: 0
        },
        manipulationScore: 0,
        qualityScore: 0,
        qualitativeAnalysis: undefined,
        topicClassification: undefined,
        manipulationAnalysis: undefined,
        emotionAnalysis: undefined,
        sentiment: undefined
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