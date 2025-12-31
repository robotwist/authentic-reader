/**
 * Daily Reliable Article Fetcher
 * 
 * Ensures we consistently fetch 5 full articles per day from the most reliable RSS sources.
 * This script prioritizes sources that:
 * 1. Have reliable RSS feeds
 * 2. Provide full article content (not just summaries)
 * 3. Are consistently available
 * 
 * Usage: Can be run manually or scheduled via cron
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

import jsonArticleService from '../services/jsonArticleService.js';
import productionAIService from '../services/productionAIService.js';
import logger from '../utils/logger.js';

// Prioritized list of reliable sources that consistently provide full content
// Based on testing, these sources have proven most reliable
const RELIABLE_SOURCES = [
  'bbc',
  'guardian', 
  'npr',
  'thehill',
  'techcrunch',
  'arstechnica',
  'pbs',
  'aljazeera',
  'propublica',
  'theatlantic',
  'wired',
  'cnbc'
];

// Fallback sources if primary ones fail
const FALLBACK_SOURCES = [
  'nytimes',
  'economist',
  'politico',
  'wsj'
];

class DailyReliableFetcher {
  constructor() {
    this.targetArticles = 5;
    this.minContentLength = 1000; // Minimum chars for "full" article
    this.fetchedArticles = [];
    this.analyzedArticles = [];
  }

  async initialize() {
    if (jsonArticleService.initialize) {
      await jsonArticleService.initialize();
    }
    logger.info('DailyReliableFetcher initialized');
  }

  /**
   * Fetch articles from a source and filter for full content
   */
  async fetchFullArticlesFromSource(sourceKey, maxArticles = 3) {
    try {
      const source = jsonArticleService.getSource(sourceKey);
      if (!source) {
        logger.warn(`Source ${sourceKey} not found`);
        return [];
      }

      logger.info(`Fetching from ${source.name}...`);
      const articles = await jsonArticleService.fetchFromSource(source, maxArticles * 2); // Fetch extra to filter

      if (!articles || articles.length === 0) {
        return [];
      }

      // Filter for articles with full content
      const fullArticles = articles.filter(article => {
        const contentLength = article.content?.length || 0;
        return contentLength >= this.minContentLength;
      });

      logger.info(`  ✓ Found ${fullArticles.length} full articles (${articles.length} total) from ${source.name}`);
      return fullArticles.slice(0, maxArticles); // Limit to maxArticles

    } catch (error) {
      logger.error(`  ✗ Error fetching from ${sourceKey}:`, error.message);
      return [];
    }
  }

  /**
   * Analyze a single article
   */
  async analyzeArticle(article) {
    try {
      logger.info(`  🔍 Analyzing: "${article.title?.substring(0, 60)}..."`);
      
      const analysis = await productionAIService.analyzeArticle(article, {
        includeManipulationTechniques: true,
        includeEducationalInsights: true
      });

      // Save analysis
      await jsonArticleService.saveArticleAnalysis(article.id, analysis);

      return {
        success: true,
        article,
        analysis
      };
    } catch (error) {
      logger.error(`  ✗ Analysis failed:`, error.message);
      return {
        success: false,
        article,
        error: error.message
      };
    }
  }

  /**
   * Main fetch process - ensures we get targetArticles number of full articles
   */
  async fetchDailyArticles() {
    logger.info('\n' + '='.repeat(60));
    logger.info('📰 Daily Reliable Article Fetch');
    logger.info(`Target: ${this.targetArticles} full articles`);
    logger.info('='.repeat(60) + '\n');

    // Try reliable sources first
    let sourceList = [...RELIABLE_SOURCES];
    let articlesFetched = 0;
    let attempts = 0;
    const maxAttempts = RELIABLE_SOURCES.length + FALLBACK_SOURCES.length;

    while (articlesFetched < this.targetArticles && attempts < maxAttempts) {
      const sourceKey = sourceList[attempts % sourceList.length];
      
      // If we've tried all reliable sources, switch to fallbacks
      if (attempts >= RELIABLE_SOURCES.length && sourceList === RELIABLE_SOURCES) {
        logger.info('\n⚠️  Primary sources exhausted, trying fallback sources...\n');
        sourceList = [...FALLBACK_SOURCES];
      }

      const articles = await this.fetchFullArticlesFromSource(sourceKey, 2);
      
      if (articles.length > 0) {
        // Add articles that we don't already have
        for (const article of articles) {
          if (articlesFetched >= this.targetArticles) break;
          
          // Check if we already have this article
          const existingArticles = await jsonArticleService.loadExistingArticles();
          const alreadyExists = existingArticles.some(a => a.id === article.id || a.url === article.url);
          
          if (!alreadyExists) {
            this.fetchedArticles.push(article);
            articlesFetched++;
            logger.info(`  ✓ Added article ${articlesFetched}/${this.targetArticles}: "${article.title?.substring(0, 50)}..."`);
          } else {
            logger.debug(`  ⊘ Skipped duplicate: "${article.title?.substring(0, 50)}..."`);
          }
        }
      }

      attempts++;
      
      // Add delay between sources to avoid rate limiting
      if (attempts < maxAttempts && articlesFetched < this.targetArticles) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (articlesFetched < this.targetArticles) {
      logger.warn(`\n⚠️  Only fetched ${articlesFetched} articles (target: ${this.targetArticles})`);
    } else {
      logger.info(`\n✅ Successfully fetched ${articlesFetched} full articles\n`);
    }

    return this.fetchedArticles;
  }

  /**
   * Analyze all fetched articles
   */
  async analyzeFetchedArticles() {
    if (this.fetchedArticles.length === 0) {
      logger.warn('No articles to analyze');
      return [];
    }

    logger.info(`\n🔬 Analyzing ${this.fetchedArticles.length} articles...\n`);

    for (let i = 0; i < this.fetchedArticles.length; i++) {
      const article = this.fetchedArticles[i];
      logger.info(`[${i + 1}/${this.fetchedArticles.length}] Processing...`);
      
      const result = await this.analyzeArticle(article);
      this.analyzedArticles.push(result);

      // Add delay between analyses to respect rate limits
      if (i < this.fetchedArticles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay for Groq
      }
    }

    const successful = this.analyzedArticles.filter(r => r.success).length;
    logger.info(`\n✅ Analysis complete: ${successful}/${this.analyzedArticles.length} successful\n`);

    return this.analyzedArticles;
  }

  /**
   * Main execution
   */
  async execute() {
    try {
      await this.initialize();
      
      // Fetch articles
      await this.fetchDailyArticles();
      
      // Analyze articles
      await this.analyzeFetchedArticles();
      
      // Summary
      logger.info('\n' + '='.repeat(60));
      logger.info('📊 SUMMARY');
      logger.info('='.repeat(60));
      logger.info(`Articles Fetched: ${this.fetchedArticles.length}`);
      logger.info(`Articles Analyzed: ${this.analyzedArticles.filter(r => r.success).length}`);
      logger.info(`Target Met: ${this.fetchedArticles.length >= this.targetArticles ? '✅ YES' : '❌ NO'}`);
      logger.info('='.repeat(60) + '\n');

      return {
        success: true,
        fetched: this.fetchedArticles.length,
        analyzed: this.analyzedArticles.filter(r => r.success).length,
        targetMet: this.fetchedArticles.length >= this.targetArticles
      };
    } catch (error) {
      logger.error('Fatal error:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const fetcher = new DailyReliableFetcher();
    const result = await fetcher.execute();
    
    if (result.targetMet) {
      process.exit(0);
    } else {
      logger.warn('Target not fully met, but process completed');
      process.exit(0); // Still exit successfully
    }
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default DailyReliableFetcher;
