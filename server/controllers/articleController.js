const { Article, User, UserArticle, Source, Analysis } = require('../models');
const { validationResult } = require('express-validator');
const axios = require('axios');
const xml2js = require('xml2js');
const { Op } = require('sequelize');
const { fetchAndExtractArticle } = require('../services/contentExtractionService');

// Save article for a user
exports.saveArticle = async (req, res) => {
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
    console.error('Error saving article:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
};

// Mark article as read
exports.markArticleAsRead = async (req, res) => {
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
    console.error('Error marking article as read:', error);
    res.status(500).json({ error: 'Failed to mark article as read' });
  }
};

// Get all saved articles for a user
exports.getSavedArticles = async (req, res) => {
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
    console.error('Error fetching saved articles:', error);
    res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
};

// Get all read articles for a user
exports.getReadArticles = async (req, res) => {
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
    console.error('Error fetching read articles:', error);
    res.status(500).json({ error: 'Failed to fetch read articles' });
  }
};

// Remove saved article
exports.unsaveArticle = async (req, res) => {
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
    console.error('Error unsaving article:', error);
    res.status(500).json({ error: 'Failed to unsave article' });
  }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
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
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

// Fetch articles from RSS
exports.fetchArticlesFromRSS = async (req, res) => {
  const { sourceId } = req.params;

  try {
    const source = await Source.findByPk(sourceId);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Fetch RSS feed
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Authentic Reader RSS Fetcher/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      timeout: 10000
    });

    // Parse XML to JSON
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });

    const result = await parser.parseStringPromise(response.data);
    
    // Extract articles from the feed
    let items = [];
    if (result.rss && result.rss.channel) {
      items = result.rss.channel.item || [];
    } else if (result.feed) {
      items = result.feed.entry || [];
    } else if (result.rdf && result.rdf.item) {
      items = result.rdf.item || [];
    }

    // Ensure items is an array
    if (!Array.isArray(items)) {
      items = [items];
    }

    // Map items to our article format
    const articles = items.map(item => ({
      title: item.title || 'Untitled',
      link: item.link || (item.guid && item.guid._ ? item.guid._ : item.guid),
      author: item.author || item['dc:creator'] || source.name,
      publishDate: item.pubDate || item.published || new Date().toISOString(),
      content: item['content:encoded'] || item.content || item.description || '',
      summary: item.description || item.summary || '',
      guid: item.guid || item.id || item.link,
      sourceId: source.id,
      source: {
        id: source.id,
        name: source.name,
        url: source.url,
        category: source.category
      }
    }));

    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching articles from RSS:', error);
    res.status(500).json({ 
      error: 'Failed to fetch articles from RSS',
      message: error.message
    });
  }
};

