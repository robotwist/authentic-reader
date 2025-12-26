import cron from 'node-cron';
import jsonArticleService from './jsonArticleService.js';
import { nlpAnalysisService } from '../services/nlpAnalysisService.js';
import logger from '../utils/logger.js';

/**
 * Article Stockpile Service
 * 
 * Automatically fetches articles from RSS feeds every 15 minutes,
 * pre-analyzes them with NLP/ML, and stores everything for instant retrieval.
 * This provides the core functionality for a real-time news reader.
 */
class ArticleStockpileService {
  constructor() {
    this.isRunning = false;
    this.lastFetchTime = null;
    this.fetchInterval = 15 * 60 * 1000; // 15 minutes
    this.maxArticlesPerSource = 20;
    this.analysisQueue = [];
    this.isAnalyzing = false;
    this.stats = {
      totalFetched: 0,
      totalAnalyzed: 0,
      lastFetchTime: null,
      errors: 0,
      sourcesProcessed: 0
    };
  }

  /**
   * Initialize the stockpile service
   */
  async initialize() {
    try {
      await jsonArticleService.initialize();
      logger.info('ArticleStockpileService initialized');
      
      // Start the background fetching
      this.startBackgroundFetching();
      
      // Do an initial fetch if no articles exist
      const existingArticles = await jsonArticleService.loadExistingArticles();
      if (existingArticles.length === 0) {
        logger.info('No existing articles found, performing initial fetch...');
        await this.fetchAllArticles();
      }
      
    } catch (error) {
      logger.error('Error initializing ArticleStockpileService:', error);
      throw error;
    }
  }

