#!/usr/bin/env node

/**
 * Test CORS Fix Script
 * 
 * This script tests the CORS configuration and provides instructions for clearing cache
 */

const https = require('https');

const RAILWAY_URL = 'https://web-production-2e12d.up.railway.app';
const NETLIFY_ORIGIN = 'https://authentic-reader.netlify.app';

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': NETLIFY_ORIGIN,
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

function makeOptionsRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'OPTIONS',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': NETLIFY_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testCORS() {
  console.log('🔍 Testing CORS Configuration...\n');
  
  try {
    // Test 1: OPTIONS preflight request
    console.log('1️⃣ Testing OPTIONS preflight request...');
    const optionsResponse = await makeOptionsRequest(`${RAILWAY_URL}/api/balanced-feed`);
    
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`);
    console.log(`     - Access-Control-Allow-Origin: ${optionsResponse.headers['access-control-allow-origin'] || 'NOT SET'}`);
    console.log(`     - Access-Control-Allow-Methods: ${optionsResponse.headers['access-control-allow-methods'] || 'NOT SET'}`);
    console.log(`     - Access-Control-Allow-Headers: ${optionsResponse.headers['access-control-allow-headers'] || 'NOT SET'}`);
    console.log(`     - Access-Control-Allow-Credentials: ${optionsResponse.headers['access-control-allow-credentials'] || 'NOT SET'}`);
    
    if (optionsResponse.status === 200) {
      console.log('   ✅ OPTIONS request successful');
    } else {
      console.log('   ❌ OPTIONS request failed');
    }
    
    console.log('');
    
    // Test 2: Actual GET request
    console.log('2️⃣ Testing GET request with Origin header...');
    const getResponse = await makeRequest(`${RAILWAY_URL}/api/balanced-feed?categories=far-left,left,center,right,far-right&limit=50`);
    
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Content-Type: ${getResponse.headers['content-type'] || 'NOT SET'}`);
    console.log(`   CORS Headers:`);
    console.log(`     - Access-Control-Allow-Origin: ${getResponse.headers['access-control-allow-origin'] || 'NOT SET'}`);
    console.log(`     - Access-Control-Allow-Credentials: ${getResponse.headers['access-control-allow-credentials'] || 'NOT SET'}`);
    
    if (getResponse.status === 200) {
      console.log('   ✅ GET request successful');
      
      try {
        const data = JSON.parse(getResponse.data);
        console.log(`   📰 Articles returned: ${data.articles ? data.articles.length : 0}`);
        console.log(`   🕐 Timestamp: ${data.timestamp || 'NOT SET'}`);
      } catch (e) {
        console.log('   ⚠️ Could not parse JSON response');
      }
    } else {
      console.log('   ❌ GET request failed');
    }
    
    console.log('');
    
    // Test 3: Health check
    console.log('3️⃣ Testing health endpoint...');
    const healthResponse = await makeRequest(`${RAILWAY_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${healthResponse.data}`);
    
    if (healthResponse.status === 200) {
      console.log('   ✅ Health check successful');
    } else {
      console.log('   ❌ Health check failed');
    }
    
    console.log('\n📋 Summary:');
    console.log('===========');
    
    if (optionsResponse.status === 200 && getResponse.status === 200 && healthResponse.status === 200) {
      console.log('✅ All tests passed! CORS is working correctly on the server side.');
      console.log('');
      console.log('🔧 If you\'re still seeing CORS errors in the browser:');
      console.log('   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('   2. Clear service worker cache:');
      console.log('      - Open DevTools (F12)');
      console.log('      - Go to Application tab');
      console.log('      - Click "Clear storage"');
      console.log('      - Check "Service Workers" and "Cache storage"');
      console.log('   3. Hard refresh the page');
      console.log('   4. Try opening in an incognito/private window');
    } else {
      console.log('❌ Some tests failed. Check the Railway deployment status.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testCORS().catch(console.error);
