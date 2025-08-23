#!/usr/bin/env node

/**
 * Monitor Railway Deployment Script
 * 
 * This script monitors the Railway deployment to check when the new code is live
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
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function checkDeployment() {
  console.log('🔍 Monitoring Railway deployment...\n');
  
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      console.log(`Attempt ${attempts}/${maxAttempts} - Checking deployment...`);
      
      // Check health endpoint
      const health = await makeRequest(`${RAILWAY_URL}/health`);
      console.log(`✅ Health: ${health.status}`);
      
      // Check balanced feed
      const feed = await makeRequest(`${RAILWAY_URL}/api/balanced-feed`);
      
      const realArticles = feed.articles.filter(article => article.articleId.startsWith('real_')).length;
      const sampleArticles = feed.articles.filter(article => article.articleId.startsWith('fallback_')).length;
      
      console.log(`📰 Articles: ${feed.totalArticles} total`);
      console.log(`   - Real articles: ${realArticles}`);
      console.log(`   - Sample articles: ${sampleArticles}`);
      console.log(`🕐 Timestamp: ${feed.timestamp}`);
      
      // Check if we have real articles (new deployment)
      if (realArticles > 0) {
        console.log('\n🎉 SUCCESS! New deployment is live with real articles!');
        console.log(`📊 Real articles: ${realArticles}`);
        console.log(`📊 Sample articles: ${sampleArticles}`);
        
        // Show first few real articles
        const firstRealArticles = feed.articles
          .filter(article => article.articleId.startsWith('real_'))
          .slice(0, 3);
        
        console.log('\n📋 First real articles:');
        firstRealArticles.forEach((article, index) => {
          console.log(`   ${index + 1}. ${article.title}`);
          console.log(`      Source: ${article.source}`);
          console.log(`      Date: ${article.pubDate}`);
          console.log('');
        });
        
        return true;
      } else {
        console.log('⏳ Still using old deployment (only sample articles)');
        console.log('   Waiting for new deployment to go live...\n');
      }
      
    } catch (error) {
      console.log(`❌ Error checking deployment: ${error.message}`);
    }
    
    // Wait 30 seconds before next check
    if (attempts < maxAttempts) {
      console.log('⏰ Waiting 30 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('⏰ Max attempts reached. Deployment may still be in progress.');
  console.log('   Check Railway dashboard for deployment status.');
  return false;
}

// Run the monitoring
checkDeployment().catch(console.error);
