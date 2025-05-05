// Central type definitions file for the application

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
  summary?: string;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  topics?: string[];
  readabilityScore?: number;
  factualityScore?: number;
  politicalBias?: {
    score: number;
    label: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
  };
  keyPoints?: string[];
  createdAt?: string;
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
 * Result from content extraction API
 */
export interface ExtractedContent {
  title: string; 
  content: string; 
  textContent: string; 
  length: number; 
  excerpt: string; 
  byline: string | null;
} 