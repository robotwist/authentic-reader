const { sequelize } = require('../models');
const { execSync } = require('child_process');

// Ensure we are in the test environment
process.env.NODE_ENV = 'test';

// Function to run migrations and seeds
const setupTestDatabase = async () => {
  console.log('Setting up test database...');
  try {
    const commandOptions = { cwd: __dirname + '/..', stdio: 'pipe', env: { ...process.env, NODE_ENV: 'test' } };
    
    // Try dropping the existing test DB, ignore errors if it doesn't exist
    try {
      console.log('Attempting to drop existing test database...');
      execSync('npx sequelize-cli db:drop --env test', commandOptions);
      console.log('Existing test database dropped.');
    } catch (dropError) {
      if (dropError.stderr && dropError.stderr.toString().includes('does not exist')) {
         console.log('Test database does not exist, proceeding.');
      } else {
         console.warn('Warning: Could not drop test database:', dropError.stderr ? dropError.stderr.toString() : dropError.message);
      }
    }
    
    // Create test database
    console.log('Creating test database...');
    execSync('npx sequelize-cli db:create --env test', commandOptions);
    console.log('Test database created.');
    
    // Run migrations
    console.log('Running migrations...');
    execSync('npx sequelize-cli db:migrate --env test', commandOptions);
    console.log('Migrations complete.');
    
    // Run seeds
    console.log('Running seeds...');
    execSync('npx sequelize-cli db:seed:all --env test', commandOptions);
    console.log('Seeds complete.');
    
    console.log('Test database setup complete.');
  } catch (error) {
    console.error('Failed to set up test database:', error.stderr ? error.stderr.toString() : error.message);
    process.exit(1);
  }
};

// Function to tear down the test database (kept here for teardown script to import)
const teardownTestDatabase = async () => {
  console.log('Tearing down test database...');
  try {
    // Close the database connection
    if (sequelize && sequelize.close) {
      await sequelize.close();
      console.log('Database connection closed.');
    } else {
      console.log('Sequelize connection already closed or unavailable.');
    }
    
    // Optionally drop the test database after tests
    // const commandOptions = { cwd: __dirname + '/..', stdio: 'pipe', env: { ...process.env, NODE_ENV: 'test' } };
    // try {
    //   console.log('Dropping test database after tests...');
    //   execSync('npx sequelize-cli db:drop --env test', commandOptions);
    //   console.log('Test database dropped after tests.');
    // } catch (dropError) {
    //   console.warn('Could not drop test database after tests:', dropError.stderr ? dropError.stderr.toString() : dropError.message);
    // }
    
    console.log('Test database teardown complete.');
  } catch (error) {
    console.error('Failed to tear down test database:', error);
  }
};

// Export the setup function for globalSetup
module.exports = setupTestDatabase;

// Also export teardown for the dedicated teardown script
module.exports.teardownTestDatabase = teardownTestDatabase; 