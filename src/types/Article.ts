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