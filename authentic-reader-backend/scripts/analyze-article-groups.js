/**
 * Analyze Article Groups Script
 * 
 * Fetches and analyzes 3 groups of 5 articles (15 total) from different sources
 * to build history/archives and validate analysis markers.
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

// Article groups configuration
const ARTICLE_GROUPS = [
  {
    name: 'Group 1: International News',
    sources: ['bbc', 'reuters', 'ap', 'guardian', 'nytimes'],
    maxPerSource: 1
  },
  {
    name: 'Group 2: US Politics',
    sources: ['npr', 'nytimes', 'ap', 'thehill', 'wsj'],
    maxPerSource: 1
  },
  {
    name: 'Group 3: Technology & Business',
    sources: ['reuters', 'wsj', 'economist', 'techcrunch', 'arstechnica'],
    maxPerSource: 1
  }
];

class ArticleGroupAnalyzer {
  constructor() {
    this.articleService = jsonArticleService;
    this.aiService = productionAIService;
    this.results = {
      groups: [],
      summary: {
        totalArticles: 0,
        successful: 0,
        failed: 0,
        markers: {
          biasDetected: 0,
          fallaciesDetected: 0,
          manipulationTechniques: 0,
          credibilityIssues: 0
        }
      }
    };
  }

  async initialize() {
    // Initialize the article service if needed
    if (this.articleService.initialize) {
      await this.articleService.initialize();
    }
    logger.info('ArticleGroupAnalyzer initialized');
  }

  /**
   * Fetch articles for a specific group
   */
  async fetchGroupArticles(group) {
    logger.info(`\n📰 Fetching articles for ${group.name}`);
    const articles = [];

    for (const sourceKey of group.sources) {
      try {
        const source = this.articleService.getSource(sourceKey);
        if (!source) {
          logger.warn(`Source ${sourceKey} not found, skipping`);
          continue;
        }

        logger.info(`  Fetching from ${source.name}...`);
        const fetchedArticles = await this.articleService.fetchFromSource(
          source,
          group.maxPerSource
        );

        if (fetchedArticles && fetchedArticles.length > 0) {
          articles.push(...fetchedArticles.slice(0, group.maxPerSource));
          logger.info(`  ✓ Found ${Math.min(fetchedArticles.length, group.maxPerSource)} article(s)`);
        } else {
          logger.warn(`  ⚠ No articles found from ${source.name}`);
        }
      } catch (error) {
        logger.error(`  ✗ Error fetching from ${sourceKey}:`, error.message);
      }
    }

    return articles;
  }

  /**
   * Analyze a single article with AI
   */
  async analyzeArticle(article) {
    try {
      logger.info(`\n  🔍 Analyzing: "${article.title?.substring(0, 60)}..."`);
      
      // Use production AI service for comprehensive analysis
      const analysis = await this.aiService.analyzeArticle(article, {
        includeManipulationTechniques: true,
        includeEducationalInsights: true
      });

      // Save analysis
      await this.articleService.saveArticleAnalysis(article.id, analysis);

      // Extract markers for validation
      const markers = this.extractMarkers(analysis);

      return {
        success: true,
        article,
        analysis,
        markers
      };
    } catch (error) {
      logger.error(`  ✗ Analysis failed:`, error.message);
      return {
        success: false,
        article,
        error: error.message,
        markers: null
      };
    }
  }

  /**
   * Extract key markers from analysis for validation
   */
  extractMarkers(analysis) {
    const markers = {
      biasDetected: false,
      fallaciesDetected: false,
      manipulationTechniques: false,
      credibilityIssues: false,
      details: {}
    };

    // Check for bias
    if (analysis.bias) {
      const biasDirection = analysis.bias.direction || analysis.bias;
      if (biasDirection && biasDirection !== 'center' && biasDirection !== 'neutral') {
        markers.biasDetected = true;
        markers.details.bias = biasDirection;
      }
    }

    // Check for logical fallacies
    if (analysis.logicalFallacies && Array.isArray(analysis.logicalFallacies)) {
      if (analysis.logicalFallacies.length > 0) {
        markers.fallaciesDetected = true;
        markers.details.fallacies = analysis.logicalFallacies.length;
        markers.details.fallacyTypes = analysis.logicalFallacies.map(f => f.type || f);
      }
    }

    // Check for manipulation techniques
    if (analysis.manipulationTechniques && Array.isArray(analysis.manipulationTechniques)) {
      if (analysis.manipulationTechniques.length > 0) {
        markers.manipulationTechniques = true;
        markers.details.techniques = analysis.manipulationTechniques.length;
      }
    }

    // Check for credibility issues
    if (analysis.credibility) {
      const credibilityLevel = analysis.credibility.level || analysis.credibility;
      if (credibilityLevel === 'low' || (analysis.credibility.score && analysis.credibility.score < 0.5)) {
        markers.credibilityIssues = true;
        markers.details.credibility = credibilityLevel;
      }
    }

    return markers;
  }

  /**
   * Process a single group
   */
  async processGroup(group) {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`Processing ${group.name}`);
    logger.info(`${'='.repeat(60)}`);

    const groupResult = {
      name: group.name,
      articles: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        markers: {
          biasDetected: 0,
          fallaciesDetected: 0,
          manipulationTechniques: 0,
          credibilityIssues: 0
        }
      }
    };

    // Fetch articles for this group
    const articles = await this.fetchGroupArticles(group);
    groupResult.summary.total = articles.length;

    if (articles.length === 0) {
      logger.warn(`⚠ No articles found for ${group.name}`);
      this.results.groups.push(groupResult);
      return groupResult;
    }

    // Analyze each article
    logger.info(`\n🔬 Analyzing ${articles.length} articles...`);
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      logger.info(`\n[${i + 1}/${articles.length}] Processing article...`);
      
      const result = await this.analyzeArticle(article);
      groupResult.articles.push(result);

      if (result.success) {
        groupResult.summary.successful++;
        
        // Update marker counts
        if (result.markers) {
          if (result.markers.biasDetected) groupResult.summary.markers.biasDetected++;
          if (result.markers.fallaciesDetected) groupResult.summary.markers.fallaciesDetected++;
          if (result.markers.manipulationTechniques) groupResult.summary.markers.manipulationTechniques++;
          if (result.markers.credibilityIssues) groupResult.summary.markers.credibilityIssues++;
        }
      } else {
        groupResult.summary.failed++;
      }

      // Add delay between analyses to respect rate limits
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    this.results.groups.push(groupResult);
    return groupResult;
  }

  /**
   * Process all groups
   */
  async processAllGroups() {
    logger.info('\n🚀 Starting Article Group Analysis');
    logger.info(`📊 Will analyze ${ARTICLE_GROUPS.length} groups of articles\n`);

    for (const group of ARTICLE_GROUPS) {
      await this.processGroup(group);
      
      // Add delay between groups
      if (ARTICLE_GROUPS.indexOf(group) < ARTICLE_GROUPS.length - 1) {
        logger.info('\n⏳ Waiting 5 seconds before next group...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Calculate overall summary
    this.calculateSummary();
    this.printResults();
  }

  /**
   * Calculate overall summary statistics
   */
  calculateSummary() {
    this.results.summary.totalArticles = this.results.groups.reduce(
      (sum, group) => sum + group.summary.total, 0
    );
    this.results.summary.successful = this.results.groups.reduce(
      (sum, group) => sum + group.summary.successful, 0
    );
    this.results.summary.failed = this.results.groups.reduce(
      (sum, group) => sum + group.summary.failed, 0
    );

    // Aggregate markers
    this.results.groups.forEach(group => {
      this.results.summary.markers.biasDetected += group.summary.markers.biasDetected;
      this.results.summary.markers.fallaciesDetected += group.summary.markers.fallaciesDetected;
      this.results.summary.markers.manipulationTechniques += group.summary.markers.manipulationTechniques;
      this.results.summary.markers.credibilityIssues += group.summary.markers.credibilityIssues;
    });
  }

  /**
   * Print results summary
   */
  printResults() {
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 ANALYSIS RESULTS SUMMARY');
    logger.info('='.repeat(60));

    logger.info(`\n📈 Overall Statistics:`);
    logger.info(`  Total Articles: ${this.results.summary.totalArticles}`);
    logger.info(`  Successful: ${this.results.summary.successful}`);
    logger.info(`  Failed: ${this.results.summary.failed}`);
    logger.info(`  Success Rate: ${((this.results.summary.successful / this.results.summary.totalArticles) * 100).toFixed(1)}%`);

    logger.info(`\n🔍 Markers Detected:`);
    logger.info(`  Bias Detected: ${this.results.summary.markers.biasDetected} articles`);
    logger.info(`  Fallacies Detected: ${this.results.summary.markers.fallaciesDetected} articles`);
    logger.info(`  Manipulation Techniques: ${this.results.summary.markers.manipulationTechniques} articles`);
    logger.info(`  Credibility Issues: ${this.results.summary.markers.credibilityIssues} articles`);

    logger.info(`\n📋 Group Breakdown:`);
    this.results.groups.forEach((group, index) => {
      logger.info(`\n  Group ${index + 1}: ${group.name}`);
      logger.info(`    Total: ${group.summary.total}`);
      logger.info(`    Successful: ${group.summary.successful}`);
      logger.info(`    Failed: ${group.summary.failed}`);
      logger.info(`    Markers:`);
      logger.info(`      - Bias: ${group.summary.markers.biasDetected}`);
      logger.info(`      - Fallacies: ${group.summary.markers.fallaciesDetected}`);
      logger.info(`      - Manipulation: ${group.summary.markers.manipulationTechniques}`);
      logger.info(`      - Credibility: ${group.summary.markers.credibilityIssues}`);

      // Show sample articles with markers
      const articlesWithMarkers = group.articles.filter(a => 
        a.success && a.markers && (
          a.markers.biasDetected || 
          a.markers.fallaciesDetected || 
          a.markers.manipulationTechniques || 
          a.markers.credibilityIssues
        )
      );

      if (articlesWithMarkers.length > 0) {
        logger.info(`\n    Sample Articles with Markers:`);
        articlesWithMarkers.slice(0, 3).forEach(article => {
          logger.info(`      • "${article.article.title?.substring(0, 50)}..."`);
          if (article.markers.details.bias) {
            logger.info(`        Bias: ${article.markers.details.bias}`);
          }
          if (article.markers.details.fallacies) {
            logger.info(`        Fallacies: ${article.markers.details.fallacies} detected`);
          }
          if (article.markers.details.techniques) {
            logger.info(`        Manipulation Techniques: ${article.markers.details.techniques}`);
          }
          if (article.markers.details.credibility) {
            logger.info(`        Credibility: ${article.markers.details.credibility}`);
          }
        });
      }
    });

    logger.info('\n' + '='.repeat(60));
    logger.info('✅ Analysis Complete!');
    logger.info('='.repeat(60));
    logger.info('\n💾 All articles and analyses have been saved to:');
    logger.info('   - data/articles.json');
    logger.info('   - data/analysis.json');
    logger.info('\n');
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new ArticleGroupAnalyzer();
    await analyzer.initialize();
    await analyzer.processAllGroups();
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default ArticleGroupAnalyzer;
