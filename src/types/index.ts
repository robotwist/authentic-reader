// Central type definitions file for the application
import { ManipulationAnalysis } from '../services/doomscrollAnalysisService';
import { EmotionAnalysisResult } from '../services/emotionAnalysisService';

/**
 * Union type for GUID which can be either a string or an object with _ property
 */
export type GUID = string | { _: string; type?: string } | { [key: string]: any };

/**
 * Base source interface for common properties between source types
 */
export interface BaseSource {
  name: string;
  url: string;
  category?: string;
  description?: string;
}

/**
 * RSS Source as used in the frontend
 */
export interface RSSSource extends BaseSource {
  id?: number;
}

/**
 * API Source from the backend
 */
export interface APISource extends BaseSource {
  id: number;
  displayOrder?: number;
  logoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * RSS Article from feed sources
 */
export interface RSSArticle {
  title: string;
  link: string;
  guid?: GUID;
  author: string;
  source: string | { name: string; url: string };
  sourceUrl?: string;
  sourceName?: string;
  sourceLogoUrl?: string;
  publishDate: string;
  pubDate?: string;
  summary: string;
  content?: string;
  contentSnippet?: string;
  imageUrl?: string;
  categories: string[];
  isRead?: boolean;
  isSaved?: boolean;
  creator?: string;
}

/**
 * Article from the API
 */
export interface APIArticle {
  id: number;
  title: string;
  link: string;
  guid: string;
  author: string;
  sourceId: number;
  source?: APISource;
  publishDate: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  categories?: string[];
  isRead: boolean;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User data from API
 */
export interface User {
  id: number;
  username: string;
  email: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
  preferences?: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  id?: number;
  userId?: number;
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  layout?: 'grid' | 'list';
  defaultView?: 'all' | 'saved' | 'categories';
  showImages?: boolean;
  sortBy?: 'date' | 'source' | 'title';
  hideReadArticles?: boolean;
  articlesPerPage?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paginated response from API
 */
export interface PaginatedResponse<T> {
  articles: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Article filters for frontend
 */
export interface ArticleFilters {
  sources?: string[];
  categories?: string[];
  startDate?: string;
  endDate?: string;
  onlyUnread?: boolean;
  onlySaved?: boolean;
}

/**
 * Content analysis result
 */
export interface ContentAnalysisResult {
  qualityScore: number; // 0.0 to 1.0
  manipulationScore: number; // 0.0 to 1.0
  limitedAnalysis?: boolean; // Set to true if the analysis was limited by content size
  biasAnalysis: {
    type: string; // Political bias type (e.g., 'left_strong', 'center', 'right_moderate')
    confidence: number; // 0.0 to 1.0
    explanation: string;
    leftIndicators?: string[];
    rightIndicators?: string[];
    scores?: {
      left: number;
      center: number;
      right: number;
    };
  };
  logicalFallacies: Array<{
    type: string;
    explanation: string;
    excerpt?: string;
    confidence: number; // 0.0 to 1.0
  }>;
  manipulationAnalysis?: ManipulationAnalysis; // From darkPatternService
  metadata: ArticleMetadata;
  emotionalAppeals?: Record<string, number>; // e.g., { 'fear': 0.7, 'hope': 0.3 }
  sentimentAnalysis?: {
    overall: number; // -1.0 to 1.0
    aspects: Record<string, number>; // Sentiment for specific aspects
  };
  emotionAnalysis?: EmotionAnalysisResult; // From emotionAnalysisService
  sentiment?: {
    score: number;
    label: string;
  };
}

/**
 * Article analysis from API
 */
export interface ArticleAnalysis {
  id?: number;
  articleId?: number;
  guid?: string;
  summary?: string;
  sentiment?: number;
  topics?: string[];
  readabilityScore?: number;
  factualityScore?: number;
  politicalBias?: number;
  keyPoints?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sorting options for article lists
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
 * Type guard to check if a source is an API source
 */
export function isAPISource(source: any): source is APISource {
  return source && typeof source.id === 'number';
}

/**
 * Type guard to check if an article is an API article
 */
export function isAPIArticle(article: any): article is APIArticle {
  return article && typeof article.id === 'number';
}

/**
 * Convert any source type to RSSSource
 */
export function toRSSSource(source: APISource | BaseSource | any): RSSSource {
  if (!source) return { name: 'Unknown', url: '' };
  
  return {
    id: source.id,
    name: source.name || 'Unknown',
    url: source.url || '',
    category: source.category,
    description: source.description
  };
}

/**
 * Convert any article type to RSSArticle
 */
export function toRSSArticle(article: APIArticle | any): RSSArticle {
  if (!article) return {
    title: 'Unknown',
    link: '',
    author: 'Unknown',
    source: 'Unknown',
    publishDate: new Date().toISOString(),
    summary: '',
    categories: []
  };
  
  // Handle case where source might be a string or object
  let source: string | { name: string; url: string };
  
  if (typeof article.source === 'object' && article.source !== null) {
    source = {
      name: article.source.name || 'Unknown',
      url: article.source.url || ''
    };
  } else {
    source = article.source || 'Unknown';
  }
  
  return {
    title: article.title || 'Unknown',
    link: article.link || '',
    guid: article.guid,
    author: article.author || article.creator || 'Unknown',
    source,
    sourceUrl: article.sourceUrl || (typeof article.source === 'object' ? article.source.url : ''),
    sourceName: article.sourceName || (typeof article.source === 'object' ? article.source.name : article.source),
    sourceLogoUrl: article.sourceLogoUrl,
    publishDate: article.publishDate || article.pubDate || new Date().toISOString(),
    pubDate: article.pubDate || article.publishDate,
    summary: article.summary || article.description || '',
    content: article.content || '',
    contentSnippet: article.contentSnippet || '',
    imageUrl: article.imageUrl || '',
    categories: Array.isArray(article.categories) ? article.categories : [],
    isRead: article.isRead || false,
    isSaved: article.isSaved || false,
    creator: article.creator || article.author
  };
}

/**
 * Extracted content from an article source
 */
export interface ExtractedContent {
  id?: string;
  content: string;
  metadata?: {
    title?: string;
    byline?: string;
    siteName?: string;
    date?: string;
    url?: string;
    excerpt?: string;
    imageUrl?: string;
  };
  darkPatterns?: any[];
  timestamp?: number;
}

// Add new types for multi-dimensional bias analysis

// Enhanced bias dimensions for more nuanced analysis
export enum BiasDimension {
  POLITICAL = 'political',
  ECONOMIC = 'economic',
  SOCIAL = 'social',
  IDENTITY = 'identity',
  GEOPOLITICAL = 'geopolitical',
  EPISTEMOLOGICAL = 'epistemological'
}

// Existing BiasType (for backward compatibility)
export enum BiasType {
  LEFT_STRONG = 'LEFT_STRONG',
  LEFT_MODERATE = 'LEFT_MODERATE',
  CENTER = 'CENTER',
  RIGHT_MODERATE = 'RIGHT_MODERATE',
  RIGHT_STRONG = 'RIGHT_STRONG'
}

// Multi-dimensional bias rating system
export interface BiasRating {
  value: number; // -1.0 to 1.0 scale where 0 is neutral
  confidence: number; // 0.0 to 1.0
  evidence: string[]; // Text evidence for this rating
}

// Complete multi-dimensional bias analysis
export interface MultidimensionalBias {
  political: BiasRating; // Traditional left-right spectrum
  economic: BiasRating; // State intervention vs free market
  social: BiasRating; // Progressive vs traditional
  identity: BiasRating; // Identity politics sensitivity
  geopolitical: BiasRating; // International relations perspective
  epistemological: BiasRating; // How sources of truth are treated
  overallBias: BiasType; // Legacy compatibility
  confidence: number; // Overall confidence in the analysis
}

// Dark pattern detection
export enum DarkPatternType {
  FORCED_CONTINUITY = 'forced_continuity',
  HIDDEN_COSTS = 'hidden_costs',
  TRICK_QUESTIONS = 'trick_questions',
  MISDIRECTION = 'misdirection',
  CONFIRMSHAMING = 'confirmshaming',
  DISGUISED_ADS = 'disguised_ads',
  SCARCITY = 'scarcity',
  SOCIAL_PROOF = 'social_proof',
  URGENCY = 'urgency',
  ROACH_MOTEL = 'roach_motel'
}

export interface DarkPatternDetection {
  type: DarkPatternType;
  confidence: number;
  description: string;
  elementType?: string;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshot?: string;
}

export interface DarkPatternAnalysisResult {
  patternCount: number;
  patterns: DarkPatternDetection[];
  manipulationScore: number;
  feedbackRequired: boolean;
}

// Rhetoric and persuasion techniques
export enum RhetoricType {
  ETHOS = 'ethos', // Appeal to authority/credibility
  PATHOS = 'pathos', // Appeal to emotion
  LOGOS = 'logos', // Appeal to logic
  KAIROS = 'kairos' // Appeal to timeliness/opportunity
}

export interface RhetoricAnalysis {
  primary: RhetoricType;
  secondary?: RhetoricType;
  techniques: string[];
  effectiveness: number; // 0.0 to 1.0
  examples: string[];
}

// Passage-level analysis
export interface ArticlePassage {
  text: string;
  element?: string; // HTML element type (p, h1, blockquote, etc)
  startIndex: number;
  endIndex: number;
  analyses: PassageAnalysis | null;
}

export interface PassageAnalysis {
  bias?: MultidimensionalBias;
  rhetoric?: RhetoricAnalysis;
  manipulation?: {
    score: number;
    tactics: string[];
  };
  darkPatterns?: DarkPatternDetection[];
  keyEntities?: string[];
}

// "Virgil" AI chat system for guiding users through analysis
export interface VirgileMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  relatedPassage?: string;
  relatedAnalysis?: any;
}

export interface VirgileSession {
  id: string;
  articleId: string;
  messages: VirgileMessage[];
  created: number;
  updated: number;
}

// Article metadata type
export interface ArticleMetadata {
  wordCount: number;
  readingTimeMinutes: number;
  sentenceCount: number;
  paragraphCount: number;
  externalLinks: string[] | { url: string; text: string }[];
  sourceCitations: string[] | { source: string; text: string }[];
  mainEntities: string[];
  entities?: string[];
  keyphrases: string[];
  complexityScore: number; // 0.0 to 1.0
  avgSentenceLength: number;
  longWordPercentage: number;
  mainPoint?: string; // Summarized main point of the article
  agenda?: string; // Detected agenda or purpose
  affiliation?: string; // Detected political/organization affiliation
  readingLevel?: string; // Text reading level (Elementary, Middle School, etc.)
} 