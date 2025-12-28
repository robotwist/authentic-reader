#!/usr/bin/env node

/**
 * Database Sync Script
 * 
 * Syncs Sequelize models to the database by creating missing tables
 * and adding missing columns without deleting existing data.
 * 
 * Usage: node scripts/syncDb.js (from authentic-reader-backend directory)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Sync database schema
 */
async function syncDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');
    
    console.log('🔄 Syncing database schema...');
    console.log('   (This will create missing tables and add missing columns)');
    
    // Sync models to database with alter: true
    // This creates missing tables and adds missing columns without deleting data
    await db.sequelize.sync({ alter: true });
    
    console.log('✅ Database synced successfully');
    
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  } finally {
    // Close database connection
    await db.sequelize.close();
    console.log('Database connection closed');
  }
}

// Execute the script
syncDatabase()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

