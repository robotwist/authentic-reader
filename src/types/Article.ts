/**
 * Interface representing an article source
 */
export interface Source {
  id?: string;
  name: string;
  url?: string;
  favicon?: string;
  description?: string;
  language?: string;
  country?: string;
  category?: string;
}

/**
 * Interface for fallacy analysis within an article
 */
export interface Fallacy {
  type: string;
  quote: string;
  why_it_matters: string;
  better_alternative: string;
  severity: string;
}

/**
 * Interface for rich LLM analysis data stored in Postgres
 */
export interface Analysis {
  summary: string;
  bias_rating: string; // "Left", "Center", "Right", etc.
  confidence_score: number;
  tone: string; // e.g., "Alarmist", "Neutral", "Informative"
  educational_insight: string; // The "Lesson"
  fallacies: Fallacy[];
}

/**
 * Interface representing an article in the system
 */
export interface Article {
  id: string;
  title?: string;
  url?: string;
  source?: Source | string;
  author?: string;
  summary?: string;
  content?: string;
  image?: string;
  publishedAt?: string;
  contentType?: string;
  categories?: string[];
  read?: boolean;
  saved?: boolean;
  hasFullContent?: boolean;
  sentiment?: {
    score: number;
    label: string;
  };
  analysis?: Analysis; // Rich LLM analysis payload from Postgres
}

/**
 * Interface for content analysis results
 */
export interface ContentAnalysis {
  sentiment: {
    score: number;
    label: string;
  };
  emotionalTone?: {
    joy: number;
    sadness: number;
    fear: number;
    disgust: number;
    anger: number;
  };
  topics?: string[];
  keywords?: string[];
  readability?: {
    score: number;
    level: string;
  };
  bias?: {
    score: number;
    direction: string;
  };
} 