  /**
   * Start background fetching with cron job
   */
  startBackgroundFetching() {
    if (this.isRunning) {
      logger.warn('Background fetching already running');
      return;
    }

    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('Starting scheduled article fetch...');
        await this.fetchAllArticles();
      } catch (error) {
        logger.error('Error in scheduled fetch:', error);
        this.stats.errors++;
      }
    });

    this.isRunning = true;
    logger.info('Background article fetching started (every 15 minutes)');
  }

  /**
   * Stop background fetching
   */
  stopBackgroundFetching() {
    this.isRunning = false;
    logger.info('Background article fetching stopped');
  }

  /**
   * Fetch articles from all sources
   */
  async fetchAllArticles() {
    const startTime = Date.now();
    logger.info('Starting article fetch from all sources...');

    try {
      const sources = jsonArticleService.getSources();
      if (!sources || sources.length === 0) {
        logger.warn('No sources configured');
        return { success: false, message: 'No sources configured' };
      }

      let totalFetched = 0;
      let totalErrors = 0;

      // Process sources in batches to avoid overwhelming
      const batchSize = 3;
      for (let i = 0; i < sources.length; i += batchSize) {
        const batch = sources.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (source) => {
          try {
            const articles = await this.fetchFromSource(source);
            totalFetched += articles.length;
            this.stats.sourcesProcessed++;
            
            // Queue articles for analysis
            for (const article of articles) {
              this.queueForAnalysis(article);
            }
            
            return articles;
          } catch (error) {
            logger.error(`Error fetching from ${source.name}:`, error.message);
            totalErrors++;
            return [];
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches
        if (i + batchSize < sources.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.stats.totalFetched += totalFetched;
      this.stats.lastFetchTime = new Date().toISOString();
      this.lastFetchTime = new Date();

      const duration = Date.now() - startTime;
      logger.info(`Article fetch completed: ${totalFetched} articles fetched in ${duration}ms`);

      // Start analysis processing
      this.processAnalysisQueue();

      return {
        success: true,
        articlesFetched: totalFetched,
        sourcesProcessed: sources.length,
        errors: totalErrors,
        duration
      };

    } catch (error) {
      logger.error('Error in fetchAllArticles:', error);
      this.stats.errors++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch articles from a specific source
   */
  async fetchFromSource(source) {
    try {
      logger.info(`Fetching articles from ${source.name}...`);
      
      const articles = await jsonArticleService.fetchFromSource(source, this.maxArticlesPerSource);
      
      logger.info(`Fetched ${articles.length} articles from ${source.name}`);
      return articles;
      
    } catch (error) {
      logger.error(`Error fetching from ${source.name}:`, error);
      throw error;
    }
  }

  /**
   * Queue article for analysis
   */
  queueForAnalysis(article) {
    // Check if article already has analysis
    if (article.analysis) {
      return;
    }

    // Add to queue
    this.analysisQueue.push({
      article,
      timestamp: Date.now(),
      attempts: 0
    });

    logger.debug(`Queued article for analysis: ${article.title}`);
  }

  /**
   * Process analysis queue
   */
  async processAnalysisQueue() {
    if (this.isAnalyzing || this.analysisQueue.length === 0) {
      return;
    }

    this.isAnalyzing = true;
    logger.info(`Processing analysis queue: ${this.analysisQueue.length} articles`);

    try {
      // Process articles in batches
      const batchSize = 5;
      while (this.analysisQueue.length > 0) {
        const batch = this.analysisQueue.splice(0, batchSize);
        
        const batchPromises = batch.map(async (queueItem) => {
          try {
            await this.analyzeArticle(queueItem.article);
            this.stats.totalAnalyzed++;
          } catch (error) {
            logger.error(`Error analyzing article ${queueItem.article.title}:`, error);
            
            // Retry logic
            queueItem.attempts++;
            if (queueItem.attempts < 3) {
              this.analysisQueue.push(queueItem);
            }
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches
        if (this.analysisQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

    } catch (error) {
      logger.error('Error processing analysis queue:', error);
    } finally {
      this.isAnalyzing = false;
      logger.info('Analysis queue processing completed');
    }
  }

  /**
   * Analyze article with NLP/ML service
   */
  async analyzeArticle(article) {
    try {
      // Check if analysis already exists
      const existingAnalysis = await jsonArticleService.getArticleAnalysis(article.id);
      if (existingAnalysis) {
        logger.debug(`Analysis already exists for article: ${article.title}`);
        return existingAnalysis;
      }

      logger.info(`Analyzing article: ${article.title}`);

      // Perform NLP/ML analysis
      const analysis = await nlpAnalysisService.analyzeArticle(article);
      
      // Save analysis
      await jsonArticleService.saveArticleAnalysis(article.id, analysis);
      
      logger.info(`Analysis completed for: ${article.title}`);
      return analysis;

    } catch (error) {
      logger.error(`Error analyzing article ${article.title}:`, error);
      throw error;
    }
  }

  /**
   * Get articles with filters and pagination
   */
  async getArticles(filters = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        categories = [],
        sources = [],
        biasRatings = [],
        includeAnalysis = true,
        searchQuery = ''
      } = filters;

      let result;

      if (searchQuery) {
        result = await jsonArticleService.searchArticles(searchQuery, {
          limit,
          offset,
          categories,
          sources,
          biasRatings,
          includeAnalysis
        });
      } else {
        result = await jsonArticleService.getArticles({
          limit,
          offset,
          categories,
          sources,
          biasRatings,
          includeAnalysis
        });
      }

      return {
        ...result,
        lastFetchTime: this.stats.lastFetchTime,
        totalAnalyzed: this.stats.totalAnalyzed,
        analysisQueueSize: this.analysisQueue.length
      };

    } catch (error) {
      logger.error('Error getting articles:', error);
      throw error;
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(id) {
    try {
      const article = await jsonArticleService.getArticleById(id);
      if (!article) {
        return null;
      }

      // Ensure analysis is loaded
      if (!article.analysis) {
        article.analysis = await jsonArticleService.getArticleAnalysis(id);
      }

      return article;
    } catch (error) {
      logger.error(`Error getting article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  async getStats() {
    try {
      const jsonStats = await jsonArticleService.getStats();
      
      return {
        ...this.stats,
        ...jsonStats,
        isRunning: this.isRunning,
        isAnalyzing: this.isAnalyzing,
        analysisQueueSize: this.analysisQueue.length,
        lastFetchTime: this.lastFetchTime,
        uptime: this.lastFetchTime ? Date.now() - this.lastFetchTime.getTime() : 0
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      return this.stats;
    }
  }

  /**
   * Force refresh all articles
   */
  async forceRefresh() {
    logger.info('Force refresh requested');
    return await this.fetchAllArticles();
  }

  /**
   * Get sources
   */
  getSources() {
    return jsonArticleService.getSources();
  }

  /**
   * Add new source
   */
  async addSource(source) {
    try {
      // This would need to be implemented in jsonArticleService
      logger.info(`Adding new source: ${source.name}`);
      // Implementation would go here
      return { success: true, source };
    } catch (error) {
      logger.error('Error adding source:', error);
      throw error;
    }
  }

  /**
   * Remove source
   */
  async removeSource(sourceId) {
    try {
      logger.info(`Removing source: ${sourceId}`);
      // Implementation would go here
      return { success: true };
    } catch (error) {
      logger.error('Error removing source:', error);
      throw error;
    }
  }

  /**
   * Get analysis queue status
   */
  getAnalysisQueueStatus() {
    return {
      queueSize: this.analysisQueue.length,
      isProcessing: this.isAnalyzing,
      oldestItem: this.analysisQueue.length > 0 ? 
        new Date(this.analysisQueue[0].timestamp) : null
    };
  }

  /**
   * Clear analysis queue
   */
  clearAnalysisQueue() {
    const cleared = this.analysisQueue.length;
    this.analysisQueue = [];
    logger.info(`Cleared ${cleared} items from analysis queue`);
    return { cleared };
  }
}

export default new ArticleStockpileService();