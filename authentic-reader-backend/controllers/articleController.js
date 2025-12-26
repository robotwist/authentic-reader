import { Article, User, UserArticle, Source, Analysis } from '../models/index.js';
import { validationResult } from 'express-validator';
import axios from 'axios';
import xml2js from 'xml2js';
import { Op } from 'sequelize';
import { fetchAndExtractArticle } from '../services/contentExtractionService.js';
import logger from '../utils/logger.js';
import { RSS_CONFIG } from '../config/rssConfig.js';

// Save article for a user
export const saveArticle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, link, author, sourceId, publishDate, content, summary, imageUrl, categories, guid } = req.body;

  try {
    // First, check if source exists
    const source = await Source.findByPk(sourceId);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Check if article already exists
    let article = await Article.findOne({ 
      where: { 
        guid: guid || link  // Use guid if available, otherwise use link as a fallback
      } 
    });

    // If article doesn't exist, create it
    if (!article) {
      article = await Article.create({
        title,
        link,
        sourceId,
        author,
        publishDate: publishDate || new Date(),
        content,
        summary,
        imageUrl,
        categories,
        guid: guid || link
      });
    }

    // Check if user has already saved this article
    const existingUserArticle = await UserArticle.findOne({
      where: {
        userId: req.user.id,
        articleId: article.id
      }
    });

    if (existingUserArticle) {
      // Update the existing record
      existingUserArticle.isSaved = true;
      existingUserArticle.savedAt = new Date();
      await existingUserArticle.save();
    } else {
      // Create a new record
      await UserArticle.create({
        userId: req.user.id,
        articleId: article.id,
        isSaved: true,
        savedAt: new Date()
      });
    }

    res.status(200).json({
      message: 'Article saved successfully',
      article
    });
  } catch (error) {
    logger.error('Error saving article:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
};

// Mark article as read
export const markArticleAsRead = async (req, res) => {
  const { articleId } = req.params;

  try {
    // Find the article
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if user-article relation exists
    let userArticle = await UserArticle.findOne({
      where: {
        userId: req.user.id,
        articleId: article.id
      }
    });

    if (userArticle) {
      // Update existing record
      userArticle.isRead = true;
      userArticle.readAt = new Date();
      await userArticle.save();
    } else {
      // Create new record
      userArticle = await UserArticle.create({
        userId: req.user.id,
        articleId: article.id,
        isRead: true,
        readAt: new Date()
      });
    }

    res.status(200).json({
      message: 'Article marked as read',
      userArticle
    });
  } catch (error) {
    logger.error('Error marking article as read:', error);
    res.status(500).json({ error: 'Failed to mark article as read' });
  }
};

// Get all saved articles for a user
export const getSavedArticles = async (req, res) => {
  try {
    const userArticles = await UserArticle.findAll({
      where: {
        userId: req.user.id,
        isSaved: true
      },
      include: [{
        model: Article,
        include: [{ model: Source }]
      }],
      order: [['savedAt', 'DESC']]
    });

    // Map to return articles with user data
    const articles = userArticles.map(ua => ({
      ...ua.Article.toJSON(),
      source: ua.Article.Source,
      savedAt: ua.savedAt,
      readAt: ua.readAt,
      isRead: ua.isRead
    }));

    res.status(200).json(articles);
  } catch (error) {
    logger.error('Error fetching saved articles:', error);
    res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
};

// Get all read articles for a user
export const getReadArticles = async (req, res) => {
  try {
    const userArticles = await UserArticle.findAll({
      where: {
        userId: req.user.id,
        isRead: true
      },
      include: [{
        model: Article,
        include: [{ model: Source }]
      }],
      order: [['readAt', 'DESC']]
    });

    // Map to return articles with user data
    const articles = userArticles.map(ua => ({
      ...ua.Article.toJSON(),
      source: ua.Article.Source,
      savedAt: ua.savedAt,
      readAt: ua.readAt,
      isSaved: ua.isSaved
    }));

    res.status(200).json(articles);
  } catch (error) {
    logger.error('Error fetching read articles:', error);
    res.status(500).json({ error: 'Failed to fetch read articles' });
  }
};

// Remove saved article
export const unsaveArticle = async (req, res) => {
  const { articleId } = req.params;

  try {
    const userArticle = await UserArticle.findOne({
      where: {
        userId: req.user.id,
        articleId,
        isSaved: true
      }
    });

    if (!userArticle) {
      return res.status(404).json({ error: 'Saved article not found' });
    }

    // Update the record
    userArticle.isSaved = false;
    userArticle.savedAt = null;
    await userArticle.save();

    res.status(200).json({ message: 'Article unsaved successfully' });
  } catch (error) {
    logger.error('Error unsaving article:', error);
    res.status(500).json({ error: 'Failed to unsave article' });
  }
};

// Get article by ID
export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: Source }]
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if user has any interaction with this article
    let userInteraction = null;
    if (req.user) {
      userInteraction = await UserArticle.findOne({
        where: {
          userId: req.user.id,
          articleId: article.id
        }
      });
    }

    res.status(200).json({
      ...article.toJSON(),
      userInteraction: userInteraction ? {
        isRead: userInteraction.isRead,
        isSaved: userInteraction.isSaved,
        readAt: userInteraction.readAt,
        savedAt: userInteraction.savedAt
      } : null
    });
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

