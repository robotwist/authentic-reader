#!/usr/bin/env node

/**
 * Heroku Backend Deployment Helper
 * This script helps prepare and deploy the backend to Heroku
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
  console.log('\n===== Authentic Reader - Heroku Deployment Helper =====\n');
  
  // Check if Heroku CLI is installed
  try {
    execSync('heroku --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('Error: Heroku CLI is not installed or not in PATH.');
    console.log('Please install the Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli');
    process.exit(1);
  }
  
  // Check if user is logged in
  try {
    console.log('Checking Heroku login status...');
    execSync('heroku auth:whoami', { stdio: 'ignore' });
    console.log('✅ Already logged in to Heroku.');
  } catch (error) {
    console.log('You need to log in to Heroku first.');
    try {
      execSync('heroku login', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to log in to Heroku. Please try again later.');
      process.exit(1);
    }
  }
  
  // Get app name
  let appName = await question('Enter your Heroku app name (or create a new one): ');
  
  // Check if the app exists
  try {
    execSync(`heroku apps:info ${appName}`, { stdio: 'ignore' });
    console.log(`App '${appName}' exists. Will deploy to this app.`);
  } catch (error) {
    const createNew = await question(`App '${appName}' doesn't exist. Create it? (y/n): `);
    if (createNew.toLowerCase() === 'y') {
      try {
        console.log(`Creating app '${appName}'...`);
        execSync(`heroku apps:create ${appName}`, { stdio: 'inherit' });
        console.log(`✅ App '${appName}' created.`);
        
        // Add PostgreSQL add-on
        const addPostgres = await question('Add PostgreSQL to the app? (y/n): ');
        if (addPostgres.toLowerCase() === 'y') {
          console.log('Adding PostgreSQL to the app...');
          execSync(`heroku addons:create heroku-postgresql:essential-0 --app ${appName}`, { stdio: 'inherit' });
          console.log('✅ PostgreSQL add-on created.');
        }
      } catch (error) {
        console.error('Failed to create app or add PostgreSQL:', error.message);
        process.exit(1);
      }
    } else {
      console.log('Deployment cancelled.');
      process.exit(0);
    }
  }
  
  // Set up environment variables
  console.log('\nSetting up environment variables...');
  
  const envVars = [
    { name: 'NODE_ENV', defaultValue: 'production' },
    { name: 'JWT_SECRET', defaultValue: '' },
    { name: 'JWT_EXPIRES_IN', defaultValue: '7d' },
    { name: 'HF_API_TOKEN', defaultValue: '' },
    { name: 'LOG_LEVEL', defaultValue: 'error' }
  ];
  
  for (const envVar of envVars) {
    if (envVar.name === 'JWT_SECRET' && !envVar.defaultValue) {
      // Generate random JWT secret if not provided
      envVar.defaultValue = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
    }
    
    let value = await question(`${envVar.name} [${envVar.defaultValue}]: `);
    value = value || envVar.defaultValue;
    
    if (value) {
      try {
        execSync(`heroku config:set ${envVar.name}=${value} --app ${appName}`);
        console.log(`✅ Set ${envVar.name}`);
      } catch (error) {
        console.error(`Failed to set ${envVar.name}:`, error.message);
      }
    }
  }
  
  // Prepare for deployment
  console.log('\nPreparing for deployment...');
  
  // Check if git is initialized
  let isGitRepo = false;
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    isGitRepo = true;
  } catch (error) {
    console.log('Initializing git repository...');
    execSync('git init');
  }
  
  // Check if Heroku remote exists
  let hasHerokuRemote = false;
  try {
    const remotes = execSync('git remote').toString();
    hasHerokuRemote = remotes.split('\n').includes('heroku');
  } catch (error) {
    // Git remotes command failed, assume no remote
  }
  
  if (!hasHerokuRemote) {
    console.log('Adding Heroku remote...');
    execSync(`heroku git:remote -a ${appName}`);
  }
  
  // Confirm deployment
  const confirmDeploy = await question('\nReady to deploy to Heroku. Continue? (y/n): ');
  if (confirmDeploy.toLowerCase() !== 'y') {
    console.log('Deployment cancelled.');
    rl.close();
    return;
  }
  
  // Deploy
  console.log('\nDeploying to Heroku...');
  try {
    execSync('git subtree push --prefix server heroku main', { stdio: 'inherit' });
    console.log('✅ Deployment successful!');
    
    // Run migrations
    const runMigrations = await question('Run database migrations? (y/n): ');
    if (runMigrations.toLowerCase() === 'y') {
      console.log('Running migrations...');
      execSync(`heroku run npm run migrate --app ${appName}`, { stdio: 'inherit' });
      console.log('✅ Migrations completed.');
    }
    
    console.log(`\nYour API is now available at: https://${appName}.herokuapp.com/`);
    console.log('Make sure to update your frontend configuration to use this URL.');
  } catch (error) {
    console.error('Deployment failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure you have committed your changes');
    console.log('2. You might need to use "git push heroku main" if not using subtree');
    console.log('3. Check Heroku logs with "heroku logs --tail"');
  }
  
  rl.close();
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
}); 