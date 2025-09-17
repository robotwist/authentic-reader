import { Article, Analysis, Source, UserArticle } from '../models/index.js';
import { Op } from 'sequelize';
import { logger } from '../utils/logger.js';

/**
 * Analytics Service
 * 
 * This service generates comprehensive analytics, charts, and graphs
 * based on the analyzed article data and user interactions.
 */
class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics() {
    const cacheKey = 'dashboard_analytics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        articleStats,
        sourceDistribution,
        biasAnalysis,
        sentimentTrends,
        userEngagement,
        topTopics,
        credibilityMetrics,
        timeSeriesData
      ] = await Promise.all([
        this.getArticleStatistics(),
        this.getSourceDistribution(),
        this.getBiasAnalysis(),
        this.getSentimentTrends(),
        this.getUserEngagement(),
        this.getTopTopics(),
        this.getCredibilityMetrics(),
        this.getTimeSeriesData()
      ]);

      const analytics = {
        overview: articleStats,
        sourceDistribution,
        biasAnalysis,
        sentimentTrends,
        userEngagement,
        topTopics,
        credibilityMetrics,
        timeSeriesData,
        generatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, analytics);
      return analytics;

    } catch (error) {
      logger.error('Error generating dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get basic article statistics
   */
  async getArticleStatistics() {
    const totalArticles = await Article.count();
    const totalAnalyses = await Analysis.count({ where: { userId: null } });
    const recentArticles = await Article.count({
      where: {
        publishDate: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const avgReadingTime = await Analysis.findOne({
      attributes: [[Op.avg(Op.col('readingTime')), 'avgReadingTime']],
      where: { userId: null }
    });

    return {
      totalArticles,
      totalAnalyses,
      recentArticles,
      avgReadingTime: Math.round(avgReadingTime?.dataValues?.avgReadingTime || 0),
      analysisCoverage: totalArticles > 0 ? Math.round((totalAnalyses / totalArticles) * 100) : 0
    };
  }

  /**
   * Get source distribution chart data
   */
  async getSourceDistribution() {
    const sourceStats = await Article.findAll({
      attributes: [
        'sourceId',
        [Op.fn('COUNT', Op.col('id')), 'articleCount']
      ],
      include: [{
        model: Source,
        attributes: ['name', 'category', 'biasRating', 'reliability']
      }],
      group: ['sourceId', 'Source.id'],
      order: [[Op.fn('COUNT', Op.col('id')), 'DESC']],
      limit: 20
    });

    return {
      type: 'pie',
      data: sourceStats.map(stat => ({
        name: stat.Source?.name || 'Unknown',
        value: parseInt(stat.dataValues.articleCount),
        category: stat.Source?.category || 'unknown',
        biasRating: stat.Source?.biasRating || 'unknown',
        reliability: stat.Source?.reliability || 'unknown'
      })),
      total: sourceStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.articleCount), 0)
    };
  }

  /**
   * Get bias analysis chart data
   */
  async getBiasAnalysis() {
    const biasStats = await Analysis.findAll({
      attributes: [
        'biasDirection',
        [Op.fn('COUNT', Op.col('id')), 'count'],
        [Op.fn('AVG', Op.col('biasScore')), 'avgScore']
      ],
      where: { userId: null },
      group: ['biasDirection'],
      order: [[Op.fn('COUNT', Op.col('id')), 'DESC']]
    });

    const biasDistribution = biasStats.map(stat => ({
      direction: stat.biasDirection || 'neutral',
      count: parseInt(stat.dataValues.count),
      avgScore: parseFloat(stat.dataValues.avgScore || 0)
    }));

    // Calculate bias spectrum
    const biasSpectrum = await Analysis.findAll({
      attributes: [
        [Op.fn('AVG', Op.col('biasScore')), 'avgBiasScore'],
        [Op.fn('STDDEV', Op.col('biasScore')), 'biasStdDev']
      ],
      where: { userId: null }
    });

    return {
      distribution: biasDistribution,
      spectrum: {
        avgBiasScore: parseFloat(biasSpectrum[0]?.dataValues?.avgBiasScore || 0),
        biasStdDev: parseFloat(biasSpectrum[0]?.dataValues?.biasStdDev || 0)
      },
      total: biasDistribution.reduce((sum, item) => sum + item.count, 0)
    };
  }

  /**
   * Get sentiment trends chart data
   */
  async getSentimentTrends() {
    const sentimentData = await Analysis.findAll({
      attributes: [
        [Op.fn('DATE', Op.col('createdAt')), 'date'],
        [Op.fn('AVG', Op.col('sentiment')), 'avgSentiment'],
        [Op.fn('COUNT', Op.col('id')), 'articleCount']
      ],
      where: { userId: null },
      group: [Op.fn('DATE', Op.col('createdAt'))],
      order: [[Op.fn('DATE', Op.col('createdAt')), 'ASC']],
      limit: 30 // Last 30 days
    });

    return {
      type: 'line',
      data: sentimentData.map(item => ({
        date: item.dataValues.date,
        avgSentiment: parseFloat(item.dataValues.avgSentiment || 0),
        articleCount: parseInt(item.dataValues.articleCount)
      })),
      summary: {
        avgSentiment: sentimentData.reduce((sum, item) => sum + parseFloat(item.dataValues.avgSentiment || 0), 0) / sentimentData.length,
        totalArticles: sentimentData.reduce((sum, item) => sum + parseInt(item.dataValues.articleCount), 0)
      }
    };
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement() {
    const engagementStats = await UserArticle.findAll({
      attributes: [
        'interactionType',
        [Op.fn('COUNT', Op.col('id')), 'count'],
        [Op.fn('DATE', Op.col('createdAt')), 'date']
      ],
      group: ['interactionType', Op.fn('DATE', Op.col('createdAt'))],
      order: [[Op.fn('DATE', Op.col('createdAt')), 'DESC']],
      limit: 100
    });

    const engagementByType = {};
    engagementStats.forEach(stat => {
      const type = stat.interactionType || 'unknown';
      if (!engagementByType[type]) {
        engagementByType[type] = [];
      }
      engagementByType[type].push({
        date: stat.dataValues.date,
        count: parseInt(stat.dataValues.count)
      });
    });

    return {
      byType: engagementByType,
      totalInteractions: engagementStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0)
    };
  }

  /**
   * Get top topics and keywords
   */
  async getTopTopics() {
    const keywordStats = await Analysis.findAll({
      attributes: [
        'topKeywords',
        [Op.fn('COUNT', Op.col('id')), 'frequency']
      ],
      where: { 
        userId: null,
        topKeywords: { [Op.ne]: null }
      },
      group: ['topKeywords'],
      order: [[Op.fn('COUNT', Op.col('id')), 'DESC']],
      limit: 50
    });

    const keywordFrequency = {};
    keywordStats.forEach(stat => {
      const keywords = stat.topKeywords || [];
      keywords.forEach(keyword => {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + parseInt(stat.dataValues.frequency);
      });
    });

    const topKeywords = Object.entries(keywordFrequency)
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    return {
      topKeywords,
      totalKeywords: Object.keys(keywordFrequency).length,
      keywordCloud: topKeywords.map(item => ({
        text: item.keyword,
        value: item.frequency
      }))
    };
  }

  /**
   * Get credibility metrics
   */
  async getCredibilityMetrics() {
    const credibilityStats = await Analysis.findAll({
      attributes: [
        [Op.fn('AVG', Op.col('clickbaitScore')), 'avgClickbaitScore'],
        [Op.fn('AVG', Op.col('outrageBaitScore')), 'avgOutrageBaitScore'],
        [Op.fn('COUNT', Op.col('id')), 'totalArticles']
      ],
      where: { userId: null }
    });

    const clickbaitDistribution = await Analysis.findAll({
      attributes: [
        [Op.fn('CASE', 
          Op.when(Op.col('clickbaitScore'), '<', 0.3, 'Low'),
          Op.when(Op.col('clickbaitScore'), '<', 0.7, 'Medium'),
          Op.else('High')
        ), 'clickbaitLevel'],
        [Op.fn('COUNT', Op.col('id')), 'count']
      ],
      where: { userId: null },
      group: ['clickbaitLevel']
    });

    return {
      overall: {
        avgClickbaitScore: parseFloat(credibilityStats[0]?.dataValues?.avgClickbaitScore || 0),
        avgOutrageBaitScore: parseFloat(credibilityStats[0]?.dataValues?.avgOutrageBaitScore || 0),
        totalArticles: parseInt(credibilityStats[0]?.dataValues?.totalArticles || 0)
      },
      clickbaitDistribution: clickbaitDistribution.map(stat => ({
        level: stat.dataValues.clickbaitLevel,
        count: parseInt(stat.dataValues.count)
      }))
    };
  }

  /**
   * Get time series data for trends
   */
  async getTimeSeriesData() {
    const timeSeries = await Article.findAll({
      attributes: [
        [Op.fn('DATE', Op.col('publishDate')), 'date'],
        [Op.fn('COUNT', Op.col('id')), 'articleCount']
      ],
      group: [Op.fn('DATE', Op.col('publishDate'))],
      order: [[Op.fn('DATE', Op.col('publishDate')), 'ASC']],
      limit: 30
    });

    return {
      type: 'area',
      data: timeSeries.map(item => ({
        date: item.dataValues.date,
        articleCount: parseInt(item.dataValues.articleCount)
      })),
      totalArticles: timeSeries.reduce((sum, item) => sum + parseInt(item.dataValues.articleCount), 0)
    };
  }

  /**
   * Get source credibility comparison
   */
  async getSourceCredibilityComparison() {
    const sourceCredibility = await Analysis.findAll({
      attributes: [
        'articleId',
        'clickbaitScore',
        'outrageBaitScore',
        'biasScore'
      ],
      include: [{
        model: Article,
        include: [{
          model: Source,
          attributes: ['name', 'category', 'biasRating', 'reliability']
        }]
      }],
      where: { userId: null }
    });

    const sourceStats = {};
    sourceCredibility.forEach(analysis => {
      const sourceName = analysis.Article?.Source?.name || 'Unknown';
      if (!sourceStats[sourceName]) {
        sourceStats[sourceName] = {
          name: sourceName,
          category: analysis.Article?.Source?.category || 'unknown',
          biasRating: analysis.Article?.Source?.biasRating || 'unknown',
          reliability: analysis.Article?.Source?.reliability || 'unknown',
          clickbaitScores: [],
          outrageBaitScores: [],
          biasScores: [],
          articleCount: 0
        };
      }

      sourceStats[sourceName].clickbaitScores.push(analysis.clickbaitScore || 0);
      sourceStats[sourceName].outrageBaitScores.push(analysis.outrageBaitScore || 0);
      sourceStats[sourceName].biasScores.push(analysis.biasScore || 0);
      sourceStats[sourceName].articleCount++;
    });

    // Calculate averages
    Object.values(sourceStats).forEach(source => {
      source.avgClickbaitScore = source.clickbaitScores.reduce((a, b) => a + b, 0) / source.clickbaitScores.length;
      source.avgOutrageBaitScore = source.outrageBaitScores.reduce((a, b) => a + b, 0) / source.outrageBaitScores.length;
      source.avgBiasScore = source.biasScores.reduce((a, b) => a + b, 0) / source.biasScores.length;
    });

    return Object.values(sourceStats).sort((a, b) => b.articleCount - a.articleCount);
  }

  /**
   * Get reading level distribution
   */
  async getReadingLevelDistribution() {
    const readingLevelStats = await Analysis.findAll({
      attributes: [
        'readingLevel',
        [Op.fn('COUNT', Op.col('id')), 'count']
      ],
      where: { userId: null },
      group: ['readingLevel'],
      order: [[Op.fn('COUNT', Op.col('id')), 'DESC']]
    });

    return {
      type: 'bar',
      data: readingLevelStats.map(stat => ({
        level: stat.readingLevel || 'unknown',
        count: parseInt(stat.dataValues.count)
      })),
      total: readingLevelStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0)
    };
  }

  /**
   * Get entity analysis (people, places, organizations)
   */
  async getEntityAnalysis() {
    const entityStats = await Analysis.findAll({
      attributes: [
        'entities',
        [Op.fn('COUNT', Op.col('id')), 'frequency']
      ],
      where: { 
        userId: null,
        entities: { [Op.ne]: null }
      },
      group: ['entities'],
      order: [[Op.fn('COUNT', Op.col('id')), 'DESC']],
      limit: 100
    });

    const entityFrequency = {};
    entityStats.forEach(stat => {
      const entities = stat.entities || [];
      entities.forEach(entity => {
        const key = `${entity.type}:${entity.name}`;
        entityFrequency[key] = (entityFrequency[key] || 0) + parseInt(stat.dataValues.frequency);
      });
    });

    const topEntities = Object.entries(entityFrequency)
      .map(([key, frequency]) => {
        const [type, name] = key.split(':');
        return { type, name, frequency };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 30);

    return {
      topEntities,
      byType: {
        person: topEntities.filter(e => e.type === 'PERSON'),
        organization: topEntities.filter(e => e.type === 'ORG'),
        location: topEntities.filter(e => e.type === 'LOC')
      }
    };
  }

  /**
   * Cache management
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout,
      uptime: process.uptime()
    };
  }
}

export default new AnalyticsService();