// Fetch articles from a source
exports.fetchArticlesFromSource = async (req, res) => {
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
    
    // Fetch the RSS feed
    const feedUrl = source.url;
    console.log(`Fetching RSS feed from: ${feedUrl}`);
    
    // Fix for Reuters feed which may have special handling needs
    let adjustedFeedUrl = feedUrl;
    if (feedUrl.includes('reuters.com')) {
      // Use alternative Reuters feed URL if needed
      if (feedUrl === 'https://feeds.reuters.com/reuters/topNews') {
        // Reuters API has changed, use a different news source as fallback
        adjustedFeedUrl = 'https://www.cnbc.com/id/100003114/device/rss/rss.html';
        console.log(`Redirecting Reuters feed to CNBC News feed: ${adjustedFeedUrl}`);
      }
    }
    
    const response = await axios.get(adjustedFeedUrl, {
      headers: {
        'User-Agent': 'Authentic Reader RSS Fetcher/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      timeout: 15000 // 15 second timeout
    });
    
    // Parse the XML to JSON
    const result = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      normalizeTags: false,
      trim: true
    });
    
    // Extract the articles
    let articles = [];
    
    if (result.rss && result.rss.channel) {
      // Standard RSS format
      let items = result.rss.channel.item;
      if (!Array.isArray(items)) items = [items];
      
      articles = items.map(item => {
        // Handle guid which might be an object with _ property or a string
        let guid = null;
        if (item.guid) {
          if (typeof item.guid === 'object' && item.guid._) {
            guid = item.guid._;
          } else if (typeof item.guid === 'string') {
            guid = item.guid;
          } else {
            guid = item.link; // Fallback to link
          }
        } else {
          guid = item.link;
        }
        
        // Handle link which might also be complex
        let link = null;
        if (item.link) {
          if (typeof item.link === 'object' && item.link._) {
            link = item.link._;
          } else {
            link = item.link;
          }
        }
        
        return {
          title: item.title,
          link: link,
          guid: guid,
          author: item['dc:creator'] || item.author || source.name,
          publishDate: item.pubDate || item.date || new Date().toISOString(),
          summary: item.description || '',
          content: item['content:encoded'] || item.content || item.description || '',
          sourceId: source.id
        };
      });
    } else if (result.feed) {
      // Atom format
      let entries = result.feed.entry;
      if (!Array.isArray(entries)) entries = [entries];
      
      articles = entries.map(entry => {
        let link = '';
        if (entry.link) {
          if (Array.isArray(entry.link)) {
            const alternateLink = entry.link.find(l => l.rel === 'alternate' || !l.rel);
            link = alternateLink?.href || entry.link[0]?.href || '';
          } else {
            link = entry.link.href || entry.link || '';
          }
        }
        
        return {
          title: entry.title,
          link: link,
          guid: entry.id || link,
          author: entry.author?.name || entry.author || source.name,
          publishDate: entry.published || entry.updated || new Date().toISOString(),
          summary: entry.summary || '',
          content: entry.content || entry.summary || '',
          sourceId: source.id
        };
      });
    }
    
    // Process and return the articles
    const processedArticles = articles.map(article => {
      // Add the source object to each article
      return {
        ...article,
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
    console.error(`Error fetching articles from source ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Server error fetching articles',
      error: error.message
    });
  }
};

// Get all articles
exports.getAllArticles = async (req, res) => {
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
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Server error fetching articles' });
  }
};

// Get user's saved articles
exports.getSavedArticles = async (req, res) => {
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
    console.error('Error fetching saved articles:', error);
    res.status(500).json({ message: 'Server error fetching saved articles' });
  }
};

// Mark article as read
exports.markAsRead = async (req, res) => {
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
    console.error('Error marking article as read:', error);
    res.status(500).json({ message: 'Server error marking article as read' });
  }
};

// Save article
exports.saveArticle = async (req, res) => {
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
    console.error('Error saving article:', error);
    res.status(500).json({ message: 'Server error saving article' });
  }
};

// Get article analysis
exports.getArticleAnalysis = async (req, res) => {
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
    console.error('Error fetching article analysis:', error);
    res.status(500).json({ message: 'Server error fetching article analysis' });
  }
};

// Create article analysis
exports.createArticleAnalysis = async (req, res) => {
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
    console.error('Error creating article analysis:', error);
    res.status(500).json({ message: 'Server error creating article analysis' });
  }
};

/**
 * NEW: Fetch and extract full article content
 */
exports.extractFullArticleContent = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: 'URL query parameter is required' });
  }

  try {
    console.log(`[Controller] Attempting to extract content for URL: ${url}`);
    const extractedContent = await fetchAndExtractArticle(url);

    if (!extractedContent) {
      console.warn(`[Controller] Content extraction failed or returned null for ${url}`);
      return res.status(404).json({ 
        message: 'Could not extract main content from the provided URL. The website might be incompatible or blocking requests.',
        url 
      });
    }

    console.log(`[Controller] Successfully extracted content for ${url}. Length: ${extractedContent.length}`);
    res.json(extractedContent);

  } catch (error) {
    console.error(`[Controller] Error during content extraction for ${url}:`, error);
    res.status(500).json({ 
      message: 'Server error during content extraction', 
      error: error.message, // Provide error message for debugging
      url
     });
  }
}; 