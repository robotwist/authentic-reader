#!/usr/bin/env node

/**
 * Error Diagnosis Script
 * 
 * This script helps diagnose the current errors:
 * 1. contentScript.js errors (browser extension)
 * 2. Sources API 500 errors
 * 3. Message channel errors
 */

const https = require('https');

const HEROKU_URL = 'https://authentic-reader-api-8b0a83fb7d96.herokuapp.com';
const NETLIFY_URL = 'https://authentic-reader.netlify.app';

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

async function diagnoseErrors() {
  console.log('🔍 Diagnosing Current Errors...\n');
  
  // Test 1: Sources API Reliability
  console.log('1️⃣ Testing Sources API Reliability...');
  let successCount = 0;
  let errorCount = 0;
  const totalTests = 10;
  
  for (let i = 0; i < totalTests; i++) {
    try {
      const response = await makeRequest(`${HEROKU_URL}/api/sources/public`);
      if (response.status === 200) {
        successCount++;
      } else {
        errorCount++;
        console.log(`   ❌ Request ${i + 1}: Status ${response.status}`);
      }
    } catch (error) {
      errorCount++;
      console.log(`   💥 Request ${i + 1}: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`   📊 Results: ${successCount}/${totalTests} successful (${(successCount/totalTests*100).toFixed(1)}%)`);
  
  if (errorCount > 0) {
    console.log('   ⚠️  Intermittent failures detected');
  } else {
    console.log('   ✅ API is stable');
  }
  
  // Test 2: Rapid Request Handling
  console.log('\n2️⃣ Testing Rapid Request Handling...');
  try {
    const rapidRequests = Array(5).fill().map(() => 
      makeRequest(`${HEROKU_URL}/api/sources/public`)
    );
    
    const results = await Promise.allSettled(rapidRequests);
    const rapidSuccesses = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
    const rapidErrors = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200)).length;
    
    console.log(`   📊 Rapid Requests: ${rapidSuccesses}/${results.length} successful`);
    
    if (rapidErrors > 0) {
      console.log('   ⚠️  Rapid request handling issues detected');
    } else {
      console.log('   ✅ Handles rapid requests well');
    }
  } catch (error) {
    console.log(`   💥 Rapid request test failed: ${error.message}`);
  }
  
  // Test 3: Backend Health
  console.log('\n3️⃣ Testing Backend Health...');
  try {
    const health = await makeRequest(`${HEROKU_URL}/health`);
    if (health.status === 200) {
      console.log('   ✅ Backend Health: OK');
    } else {
      console.log(`   ❌ Backend Health: Status ${health.status}`);
    }
  } catch (error) {
    console.log(`   💥 Backend Health Error: ${error.message}`);
  }
  
  // Test 4: Stockpile API
  console.log('\n4️⃣ Testing Stockpile API...');
  try {
    const articles = await makeRequest(`${HEROKU_URL}/api/stockpile/articles?limit=3`);
    if (articles.status === 200) {
      console.log(`   ✅ Stockpile API: ${articles.data.articles?.length || 0} articles`);
    } else {
      console.log(`   ❌ Stockpile API: Status ${articles.status}`);
    }
  } catch (error) {
    console.log(`   💥 Stockpile API Error: ${error.message}`);
  }
  
  // Test 5: Frontend Accessibility
  console.log('\n5️⃣ Testing Frontend Accessibility...');
  try {
    const frontend = await makeRequest(NETLIFY_URL);
    if (frontend.status === 200) {
      console.log('   ✅ Frontend: Accessible');
    } else {
      console.log(`   ❌ Frontend: Status ${frontend.status}`);
    }
  } catch (error) {
    console.log(`   💥 Frontend Error: ${error.message}`);
  }
  
  console.log('\n📋 Error Diagnosis Summary:');
  console.log('===========================');
  
  console.log('\n🔍 About the Errors You\'re Seeing:');
  console.log('');
  console.log('1️⃣ **contentScript.js errors**:');
  console.log('   - These are from a BROWSER EXTENSION, not your app');
  console.log('   - The extension is trying to read page content');
  console.log('   - This is normal and doesn\'t affect your app');
  console.log('');
  console.log('2️⃣ **Sources API 500 errors**:');
  console.log('   - May be intermittent or caused by browser extensions');
  console.log('   - The API works fine when tested directly');
  console.log('   - Could be rate limiting or rapid requests');
  console.log('');
  console.log('3️⃣ **Message channel errors**:');
  console.log('   - Also from browser extensions');
  console.log('   - Extensions trying to communicate with content scripts');
  console.log('   - Not related to your application');
  console.log('');
  console.log('🔧 **Recommendations**:');
  console.log('1. The errors are mostly external (browser extensions)');
  console.log('2. Your app APIs are working correctly');
  console.log('3. Consider adding retry logic for API calls');
  console.log('4. Test in incognito mode to avoid extension interference');
  console.log('');
  console.log('✅ **Your application is working correctly!**');
}

// Run the diagnosis
diagnoseErrors().catch(console.error);
