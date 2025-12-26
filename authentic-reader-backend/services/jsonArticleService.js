import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import logger from '../utils/logger.js';
import rssService from './rssService.js';
import { RSS_CONFIG, CREDIBILITY_RATINGS, BIAS_RATINGS } from '../config/rssConfig.js';
import enhancedAIAnalysisService from './enhancedAIAnalysisService.js';

/**
 * JSON-based Article Service
 * 
 * This service manages articles using JSON file storage as per memory requirements.
 * It provides efficient article retrieval, analysis, and caching.
 */
class JsonArticleService {
  constructor() {
    this.dataDir = path.join(process.cwd(), '..', 'data');
    this.articlesFile = path.join(this.dataDir, 'articles.json');
    this.analysisFile = path.join(this.dataDir, 'analysis.json');
    this.sourcesFile = path.join(this.dataDir, 'sources.json');
    this.cache = new Map();
    this.cacheTimeout = RSS_CONFIG.CACHE_TIMEOUT;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      await this.ensureDataDirectory();
      await this.loadSources();
      logger.info('JsonArticleService initialized');
    } catch (error) {
      logger.error('Error initializing JsonArticleService:', error);
      throw error;
    }
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  /**
   * Load sources from JSON file
   */
  async loadSources() {
    try {
      const data = await fs.readFile(this.sourcesFile, 'utf8');
      this.sources = JSON.parse(data);
      logger.info(`Loaded ${Object.keys(this.sources).length} sources`);
    } catch (error) {
      logger.error('Error loading sources:', error);
      this.sources = {};
    }
  }

  /**
   * Get all sources
   */
  getSources() {
    return Object.values(this.sources);
  }

  /**
   * Get source by key
   */
  getSource(key) {
    return this.sources[key];
  }

