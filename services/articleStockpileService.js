import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { Article, Analysis, Source } from '../models/index.js';
import comprehensiveAnalysis from './comprehensiveAnalysisService.js';
import { logger } from '../utils/logger.js';

/**
 * Article Stockpile Service
 * 
 * This service manages:
 * 1. RSS feed fetching and article storage
 * 2. Pre-analysis of all articles
 * 3. Database management for fast retrieval
 * 4. Analytics compilation
 * 5. User interaction tracking for analysis improvement
 */
class ArticleStockpileService {
  constructor() {
    this.isRunning = false;
    this.lastFetchTime = null;
    this.fetchInterval = 15 * 60 * 1000; // 15 minutes
    this.maxArticlesPerSource = 50;
    this.analysisQueue = [];
    this.isAnalyzing = false;
  }

  /**
   * Initialize the stockpile service
   */
  async initialize() {
    logger.info('Initializing Article Stockpile Service...');
    
    // Start the background fetch process
    this.startBackgroundFetch();
    
    // Start the analysis queue processor
    this.startAnalysisProcessor();
    
    logger.info('Article Stockpile Service initialized');
  }

  /**
   * Start background RSS fetching
   */
  startBackgroundFetch() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.fetchAndStockpile();
    
    // Set up recurring fetch
    setInterval(() => {
      this.fetchAndStockpile();
    }, this.fetchInterval);
  }

  /**
   * Main method to fetch RSS feeds and stockpile articles
   */
  async fetchAndStockpile() {
    try {
      logger.info('Starting RSS fetch and stockpile process...');
      
      // Get all active sources
      const sources = await Source.findAll({ where: { isActive: true } });
      logger.info(`Fetching from ${sources.length} sources`);
      
      const newArticles = [];
      
      // Fetch from each source
      for (const source of sources) {
        try {
          const articles = await this.fetchFromSource(source);
          newArticles.push(...articles);
          logger.info(`Fetched ${articles.length} articles from ${source.name}`);
        } catch (error) {
          logger.error(`Error fetching from ${source.name}:`, error.message);
        }
      }
      
      // Add new articles to analysis queue
      this.addToAnalysisQueue(newArticles);
      
      // Update last fetch time
      this.lastFetchTime = new Date();
      
      logger.info(`Stockpile process completed. ${newArticles.length} new articles queued for analysis`);
      
    } catch (error) {
      logger.error('Error in fetchAndStockpile:', error);
    }
  }

  /**
   * Fetch articles from a specific source
   */
  async fetchFromSource(source) {
    const response = await axios.get(source.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    const feed = await parseStringPromise(response.data);
    const items = feed.rss?.channel?.[0]?.item || feed.feed?.entry || [];
    
    const articles = [];
    
    for (const item of items.slice(0, this.maxArticlesPerSource)) {
      try {
        const article = await this.processArticleItem(item, source);
        if (article) {
          articles.push(article);
        }
      } catch (error) {
        logger.error(`Error processing article from ${source.name}:`, error.message);
      }
    }
    
    return articles;
  }

  /**
   * Process a single RSS item into an article
   */
  async processArticleItem(item, source) {
    const rawTitle = item.title?.[0] || item['media:title']?.[0] || '';
    const title = this.decodeHtmlEntities(rawTitle);
    const link = item.link?.[0] || item.link?.[0]?.$?.href || '';
    const rawDesc = item.description?.[0] || item.summary?.[0] || item['media:description']?.[0] || '';
    const description = this.decodeHtmlEntities(rawDesc).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
    const author = item.author?.[0] || item['dc:creator']?.[0] || source.name;
    const guid = item.guid?.[0] || item.id?.[0] || link;
    
    // Check if article already exists
    const existingArticle = await Article.findOne({ where: { guid } });
    if (existingArticle) {
      return null; // Skip if already exists
    }
    
    // Extract full content if available
    let fullContent = item['content:encoded']?.[0] || description;
    
    // Try to fetch full article content if we have a link
    if (link && fullContent.length < 1000) {
      try {
        const contentResponse = await axios.get(link, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
        logger.debug(`Could not fetch full content for ${link}:`, contentError.message);
      }
    }
    
    // Create article in database
    const article = await Article.create({
      title,
      link,
      author,
      publishDate: new Date(pubDate),
      content: fullContent,
      summary: description,
      guid,
      sourceId: source.id,
      categories: source.category ? [source.category] : []
    });
    
    return article;
  }

  /**
   * Add articles to analysis queue
   */
  addToAnalysisQueue(articles) {
    this.analysisQueue.push(...articles);
    logger.info(`Added ${articles.length} articles to analysis queue. Queue size: ${this.analysisQueue.length}`);
  }

  /**
   * Start the analysis queue processor
   */
  startAnalysisProcessor() {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    this.processAnalysisQueue();
  }

  /**
   * Process the analysis queue
   */
  async processAnalysisQueue() {
    while (this.isAnalyzing && this.analysisQueue.length > 0) {
      const article = this.analysisQueue.shift();
      
      try {
        await this.analyzeArticle(article);
        logger.debug(`Analyzed article: ${article.title}`);
      } catch (error) {
        logger.error(`Error analyzing article ${article.id}:`, error.message);
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Schedule next processing run
    if (this.isAnalyzing) {
      setTimeout(() => this.processAnalysisQueue(), 5000);
    }
  }

  /**
   * Analyze a single article comprehensively
   */
  async analyzeArticle(article) {
    const articleData = {
      articleId: article.id,
      title: article.title,
      content: article.content,
      description: article.summary,
      link: article.link,
      author: article.author,
      source: article.Source?.name || 'Unknown'
    };
    
    // Perform comprehensive analysis
    const analysis = await comprehensiveAnalysis.analyzeFullArticle(articleData);
    
    // Store analysis in database
    await Analysis.create({
      articleId: article.id,
      userId: null, // System analysis
      biasScore: analysis.biasDetection?.score || 0,
      biasDirection: analysis.biasDetection?.direction || 'neutral',
      sentiment: analysis.contentAnalysis?.sentiment || 0,
      entities: analysis.contentAnalysis?.entities || [],
      topKeywords: analysis.contentAnalysis?.keywords || [],
      readingLevel: analysis.contentAnalysis?.readingLevel || 'medium',
      clickbaitScore: analysis.credibilityAssessment?.clickbaitScore || 0,
      outrageBaitScore: analysis.credibilityAssessment?.outrageBaitScore || 0,
      summaryText: analysis.contentAnalysis?.summary || ''
    });
    
    return analysis;
  }

  /**
   * Get articles from stockpile with analysis
   */
  async getArticlesFromStockpile(options = {}) {
    const {
      limit = 50,
      categories = [],
      sources = [],
      offset = 0,
      includeAnalysis = true
    } = options;
    
    const whereClause = {};
    
    if (categories.length > 0) {
      whereClause.categories = {
        [Op.overlap]: categories
      };
    }
    
    if (sources.length > 0) {
      whereClause.sourceId = {
        [Op.in]: sources
      };
    }
    
    const queryOptions = {
      where: whereClause,
      limit,
      offset,
      order: [['publishDate', 'DESC']],
      include: [
        {
          model: Source,
          attributes: ['id', 'name', 'category', 'biasRating', 'reliability']
        }
      ]
    };
    
    if (includeAnalysis) {
      queryOptions.include.push({
        model: Analysis,
        where: { userId: null }, // System analysis
        required: false
      });
    }
    
    const articles = await Article.findAll(queryOptions);
    
    return articles.map(article => this.formatArticleForResponse(article));
  }

  /**
   * Format article for API response
   */
  formatArticleForResponse(article) {
    const formatted = {
      id: article.id,
      title: article.title,
      link: article.link,
      author: article.author,
      publishDate: article.publishDate,
      content: article.content,
      summary: article.summary,
      source: article.Source?.name || 'Unknown',
      sourceCategory: article.Source?.category || 'unknown',
      biasRating: article.Source?.biasRating || 'unknown',
      reliability: article.Source?.reliability || 'unknown',
      categories: article.categories || []
    };
    
    // Add analysis if available
    if (article.Analyses && article.Analyses.length > 0) {
      const analysis = article.Analyses[0];
      formatted.analysis = {
        biasScore: analysis.biasScore,
        biasDirection: analysis.biasDirection,
        sentiment: analysis.sentiment,
        entities: analysis.entities,
        topKeywords: analysis.topKeywords,
        readingLevel: analysis.readingLevel,
        clickbaitScore: analysis.clickbaitScore,
        outrageBaitScore: analysis.outrageBaitScore,
        summary: analysis.summaryText
      };
    }
    
    return formatted;
  }

  /**
   * Get analytics data
   */
  async getAnalytics() {
    const totalArticles = await Article.count();
    const totalAnalyses = await Analysis.count({ where: { userId: null } });
    
    // Get source distribution
    const sourceStats = await Article.findAll({
      attributes: [
        'sourceId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'articleCount']
      ],
      include: [{
        model: Source,
        attributes: ['name', 'category', 'biasRating']
      }],
      group: ['sourceId', 'Source.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
    
    // Get bias distribution
    const biasStats = await Analysis.findAll({
      attributes: [
        'biasDirection',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('biasScore')), 'avgScore']
      ],
      where: { userId: null },
      group: ['biasDirection'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
    
    // Get sentiment distribution
    const sentimentStats = await Analysis.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('sentiment')), 'avgSentiment'],
        [sequelize.fn('MIN', sequelize.col('sentiment')), 'minSentiment'],
        [sequelize.fn('MAX', sequelize.col('sentiment')), 'maxSentiment']
      ],
      where: { userId: null }
    });
    
    return {
      totalArticles,
      totalAnalyses,
      sourceDistribution: sourceStats,
      biasDistribution: biasStats,
      sentimentStats: sentimentStats[0],
      lastFetchTime: this.lastFetchTime,
      queueSize: this.analysisQueue.length
    };
  }

  /**
   * Track user interaction for analysis improvement
   */
  async trackUserInteraction(articleId, userId, interactionType, feedback = null) {
    // Store user interaction
    await UserArticle.create({
      userId,
      articleId,
      interactionType, // 'read', 'save', 'share', 'feedback'
      feedback,
      timestamp: new Date()
    });
    
    // If user provided feedback, use it to improve analysis
    if (feedback && feedback.analysisFeedback) {
      await this.improveAnalysisFromFeedback(articleId, feedback.analysisFeedback);
    }
  }

  /**
   * Improve analysis based on user feedback
   */
  async improveAnalysisFromFeedback(articleId, feedback) {
    const analysis = await Analysis.findOne({
      where: { articleId, userId: null }
    });
    
    if (analysis) {
      // Update analysis based on feedback
      // This could involve machine learning improvements
      // For now, we'll just log the feedback
      logger.info(`User feedback for article ${articleId}:`, feedback);
      
      // Store feedback for future analysis improvements
      await Analysis.update({
        userFeedback: feedback
      }, {
        where: { id: analysis.id }
      });
    }
  }

  /**
   * Utility method to decode HTML entities
   */
  decodeHtmlEntities(text) {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isAnalyzing: this.isAnalyzing,
      lastFetchTime: this.lastFetchTime,
      queueSize: this.analysisQueue.length,
      fetchInterval: this.fetchInterval
    };
  }
}

export default new ArticleStockpileService();
