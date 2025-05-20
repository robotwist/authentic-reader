#!/usr/bin/env node

/**
 * Setup verification script
 * Checks if the project is properly configured for development and deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n===== Authentic Reader Setup Verification =====\n');

// Paths to check
const PATHS_TO_CHECK = [
  { path: 'package.json', name: 'Frontend package.json' },
  { path: 'server/package.json', name: 'Backend package.json' },
  { path: 'node_modules', name: 'Frontend node_modules' },
  { path: 'server/node_modules', name: 'Backend node_modules' },
  { path: '.env-templates', name: 'Environment templates' },
  { path: 'scripts/deploy-netlify.js', name: 'Netlify deployment script' },
  { path: 'scripts/deploy-heroku.js', name: 'Heroku deployment script' }
];

// Environment variables to check
const ENV_VARS_TO_CHECK = [
  { file: '.env', variables: ['VITE_API_URL', 'VITE_LOG_LEVEL'] },
  { file: 'server/.env', variables: ['PORT', 'NODE_ENV', 'JWT_SECRET', 'DB_USERNAME'] }
];

// Check paths
console.log('Checking required files and directories...');
let allPathsExist = true;

for (const { path: pathToCheck, name } of PATHS_TO_CHECK) {
  const exists = fs.existsSync(pathToCheck);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (!exists) {
    allPathsExist = false;
  }
}

if (!allPathsExist) {
  console.log('\n⚠️ Some required files or directories are missing.');
  console.log('   Run the setup script to install dependencies:');
  console.log('   bash setup.sh');
}

// Check environment variables
console.log('\nChecking environment files...');
let allEnvsExist = true;

for (const { file, variables } of ENV_VARS_TO_CHECK) {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '⚠️';
  console.log(`${status} ${file}`);
  
  if (!exists) {
    allEnvsExist = false;
    continue;
  }
  
  // If env file exists, check if it contains required variables
  const content = fs.readFileSync(file, 'utf8');
  for (const variable of variables) {
    const hasVariable = content.includes(variable);
    const varStatus = hasVariable ? '  ✅' : '  ⚠️';
    console.log(`${varStatus} ${variable}`);
  }
}

if (!allEnvsExist) {
  console.log('\n⚠️ Some environment files are missing.');
  console.log('   Run the setup-dev.js script to create environment files:');
  console.log('   node setup-dev.js');
}

// Check deployment prerequisites
console.log('\nChecking deployment prerequisites...');

// Check for Git
try {
  execSync('git --version', { stdio: 'ignore' });
  console.log('✅ Git is installed');
} catch (error) {
  console.log('❌ Git is not installed (required for deployment)');
}

// Check for Netlify CLI
try {
  execSync('netlify --version', { stdio: 'ignore' });
  console.log('✅ Netlify CLI is installed');
} catch (error) {
  console.log('⚠️ Netlify CLI is not installed (required for Netlify deployment)');
  console.log('   Install with: npm install -g netlify-cli');
}

// Check for Heroku CLI
try {
  execSync('heroku --version', { stdio: 'ignore' });
  console.log('✅ Heroku CLI is installed');
} catch (error) {
  console.log('⚠️ Heroku CLI is not installed (required for Heroku deployment)');
  console.log('   Install from: https://devcenter.heroku.com/articles/heroku-cli');
}

// Print summary
console.log('\n===== Setup Verification Summary =====');

if (allPathsExist && allEnvsExist) {
  console.log('✅ Your project appears to be properly set up for development.');
  console.log('\nTo start the application:');
  console.log('  npm run dev            # Run frontend and backend together');
  console.log('  npm run dev (in src/)  # Run frontend only');
  console.log('  npm run dev (in server/) # Run backend only');
} else {
  console.log('⚠️ Your project has some configuration issues.');
  console.log('   Please address the warnings above before proceeding to deployment.');
}

console.log('\nDeployment Instructions:');
console.log('  1. Create and configure environment files based on templates in .env-templates/');
console.log('  2. Run node scripts/deploy-netlify.js to deploy the frontend');
console.log('  3. Run node scripts/deploy-heroku.js to deploy the backend');
console.log('  4. Update your frontend environment to point to your deployed backend');
console.log('  5. Run security checks with npm run security:check\n'); 