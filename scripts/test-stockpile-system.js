#!/usr/bin/env node

/**
 * Test Stockpile System Script
 * 
 * This script tests the new stockpile system endpoints and identifies issues
 */

const https = require('https');

const RAILWAY_URL = 'https://web-production-2e12d.up.railway.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testStockpileSystem() {
  console.log('🧪 Testing Stockpile System...\n');
  
  const endpoints = [
    { name: 'Health Check', url: '/health' },
    { name: 'Balanced Feed', url: '/api/balanced-feed' },
    { name: 'Stockpile Status', url: '/api/stockpile/status' },
    { name: 'Stockpile Articles', url: '/api/stockpile/articles' },
    { name: 'Analytics Dashboard', url: '/api/analytics/dashboard' },
    { name: 'Analytics Sources', url: '/api/analytics/sources' },
    { name: 'Analytics Bias', url: '/api/analytics/bias' },
    { name: 'Analytics Sentiment', url: '/api/analytics/sentiment' },
    { name: 'Analytics Topics', url: '/api/analytics/topics' },
    { name: 'Analytics Credibility', url: '/api/analytics/credibility' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await makeRequest(`${RAILWAY_URL}${endpoint.url}`);
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: Working (${response.status})`);
        
        // Show some data for working endpoints
        if (endpoint.name === 'Balanced Feed' && response.data.articles) {
          console.log(`   📰 Articles: ${response.data.articles.length}`);
          console.log(`   🕐 Timestamp: ${response.data.timestamp}`);
        }
        
        if (endpoint.name === 'Health Check') {
          console.log(`   💚 Status: ${response.data.status}`);
        }
        
      } else if (response.status === 404) {
        console.log(`❌ ${endpoint.name}: Not Found (${response.status})`);
        if (response.data && response.data.message) {
          console.log(`   📝 Message: ${response.data.message}`);
        }
      } else {
        console.log(`⚠️ ${endpoint.name}: Status ${response.status}`);
        if (response.data && response.data.error) {
          console.log(`   ❌ Error: ${response.data.error}`);
        }
      }
      
    } catch (error) {
      console.log(`💥 ${endpoint.name}: Error - ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📋 Summary:');
  console.log('===========');
  console.log('The stockpile system endpoints may not be available yet because:');
  console.log('1. Railway deployment is still in progress');
  console.log('2. Database setup is required for the stockpile system');
  console.log('3. The stockpile service needs to be initialized');
  console.log('');
  console.log('Next steps:');
  console.log('1. Wait for Railway deployment to complete');
  console.log('2. Set up database tables for articles and analyses');
  console.log('3. Initialize the stockpile service');
  console.log('4. Test the endpoints again');
}

// Run the test
testStockpileSystem().catch(console.error);
