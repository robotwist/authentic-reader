#!/usr/bin/env node

/**
 * Development environment setup script
 * Helps developers set up their environment variables safely
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define paths
const frontendEnvPath = path.join(__dirname, '.env');
const serverEnvPath = path.join(__dirname, 'server', '.env');
const frontendTemplateEnvPath = path.join(__dirname, '.env-templates', 'frontend.env.example');
const serverTemplateEnvPath = path.join(__dirname, '.env-templates', 'server.env.example');

console.log('\n===== Authentic Reader Development Setup =====\n');
console.log('This script will help you set up your local development environment.\n');

// Helper function for questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  // Check if frontend .env already exists
  if (fs.existsSync(frontendEnvPath)) {
    const answer = await question('A frontend .env file already exists. Do you want to override it? (y/n): ');
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('\nFrontend .env file was not modified.');
    } else {
      await createFrontendEnvFile();
    }
  } else {
    await createFrontendEnvFile();
  }

  // Check if server .env already exists
  if (fs.existsSync(serverEnvPath)) {
    const answer = await question('A server .env file already exists. Do you want to override it? (y/n): ');
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('\nServer .env file was not modified.');
    } else {
      await createServerEnvFile();
    }
  } else {
    await createServerEnvFile();
  }

  console.log('\n✅ Environment setup complete!');
  console.log('\n⚠️ IMPORTANT: Never commit your .env files to Git!');
  console.log('   The .env files contain sensitive information like API keys and passwords.');
  console.log('\n   To use this app in production, set up environment variables');
  console.log('   in your hosting platforms (Netlify for frontend, Heroku for backend)');
  
  rl.close();
}

async function createFrontendEnvFile() {
  console.log('\nSetting up frontend environment variables...');
  
  // Read the template
  const templateContent = fs.readFileSync(frontendTemplateEnvPath, 'utf8');
  
  // Get Hugging Face API token
  console.log('\nDo you have a Hugging Face API token? (y/n)');
  const hasToken = await question('> ');
  
  let envContent = templateContent;
  
  if (hasToken.toLowerCase() === 'y' || hasToken.toLowerCase() === 'yes') {
    console.log('\nPlease enter your Hugging Face API token:');
    const token = await question('> ');
    envContent = envContent.replace(/your_hugging_face_token_here/g, token);
  } else {
    console.log('\nNo problem! The app will use local fallbacks for NLP features.');
    console.log('You can get a token later at: https://huggingface.co/settings/tokens');
  }
  
  // Write the file
  fs.writeFileSync(frontendEnvPath, envContent, 'utf8');
  console.log('✅ Frontend .env file created successfully!');
}

async function createServerEnvFile() {
  console.log('\nSetting up server environment variables...');
  
  // Read the template
  const templateContent = fs.readFileSync(serverTemplateEnvPath, 'utf8');
  
  // Get database password
  console.log('\nPlease enter your local PostgreSQL password:');
  const dbPassword = await question('> ');
  
  // Generate a random JWT secret
  const jwtSecret = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  
  // Get Hugging Face API token
  console.log('\nDo you have a Hugging Face API token? (y/n)');
  const hasToken = await question('> ');
  
  let envContent = templateContent
    .replace(/your_db_password_here/g, dbPassword || 'postgres')
    .replace(/your_jwt_secret_here/g, jwtSecret);
  
  if (hasToken.toLowerCase() === 'y' || hasToken.toLowerCase() === 'yes') {
    console.log('\nPlease enter your Hugging Face API token:');
    const token = await question('> ');
    envContent = envContent.replace(/your_hugging_face_token_here/g, token);
  }
  
  // Create server directory if it doesn't exist
  const serverDir = path.dirname(serverEnvPath);
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(serverEnvPath, envContent, 'utf8');
  console.log('✅ Server .env file created successfully!');
}

main().catch(err => {
  console.error('Error setting up environment:', err);
  rl.close();
}); 