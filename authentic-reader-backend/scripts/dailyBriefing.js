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
import industryLeadingAnalysisService from '../services/industryLeadingAnalysisService.js';
import { fetchAndExtractArticle } from '../services/contentExtractionService.js';
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
      
      // Fetch RSS feed - reduced to focus on quality over quantity
      const feedData = await rssService.fetchFeed(source.url, {
        maxItems: 10, // Reduced from 20 to focus on best articles
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
 * Check if content is a full article or just an excerpt/snippet
 * @param {string} content - The article content to check
 * @param {string} description - The article description/summary
 * @param {number} minLength - Minimum required content length
 * @returns {boolean} True if this appears to be a full article
 */
function isFullArticle(content, description, minLength = 2000) {
  if (!content || content.length === 0) return false;
  
  const contentText = content.toLowerCase();
  const descText = (description || '').toLowerCase();
  const contentLength = content.length;
  
  // Check 1: Minimum length requirement
  if (contentLength < minLength) {
    return false;
  }
  
  // Check 2: Excerpt indicators (common phrases in snippets)
  const excerptIndicators = [
    'read more',
    'continue reading',
    'subscribe to read',
    'sign up to read',
    'premium content',
    'this is a summary',
    'click here to read',
    'view full article',
    'read the full story',
    'full article available',
    'members only',
    'paywall',
    'to continue reading',
    'unlock this article'
  ];
  
  const hasExcerptIndicator = excerptIndicators.some(indicator => 
    contentText.includes(indicator) || descText.includes(indicator)
  );
  
  if (hasExcerptIndicator) {
    return false;
  }
  
  // Check 3: Content is mostly just the description (snippet)
  const descLength = description ? description.length : 0;
  if (descLength > 0 && contentLength < descLength * 1.5) {
    return false; // Content is too similar to description (likely snippet)
  }
  
  // Check 4: Content ends abruptly (common in excerpts)
  const endsAbruptly = contentText.endsWith('...') || 
                       contentText.endsWith('…') ||
                       (contentText.includes('...') && contentLength < minLength * 1.5);
  
  if (endsAbruptly) {
    return false;
  }
  
  // Check 5: Very low word count (likely snippet)
  const wordCount = contentText.split(/\s+/).length;
  if (wordCount < 300) { // Less than 300 words is likely a snippet
    return false;
  }
  
  // All checks passed - this appears to be a full article
  return true;
}

/**
 * Fetch full article content from the source URL
 * Uses Mozilla Readability to extract clean article text
 */
async function fetchFullArticleContent(article) {
  if (!article.link) {
    logger.warn(`No link for article: ${article.title?.substring(0, 40)}`);
    return article;
  }
  
  try {
    logger.info(`Fetching full content from: ${article.link.substring(0, 60)}...`);
    const extracted = await fetchAndExtractArticle(article.link);
    
    if (extracted && extracted.textContent) {
      // Use extracted full content
      const fullContent = extracted.textContent.trim();
      
      if (fullContent.length > (article.content?.length || 0)) {
        logger.info(`  ✅ Extracted ${fullContent.length} chars (was ${article.content?.length || 0})`);
        return {
          ...article,
          content: fullContent,
          // Keep HTML version for display
          contentHtml: extracted.content,
          // Use extracted author if available
          author: extracted.byline || article.author,
          // Use extracted title if better
          title: extracted.title || article.title
        };
      }
    }
    
    logger.warn(`  ⚠️  Could not extract full content, using RSS snippet`);
    return article;
  } catch (error) {
    logger.error(`  ❌ Content extraction failed: ${error.message}`);
    return article;
  }
}

/**
 * Analyze article with INDUSTRY-LEADING AI service
 * Now returns comprehensive analysis with:
 * - Logic scores with 5-dimension breakdown
 * - Claim verification
 * - Emotional manipulation scoring
 * - Stakeholder analysis
 * - Reader guidance
 */
async function analyzeArticle(article) {
  try {
    logger.info(`🔬 Deep analyzing article: ${article.title.substring(0, 60)}...`);
    
    // Use industry-leading deep analysis service
    const fullAnalysis = await industryLeadingAnalysisService.analyzeArticle(article);
    
    // Format comprehensive analysis payload for database
    const analysisPayload = {
      // Core analysis
      summary: fullAnalysis.executive_summary?.one_sentence || article.description || '',
      executive_summary: fullAnalysis.executive_summary || null,
      
      // Logic scoring
      logic_score: fullAnalysis.logic_score || null,
      
      // Bias analysis  
      bias: {
        overall: fullAnalysis.bias_analysis?.political_lean || 'center',
        confidence: fullAnalysis.bias_analysis?.confidence || 50,
        evidence: fullAnalysis.bias_analysis?.evidence || [],
        framing: fullAnalysis.bias_analysis?.framing || '',
        missing_perspectives: fullAnalysis.bias_analysis?.what_perspectives_missing || []
      },
      
      // Emotional manipulation
      emotional_manipulation: fullAnalysis.emotional_manipulation || null,
      
      // Rhetorical analysis with manipulation techniques
      rhetorical_analysis: fullAnalysis.rhetorical_analysis || null,
      fallacies: (fullAnalysis.rhetorical_analysis?.manipulation_techniques || []).map(t => ({
        type: t.type,
        category: t.category,
        quote: t.quote,
        explanation: t.explanation,
        neutral_rewrite: t.neutral_rewrite,
        severity: t.severity
      })),
      
      // Claim verification
      claim_verification: fullAnalysis.claim_verification || [],
      
      // Stakeholder analysis
      stakeholder_analysis: fullAnalysis.stakeholder_analysis || null,
      
      // Missing context
      missing_context: fullAnalysis.missing_context || null,
      
      // Reader guidance
      reader_guidance: fullAnalysis.reader_guidance || null,
      
      // Overall assessment
      overall_assessment: fullAnalysis.overall_assessment || null,
      
      // Legacy fields for backward compatibility
      sentiment: { 
        label: fullAnalysis.emotional_manipulation?.intended_emotional_response || 'neutral',
        score: (100 - (fullAnalysis.emotional_manipulation?.score || 50)) / 100
      },
      credibility: { 
        overall: fullAnalysis.overall_assessment?.reliability || 'medium',
        score: (fullAnalysis.logic_score?.overall || 50) / 100
      },
      confidence_score: (fullAnalysis.logic_score?.overall || 50) / 100,
      tone: fullAnalysis.emotional_manipulation?.intended_emotional_response || 'neutral',
      educational_insight: fullAnalysis.reader_guidance?.media_literacy_lesson || '',
      
      // Metadata
      service: 'industry-leading',
      analysis_version: '2.0',
      timestamp: new Date().toISOString()
    };
    
    logger.info(`   ✅ Deep analysis complete - Logic Score: ${fullAnalysis.logic_score?.overall || 'N/A'}`);
    return analysisPayload;
  } catch (error) {
    logger.error(`Error in deep analysis:`, error.message);
    
    // Return basic fallback analysis
    return {
      summary: article.description || article.content?.substring(0, 200) || '',
      executive_summary: null,
      logic_score: null,
      bias: { overall: 'unknown' },
      emotional_manipulation: null,
      rhetorical_analysis: null,
      fallacies: [],
      claim_verification: [],
      stakeholder_analysis: null,
      missing_context: null,
      reader_guidance: null,
      overall_assessment: { reliability: 'unknown', recommended_action: 'verify' },
      sentiment: { label: 'neutral', score: 0 },
      credibility: { overall: 'medium' },
      confidence_score: 0.3,
      tone: 'neutral',
      educational_insight: article.description || '',
      service: 'fallback',
      analysis_version: '2.0',
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
    
    // STRICT REQUIREMENTS: Exactly 1 full article per topic, no excerpts/snippets
    const REQUIRED_ARTICLES_PER_TOPIC = 1; // Exactly 1 article per topic (no more, no less)
    const MIN_CONTENT_LENGTH = 2000; // Increased: Require substantial full content (no snippets)
    const MAX_ARTICLES_TO_TRY_PER_TOPIC = 15; // Try up to 15 articles to find one full article
    
    let totalArticles = 0;
    let totalSaved = 0;
    const topicResults = {};
    
    for (const topic of TOPICS) {
      logger.info(`\n📌 Processing topic: ${topic.name}`);
      logger.info(`   Keywords: ${topic.keywords.join(', ')}`);
      logger.info(`   Goal: Find exactly ${REQUIRED_ARTICLES_PER_TOPIC} full article (no excerpts/snippets)`);
      
      let articleFound = false;
      let articlesTried = 0;
      
      try {
        // Fetch articles for this topic
        const articles = await fetchArticlesForTopic(topic, seenUrls, sources);
        totalArticles += articles.length;
        
        if (articles.length === 0) {
          logger.warn(`   ⚠️  No articles found for ${topic.name}`);
          topicResults[topic.name] = { success: false, reason: 'No articles found' };
          continue;
        }
        
        logger.info(`   📊 Found ${articles.length} potential articles. Searching for full article...`);
        
        // Try articles until we find one that meets full article criteria
        for (let article of articles) {
          if (articleFound) break; // Already found one for this topic
          if (articlesTried >= MAX_ARTICLES_TO_TRY_PER_TOPIC) {
            logger.warn(`   ⚠️  Tried ${articlesTried} articles, none met full article criteria`);
            break;
          }
          
          articlesTried++;
          
          try {
            // First, fetch full article content from source
            logger.info(`   [${articlesTried}] 📥 Fetching: ${article.title.substring(0, 50)}...`);
            article = await fetchFullArticleContent(article);
            
            // STRICT FILTER: Check if this is a full article (not excerpt/snippet)
            const content = article.content || '';
            const description = article.description || '';
            const contentLength = content.length;
            
            // Check 1: Minimum length requirement
            if (contentLength < MIN_CONTENT_LENGTH) {
              logger.warn(`      ❌ Rejected: Only ${contentLength} chars (minimum: ${MIN_CONTENT_LENGTH})`);
              continue; // Try next article
            }
            
            // Check 2: Is it actually a full article or just an excerpt?
            if (!isFullArticle(content, description, MIN_CONTENT_LENGTH)) {
              logger.warn(`      ❌ Rejected: Appears to be excerpt/snippet, not full article`);
              logger.warn(`      Title: ${article.title.substring(0, 60)}...`);
              continue; // Try next article
            }
            
            logger.info(`      ✅ Full article verified: ${contentLength} characters`);
            logger.info(`      ✅ No excerpt indicators found - this is a complete article`);
            
            // Deep analyze article with comprehensive LLM analysis
            logger.info(`      🔬 Deep analyzing: ${article.title.substring(0, 60)}...`);
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
            articleFound = true;
            
            logger.info(`      ✅ SAVED: ${article.title.substring(0, 60)}...`);
            logger.info(`      ✅ Topic "${topic.name}": 1 full article found and saved`);
            topicResults[topic.name] = { success: true, article: article.title };
            break; // Found one, move to next topic
            
          } catch (error) {
            logger.error(`      ❌ Error processing article:`, error.message);
            continue; // Try next article
          }
        }
        
        if (!articleFound) {
          logger.error(`   ❌ FAILED: Could not find a full article for topic "${topic.name}"`);
          logger.error(`   Tried ${articlesTried} articles, none met full article criteria`);
          topicResults[topic.name] = { success: false, reason: 'No full articles found', tried: articlesTried };
        }
        
      } catch (error) {
        logger.error(`   ❌ Error processing topic ${topic.name}:`, error.message);
        topicResults[topic.name] = { success: false, reason: error.message };
        continue;
      }
    }
    
    // Summary report
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🎉 Daily Briefing Generation Complete!`);
    logger.info(`${'='.repeat(60)}`);
    logger.info(`   📰 Total articles found: ${totalArticles}`);
    logger.info(`   ✅ Articles saved: ${totalSaved} (target: ${TOPICS.length})`);
    logger.info(`   🎯 Requirement: Exactly 1 full article per topic (no excerpts/snippets)`);
    logger.info(`   📏 Minimum content: ${MIN_CONTENT_LENGTH} characters`);
    logger.info(`\n   Topic Results:`);
    
    const successful = Object.values(topicResults).filter(r => r.success).length;
    const failed = Object.values(topicResults).filter(r => !r.success).length;
    
    for (const [topicName, result] of Object.entries(topicResults)) {
      if (result.success) {
        logger.info(`      ✅ ${topicName}: ${result.article?.substring(0, 50)}...`);
      } else {
        logger.warn(`      ❌ ${topicName}: ${result.reason}${result.tried ? ` (tried ${result.tried} articles)` : ''}`);
      }
    }
    
    logger.info(`\n   Summary: ${successful}/${TOPICS.length} topics have full articles`);
    if (failed > 0) {
      logger.warn(`   ⚠️  ${failed} topic(s) failed to find full articles`);
    }
    logger.info(`${'='.repeat(60)}\n`);
    
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

