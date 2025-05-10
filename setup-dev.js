#!/usr/bin/env node

/**
 * Development environment setup script
 * Helps developers set up their environment variables safely
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define paths
const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

console.log('\n===== Authentic Reader Development Setup =====\n');
console.log('This script will help you set up your local development environment.\n');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('An .env file already exists. Do you want to override it? (y/n)');
  rl.question('> ', (answer) => {
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('\nSetup cancelled. Your existing .env file was not modified.');
      rl.close();
      return;
    }
    createEnvFile();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  // Read the .env.example file
  fs.readFile(envExamplePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading .env.example file:', err);
      rl.close();
      return;
    }

    console.log('\nDo you have a Hugging Face API token? (y/n)');
    rl.question('> ', (hasToken) => {
      if (hasToken.toLowerCase() === 'y' || hasToken.toLowerCase() === 'yes') {
        console.log('\nPlease enter your Hugging Face API token:');
        rl.question('> ', (token) => {
          const envContent = data.replace(/your_hugging_face_token_here/g, token);
          writeEnvFile(envContent);
        });
      } else {
        console.log('\nNo problem! The app will use local fallbacks for NLP features.');
        console.log('You can get a token later at: https://huggingface.co/settings/tokens');
        const envContent = data; // Use example values
        writeEnvFile(envContent);
      }
    });
  });
}

function writeEnvFile(content) {
  fs.writeFile(envPath, content, 'utf8', (err) => {
    if (err) {
      console.error('Error writing .env file:', err);
      rl.close();
      return;
    }

    console.log('\n✅ .env file created successfully!');
    console.log('\n⚠️ IMPORTANT: Never commit your .env file to Git!');
    console.log('   The .env file contains sensitive information like API keys.');
    console.log('\n   To use this app in production, set up environment variables');
    console.log('   in your hosting platform (Vercel, Netlify, etc.)');
    
    rl.close();
  });
} 