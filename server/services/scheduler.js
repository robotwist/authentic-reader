import cron from 'node-cron';
import { fetchAndProcessFeeds } from './rss-service.js';
import { analyzeUnanalyzedArticles } from './analysis-service.js';
import logger from '../utils/logger.js';

// Schedule RSS feed fetching every hour and analysis every 30 minutes
export function startScheduler() {
  // Run immediately on startup
  fetchAndProcessFeeds().catch(error => {
    logger.error('Initial RSS feed fetch failed:', error);
  });

  // Schedule hourly RSS feed updates
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Starting scheduled RSS feed fetch');
      const results = await fetchAndProcessFeeds();
      logger.info(`RSS feed fetch completed. Added ${results.length} new articles.`);
    } catch (error) {
      logger.error('Scheduled RSS feed fetch failed:', error);
    }
  });

  // Schedule article analysis every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      logger.info('Starting scheduled article analysis');
      const results = await analyzeUnanalyzedArticles();
      logger.info(`Article analysis completed. Analyzed ${results.length} articles.`);
    } catch (error) {
      logger.error('Scheduled article analysis failed:', error);
    }
  });

  logger.info('Scheduler started - RSS feeds and article analysis');
} 