#!/usr/bin/env node

/**
 * Check Data Script
 * 
 * Inspects the latest article to debug missing LLM analysis data.
 * Logs the analysisPayload field and legacy analysis field.
 * 
 * Usage: node scripts/checkData.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../authentic-reader-backend/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', 'authentic-reader-backend', '.env') });

async function checkData() {
  try {
    console.log('🔍 Checking latest article data...\n');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Fetch the most recent article
    const article = await db.Article.findOne({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.Source,
          required: false
        }
      ]
    });
    
    // Fetch related Analysis records separately (legacy analysis)
    let analyses = [];
    if (article) {
      analyses = await db.Analysis.findAll({
        where: { articleId: article.id }
      });
    }
    
    if (!article) {
      console.log('❌ No articles found in database');
      await db.sequelize.close();
      process.exit(0);
    }
    
    console.log('📰 Latest Article:');
    console.log('==================');
    console.log(`ID: ${article.id}`);
    console.log(`Title: ${article.title}`);
    console.log(`Link: ${article.link}`);
    console.log(`Created At: ${article.createdAt}`);
    console.log(`Updated At: ${article.updatedAt}`);
    if (article.Source) {
      console.log(`Source: ${article.Source.name}`);
    }
    console.log('');
    
    // Log analysisPayload field
    console.log('📊 analysisPayload field:');
    console.log('==========================');
    if (article.analysisPayload) {
      console.log('✅ analysisPayload exists');
      console.log(JSON.stringify(article.analysisPayload, null, 2));
    } else {
      console.log('❌ analysisPayload is NULL or undefined');
    }
    console.log('');
    
    // Log legacy analysis field (related Analysis records)
    console.log('📋 Legacy analysis field (Analysis records):');
    console.log('=============================================');
    if (analyses && analyses.length > 0) {
      console.log(`✅ Found ${analyses.length} Analysis record(s):`);
      analyses.forEach((analysis, index) => {
        console.log(`\n  Analysis #${index + 1}:`);
        console.log(`    ID: ${analysis.id}`);
        console.log(`    Article ID: ${analysis.articleId}`);
        console.log(`    User ID: ${analysis.userId}`);
        if (analysis.biasScore !== undefined) {
          console.log(`    Bias Score: ${analysis.biasScore}`);
        }
        if (analysis.biasDirection) {
          console.log(`    Bias Direction: ${analysis.biasDirection}`);
        }
        if (analysis.sentiment !== undefined) {
          console.log(`    Sentiment: ${analysis.sentiment}`);
        }
        if (analysis.content) {
          console.log(`    Content: ${analysis.content.substring(0, 100)}...`);
        }
        if (analysis.results) {
          console.log(`    Results: ${JSON.stringify(analysis.results, null, 2)}`);
        }
        if (analysis.biasTags) {
          console.log(`    Bias Tags: ${JSON.stringify(analysis.biasTags)}`);
        }
      });
    } else {
      console.log('❌ No Analysis records found (legacy analysis field is empty)');
    }
    console.log('');
    
    // Additional debugging info
    console.log('🔍 Additional Debug Info:');
    console.log('==========================');
    console.log(`Article data keys: ${Object.keys(article.dataValues).join(', ')}`);
    console.log(`analysisPayload type: ${typeof article.analysisPayload}`);
    console.log(`analysisPayload value: ${article.analysisPayload === null ? 'null' : article.analysisPayload === undefined ? 'undefined' : 'exists'}`);
    
    // Check raw database value
    const rawArticle = await db.sequelize.query(
      'SELECT id, title, analysis_payload, created_at FROM articles ORDER BY created_at DESC LIMIT 1',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    if (rawArticle && rawArticle.length > 0) {
      console.log('\n📦 Raw database query result:');
      console.log(`  analysis_payload from DB: ${rawArticle[0].analysis_payload ? 'EXISTS' : 'NULL'}`);
      if (rawArticle[0].analysis_payload) {
        console.log(`  Type: ${typeof rawArticle[0].analysis_payload}`);
        console.log(`  Value preview: ${JSON.stringify(rawArticle[0].analysis_payload).substring(0, 200)}...`);
      }
    }
    
    console.log('\n✅ Data check complete');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await db.sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkData();

