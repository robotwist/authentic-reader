#!/usr/bin/env node

/**
 * Security Script: Check for accidentally exposed API tokens
 * 
 * This script scans the codebase for patterns that look like API tokens
 * and alerts when they are found outside of .env files.
 * 
 * Run with: node scripts/check-tokens.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to look for (adjust these as needed)
const TOKEN_PATTERNS = [
  { 
    name: 'Hugging Face API Token', 
    regex: /hf_[a-zA-Z0-9]{20,}/g,
    description: 'Hugging Face API tokens typically start with "hf_" followed by a long string'
  },
  { 
    name: 'Generic API Key', 
    regex: /api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9_\-]{20,}/gi,
    description: 'Generic pattern for API keys in various formats'
  },
  {
    name: 'Bearer Token',
    regex: /["\']?Bearer["\']?\s+[a-zA-Z0-9_\-.+\/]{20,}/gi,
    description: 'Authorization headers with Bearer tokens'
  }
];

// Files and directories to ignore
const IGNORE_PATHS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  'SECURITY.md', // Ignore our security doc
  'scripts/check-tokens.js' // Ignore this script
];

// Extension-based filter for text files only
const TEXT_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', 
  '.html', '.css', '.md', '.json',
  '.yml', '.yaml', '.xml', '.svg',
  '.txt', '.sh', '.bash'
];

console.log('🔍 Scanning codebase for potentially exposed API tokens...');

// Get all files using git ls-files to include tracked files
try {
  const gitOutput = execSync('git ls-files', { encoding: 'utf-8' });
  const allFiles = gitOutput.split('\n').filter(Boolean);
  
  let foundTokens = 0;
  
  for (const file of allFiles) {
    // Skip ignored paths
    if (IGNORE_PATHS.some(ignorePath => file.includes(ignorePath))) {
      continue;
    }
    
    // Check if it's a text file we want to scan
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTENSIONS.includes(ext)) {
      continue;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      for (const pattern of TOKEN_PATTERNS) {
        const matches = content.match(pattern.regex);
        
        if (matches) {
          foundTokens += matches.length;
          console.log(`\n⚠️  Potential ${pattern.name} found in ${file}:`);
          console.log(`   ${pattern.description}`);
          
          // Extract lines with the matches for context
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Reset regex lastIndex
            pattern.regex.lastIndex = 0;
            if (pattern.regex.test(line)) {
              console.log(`   Line ${i + 1}: ${line.trim()}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
    }
  }
  
  if (foundTokens > 0) {
    console.log(`\n⛔ Found ${foundTokens} potential token(s) in your codebase that may need attention.`);
    console.log('   Please review each case and ensure no real tokens are being exposed.');
    console.log('   For guidance, see SECURITY.md');
    process.exit(1); // Exit with error code for CI/CD pipelines
  } else {
    console.log('\n✅ No potential token exposure detected!');
  }
  
} catch (error) {
  console.error('Error scanning files:', error.message);
  process.exit(1);
} 