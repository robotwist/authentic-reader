#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNetlifyCLI() {
  try {
    execSync('netlify --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.production');
  return fs.existsSync(envPath);
}

async function deploy() {
  try {
    // Check if Netlify CLI is installed
    if (!checkNetlifyCLI()) {
      log('Installing Netlify CLI...', 'yellow');
      execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    }

    // Check if .env.production exists
    if (!checkEnvFile()) {
      log('Error: .env.production file not found!', 'red');
      log('Please create a .env.production file with your environment variables.', 'yellow');
      process.exit(1);
    }

    // Build the project
    log('Building project...', 'blue');
    execSync('npm run build', { stdio: 'inherit' });

    // Import environment variables
    log('Importing environment variables...', 'blue');
    execSync('netlify env:import .env.production', { stdio: 'inherit' });

    // Deploy to Netlify
    log('Deploying to Netlify...', 'blue');
    execSync('netlify deploy --prod', { stdio: 'inherit' });

    log('Deployment completed successfully!', 'green');
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

deploy(); 