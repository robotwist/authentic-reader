#!/usr/bin/env node

/**
 * Token Rotation Helper Script
 * 
 * This script helps users rotate their Hugging Face API tokens by:
 * 1. Checking when the token was last rotated
 * 2. Prompting them to create a new token if needed
 * 3. Providing guidance on updating environment files
 * 
 * Run with: node scripts/rotate-token.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Create readline interface for user interaction
const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Main function to run the token rotation helper
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}=== Hugging Face API Token Rotation Helper ===${colors.reset}\n`);
  
  // Check for token rotation metadata
  const metaPath = path.join(ROOT_DIR, '.token-meta.json');
  let tokenMeta = { lastRotated: null };
  
  try {
    if (fs.existsSync(metaPath)) {
      tokenMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading token metadata:', error.message);
  }
  
  // Check if token needs rotation
  const now = new Date();
  const lastRotated = tokenMeta.lastRotated ? new Date(tokenMeta.lastRotated) : null;
  
  if (lastRotated) {
    const daysSinceRotation = Math.floor((now - lastRotated) / (1000 * 60 * 60 * 24));
    console.log(`${colors.cyan}Last token rotation: ${lastRotated.toLocaleDateString()}${colors.reset}`);
    console.log(`Days since last rotation: ${daysSinceRotation}`);
    
    if (daysSinceRotation > 90) {
      console.log(`\n${colors.yellow}⚠️  Your token is ${daysSinceRotation} days old.${colors.reset}`);
      console.log(`${colors.yellow}We recommend rotating tokens every 90 days for security.${colors.reset}\n`);
    } else {
      console.log(`\n${colors.green}✅ Your token is still within the recommended 90-day rotation period.${colors.reset}\n`);
    }
  } else {
    console.log(`${colors.yellow}⚠️  No record of previous token rotation.${colors.reset}`);
    console.log('Consider updating your token if you haven\'t done so recently.\n');
  }
  
  // Prompt user to rotate token
  readline.question('Would you like to rotate your token now? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await rotateToken();
    } else {
      console.log('\nToken rotation skipped. You can run this script again when ready.');
      console.log(`To manually update your token, follow the guidelines in ${colors.bold}SECURITY.md${colors.reset}`);
      readline.close();
    }
  });
}

/**
 * Guide the user through token rotation process
 */
async function rotateToken() {
  console.log('\n=== Token Rotation Steps ===\n');
  
  // Step 1
  console.log(`${colors.bold}Step 1:${colors.reset} Create a new Hugging Face API token`);
  console.log('  - Go to https://huggingface.co/settings/tokens');
  console.log('  - Click "New token"');
  console.log('  - Create a fine-grained token with "Read" access and "Inference" permission only');
  console.log('  - Use a descriptive name like "authentic-reader-app-[date]"\n');
  
  await prompt('Press Enter once you have created your new token...');
  
  // Step 2
  console.log(`\n${colors.bold}Step 2:${colors.reset} Update your environment files with the new token`);
  console.log(`  - Edit the ${colors.cyan}.env${colors.reset} file in your project root`);
  console.log('  - Update REACT_APP_HF_API_TOKEN and VITE_HF_API_TOKEN with your new token\n');
  
  await prompt('Press Enter once you have updated your environment files...');
  
  // Step 3
  console.log(`\n${colors.bold}Step 3:${colors.reset} Revoke the old token`);
  console.log('  - Return to https://huggingface.co/settings/tokens');
  console.log('  - Find your old token and click "Delete"\n');
  
  await prompt('Press Enter once you have revoked your old token...');
  
  // Step 4
  console.log(`\n${colors.bold}Step 4:${colors.reset} Test the new token`);
  console.log('  - Run your application and test the Hugging Face integration');
  console.log('  - Verify that the content analysis features are working correctly\n');
  
  await prompt('Press Enter once you have tested the new token successfully...');
  
  // Update token metadata
  const metaPath = path.join(ROOT_DIR, '.token-meta.json');
  const tokenMeta = { 
    lastRotated: new Date().toISOString(),
    nextRotationDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  try {
    fs.writeFileSync(metaPath, JSON.stringify(tokenMeta, null, 2));
    console.log(`\n${colors.green}✅ Token rotation complete!${colors.reset}`);
    console.log(`Token metadata updated. Your next rotation is due on ${new Date(tokenMeta.nextRotationDue).toLocaleDateString()}`);
    console.log('\nRemember to add .token-meta.json to your .gitignore to avoid committing token metadata.\n');
  } catch (error) {
    console.error(`\n${colors.red}Error saving token metadata:${colors.reset}`, error.message);
    console.log('Please note that your next token rotation should be in 90 days.\n');
  }
  
  readline.close();
}

/**
 * Simple prompt function
 */
function prompt(question) {
  return new Promise((resolve) => {
    readline.question(question, resolve);
  });
}

// Run the script
main().catch(error => {
  console.error(`\n${colors.red}Error:${colors.reset}`, error.message);
  readline.close();
  process.exit(1);
}); 