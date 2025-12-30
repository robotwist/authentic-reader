#!/usr/bin/env node

/**
 * Daily Briefing Script
 * 
 * Orchestrates RSS fetching, AI analysis, and database storage for daily briefing articles.
 * Topics: Ukraine, Gaza, Public Health, Justice, Economy
 * 
 * Usage: npm run daily-briefing (from authentic-reader-backend directory)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../models/index.js';
import rssService from '../services/rssService.js';
import productionAIService from '../services/productionAIService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Define topics for daily briefing with topic-specific sources
const TOPICS = [
  { 
    name: 'Ukraine', 
    keywords: ['ukraine', 'ukrainian', 'russia', 'russian', 'kyiv', 'zelensky', 'war in ukraine'],
    sourceUrls: [
      'https://feeds.bbci.co.uk/news/world/rss.xml', // BBC World (primary)
      'https://www.aljazeera.com/xml/rss/all.xml' // Al Jazeera (backup)
    ]
  },
  { 
    name: 'Gaza', 
    keywords: ['gaza', 'palestine', 'israel', 'hamas', 'gaza strip', 'west bank'],
    sourceUrls: ['https://www.aljazeera.com/xml/rss/all.xml'] // Al Jazeera
  },
  { 
    name: 'Public Health', 
    keywords: ['health', 'medical', 'disease', 'vaccine', 'public health', 'healthcare', 'hospital', 'doctor'],
    sourceUrls: [
      'https://www.sciencedaily.com/rss/top/health.xml', // ScienceDaily (primary)
      'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml' // NYT Health (backup)
    ]
  },
  { 
    name: 'Justice', 
    keywords: ['justice', 'court', 'law', 'legal', 'judge', 'trial', 'lawsuit', 'supreme court'],
    sourceUrls: ['https://thehill.com/homenews/feed/'] // The Hill
  },
  { 
    name: 'Economy', 
    keywords: ['economy', 'economic', 'market', 'stock', 'finance', 'inflation', 'recession', 'employment', 'gdp'],
    sourceUrls: [
      'https://www.cnbc.com/id/10000664/device/rss/rss.html', // CNBC Finance (primary)
      'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml' // NYT Economy (backup)
    ]
  }
];

/**
 * Check if article matches topic based on keywords
 */
