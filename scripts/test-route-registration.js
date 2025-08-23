#!/usr/bin/env node

/**
 * Test Route Registration Script
 * 
 * This script tests if the stockpile routes are properly registered
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
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testRouteRegistration() {
  console.log('🔍 Testing Route Registration...\n');
  
  const testEndpoints = [
    { name: 'Health Check', url: '/health' },
    { name: 'Balanced Feed', url: '/api/balanced-feed' },
    { name: 'Stockpile Status (new)', url: '/api/stockpile/status' },
    { name: 'Stockpile Articles (new)', url: '/api/stockpile/articles' },
    { name: 'Stockpile Analytics (new)', url: '/api/stockpile/analytics' },
    { name: 'Non-existent Route', url: '/api/nonexistent' }
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await makeRequest(`${RAILWAY_URL}${endpoint.url}`);
      
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Working`);
        if (endpoint.name.includes('Balanced Feed') && response.data.articles) {
          console.log(`   📰 Articles: ${response.data.articles.length}`);
        }
      } else if (response.status === 404) {
        console.log(`   ❌ Not Found`);
        if (response.data && response.data.message) {
          console.log(`   📝 Message: ${response.data.message}`);
        }
      } else {
        console.log(`   ⚠️ Status ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📋 Analysis:');
  console.log('===========');
  console.log('If stockpile routes return 404 but health check works:');
  console.log('1. Routes may not be properly registered');
  console.log('2. There may be a syntax error in the route file');
  console.log('3. The deployment may not have updated yet');
  console.log('4. The route file may not be in the correct location');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Check server logs for any errors');
  console.log('2. Verify the route file is in server/routes/');
  console.log('3. Check if the import statement is correct');
  console.log('4. Wait for deployment to complete');
}

// Run the test
testRouteRegistration().catch(console.error);
