#!/usr/bin/env node

/**
 * Update Article Content Script
 * 
 * Re-fetches full content for articles that only have RSS snippets.
 * Updates both Article and DailyBriefingArticle tables.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../models/index.js';
import { fetchAndExtractArticle } from '../services/contentExtractionService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function updateArticleContent() {
  try {
    await db.sequelize.authenticate();
    logger.info('✅ Database connected');

    // Find articles with short content (likely just RSS snippets)
    const shortContentThreshold = 500; // Articles with less than 500 chars probably need updating
    
    // Update DailyBriefingArticle entries
    const briefingArticles = await db.DailyBriefingArticle.findAll({
      where: db.sequelize.where(
        db.sequelize.fn('LENGTH', db.sequelize.col('content')),
        '<',
        shortContentThreshold
      ),
      limit: 20 // Process in batches
    });

    logger.info(`Found ${briefingArticles.length} briefing articles with short content`);

    for (const article of briefingArticles) {
      if (!article.url) {
        logger.warn(`Skipping ${article.headline.substring(0, 40)}... - no URL`);
        continue;
      }

      try {
        logger.info(`Fetching full content for: ${article.headline.substring(0, 50)}...`);
        const extracted = await fetchAndExtractArticle(article.url);
        
        if (extracted && extracted.textContent) {
          const fullContent = extracted.textContent.trim();
          
          if (fullContent.length > article.content.length) {
            await article.update({
              content: fullContent
            });
            logger.info(`  ✅ Updated: ${fullContent.length} chars (was ${article.content.length})`);
          } else {
            logger.warn(`  ⚠️  Extracted content not longer than existing`);
          }
        } else {
          logger.warn(`  ⚠️  Could not extract content`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`  ❌ Failed: ${error.message}`);
        continue;
      }
    }

    // Also update Article table entries
    const articles = await db.Article.findAll({
      where: db.sequelize.where(
        db.sequelize.fn('LENGTH', db.sequelize.col('content')),
        '<',
        shortContentThreshold
      ),
      limit: 20
    });

    logger.info(`Found ${articles.length} articles with short content`);

    for (const article of articles) {
      if (!article.link) {
        logger.warn(`Skipping ${article.title.substring(0, 40)}... - no link`);
        continue;
      }

      try {
        logger.info(`Fetching full content for: ${article.title.substring(0, 50)}...`);
        const extracted = await fetchAndExtractArticle(article.link);
        
        if (extracted && extracted.textContent) {
          const fullContent = extracted.textContent.trim();
          
          if (fullContent.length > article.content.length) {
            await article.update({
              content: fullContent
            });
            logger.info(`  ✅ Updated: ${fullContent.length} chars (was ${article.content.length})`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`  ❌ Failed: ${error.message}`);
        continue;
      }
    }

    logger.info('✅ Content update complete');
    await db.sequelize.close();
  } catch (error) {
    logger.error('❌ Error:', error);
    await db.sequelize.close();
    process.exit(1);
  }
}

updateArticleContent();
