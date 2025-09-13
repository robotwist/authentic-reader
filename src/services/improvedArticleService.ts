/**
 * Improved Article Service
 * 
 * This service provides enhanced article retrieval and analysis
 * using the improved backend API with JSON storage.
 */

export interface Article {
  id: string;
  title: string;
  link: string;
  description: string;
  summary: string;
  publishDate: string;
  author: string;
  content: string;
  source: {
    name: string;
    category: string;
    biasRating: string;
    reliability: string;
  };
  categories: string[];
  analysis?: {
    wordCount: number;
    readingTime: number;
    hasExternalLinks: boolean;
    complexity: string;
    keyTopics: string[];
    credibility: {
      score: number;
      level: string;
      reason: string;
    };
    summary: string;
    biasIndicators: Record<string, string[]>;
    logicalFallacies: Array<{
      type: string;
      confidence: number;
      explanation: string;
      excerpt?: string;
    }>;
    bias: {
      direction: string;
      confidence: number;
    };
    network: {
      entities: string[];
      connections: any[];
    };
    timestamp: string;
  };
  createdAt: string;
}

export interface Source {
  name: string;
  url: string;
  description: string;
  category: string;
  biasRating: string;
  reliability: string;
}

export interface FeedResponse {
  articles: Article[];
  metadata: {
    total: number;
    hasMore: boolean;
    limit: number;
    offset: number;
    filters: {
      categories: string[];
      sources: string[];
      biasRatings: string[];
    };
    timestamp: string;
  };
}

export interface SearchResponse {
  articles: Article[];
  query: string;
  total: number;
  timestamp: string;
}

class ImprovedArticleService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  /**
   * Get articles from the balanced feed
   */
  async getArticles(options: {
    limit?: number;
    offset?: number;
    categories?: string[];
    sources?: string[];
    biasRatings?: string[];
    includeAnalysis?: boolean;
  } = {}): Promise<FeedResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.categories?.length) params.append('categories', options.categories.join(','));
      if (options.sources?.length) params.append('sources', options.sources.join(','));
      if (options.biasRatings?.length) params.append('biasRatings', options.biasRatings.join(','));
      if (options.includeAnalysis !== undefined) params.append('includeAnalysis', options.includeAnalysis.toString());

      const response = await fetch(`${this.baseUrl}/feed/balanced-feed?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  }

  /**
   * Search articles
   */
  async searchArticles(query: string, options: {
    limit?: number;
    offset?: number;
    categories?: string[];
    sources?: string[];
    biasRatings?: string[];
  } = {}): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.categories?.length) params.append('categories', options.categories.join(','));
      if (options.sources?.length) params.append('sources', options.sources.join(','));
      if (options.biasRatings?.length) params.append('biasRatings', options.biasRatings.join(','));

      const response = await fetch(`${this.baseUrl}/feed/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  }

  /**
   * Get a single article by ID
   */
  async getArticleById(id: string): Promise<Article> {
    try {
      const response = await fetch(`${this.baseUrl}/feed/article/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Article not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }

  /**
   * Analyze an article
   */
  async analyzeArticle(id: string): Promise<{ analysis: Article['analysis'] }> {
    try {
      const response = await fetch(`${this.baseUrl}/feed/article/${id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing article:', error);
      throw error;
    }
  }

  /**
   * Get available sources
   */
  async getSources(): Promise<{ sources: Source[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/feed/sources`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sources:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    totalArticles: number;
    totalAnalyses: number;
    sources: number;
    cacheSize: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/feed/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Refresh articles from all sources
   */
  async refreshArticles(): Promise<{
    message: string;
    count: number;
    timestamp: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/feed/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error refreshing articles:', error);
      throw error;
    }
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(category: string, options: {
    limit?: number;
    offset?: number;
    includeAnalysis?: boolean;
  } = {}): Promise<FeedResponse> {
    return this.getArticles({
      ...options,
      categories: [category]
    });
  }

  /**
   * Get articles by source
   */
  async getArticlesBySource(source: string, options: {
    limit?: number;
    offset?: number;
    includeAnalysis?: boolean;
  } = {}): Promise<FeedResponse> {
    return this.getArticles({
      ...options,
      sources: [source]
    });
  }

  /**
   * Get articles by bias rating
   */
  async getArticlesByBiasRating(biasRating: string, options: {
    limit?: number;
    offset?: number;
    includeAnalysis?: boolean;
  } = {}): Promise<FeedResponse> {
    return this.getArticles({
      ...options,
      biasRatings: [biasRating]
    });
  }

  /**
   * Get balanced articles (mix of different bias ratings)
   */
  async getBalancedArticles(options: {
    limit?: number;
    offset?: number;
    includeAnalysis?: boolean;
  } = {}): Promise<FeedResponse> {
    return this.getArticles({
      ...options,
      biasRatings: ['center', 'center-left', 'center-right']
    });
  }

  /**
   * Get trending articles (most recent)
   */
  async getTrendingArticles(options: {
    limit?: number;
    includeAnalysis?: boolean;
  } = {}): Promise<FeedResponse> {
    return this.getArticles({
      ...options,
      limit: options.limit || 20
    });
  }

  /**
   * Get high-credibility articles
   */
  async getHighCredibilityArticles(options: {
    limit?: number;
    offset?: number;
    includeAnalysis?: boolean;
  } = {}): Promise<FeedResponse> {
    return this.getArticles({
      ...options,
      sources: ['NPR', 'BBC News', 'Reuters', 'Associated Press', 'Wall Street Journal', 'New York Times', 'The Guardian', 'The Economist']
    });
  }
}

export const improvedArticleService = new ImprovedArticleService();
export default improvedArticleService;