// Fetch articles from RSS using optimized service
export const fetchArticlesFromRSS = async (req, res) => {
  const { sourceId } = req.params;

  try {
    const source = await Source.findByPk(sourceId);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Use optimized RSS service
    const rssService = (await import('../services/rssService.js')).default;
    const feedData = await rssService.fetchFeed(source.url, {
      timeout: 8000,
      maxItems: 50,
      useCache: true
    });

    // Normalize items
    const articles = feedData.items.map(item => {
      const normalized = rssService.normalizeItem(item, source.name);
      return {
        title: normalized.title,
        link: normalized.link,
        author: normalized.author,
        publishDate: normalized.publishDate,
        content: normalized.content,
        summary: normalized.description,
        guid: normalized.guid,
        sourceId: source.id,
        source: {
          id: source.id,
          name: source.name,
          url: source.url,
          category: source.category
        }
      };
    });

    res.status(200).json(articles);
  } catch (error) {
    logger.error('Error fetching articles from RSS:', { sourceId, error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Failed to fetch articles from RSS',
      message: error.message
    });
  }
};

// Fetch articles from a source
export const fetchArticlesFromSource = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the source - first try by primary key (numeric ID)
    let source = null;
    
    if (!isNaN(id)) {
      // If id is numeric, try to find by primary key
      source = await Source.findByPk(id);
    }
    
    // If not found or id is not numeric, try to find by name or slug
    if (!source) {
      source = await Source.findOne({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${id}%` } },
            { slug: id },
            { identifier: id }
          ]
        }
      });
    }
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }
    
    // Use optimized RSS service
    const rssService = (await import('../services/rssService.js')).default;
    const feedData = await rssService.fetchFeed(source.url, {
      timeout: 8000,
      maxItems: 50,
      useCache: true
    });

    // Normalize items and add source info
    const processedArticles = feedData.items.map(item => {
      const normalized = rssService.normalizeItem(item, source.name);
      return {
        title: normalized.title,
        link: normalized.link,
        guid: normalized.guid,
        author: normalized.author,
        publishDate: normalized.publishDate,
        summary: normalized.description,
        content: normalized.content,
        sourceId: source.id,
        source: {
          id: source.id,
          name: source.name,
          url: source.url,
          category: source.category
        }
      };
    });
    
    res.status(200).json(processedArticles);
  } catch (error) {
    logger.error(`Error fetching articles from source ${req.params.id}:`, { sourceId: req.params.id, error: error.message, stack: error.stack });
    res.status(500).json({ 
      message: 'Server error fetching articles',
      error: error.message
    });
  }
};

// Get all articles
export const getAllArticles = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      limit = 50, 
      offset = 0, 
      sourceId,
      search,
      startDate,
      endDate,
      sortBy = 'publishDate',
      sortOrder = 'DESC'
    } = req.query;
    
    // Build the where clause
    const where = {};
    
    if (sourceId) {
      where.sourceId = sourceId;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { summary: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (startDate || endDate) {
      where.publishDate = {};
      if (startDate) {
        where.publishDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.publishDate[Op.lte] = new Date(endDate);
      }
    }
    
    // Get the articles
    const articles = await Article.findAndCountAll({
      where,
      include: [
        {
          model: Source,
          attributes: ['id', 'name', 'url', 'category']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // If user is authenticated, include their read/saved status
    if (req.user) {
      const userId = req.user.id;
      const articleIds = articles.rows.map(article => article.id);
      
      // Find user's read/saved articles
      const userArticles = await UserArticle.findAll({
        where: {
          userId,
          articleId: {
            [Op.in]: articleIds
          }
        }
      });
      
      // Create a map for quick lookup
      const userArticleMap = {};
      userArticles.forEach(ua => {
        userArticleMap[ua.articleId] = ua;
      });
      
      // Add read/saved status to articles
      articles.rows = articles.rows.map(article => {
        const userArticle = userArticleMap[article.id];
        return {
          ...article.get(),
          isRead: Boolean(userArticle?.isRead),
          isSaved: Boolean(userArticle?.isSaved)
        };
      });
    }
    
    res.json({
      articles: articles.rows,
      total: articles.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Server error fetching articles' });
  }
};

// Get user's saved articles
export const getUserSavedArticles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get query parameters for pagination
    const { limit = 50, offset = 0 } = req.query;
    
    // Find user's saved articles
    const savedArticles = await UserArticle.findAndCountAll({
      where: {
        userId,
        isSaved: true
      },
      include: [
        {
          model: Article,
          include: [
            {
              model: Source,
              attributes: ['id', 'name', 'url', 'category']
            }
          ]
        }
      ],
      order: [['savedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Format the response
    const articles = savedArticles.rows.map(ua => ({
      ...ua.Article.get(),
      isRead: ua.isRead,
      isSaved: ua.isSaved,
      savedAt: ua.savedAt
    }));
    
    res.json({
      articles,
      total: savedArticles.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching saved articles:', error);
    res.status(500).json({ message: 'Server error fetching saved articles' });
  }
};

// Mark article as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { articleId, guid, isRead = true } = req.body;
    
    if (!articleId && !guid) {
      return res.status(400).json({ message: 'Either articleId or guid is required' });
    }
    
    let userArticle;
    
    // Find by articleId or guid
    if (articleId) {
      [userArticle] = await UserArticle.findOrCreate({
        where: { userId, articleId },
        defaults: {
          userId,
          articleId,
          isRead,
          readAt: isRead ? new Date() : null
        }
      });
    } else {
      [userArticle] = await UserArticle.findOrCreate({
        where: { userId, articleGuid: guid },
        defaults: {
          userId,
          articleGuid: guid,
          isRead,
          readAt: isRead ? new Date() : null
        }
      });
    }
    
    // Update if found
    if (userArticle.isRead !== isRead) {
      userArticle.isRead = isRead;
      userArticle.readAt = isRead ? new Date() : null;
      await userArticle.save();
    }
    
    res.json({ message: `Article marked as ${isRead ? 'read' : 'unread'}` });
  } catch (error) {
    logger.error('Error marking article as read:', error);
    res.status(500).json({ message: 'Server error marking article as read' });
  }
};

// Save article in the user's collection
export const saveUserArticle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { articleId, guid, isSaved = true } = req.body;
    
    if (!articleId && !guid) {
      return res.status(400).json({ message: 'Either articleId or guid is required' });
    }
    
    let userArticle;
    
    // Find by articleId or guid
    if (articleId) {
      [userArticle] = await UserArticle.findOrCreate({
        where: { userId, articleId },
        defaults: {
          userId,
          articleId,
          isSaved,
          savedAt: isSaved ? new Date() : null
        }
      });
    } else {
      [userArticle] = await UserArticle.findOrCreate({
        where: { userId, articleGuid: guid },
        defaults: {
          userId,
          articleGuid: guid,
          isSaved,
          savedAt: isSaved ? new Date() : null
        }
      });
    }
    
    // Update if found
    if (userArticle.isSaved !== isSaved) {
      userArticle.isSaved = isSaved;
      userArticle.savedAt = isSaved ? new Date() : null;
      await userArticle.save();
    }
    
    res.json({ message: `Article ${isSaved ? 'saved' : 'unsaved'}` });
  } catch (error) {
    logger.error('Error saving article:', error);
    res.status(500).json({ message: 'Server error saving article' });
  }
};

// Get article analysis
export const getArticleAnalysis = async (req, res) => {
  try {
    const { id, guid } = req.params;
    
    let analysis;
    
    // Find by id or guid
    if (id) {
      analysis = await Analysis.findOne({
        where: { articleId: id }
      });
    } else if (guid) {
      analysis = await Analysis.findOne({
        where: { articleGuid: guid }
      });
    } else {
      return res.status(400).json({ message: 'Either id or guid is required' });
    }
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    res.json(analysis);
  } catch (error) {
    logger.error('Error fetching article analysis:', error);
    res.status(500).json({ message: 'Server error fetching article analysis' });
  }
};

// Create article analysis
export const createArticleAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { 
      articleId, 
      articleGuid,
      biasScore,
      biasDirection,
      sentiment,
      entities,
      topKeywords,
      readingLevel,
      clickbaitScore,
      outrageBaitScore,
      summaryText
    } = req.body;
    
    if (!articleId && !articleGuid) {
      return res.status(400).json({ message: 'Either articleId or articleGuid is required' });
    }
    
    // Check if analysis already exists
    let analysis;
    if (articleId) {
      analysis = await Analysis.findOne({ where: { articleId } });
    } else {
      analysis = await Analysis.findOne({ where: { articleGuid } });
    }
    
    // Create or update the analysis
    if (analysis) {
      // Update existing analysis
      if (biasScore !== undefined) analysis.biasScore = biasScore;
      if (biasDirection !== undefined) analysis.biasDirection = biasDirection;
      if (sentiment !== undefined) analysis.sentiment = sentiment;
      if (entities !== undefined) analysis.entities = entities;
      if (topKeywords !== undefined) analysis.topKeywords = topKeywords;
      if (readingLevel !== undefined) analysis.readingLevel = readingLevel;
      if (clickbaitScore !== undefined) analysis.clickbaitScore = clickbaitScore;
      if (outrageBaitScore !== undefined) analysis.outrageBaitScore = outrageBaitScore;
      if (summaryText !== undefined) analysis.summaryText = summaryText;
      
      await analysis.save();
    } else {
      // Create new analysis
      analysis = await Analysis.create({
        articleId,
        articleGuid,
        userId,
        biasScore,
        biasDirection,
        sentiment,
        entities,
        topKeywords,
        readingLevel,
        clickbaitScore,
        outrageBaitScore,
        summaryText
      });
    }
    
    res.status(201).json(analysis);
  } catch (error) {
    logger.error('Error creating article analysis:', error);
    res.status(500).json({ message: 'Server error creating article analysis' });
  }
};

/**
 * NEW: Fetch and extract full article content
 */
export const extractFullArticleContent = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: 'URL query parameter is required' });
  }

  try {
    logger.info(`[Controller] Attempting to extract content for URL: ${url}`);
    const extractedContent = await fetchAndExtractArticle(url);

    if (!extractedContent) {
      logger.warn(`[Controller] Content extraction failed or returned null for ${url}`);
      return res.status(404).json({ 
        message: 'Could not extract main content from the provided URL. The website might be incompatible or blocking requests.',
        url 
      });
    }

    logger.info(`[Controller] Successfully extracted content for ${url}. Length: ${extractedContent.length}`);
    res.json(extractedContent);

  } catch (error) {
    logger.error(`[Controller] Error during content extraction for ${url}:`, error);
    res.status(500).json({ 
      message: 'Server error during content extraction', 
      error: error.message, // Provide error message for debugging
      url
     });
  }
};

// Get public articles
export const getPublicArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: {
        isPublic: true
      },
      limit: 20,
      order: [['publishDate', 'DESC']],
      include: [{ model: Source }]
    });
    
    res.status(200).json(articles);
  } catch (error) {
    logger.error('Error fetching public articles:', error);
    res.status(500).json({ message: 'Server error fetching public articles' });
  }
};

// Get a specific public article
export const getPublicArticle = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { 
        id: req.params.id,
        isPublic: true
      },
      include: [{ model: Source }]
    });
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json(article);
  } catch (error) {
    logger.error('Error fetching public article:', error);
    res.status(500).json({ message: 'Server error fetching article' });
  }
};

// Get articles for the logged-in user
export const getUserArticles = async (req, res) => {
  try {
    const userArticles = await UserArticle.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Article,
        include: [{ model: Source }]
      }],
      order: [[Article, 'publishDate', 'DESC']]
    });
    
    const articles = userArticles.map(ua => ({
      ...ua.Article.toJSON(),
      source: ua.Article.Source,
      savedAt: ua.savedAt,
      readAt: ua.readAt,
      isRead: ua.isRead,
      isSaved: ua.isSaved
    }));
    
    res.status(200).json(articles);
  } catch (error) {
    logger.error('Error fetching user articles:', error);
    res.status(500).json({ message: 'Server error fetching articles' });
  }
};

// Create a new article
export const createArticle = async (req, res) => {
  try {
    const { title, link, author, sourceId, publishDate, content, summary, imageUrl, categories, guid } = req.body;
    
    if (!title || !link || !sourceId) {
      return res.status(400).json({ message: 'Title, link, and sourceId are required' });
    }
    
    const article = await Article.create({
      title,
      link,
      author,
      sourceId,
      publishDate: publishDate || new Date(),
      content,
      summary,
      imageUrl,
      categories,
      guid: guid || link,
      isPublic: false
    });
    
    res.status(201).json(article);
  } catch (error) {
    logger.error('Error creating article:', error);
    res.status(500).json({ message: 'Server error creating article' });
  }
};

// Get a specific article
export const getArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: Source }]
    });
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json(article);
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ message: 'Server error fetching article' });
  }
};

// Update an article
export const updateArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const { title, content, summary, isPublic } = req.body;
    
    await article.update({
      title: title || article.title,
      content: content || article.content,
      summary: summary || article.summary,
      isPublic: isPublic !== undefined ? isPublic : article.isPublic
    });
    
    res.status(200).json(article);
  } catch (error) {
    logger.error('Error updating article:', error);
    res.status(500).json({ message: 'Server error updating article' });
  }
};

// Delete an article
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    await article.destroy();
    
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    logger.error('Error deleting article:', error);
    res.status(500).json({ message: 'Server error deleting article' });
  }
};

// Bookmark an article
export const bookmarkArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    let userArticle = await UserArticle.findOne({
      where: {
        userId: req.user.id,
        articleId: article.id
      }
    });
    
    if (userArticle) {
      userArticle.isSaved = true;
      userArticle.savedAt = new Date();
      await userArticle.save();
    } else {
      userArticle = await UserArticle.create({
        userId: req.user.id,
        articleId: article.id,
        isSaved: true,
        savedAt: new Date()
      });
    }
    
    res.status(200).json({ message: 'Article bookmarked successfully' });
  } catch (error) {
    logger.error('Error bookmarking article:', error);
    res.status(500).json({ message: 'Server error bookmarking article' });
  }
};

// Remove bookmark from an article
export const removeBookmark = async (req, res) => {
  try {
    const userArticle = await UserArticle.findOne({
      where: {
        userId: req.user.id,
        articleId: req.params.id,
        isSaved: true
      }
    });
    
    if (!userArticle) {
      return res.status(404).json({ message: 'Bookmarked article not found' });
    }
    
    userArticle.isSaved = false;
    userArticle.savedAt = null;
    await userArticle.save();
    
    res.status(200).json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    logger.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Server error removing bookmark' });
  }
};

// Get bookmarked articles
export const getBookmarkedArticles = async (req, res) => {
  try {
    const userArticles = await UserArticle.findAll({
      where: {
        userId: req.user.id,
        isSaved: true
      },
      include: [{
        model: Article,
        include: [{ model: Source }]
      }],
      order: [['savedAt', 'DESC']]
    });
    
    const articles = userArticles.map(ua => ({
      ...ua.Article.toJSON(),
      source: ua.Article.Source,
      savedAt: ua.savedAt,
      readAt: ua.readAt,
      isRead: ua.isRead
    }));
    
    res.status(200).json(articles);
  } catch (error) {
    logger.error('Error fetching bookmarked articles:', error);
    res.status(500).json({ message: 'Server error fetching bookmarked articles' });
  }
}; 