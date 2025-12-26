import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jsonStorage from '../authentic-reader-backend/services/jsonStorageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure we are in the test environment
process.env.NODE_ENV = 'test';

// Function to setup test environment (for JSON storage tests)
const setupTestDatabase = async () => {
  console.log('Setting up test environment...');
  try {
    // Ensure data directory exists for JSON storage
    await jsonStorage.ensureDataDir();
    console.log('Test environment setup complete.');
  } catch (error) {
    console.error('Failed to set up test environment:', error.message);
    // Don't exit for JSON storage tests - they don't need database
  }
};

// Function to tear down the test environment
const teardownTestDatabase = async () => {
  console.log('Tearing down test environment...');
  try {
    // JSON storage tests clean up their own data
    console.log('Test environment teardown complete.');
  } catch (error) {
    console.error('Failed to tear down test environment:', error);
  }
};

// Export the setup function for globalSetup
export default setupTestDatabase;

// Also export teardown for the dedicated teardown script
export { teardownTestDatabase }; 