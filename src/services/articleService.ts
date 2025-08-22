/**
 * Reliable Article Service with Local Storage Fallback
 * 
 * This service provides multiple fallback mechanisms to ensure articles
 * are always available, even when the backend is down.
 */

import { API_BASE_URL } from '../config/api.config';

export interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  content: string;
  analysis?: {
    wordCount: number;
    readingTime: number;
    summary: string;
    credibility: { score: number; level: string; reason: string };
    logicalFallacies?: Array<{ type: string; explanation: string; excerpt?: string; confidence: number }>;
    biasAnalysis?: { direction: 'left' | 'right' | 'center'; confidence: number; explanation: string; indicators: { left: number; right: number } };
    networkAnalysis?: { topEntities: Array<{ name: string; count: number }>; entityCount: number };
    timestamp: string;
  };
  articleId: string;
  source: string;
  sourceCategory: string;
}

// Cached fallback articles for when backend is unavailable
const FALLBACK_ARTICLES: Article[] = [
  {
    title: "AI Breakthrough: GPT-5 Achieves Human-Level Reasoning",
    link: "https://example.com/ai-breakthrough",
    description: "OpenAI announces significant progress in artificial intelligence capabilities",
    pubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    author: "Tech Reporter",
    content: "OpenAI announced today that GPT-5 has achieved human-level reasoning capabilities. The new model scored 95% on standardized intelligence tests, surpassing previous benchmarks. According to the study, GPT-5 can now solve complex problems that previously required human experts. This breakthrough represents a significant milestone in artificial intelligence development.",
    articleId: "fallback-1",
    source: "Tech News Daily",
    sourceCategory: "technology",
    analysis: {
      wordCount: 45,
      readingTime: 1,
      summary: "OpenAI's GPT-5 shows significant improvements in reasoning capabilities",
      credibility: { score: 0.7, level: "medium", reason: "Company announcement with limited independent verification" },
      timestamp: new Date().toISOString()
    }
  },
  {
    title: "Researchers Question AI Claims",
    link: "https://example.com/ai-skepticism",
    description: "Independent researchers challenge recent AI breakthrough claims",
    pubDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    author: "Science Writer",
    content: "Leading AI researchers are disputing claims that GPT-5 has achieved human-level reasoning. Independent testing shows the model scored only 72% on intelligence tests, not the 95% claimed. Experts say the methodology used in the original study was flawed. This controversy highlights the need for more rigorous AI evaluation standards.",
    articleId: "fallback-2",
    source: "Science Review",
    sourceCategory: "technology",
    analysis: {
      wordCount: 52,
      readingTime: 2,
      summary: "AI researchers dispute recent breakthrough claims, calling for better evaluation standards",
      credibility: { score: 0.8, level: "high", reason: "Independent research with peer review" },
      timestamp: new Date().toISOString()
    }
  },
  {
    title: "Climate Change Study Shows Temperature Increases",
    link: "https://example.com/climate-study",
    description: "New research indicates significant global temperature changes",
    pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    author: "Environmental Reporter",
    content: "A comprehensive study published in Nature shows that global temperatures have increased by 2.5% over the past decade. Scientists from leading universities confirm these findings. The research indicates significant climate change impacts that require immediate attention from policymakers worldwide.",
    articleId: "fallback-3",
    source: "Environmental Journal",
    sourceCategory: "environment",
    analysis: {
      wordCount: 38,
      readingTime: 1,
      summary: "Study confirms significant global temperature increases over the past decade",
      credibility: { score: 0.9, level: "high", reason: "Peer-reviewed research in reputable journal" },
      timestamp: new Date().toISOString()
    }
  },
  {
    title: "Economic Recovery Shows Mixed Results",
    link: "https://example.com/economic-recovery",
    description: "Latest economic data reveals uneven recovery patterns",
    pubDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    author: "Economics Correspondent",
    content: "The latest economic indicators show a mixed picture of recovery. While employment numbers are improving, inflation remains a concern. The Federal Reserve's latest report indicates that while some sectors are thriving, others continue to struggle. This uneven recovery pattern suggests the need for targeted economic policies.",
    articleId: "fallback-4",
    source: "Economic Times",
    sourceCategory: "economy",
    analysis: {
      wordCount: 48,
      readingTime: 2,
      summary: "Economic recovery shows mixed results with employment gains but inflation concerns",
      credibility: { score: 0.8, level: "high", reason: "Official economic data and expert analysis" },
      timestamp: new Date().toISOString()
    }
  },
  {
    title: "Healthcare System Faces Challenges",
    link: "https://example.com/healthcare-challenges",
    description: "Healthcare providers report ongoing challenges in service delivery",
    pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    author: "Health Reporter",
    content: "Healthcare providers across the country are reporting significant challenges in maintaining service quality. Staff shortages, increased patient loads, and rising costs are creating pressure on the system. Experts warn that without intervention, these issues could impact patient care quality.",
    articleId: "fallback-5",
    source: "Health News",
    sourceCategory: "health",
    analysis: {
      wordCount: 42,
      readingTime: 2,
      summary: "Healthcare system faces multiple challenges including staff shortages and rising costs",
      credibility: { score: 0.7, level: "medium", reason: "Industry reports with expert commentary" },
      timestamp: new Date().toISOString()
    }
  }
];

