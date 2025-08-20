/**
 * Database setup script for Authentic Reader
 * Initializes the database with required tables
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Initialize PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'authentic_reader_dev',
});

async function setupDatabase() {
  console.log('Setting up database...');
  console.log(`Using database: ${process.env.DB_NAME || 'authentic_reader_dev'}`);
  
  try {
    // Create tables for annotations
    const annotationsSchemaSQL = fs.readFileSync(
      path.join(__dirname, 'annotations_schema.sql'),
      'utf8'
    );
    
    // Execute the SQL script
    await pool.query(annotationsSchemaSQL);
    console.log('✅ Annotations tables created successfully');
    
    // Add additional schema setup here as needed
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the setup if this script is called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 