#!/usr/bin/env node

/**
 * Setup Stockpile Database Script
 * 
 * This script sets up the database tables needed for the stockpile system
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/authentic_reader', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.DATABASE_URL ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function setupDatabase() {
  console.log('🗄️ Setting up stockpile database...\n');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create articles table
    console.log('📰 Creating articles table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        link VARCHAR(1000) NOT NULL,
        author VARCHAR(200),
        "publishDate" TIMESTAMP,
        content TEXT,
        summary TEXT,
        "imageUrl" VARCHAR(1000),
        categories TEXT[],
        guid VARCHAR(500) UNIQUE,
        "sourceId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Articles table created');
    
    // Create indexes for articles
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS articles_guid_unique ON articles(guid);
      CREATE INDEX IF NOT EXISTS articles_source_id_idx ON articles("sourceId");
      CREATE INDEX IF NOT EXISTS articles_publish_date_idx ON articles("publishDate");
    `);
    console.log('✅ Articles indexes created');
    
    // Create analyses table
    console.log('🔍 Creating analyses table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        "articleId" INTEGER NOT NULL,
        "userId" INTEGER,
        "biasScore" FLOAT,
        "biasDirection" VARCHAR(50),
        sentiment FLOAT,
        entities JSONB,
        "topKeywords" TEXT[],
        "readingLevel" VARCHAR(50),
        "clickbaitScore" FLOAT,
        "outrageBaitScore" FLOAT,
        "summaryText" TEXT,
        "userFeedback" JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Analyses table created');
    
    // Create indexes for analyses
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS analyses_article_id_idx ON analyses("articleId");
      CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON analyses("userId");
      CREATE INDEX IF NOT EXISTS analyses_bias_direction_idx ON analyses("biasDirection");
    `);
    console.log('✅ Analyses indexes created');
    
    // Create user_articles table
    console.log('👤 Creating user_articles table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_articles (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "articleId" INTEGER NOT NULL,
        "interactionType" VARCHAR(50) NOT NULL,
        feedback JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ User articles table created');
    
    // Create indexes for user_articles
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS user_articles_user_id_idx ON user_articles("userId");
      CREATE INDEX IF NOT EXISTS user_articles_article_id_idx ON user_articles("articleId");
      CREATE INDEX IF NOT EXISTS user_articles_interaction_type_idx ON user_articles("interactionType");
      CREATE INDEX IF NOT EXISTS user_articles_timestamp_idx ON user_articles(timestamp);
    `);
    console.log('✅ User articles indexes created');
    
    // Check if sources table exists, if not create it
    console.log('📰 Checking sources table...');
    const sourcesTableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sources'
      );
    `);
    
    if (!sourcesTableExists[0][0].exists) {
      console.log('📰 Creating sources table...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS sources (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          url VARCHAR(1000) NOT NULL,
          category VARCHAR(100),
          "biasRating" VARCHAR(50),
          reliability VARCHAR(50),
          description TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Sources table created');
      
      // Insert some default sources
      console.log('📰 Inserting default sources...');
      await sequelize.query(`
        INSERT INTO sources (name, url, category, "biasRating", reliability, description) VALUES
        ('BBC News', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'center', 'center', 'high', 'British public service broadcaster'),
        ('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'left', 'left', 'high', 'Center-left public radio news'),
        ('Reuters', 'https://feeds.reuters.com/reuters/topNews', 'center', 'center', 'high', 'International news agency'),
        ('Associated Press', 'https://feeds.ap.org/ap/topnews', 'center', 'center', 'high', 'Non-profit news cooperative'),
        ('Wall Street Journal', 'https://feeds.wsj.com/public/rss/2_0.xml', 'right', 'right', 'high', 'Conservative business newspaper')
        ON CONFLICT (name) DO NOTHING;
      `);
      console.log('✅ Default sources inserted');
    } else {
      console.log('✅ Sources table already exists');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('   - articles (for storing RSS articles)');
    console.log('   - analyses (for storing article analysis)');
    console.log('   - user_articles (for tracking user interactions)');
    console.log('   - sources (for RSS feed sources)');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Deploy to Railway');
    console.log('   2. Test the stockpile endpoints');
    console.log('   3. Initialize the stockpile service');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the setup
setupDatabase().catch(console.error);