function articleMatchesTopic(article, topic) {
  const text = `${article.title || ''} ${article.content || ''} ${article.description || ''}`.toLowerCase();
  return topic.keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Convert topic source URLs to source objects with names extracted from URLs
 */
function getTopicSourceObjects(topicSourceUrls) {
  const urlToNameMap = {
    'https://feeds.bbci.co.uk/news/world/rss.xml': 'BBC World News',
    'https://www.aljazeera.com/xml/rss/all.xml': 'Al Jazeera',
    'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml': 'New York Times Health',
    'https://www.sciencedaily.com/rss/top/health.xml': 'ScienceDaily Health',
    'https://thehill.com/homenews/feed/': 'The Hill',
    'https://www.cnbc.com/id/10000664/device/rss/rss.html': 'CNBC Finance',
    'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml': 'New York Times Economy'
  };
  
  return topicSourceUrls.map(url => ({
    id: null, // Will be resolved from database if exists
    name: urlToNameMap[url] || new URL(url).hostname.replace('www.', ''),
    url: url,
    category: 'news'
  }));
}

/**
 * Fetch articles from RSS for a specific topic using topic-specific sources
 */
async function fetchArticlesForTopic(topic, seenUrls, allSources) {
  const articles = [];
  
  // Use topic-specific sources if defined, otherwise fall back to all sources
  let sourcesToUse;
  if (topic.sourceUrls && topic.sourceUrls.length > 0) {
    // Convert topic URLs to source objects
    const topicSourceObjects = getTopicSourceObjects(topic.sourceUrls);
    
    // Try to find matching sources in database by URL
    sourcesToUse = topicSourceObjects.map(topicSource => {
      const dbSource = allSources.find(s => s.url === topicSource.url);
      if (dbSource) {
        return dbSource;
      }
      return topicSource; // Use URL-based source object if not in DB
    });
    
    logger.info(`[Topic: ${topic.name}] Using ${sourcesToUse.length} topic-specific source(s)...`);
  } else {
    sourcesToUse = allSources;
    logger.info(`[Topic: ${topic.name}] Using all ${sourcesToUse.length} available sources...`);
  }
  
  let totalItemsFetched = 0;
  let totalItemsSkipped = 0;
  let totalItemsNoMatch = 0;
  
  for (const source of sourcesToUse) {
    try {
      logger.info(`  Fetching from ${source.name} (${source.url})...`);
      
      // Fetch RSS feed
      const feedData = await rssService.fetchFeed(source.url, {
        maxItems: 20,
        timeout: 15000
      });
      
      if (!feedData || !feedData.items) {
        logger.warn(`  ⚠️  No items found in feed from ${source.name}`);
        continue;
      }
      
      logger.info(`  📄 Fetched ${feedData.items.length} items from ${source.name}`);
      totalItemsFetched += feedData.items.length;
      
      // Process each item
      for (const item of feedData.items) {
        const normalizedItem = rssService.normalizeItem(item, source.name);
        
        // Skip if already seen
        if (seenUrls.has(normalizedItem.link)) {
          totalItemsSkipped++;
          continue;
        }
        
        // Check if article matches topic
        if (articleMatchesTopic(normalizedItem, topic)) {
          // Add source information
          const article = {
            ...normalizedItem,
            sourceId: source.id,
            source: {
              id: source.id,
              name: source.name,
              url: source.url,
              category: source.category || 'news'
            }
          };
          
          articles.push(article);
          seenUrls.add(normalizedItem.link);
          
          logger.info(`  ✅ Found matching article: ${normalizedItem.title.substring(0, 60)}...`);
        } else {
          totalItemsNoMatch++;
        }
      }
    } catch (error) {
      logger.error(`  ❌ Error fetching from ${source.name}:`, error.message);
      continue;
    }
  }
  
  logger.info(`[Topic: ${topic.name}] Summary: ${totalItemsFetched} items fetched, ${totalItemsSkipped} already seen, ${totalItemsNoMatch} didn't match keywords, ${articles.length} new articles found`);
  return articles;
}

/**
 * Analyze article with AI service
 */
async function analyzeArticle(article) {
  try {
    logger.info(`Analyzing article: ${article.title.substring(0, 60)}...`);
    
    // Use production AI service
    const analysis = await productionAIService.analyzeArticle(article, {
      includeBias: true,
      includeSentiment: true,
      includeCredibility: true,
      includeFallacies: true,
      includeSummary: true
    });
    
    // Format analysis payload for database
    const analysisPayload = {
      summary: analysis.summary || article.description || '',
      bias: analysis.bias || {},
      sentiment: analysis.sentiment || {},
      credibility: analysis.credibility || {},
      fallacies: analysis.fallacies || [],
      confidence_score: analysis.confidence || 0.5,
      tone: analysis.sentiment?.label || 'neutral',
      educational_insight: analysis.summary || '',
      service: analysis.service || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    return analysisPayload;
  } catch (error) {
    logger.error(`Error analyzing article:`, error.message);
    
    // Return basic fallback analysis
    return {
      summary: article.description || article.content?.substring(0, 200) || '',
      bias: { overall: 'unknown' },
      sentiment: { label: 'neutral', score: 0 },
      credibility: { overall: 'medium' },
      fallacies: [],
      confidence_score: 0.3,
      tone: 'neutral',
      educational_insight: article.description || '',
      service: 'fallback',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Topic key mapping for daily briefing
 */
const TOPIC_KEY_MAP = {
  'Ukraine': 'ukraine',
  'Gaza': 'gaza',
  'Public Health': 'diseases',
  'Justice': 'epstein',
  'Economy': 'trump'
};

const TOPIC_ICON_MAP = {
  'ukraine': '🇺🇦',
  'gaza': '🕊️',
  'diseases': '🦠',
  'epstein': '📄',
  'trump': '⚖️'
};

/**
 * Save article to database (both Article and DailyBriefingArticle tables)
 */
async function saveArticle(article, analysisPayload, sourceId, topicName = null) {
  try {
    // Parse publish date
    let publishDate = null;
    if (article.publishDate) {
      publishDate = new Date(article.publishDate);
      if (isNaN(publishDate.getTime())) {
        publishDate = new Date();
      }
    } else {
      publishDate = new Date();
    }
    
    // Check if article already exists by guid in Article table
    const existingArticle = await db.Article.findOne({
      where: { guid: article.guid || article.link }
    });
    
    if (existingArticle) {
      logger.debug(`Article already exists: ${article.title.substring(0, 60)}...`);
      return existingArticle;
    }
    
    // Create new article in Article table
    const savedArticle = await db.Article.create({
      title: article.title,
      link: article.link,
      author: article.author || null,
      publishDate: publishDate,
      content: article.content || article.description || '',
      summary: article.description || '',
      guid: article.guid || article.link,
      sourceId: sourceId,
      categories: article.categories || [],
      analysisPayload: analysisPayload
    });
    
    // ALSO save to DailyBriefingArticle table for the daily briefing page
    if (topicName) {
      const topicKey = TOPIC_KEY_MAP[topicName] || topicName.toLowerCase().replace(/\s+/g, '_');
      const today = new Date().toISOString().split('T')[0];
      
      try {
        // Use upsert to avoid duplicates for same topic on same day
        await db.DailyBriefingArticle.upsert({
          briefingDate: today,
          topic: topicKey,
          topicLabel: topicName,
          icon: TOPIC_ICON_MAP[topicKey] || '📰',
          headline: article.title,
          source: article.source?.name || 'Unknown',
          author: article.author || null,
          url: article.link,
          content: article.content || article.description || '',
          publishDate: publishDate,
          fallacies: analysisPayload || {},
          reliabilityScore: analysisPayload?.confidence_score 
            ? Math.round(analysisPayload.confidence_score * 100) 
            : null
        });
        
        logger.info(`Saved to DailyBriefingArticle: ${topicKey}`);
      } catch (briefingError) {
        logger.error(`Error saving to DailyBriefingArticle:`, briefingError.message);
        // Don't fail the whole save if briefing save fails
      }
    }
    
    logger.info(`Saved article: ${article.title.substring(0, 60)}...`);
    return savedArticle;
  } catch (error) {
    logger.error(`Error saving article:`, error.message);
    logger.error(`Full error:`, error);
    if (error.errors) {
      logger.error(`Validation errors:`, error.errors);
    }
    throw error;
  }
}

/**
 * Main orchestrator function
 * Exported for use in cron jobs or other automation
 */
export const generateDailyBriefing = async () => {
  logger.info('🚀 Starting Daily Briefing Generation...\n');
  
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('✅ Database connection established');
    
    // Get all active sources from database
    const sources = await db.Source.findAll({
      where: {},
      limit: 50 // Limit to prevent too many requests
    });
    
    if (sources.length === 0) {
      logger.warn('⚠️  No sources found in database. Creating fallback sources...');
      // Create fallback sources in database if they don't exist
      const fallbackSourcesConfig = [
        { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'news' },
        { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', category: 'news' },
        { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', category: 'news' },
        { name: 'Associated Press', url: 'https://rsshub.app/apnews/topics/apf-topnews', category: 'news' },
        { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'news' }
      ];
      
      for (const sourceConfig of fallbackSourcesConfig) {
        const [source, created] = await db.Source.findOrCreate({
          where: { name: sourceConfig.name },
          defaults: {
            name: sourceConfig.name,
            url: sourceConfig.url,
            category: sourceConfig.category,
            description: `Default RSS feed source: ${sourceConfig.name}`
          }
        });
        sources.push(source);
        if (created) {
          logger.info(`Created source: ${sourceConfig.name}`);
        }
      }
    }
    
    logger.info(`📰 Found ${sources.length} sources to fetch from\n`);
    
    // Initialize seen URLs set for deduplication
    const seenUrls = new Set();
    
    // Get existing article URLs to avoid duplicates
    const existingArticles = await db.Article.findAll({
      attributes: ['guid', 'link'],
      limit: 1000
    });
    
    existingArticles.forEach(article => {
      if (article.guid) seenUrls.add(article.guid);
      if (article.link) seenUrls.add(article.link);
    });
    
    logger.info(`📋 Found ${seenUrls.size} existing articles to skip\n`);
    
    // Process each topic
    let totalArticles = 0;
    let totalSaved = 0;
    
    for (const topic of TOPICS) {
      logger.info(`\n📌 Processing topic: ${topic.name}`);
      logger.info(`   Keywords: ${topic.keywords.join(', ')}`);
      
      try {
        // Fetch articles for this topic
        const articles = await fetchArticlesForTopic(topic, seenUrls, sources);
        totalArticles += articles.length;
        
        if (articles.length === 0) {
          logger.info(`   No articles found for ${topic.name}`);
          continue;
        }
        
        // Process each article: analyze and save
        for (const article of articles) {
          try {
            // Analyze article
            logger.info(`   Analyzing: ${article.title.substring(0, 60)}...`);
            const analysisPayload = await analyzeArticle(article);
            
            // Get or create source
            let sourceId = article.sourceId;
            if (!sourceId) {
              // Try to find source by name
              const source = await db.Source.findOne({
                where: { name: article.source?.name || 'Unknown' }
              });
              
              if (source) {
                sourceId = source.id;
              } else {
                // Create source if it doesn't exist
                const newSource = await db.Source.create({
                  name: article.source?.name || 'Unknown',
                  url: article.source?.url || article.link,
                  category: article.source?.category || 'news',
                  description: article.source?.description || ''
                });
                sourceId = newSource.id;
              }
            }
            
            // Save article (to both Article and DailyBriefingArticle tables)
            await saveArticle(article, analysisPayload, sourceId, topic.name);
            totalSaved++;
            
            logger.info(`   ✅ Saved: ${article.title.substring(0, 60)}...`);
          } catch (error) {
            logger.error(`   ❌ Error processing article:`, error.message);
            if (error.errors) {
              logger.error(`   Validation errors:`, JSON.stringify(error.errors, null, 2));
            }
            if (error.stack) {
              logger.error(`   Stack trace:`, error.stack);
            }
            continue;
          }
        }
        
        logger.info(`   ✅ Topic ${topic.name}: ${articles.length} articles processed`);
      } catch (error) {
        logger.error(`   ❌ Error processing topic ${topic.name}:`, error.message);
        continue;
      }
    }
    
    logger.info(`\n🎉 Daily Briefing Generation Complete!`);
    logger.info(`   Total articles found: ${totalArticles}`);
    logger.info(`   Total articles saved: ${totalSaved}`);
    logger.info(`   Topics processed: ${TOPICS.length}`);
    
  } catch (error) {
    logger.error('❌ Fatal error in daily briefing generation:', error);
    console.error('Daily briefing generation failed:', error);
    // Don't throw - just return so it can be used as a module without crashing
    return;
  } finally {
    // Only close database connection if running as standalone script
    // When imported as a module, the connection should remain open
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      await db.sequelize.close();
      logger.info('Database connection closed');
    }
  }
};

// Self-running check: Execute the script if run directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateDailyBriefing()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

