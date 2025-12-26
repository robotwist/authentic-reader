/**
 * Daily Briefing Generator
 * 
 * Fetches 1 trending article for each of 5 topics, analyzes them with our PhD LLM,
 * and saves results to daily_briefing.json for the frontend to consume.
 * 
 * Topics:
 * - War in Ukraine
 * - War in Gaza/Palestine
 * - Jeffrey Epstein
 * - Emerging Infectious Diseases
 * - Donald Trump
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import rssService from '../services/rssService.js';
import enhancedAIAnalysisService from '../services/enhancedAIAnalysisService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diverse, established news sources
const ESTABLISHED_SOURCES = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'world' },
  { name: 'Reuters', url: 'https://www.reuters.com/rssFeed/worldNews', category: 'world' },
  { name: 'Associated Press', url: 'https://apnews.com/apf-topnews', category: 'world' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world' },
  { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', category: 'news' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'world' },
  { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'world' },
  { name: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world', category: 'world' },
];

// Topic keywords for filtering articles
const TOPICS = {
  'ukraine': {
    name: 'War in Ukraine',
    keywords: ['ukraine', 'russian', 'putin', 'zelensky', 'kyiv', 'donbas', 'crimea'],
    icon: '🇺🇦'
  },
  'gaza': {
    name: 'War in Gaza/Palestine',
    keywords: ['gaza', 'palestine', 'israel', 'hamas', 'west bank', 'jerusalem', 'idf'],
    icon: '🇵🇸'
  },
  'epstein': {
    name: 'Jeffrey Epstein',
    keywords: ['epstein', 'ghislaine', 'maxwell', 'jeffrey epstein'],
    icon: '📋'
  },
  'diseases': {
    name: 'Emerging Infectious Diseases',
    keywords: ['disease', 'outbreak', 'pandemic', 'virus', 'infection', 'epidemic', 'covid', 'flu', 'health'],
    icon: '🦠'
  },
  'trump': {
    name: 'Donald Trump',
    keywords: ['trump', 'donald trump', 'former president', 'president trump'],
    icon: '🇺🇸'
  }
};

/**
 * Extract full article content from URL
 */
async function extractFullContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    return article?.textContent || '';
  } catch (error) {
    logger.warn(`Failed to extract content from ${url}: ${error.message}`);
    return '';
  }
}

/**
 * Count words in text
 */
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if article matches topic keywords
 */
function matchesTopic(article, topic) {
  const searchText = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
  return topic.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

/**
 * Select the best article for a topic from fetched articles
 * Prioritizes: length > 500 words, diverse sources, recent publication
 */
function selectDailyArticle(articles, topic) {
  // Filter articles that match the topic
  const matchingArticles = articles.filter(article => matchesTopic(article, topic));
  
  if (matchingArticles.length === 0) {
    logger.warn(`No articles found for topic: ${topic.name}`);
    return null;
  }
  
  // Score articles: prioritize length > 500 words, then recency
  const scored = matchingArticles.map(article => {
    const wordCount = countWords(article.content || article.description || '');
    const lengthScore = wordCount > 500 ? 10 : wordCount > 300 ? 5 : 1;
    const recencyScore = article.publishDate ? 
      Math.max(0, 10 - Math.floor((Date.now() - new Date(article.publishDate).getTime()) / (24 * 60 * 60 * 1000))) : 0;
    
    return {
      article,
      score: lengthScore + recencyScore,
      wordCount
    };
  });
  
  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0]?.article || null;
}

/**
 * Fetch articles from all sources
 */
async function fetchAllArticles() {
  logger.info('Fetching articles from all sources...');
  
  const allArticles = [];
  const sourceUrls = ESTABLISHED_SOURCES.map(s => s.url);
  
  // Fetch all feeds concurrently
  const feedResults = await rssService.fetchFeeds(sourceUrls, {
    concurrency: 5,
    timeout: 10000,
    maxItems: 20
  });
  
  // Process results
  for (let i = 0; i < feedResults.length; i++) {
    const result = feedResults[i];
    const source = ESTABLISHED_SOURCES[i];
    
    if (result && result.data && result.data.items) {
      for (const item of result.data.items) {
        try {
          const normalized = rssService.normalizeItem(item, source.name);
          
          // Extract full content if not present
          let content = normalized.content || normalized.description || '';
          if (!content || countWords(content) < 200) {
            logger.info(`Extracting full content for: ${normalized.title}`);
            content = await extractFullContent(normalized.link || normalized.url);
          }
          
          allArticles.push({
            title: normalized.title,
            url: normalized.link || normalized.url,
            description: normalized.description,
            content: content,
            publishDate: normalized.publishDate,
            author: normalized.author,
            source: source.name,
            guid: normalized.guid
          });
        } catch (error) {
          logger.error(`Error processing article from ${source.name}:`, error.message);
        }
      }
    }
  }
  
  logger.info(`Fetched ${allArticles.length} total articles`);
  return allArticles;
}

/**
 * Generate daily briefing
 */
async function generateDailyBriefing() {
  logger.info('=== Starting Daily Briefing Generation ===');
  const startTime = Date.now();
  
  try {
    // Step 1: Fetch all articles
    const allArticles = await fetchAllArticles();
    
    // Step 2: Select 1 article per topic
    const selectedArticles = {};
    
    for (const [topicKey, topic] of Object.entries(TOPICS)) {
      logger.info(`Selecting article for topic: ${topic.name}`);
      const article = selectDailyArticle(allArticles, topic);
      
      if (article) {
        selectedArticles[topicKey] = {
          topic: topic.name,
          icon: topic.icon,
          article: {
            title: article.title,
            url: article.url,
            source: article.source,
            publishDate: article.publishDate,
            author: article.author,
            content: article.content || article.description
          },
          analysis: null // Will be filled in next step
        };
        logger.info(`Selected: ${article.title} from ${article.source}`);
      } else {
        logger.warn(`No article selected for topic: ${topic.name}`);
      }
    }
    
    // Step 3: Analyze each article with our PhD LLM
    logger.info('Starting LLM analysis for selected articles...');
    
    for (const [topicKey, topicData] of Object.entries(selectedArticles)) {
      if (!topicData.article) continue;
      
      try {
        logger.info(`Analyzing article: ${topicData.article.title}`);
        
        const analysis = await enhancedAIAnalysisService.analyzeArticle({
          title: topicData.article.title,
          content: topicData.article.content,
          url: topicData.article.url,
          source: { name: topicData.article.source }
        });
        
        selectedArticles[topicKey].analysis = analysis;
        logger.info(`Analysis complete for: ${topicData.article.title}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Analysis failed for ${topicData.article.title}:`, error.message);
        selectedArticles[topicKey].analysis = {
          error: error.message,
          fallback: true
        };
      }
    }
    
    // Step 4: Save to daily_briefing.json
    const briefing = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      topics: selectedArticles
    };
    
    const outputPath = path.join(__dirname, '../../data/daily_briefing.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(briefing, null, 2), 'utf-8');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`=== Daily Briefing Generated Successfully in ${duration}s ===`);
    logger.info(`Saved to: ${outputPath}`);
    
    return briefing;
    
  } catch (error) {
    logger.error('Daily briefing generation failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDailyBriefing()
    .then(() => {
      logger.info('Daily briefing generation completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Daily briefing generation failed:', error);
      process.exit(1);
    });
}

export default generateDailyBriefing;