  /**
   * Fetch articles from all sources
   */
  async fetchAllArticles(options = {}) {
    const {
      maxArticlesPerSource = 10,
      includeAnalysis = true,
      categories = [],
      biasRatings = []
    } = options;

    const allArticles = [];
    const sourceKeys = Object.keys(this.sources);
    
    // Process sources in batches to avoid overwhelming
    const batchSize = RSS_CONFIG.DEFAULT_BATCH_SIZE;
    for (let i = 0; i < sourceKeys.length; i += batchSize) {
      const batch = sourceKeys.slice(i, i + batchSize);
      const batchPromises = batch.map(async (sourceKey) => {
        try {
          const source = this.sources[sourceKey];
          
          // Filter by category if specified
          if (categories.length > 0 && !categories.includes(source.category)) {
            return [];
          }
          
          // Filter by bias rating if specified
          if (biasRatings.length > 0 && !biasRatings.includes(source.biasRating)) {
            return [];
          }

          const articles = await this.fetchFromSource(source, maxArticlesPerSource);
          return articles;
        } catch (error) {
          logger.error(`Error fetching from source ${sourceKey}:`, error.message);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allArticles.push(...batchResults.flat());
    }

    // Sort by publish date (newest first)
    allArticles.sort((a, b) => {
      const dateB = new Date(b.publishedAt || b.publishDate || 0).getTime();
      const dateA = new Date(a.publishedAt || a.publishDate || 0).getTime();
      return dateB - dateA;
    });

    // Add analysis if requested
    if (includeAnalysis) {
      for (const article of allArticles) {
        article.analysis = await this.getArticleAnalysis(article.id);
      }
    }

    return allArticles;
  }

  /**
   * Fetch articles from a specific source using RSS service
   */
  async fetchFromSource(source, maxArticles = RSS_CONFIG.DEFAULT_MAX_ARTICLES_PER_SOURCE) {
    try {
      logger.info(`Fetching from ${source.name}...`);
      
      // Use centralized RSS service instead of duplicating logic
      const feedData = await rssService.fetchFeed(source.url, {
        timeout: RSS_CONFIG.LONG_TIMEOUT,
        maxItems: maxArticles,
        useCache: true
      });

      const articles = [];

      for (const item of feedData.items.slice(0, maxArticles)) {
        try {
          // Use RSS service's normalizeItem for consistent formatting
          const normalized = rssService.normalizeItem(item, source.name);
          const article = await this.processNormalizedItem(normalized, source);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          logger.error(`Error processing article from ${source.name}:`, error.message);
        }
      }

      logger.info(`Fetched ${articles.length} articles from ${source.name}`);
      return articles;
    } catch (error) {
      logger.error(`Error fetching from ${source.name}:`, error.message);
      return [];
    }
  }

  /**
   * Process normalized RSS item into article format
   * This replaces the old processArticleItem method to work with rssService's normalized items
   */
  async processNormalizedItem(normalized, source) {
    // Check if article already exists
    const existingArticles = await this.loadArticles();
    if (existingArticles[normalized.guid]) {
      return null; // Skip if already exists
    }

    // Try to fetch full article content if we have a link and content is short
    let fullContent = normalized.content;
    if (normalized.link && fullContent.length < RSS_CONFIG.SHORT_CONTENT_THRESHOLD) {
      try {
        const contentResponse = await axios.get(normalized.link, {
          timeout: RSS_CONFIG.CONTENT_FETCH_TIMEOUT,
          headers: {
            'User-Agent': RSS_CONFIG.USER_AGENT
          }
        });
        
        // Extract main content from HTML
        const htmlContent = contentResponse.data;
        const contentMatch = htmlContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                            htmlContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                            htmlContent.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        
        if (contentMatch && contentMatch[1]) {
          const extractedContent = contentMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          if (extractedContent.length > fullContent.length) {
            fullContent = extractedContent;
          }
        }
      } catch (contentError) {
        logger.debug(`Could not fetch full content for ${normalized.link}:`, contentError.message);
      }
    }

    // Create article object with proper structure
    const article = {
      id: normalized.guid,
      title: normalized.title,
      url: normalized.link,
      author: normalized.author,
      publishedAt: new Date(normalized.publishDate).toISOString(),
      content: fullContent,
      summary: normalized.description,
      source: {
        name: source.name,
        category: source.category,
        biasRating: source.biasRating,
        reliability: source.reliability
      },
      category: source.category || 'general',
      categories: normalized.categories && normalized.categories.length > 0 
        ? normalized.categories 
        : (source.category ? [source.category] : ['general']),
      wordCount: this.estimateWordCount(fullContent),
      complexity: this.assessComplexity({ content: fullContent, title: normalized.title }),
      tags: normalized.categories || [],
      credibility: this.assessCredibility(source.name),
      bias: this.assessBias(source.name),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Save article
    await this.saveArticle(article);

    // Automatically analyze article in background (non-blocking)
    // Analysis will be stored and available to all users
    // Use setTimeout to ensure this doesn't block the response
    setTimeout(() => {
      this.analyzeArticle(article).catch(error => {
        logger.error(`Background analysis failed for article ${article.id}:`, error);
        // Don't throw - article is still saved even if analysis fails
      });
    }, 0);

    return article;
  }


  /**
   * Estimate word count from content
   */
  estimateWordCount(content) {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Assess article complexity
   */
  assessComplexity(item) {
    const content = item.content || '';
    const wordCount = this.estimateWordCount(content);
    
    if (wordCount > RSS_CONFIG.LONG_CONTENT_THRESHOLD) return 'high';
    if (wordCount > RSS_CONFIG.SHORT_CONTENT_THRESHOLD) return 'medium';
    return 'low';
  }


  /**
   * Assess source credibility
   */
  assessCredibility(sourceName) {
    return CREDIBILITY_RATINGS[sourceName] || 'medium';
  }

  /**
   * Assess source bias
   */
  assessBias(sourceName) {
    return BIAS_RATINGS[sourceName] || 'center';
  }

  /**
   * Load articles from JSON file
   */
  async loadArticles() {
    try {
      const data = await fs.readFile(this.articlesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.debug('No articles file found, starting fresh');
      return {};
    }
  }

  /**
   * Load existing articles as an array
   */
  async loadExistingArticles() {
    try {
      const articlesData = await this.loadArticles();
      return Object.values(articlesData);
    } catch (error) {
      logger.debug('No existing articles found');
      return [];
    }
  }

  /**
   * Save article to JSON file
   */
  async saveArticle(article) {
    try {
      const articles = await this.loadArticles();
      articles[article.id] = article;
      await fs.writeFile(this.articlesFile, JSON.stringify(articles, null, 2));
    } catch (error) {
      logger.error('Error saving article:', error);
    }
  }

  /**
   * Get article analysis
   */
  async getArticleAnalysis(articleId) {
    // Check cache first
    const cacheKey = `analysis_${articleId}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const data = await fs.readFile(this.analysisFile, 'utf8');
      const analyses = JSON.parse(data);
      const analysis = analyses[`analysis_${articleId}`];
      
      if (analysis) {
        // Cache the result
        this.cache.set(cacheKey, {
          data: analysis,
          timestamp: Date.now()
        });
        return analysis;
      }
    } catch (error) {
      logger.debug('No analysis file found or error reading it');
    }

    return null;
  }

  /**
   * Save article analysis
   */
  async saveArticleAnalysis(articleId, analysis) {
    try {
      const analyses = await this.loadAnalyses();
      analyses[`analysis_${articleId}`] = {
        ...analysis,
        timestamp: new Date().toISOString()
      };
      await fs.writeFile(this.analysisFile, JSON.stringify(analyses, null, 2));
    } catch (error) {
      logger.error('Error saving analysis:', error);
    }
  }

  /**
   * Load analyses from JSON file
   */
  async loadAnalyses() {
    try {
      const data = await fs.readFile(this.analysisFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.debug('No analysis file found, starting fresh');
      return {};
    }
  }

  /**
   * Get articles with filters
   */
  async getArticles(filters = {}) {
    const {
      limit = 50,
      offset = 0,
      categories = [],
      sources = [],
      biasRatings = [],
      includeAnalysis = true
    } = filters;

    // First try to load existing articles from JSON file
    let articles = await this.loadExistingArticles();

    // If no articles exist, fetch from RSS feeds
    if (articles.length === 0) {
      articles = await this.fetchAllArticles({
        includeAnalysis,
        categories,
        biasRatings
      });
    }

    // Filter by categories if specified
    if (categories.length > 0) {
      articles = articles.filter(article => 
        article.categories.some(cat => categories.includes(cat))
      );
    }

    // Filter by sources if specified
    if (sources.length > 0) {
      articles = articles.filter(article => 
        sources.includes(article.source.name)
      );
    }

    // Filter by bias ratings if specified
    if (biasRatings.length > 0) {
      articles = articles.filter(article => 
        biasRatings.includes(article.source.biasRating)
      );
    }

    // Add analysis if requested
    if (includeAnalysis) {
      for (const article of articles) {
        if (!article.analysis) {
          article.analysis = await this.getArticleAnalysis(article.id);
        }
      }
    }

    // Sort by publish date (newest first)
    articles.sort((a, b) => {
      const dateB = new Date(b.publishedAt || b.publishDate || 0).getTime();
      const dateA = new Date(a.publishedAt || a.publishDate || 0).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedArticles = articles.slice(offset, offset + limit);

    return {
      articles: paginatedArticles,
      total: articles.length,
      hasMore: offset + limit < articles.length
    };
  }

  /**
   * Search articles
   */
  async searchArticles(query, filters = {}) {
    const { articles } = await this.getArticles(filters);
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return articles.filter(article => {
      const searchText = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  /**
   * Get article by ID
   */
  async getArticleById(id) {
    const articles = await this.loadArticles();
    const article = articles[id];
    
    if (article) {
      article.analysis = await this.getArticleAnalysis(id);
    }
    
    return article;
  }

  /**
   * Analyze article content using enhanced AI analysis service
   */
  async analyzeArticle(article) {
    try {
      // Check if analysis already exists
      const existingAnalysis = await this.getArticleAnalysis(article.id);
      if (existingAnalysis && existingAnalysis.version === '2.0.0-enhanced') {
        logger.info(`Enhanced analysis already exists for article: ${article.id}`);
        return existingAnalysis;
      }

      logger.info(`Starting enhanced AI analysis for article: ${article.title || article.id}`);

      // Use enhanced AI analysis service
      const enhancedAnalysis = await enhancedAIAnalysisService.analyzeArticle(article, {
        startTime: Date.now()
      });

      // Save enhanced analysis
      await this.saveArticleAnalysis(article.id, enhancedAnalysis);

      logger.info(`Enhanced AI analysis completed and saved for article: ${article.id}`);
      return enhancedAnalysis;

    } catch (error) {
      logger.error(`Error in enhanced analysis for article ${article.id}:`, error);
      
      // Fallback to basic analysis if enhanced fails
      logger.info('Falling back to basic analysis');
      const basicAnalysis = {
        wordCount: article.content ? article.content.split(/\s+/).length : 0,
        readingTime: article.content ? Math.ceil(article.content.split(/\s+/).length / RSS_CONFIG.WORDS_PER_MINUTE) : 0,
        hasExternalLinks: article.content ? (article.content.includes('http') || article.content.includes('www')) : false,
        complexity: this.analyzeComplexity(article.content || ''),
        keyTopics: this.extractKeyTopics(article.title, article.content || ''),
        credibility: this.assessBasicCredibility(article.link, article.title, article.content || ''),
        summary: this.generateBasicSummary(article.content || ''),
        biasIndicators: this.detectBiasIndicators(article.title, article.content || ''),
        logicalFallacies: this.detectLogicalFallacies(article.content || ''),
        bias: this.assessBiasDirection(article.title, article.content || ''),
        network: this.buildNetworkSummary(article.content || ''),
        timestamp: new Date().toISOString(),
        version: '1.0.0-basic',
        error: error.message
      };

      await this.saveArticleAnalysis(article.id, basicAnalysis);
      return basicAnalysis;
    }
  }

  /**
   * Analyze content complexity
   */
  analyzeComplexity(text) {
    if (!text) return 'easy';
    
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    if (avgSentenceLength > 25 || avgWordLength > 6) return 'hard';
    if (avgSentenceLength < 15 && avgWordLength < 5) return 'easy';
    return 'medium';
  }

  /**
   * Extract key topics
   */
  extractKeyTopics(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    const topics = [];
    
    const keywords = {
      'politics': ['election', 'vote', 'democrat', 'republican', 'congress', 'senate', 'president', 'government', 'policy'],
      'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'digital', 'computer', 'algorithm'],
      'health': ['health', 'medical', 'doctor', 'hospital', 'disease', 'vaccine', 'treatment'],
      'economy': ['economy', 'market', 'stock', 'business', 'finance', 'money', 'inflation'],
      'environment': ['climate', 'environment', 'green', 'pollution', 'sustainability'],
      'science': ['research', 'study', 'scientists', 'discovery', 'experiment'],
      'education': ['school', 'university', 'education', 'student', 'learning'],
      'entertainment': ['movie', 'music', 'celebrity', 'film', 'entertainment'],
      'sports': ['sport', 'football', 'basketball', 'baseball', 'athlete'],
      'international': ['world', 'global', 'international', 'foreign', 'diplomacy']
    };

    for (const [topic, words] of Object.entries(keywords)) {
      if (words.some(word => text.includes(word))) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }

  /**
   * Assess basic credibility
   */
  assessBasicCredibility(link, title, content) {
    const domain = link ? new URL(link).hostname.toLowerCase() : '';
    
    const highCredibility = ['bbc.com', 'reuters.com', 'ap.org', 'npr.org', 'nytimes.com', 'wsj.com'];
    const mediumCredibility = ['cnn.com', 'foxnews.com', 'abcnews.go.com', 'cbsnews.com'];
    
    let score = 0.5;
    let level = 'medium';
    let reason = 'Standard content';

    if (highCredibility.some(d => domain.includes(d))) {
      score = 0.8;
      level = 'high';
      reason = 'Established reputable source';
    } else if (mediumCredibility.some(d => domain.includes(d))) {
      score = 0.6;
      level = 'medium';
      reason = 'Mainstream news source';
    }

    // Adjust based on content quality
    if (content && content.length > 1000) {
      score += 0.1;
      reason += ', substantial content';
    }

    return { score: Math.min(1.0, score), level, reason };
  }

  /**
   * Generate basic summary
   */
  generateBasicSummary(content) {
    if (!content) return '';
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ').trim();
    return summary + (summary.length < content.length ? '...' : '');
  }

  /**
   * Detect bias indicators
   */
  detectBiasIndicators(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    const biasIndicators = {};

    const politicalWords = ['liberal', 'conservative', 'left-wing', 'right-wing', 'democrat', 'republican'];
    const political = politicalWords.filter(word => text.includes(word));
    if (political.length > 0) {
      biasIndicators.political = political;
    }

    return biasIndicators;
  }

  /**
   * Detect logical fallacies
   */
  detectLogicalFallacies(content) {
    if (!content) return [];
    
    const fallacies = [];
    const text = content.toLowerCase();

    // Simple fallacy detection patterns
    const adHominemPattern = /(personal attack|ad hominem|attacking the person)/i;
    if (adHominemPattern.test(text)) {
      fallacies.push({
        type: 'AD_HOMINEM',
        confidence: 0.7,
        explanation: 'Ad Hominem: Attacking the person instead of the argument.'
      });
    }

    return fallacies;
  }

  /**
   * Assess bias direction
   */
  assessBiasDirection(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    
    const leftIndicators = ['progressive', 'liberal', 'democrat', 'left-wing'];
    const rightIndicators = ['conservative', 'republican', 'right-wing', 'traditional'];
    
    const leftScore = leftIndicators.filter(word => text.includes(word)).length;
    const rightScore = rightIndicators.filter(word => text.includes(word)).length;
    
    if (leftScore > rightScore) {
      return { direction: 'left', confidence: Math.min(leftScore * 0.2, 1.0) };
    } else if (rightScore > leftScore) {
      return { direction: 'right', confidence: Math.min(rightScore * 0.2, 1.0) };
    }
    
    return { direction: 'neutral', confidence: 0.5 };
  }

  /**
   * Build network summary
   */
  buildNetworkSummary(content) {
    if (!content) return { entities: [], connections: [] };
    
    // Simple entity extraction
    const entities = [];
    const text = content.toLowerCase();
    
    const entityPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Names
      /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd)\b/g, // Companies
      /\b(?:USA|United States|America|China|Russia|Europe)\b/g // Countries
    ];
    
    entityPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.push(...matches);
      }
    });
    
    return {
      entities: [...new Set(entities)],
      connections: []
    };
  }

  /**
   * Decode HTML entities - using rssService's method for consistency
   */
  decodeHtmlEntities(text) {
    // Reuse the RSS service's HTML entity decoding for consistency
    if (!text) return '';
    return rssService.decodeHtmlEntities(text);
  }

  /**
   * Get service statistics
   */
  async getStats() {
    const articles = await this.loadArticles();
    const analyses = await this.loadAnalyses();
    
    return {
      totalArticles: Object.keys(articles).length,
      totalAnalyses: Object.keys(analyses).length,
      sources: Object.keys(this.sources).length,
      cacheSize: this.cache.size
    };
  }
}

export default new JsonArticleService();
