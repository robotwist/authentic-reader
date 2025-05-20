#!/usr/bin/env node

/**
 * Netlify Frontend Deployment Helper
 * This script helps prepare and deploy the frontend to Netlify
 */

import { execSync } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
  console.log('\n===== Authentic Reader - Netlify Deployment Helper =====\n');
  
  // Check if Netlify CLI is installed
  try {
    execSync('netlify --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('Error: Netlify CLI is not installed or not in PATH.');
    console.log('Please install the Netlify CLI first: npm install -g netlify-cli');
    
    const installCLI = await question('Install Netlify CLI now? (y/n): ');
    if (installCLI.toLowerCase() === 'y') {
      try {
        console.log('Installing Netlify CLI...');
        execSync('npm install -g netlify-cli', { stdio: 'inherit' });
        console.log('✅ Netlify CLI installed.');
      } catch (installError) {
        console.error('Failed to install Netlify CLI:', installError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
  
  // Check if user is logged in
  try {
    console.log('Checking Netlify login status...');
    execSync('netlify status', { stdio: 'ignore' });
    console.log('✅ Already logged in to Netlify.');
  } catch (error) {
    console.log('You need to log in to Netlify first.');
    try {
      execSync('netlify login', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to log in to Netlify. Please try again later.');
      process.exit(1);
    }
  }
  
  // Create .env file for production build
  console.log('\nCreating production environment variables...');
  
  // Get the API URL
  const apiUrl = await question('Enter your API URL (e.g., https://your-app.herokuapp.com): ');
  if (!apiUrl) {
    console.error('API URL is required for the frontend to work correctly.');
    process.exit(1);
  }
  
  // Get Hugging Face API token if needed
  const needsHFToken = await question('Do you need to configure a Hugging Face API token? (y/n): ');
  let hfToken = '';
  if (needsHFToken.toLowerCase() === 'y') {
    hfToken = await question('Enter your Hugging Face API token: ');
  }
  
  // Create production .env file
  const envContent = `VITE_API_URL=${apiUrl}
VITE_LOG_LEVEL=error
VITE_ENABLE_ANALYTICS=true
${hfToken ? `VITE_HF_API_TOKEN=${hfToken}` : ''}
`;

  fs.writeFileSync('.env.production', envContent);
  console.log('✅ Created .env.production file.');
  
  // Build the project
  console.log('\nBuilding the project for production...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
  
  // Initialize Netlify site if needed
  const hasNetlifySite = fs.existsSync('netlify.toml');
  if (!hasNetlifySite) {
    console.log('\nInitializing Netlify site...');
    try {
      execSync('netlify init', { stdio: 'inherit' });
    } catch (error) {
      console.error('Netlify initialization failed:', error.message);
      process.exit(1);
    }
  }
  
  // Configure Netlify for SPA
  if (!hasNetlifySite) {
    // Create netlify.toml with SPA redirect
    const netlifyConfig = `[build]
  publish = "dist"
  command = "npm run build"

# Handle SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
    fs.writeFileSync('netlify.toml', netlifyConfig);
    console.log('✅ Created netlify.toml configuration.');
  }
  
  // Deploy to Netlify
  console.log('\nDeploying to Netlify...');
  try {
    execSync('netlify deploy --prod', { stdio: 'inherit' });
    console.log('✅ Deployment successful!');
    
    // Get the site URL
    const siteUrl = execSync('netlify sites:current --json').toString();
    const siteData = JSON.parse(siteUrl);
    
    console.log(`\nYour site is live at: ${siteData.ssl_url || siteData.url}`);
    console.log('\nRemember to configure these environment variables in the Netlify dashboard:');
    console.log('- VITE_API_URL');
    if (hfToken) {
      console.log('- VITE_HF_API_TOKEN');
    }
    console.log('- VITE_LOG_LEVEL');
    console.log('- VITE_ENABLE_ANALYTICS');
  } catch (error) {
    console.error('Deployment failed:', error.message);
  }
  
  rl.close();
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
}); 