// Local storage keys
const STORAGE_KEYS = {
  CACHED_ARTICLES: 'authentic_reader_cached_articles',
  LAST_FETCH: 'authentic_reader_last_fetch',
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
};

class ArticleService {
  private cache: Map<string, Article[]> = new Map();
  private lastFetchTime: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Get articles with multiple fallback mechanisms
   */
  async getArticles(categories: string[] = ['far-left', 'left', 'center', 'right', 'far-right'], limit: number = 50): Promise<Article[]> {
    try {
      // Try backend first
      const backendArticles = await this.fetchFromBackend(categories, limit);
      if (backendArticles.length > 0) {
        this.cacheArticles(backendArticles);
        return backendArticles;
      }
    } catch (error) {
      console.warn('Backend fetch failed, trying cached articles:', error);
    }

    // Try cached articles
    const cachedArticles = this.getCachedArticles();
    if (cachedArticles.length > 0) {
      console.log('Using cached articles');
      return this.filterArticlesByCategories(cachedArticles, categories, limit);
    }

    // Only use fallback articles as absolute last resort
    console.log('No backend or cached articles available, using minimal fallback');
    const minimalFallback = FALLBACK_ARTICLES.slice(0, 2); // Only show 2 fallback articles as last resort
    return this.filterArticlesByCategories(minimalFallback, categories, limit);
  }

  /**
   * Fetch articles from backend
   */
  private async fetchFromBackend(categories: string[], limit: number): Promise<Article[]> {
    const url = `${API_BASE_URL}/api/balanced-feed?categories=${categories.join(',')}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.articles || [];
  }

  /**
   * Cache articles in memory and local storage
   */
  private cacheArticles(articles: Article[]): void {
    this.cache.set('all', articles);
    this.lastFetchTime = Date.now();
    
    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_ARTICLES, JSON.stringify(articles));
      localStorage.setItem(STORAGE_KEYS.LAST_FETCH, this.lastFetchTime.toString());
    } catch (error) {
      console.warn('Failed to cache articles in localStorage:', error);
    }
  }

  /**
   * Get cached articles from memory or storage
   */
  private getCachedArticles(): Article[] {
    // Check memory cache first
    const memoryCache = this.cache.get('all');
    if (memoryCache && this.isCacheValid()) {
      return memoryCache;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHED_ARTICLES);
      const lastFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
      
      if (stored && lastFetch) {
        const articles = JSON.parse(stored);
        const lastFetchTime = parseInt(lastFetch);
        
        if (Date.now() - lastFetchTime < STORAGE_KEYS.CACHE_DURATION) {
          this.cache.set('all', articles);
          this.lastFetchTime = lastFetchTime;
          return articles;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached articles from localStorage:', error);
    }

    return [];
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastFetchTime < STORAGE_KEYS.CACHE_DURATION;
  }

  /**
   * Filter articles by categories
   */
  private filterArticlesByCategories(articles: Article[], categories: string[], limit: number): Article[] {
    if (categories.includes('all')) {
      return articles.slice(0, limit);
    }

    const filtered = articles.filter(article => 
      categories.includes(article.sourceCategory)
    );

    return filtered.slice(0, limit);
  }

  /**
   * Load articles from storage on initialization
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHED_ARTICLES);
      const lastFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
      
      if (stored && lastFetch) {
        const articles = JSON.parse(stored);
        const lastFetchTime = parseInt(lastFetch);
        
        this.cache.set('all', articles);
        this.lastFetchTime = lastFetchTime;
      }
    } catch (error) {
      console.warn('Failed to load articles from storage:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetchTime = 0;
    
    try {
      localStorage.removeItem(STORAGE_KEYS.CACHED_ARTICLES);
      localStorage.removeItem(STORAGE_KEYS.LAST_FETCH);
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCache: boolean; isValid: boolean; lastFetch: number } {
    const hasCache = this.cache.has('all') || this.getCachedArticles().length > 0;
    const isValid = this.isCacheValid();
    
    return {
      hasCache,
      isValid,
      lastFetch: this.lastFetchTime
    };
  }

  /**
   * Get fallback articles for testing
   */
  getFallbackArticles(): Article[] {
    return [...FALLBACK_ARTICLES];
  }
}

// Export singleton instance
export const articleService = new ArticleService();

// Export types
export type { Article };
