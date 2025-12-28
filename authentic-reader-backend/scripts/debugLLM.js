#!/usr/bin/env node

/**
 * Debug LLM Script
 * 
 * Isolates LLM crash by bypassing database/RSS entirely.
 * Tests productionAIService.analyzeArticle with a simple sample article.
 * 
 * Usage: node scripts/debugLLM.js (from authentic-reader-backend directory)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import productionAIService from '../services/productionAIService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Sample article text for testing
const text = "Senator Smith's disastrous bill is a betrayal of American values. Experts warn it will destroy the economy.";

// Create minimal article object (productionAIService expects an article object, not just text)
const article = {
  title: "Senator Smith's Bill Faces Criticism",
  content: text,
  description: text,
  source: {
    name: "Test Source"
  }
};

async function debugLLM() {
  console.log('🔍 Starting LLM Debug Test...\n');
  console.log('📝 Test Article Text:', text);
  console.log('');
  
  try {
    console.log('🚀 Calling productionAIService.analyzeArticle()...\n');
    
    const result = await productionAIService.analyzeArticle(article, {
      includeBias: true,
      includeSentiment: true,
      includeCredibility: true,
      includeFallacies: true,
      includeSummary: true
    });
    
    console.log('✅ Success:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ CRASH DETAILS:');
    console.error('  Error Message:', error.message);
    
    if (error.response) {
      console.error('  Response Status:', error.response.status);
      console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('  Response Headers:', error.response.headers);
    }
    
    if (error.request) {
      console.error('  Request made but no response received');
      console.error('  Request URL:', error.config?.url);
    }
    
    if (error.stack) {
      console.error('  Stack Trace:', error.stack);
    }
    
    console.error('\n  Full Error Object:', error);
    process.exit(1);
  }
}

// Run the debug test
debugLLM();

