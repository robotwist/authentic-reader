'use strict';
import { Model, DataTypes } from 'sequelize';

/**
 * DailyBriefingArticle Model
 * 
 * Stores articles from the daily briefing for historical archive.
 * Each day has 5 articles (one per topic).
 */
class DailyBriefingArticle extends Model {
  static initModel(sequelize) {
    DailyBriefingArticle.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      briefingDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'briefing_date'
      },
      topic: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      topicLabel: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'topic_label'
      },
      icon: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      headline: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      source: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      author: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      publishDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'publish_date'
      },
      fallacies: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      reliabilityScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reliability_score'
      }
    }, {
      sequelize,
      modelName: 'DailyBriefingArticle',
      tableName: 'daily_briefing_articles',
      underscored: true,
      timestamps: true
    });

    return DailyBriefingArticle;
  }

  /**
   * Get the latest briefing (today or most recent)
   */
  static async getLatest() {
    const articles = await this.findAll({
      order: [['briefing_date', 'DESC'], ['topic', 'ASC']],
      limit: 5
    });

    if (articles.length === 0) return null;

    // Get the most recent date and filter to that date
    const latestDate = articles[0].briefingDate;
    return articles.filter(a => a.briefingDate === latestDate);
  }

  /**
   * Get available archive dates
   */
  static async getArchiveDates() {
    const results = await this.findAll({
      attributes: [
        [this.sequelize.fn('DISTINCT', this.sequelize.col('briefing_date')), 'date']
      ],
      order: [[this.sequelize.col('briefing_date'), 'DESC']],
      raw: true
    });

    return results.map(r => r.date);
  }

  /**
   * Get briefing for a specific date
   */
  static async getByDate(date) {
    return await this.findAll({
      where: { briefingDate: date },
      order: [['topic', 'ASC']]
    });
  }

  /**
   * Save a daily briefing (upserts 5 articles)
   */
  static async saveBriefing(briefingData) {
    const today = new Date().toISOString().split('T')[0];
    const results = [];

    for (const [topicKey, topicData] of Object.entries(briefingData.topics)) {
      const [article, created] = await this.upsert({
        briefingDate: today,
        topic: topicKey,
        topicLabel: topicData.topic,
        icon: topicData.icon,
        headline: topicData.article.title,
        source: topicData.article.source,
        author: topicData.article.author || null,
        url: topicData.article.url || null,
        content: topicData.article.content,
        publishDate: topicData.article.publishDate ? new Date(topicData.article.publishDate) : null,
        fallacies: topicData.analysis || {},
        reliabilityScore: topicData.analysis?.overallAssessment?.reliabilityScore || null
      }, {
        conflictFields: ['briefing_date', 'topic']
      });

      results.push({ article, created });
    }

    return results;
  }

  /**
   * Convert DB records to API response format
   */
  static toApiFormat(articles) {
    const topics = {};

    for (const article of articles) {
      topics[article.topic] = {
        topic: article.topicLabel,
        icon: article.icon,
        article: {
          title: article.headline,
          url: article.url,
          source: article.source,
          publishDate: article.publishDate?.toISOString() || null,
          author: article.author,
          content: article.content
        },
        analysis: article.fallacies
      };
    }

    return {
      generatedAt: articles[0]?.createdAt?.toISOString() || new Date().toISOString(),
      version: '2.0',
      isArchive: true,
      briefingDate: articles[0]?.briefingDate || null,
      topics
    };
  }
}

export default DailyBriefingArticle;

