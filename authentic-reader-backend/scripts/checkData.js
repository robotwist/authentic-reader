#!/usr/bin/env node

/**
 * Check Data Script
 * 
 * Inspects the latest article to debug missing LLM analysis data.
 * Logs the analysisPayload field and legacy analysis field.
 * 
 * Usage: node scripts/checkData.js (from authentic-reader-backend directory)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

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
    
    // Check what columns actually exist in the articles table
    try {
      const tableInfo = await db.sequelize.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'articles' 
         AND column_name LIKE '%analysis%' 
         ORDER BY column_name`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      console.log('\n📋 Database columns with "analysis" in name:');
      if (tableInfo && tableInfo.length > 0) {
        tableInfo.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      } else {
        console.log('  ⚠️  No columns found with "analysis" in name');
      }
      
      // Try to get the actual column name from Sequelize model
      const articleAttributes = db.Article.rawAttributes;
      if (articleAttributes.analysisPayload) {
        const dbColumnName = articleAttributes.analysisPayload.field || 'analysisPayload';
        console.log(`\n📌 Sequelize model field mapping: analysisPayload -> ${dbColumnName}`);
      }
      
      // Try raw query with error handling - check if column exists first
      const columnExists = tableInfo.some(col => col.column_name === 'analysis_payload');
      if (columnExists && article) {
        try {
          // Query the specific article we already found
          const rawArticle = await db.sequelize.query(
            'SELECT id, title, analysis_payload FROM articles WHERE id = :articleId',
            { 
              type: db.sequelize.QueryTypes.SELECT,
              replacements: { articleId: article.id }
            }
          );
          
          if (rawArticle && rawArticle.length > 0) {
            console.log('\n📦 Raw database query result:');
            console.log(`  analysis_payload from DB: ${rawArticle[0].analysis_payload ? 'EXISTS' : 'NULL'}`);
            if (rawArticle[0].analysis_payload) {
              console.log(`  Type: ${typeof rawArticle[0].analysis_payload}`);
              const preview = JSON.stringify(rawArticle[0].analysis_payload);
              console.log(`  Value preview: ${preview.substring(0, 200)}${preview.length > 200 ? '...' : ''}`);
              console.log(`  ✅ Data is properly stored in PostgreSQL!`);
            } else {
              console.log(`  ⚠️  Column exists but value is NULL in database`);
            }
          }
        } catch (rawQueryError) {
          console.log('\n⚠️  Error querying analysis_payload:', rawQueryError.message);
        }
      } else {
        console.log('\n⚠️  Column analysis_payload does not exist in database yet.');
        console.log('   You may need to run the migration to add this column.');
        console.log('   However, Sequelize model shows analysisPayload exists, which means');
        console.log('   the data might be stored elsewhere or the model is out of sync.');
      }
    } catch (schemaError) {
      console.log('\n⚠️  Could not query database schema:', schemaError.message);
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

