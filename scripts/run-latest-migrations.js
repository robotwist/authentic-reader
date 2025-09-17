/**
 * Script to run the latest database migrations
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'authentic_reader_dev',
});

// Path to migrations directory
const migrationsDir = path.join(__dirname, '../db/migrations');

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migrations table verified.');
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
}

// Get list of applied migrations
async function getAppliedMigrations() {
  try {
    const result = await pool.query('SELECT filename FROM schema_migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  } catch (error) {
    console.error('Error fetching applied migrations:', error);
    throw error;
  }
}

// Get list of migration files
function getMigrationFiles() {
  try {
    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure order
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    throw error;
  }
}

// Run a specific migration
async function runMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log(`Running migration: ${filename}`);
    
    // Execute the migration SQL
    await client.query(sql);
    
    // Record the migration
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    
    await client.query('COMMIT');
    console.log(`Migration ${filename} completed successfully.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error running migration ${filename}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Run all pending migrations
async function runMigrations() {
  try {
    await ensureMigrationsTable();
    
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found.');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations to apply:`);
    pendingMigrations.forEach(file => console.log(` - ${file}`));
    
    // Run migrations in sequence
    for (const file of pendingMigrations) {
      await runMigration(file);
    }
    
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migrations
runMigrations(); 