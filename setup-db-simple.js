/**
 * Simple Database Setup Script
 * 
 * This script creates the basic tables needed for the application
 * without complex migrations or Sequelize ORM.
 */

import pg from 'pg';
const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'authentic_reader',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up database tables...');
    
    // Create Sources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Sources" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        category VARCHAR(100),
        description TEXT,
        "isPublic" BOOLEAN DEFAULT true,
        "biasRating" VARCHAR(50),
        reliability VARCHAR(50),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "isAdmin" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create Articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Articles" (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        url TEXT,
        "sourceId" INTEGER REFERENCES "Sources"(id),
        "publishedDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert some default sources
    await client.query(`
      INSERT INTO "Sources" (name, url, category, description, "biasRating", reliability) VALUES
      ('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'left', 'Center-left public radio news', 'left', 'high'),
      ('BBC News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'center', 'British public broadcaster', 'center', 'high'),
      ('Reuters', 'https://feeds.reuters.com/reuters/topNews', 'center', 'International news agency', 'center', 'high'),
      ('Fox News', 'http://feeds.foxnews.com/foxnews/latest', 'right', 'Conservative news outlet', 'right', 'medium'),
      ('MSNBC', 'http://www.msnbc.com/msnbc_tune-in', 'left', 'Liberal cable news network', 'left', 'medium')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase };
