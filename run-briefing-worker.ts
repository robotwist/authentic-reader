/**
 * Runner script to execute the daily briefing worker
 * Usage: npx tsx run-briefing-worker.ts
 */

import { fetchDailySpectrum } from './src/worker/dailyBriefing.js';

async function main() {
  console.log('🚀 Running Daily Briefing Worker with deduplication fix...\n');
  
  try {
    const articles = await fetchDailySpectrum();
    
    console.log('\n📰 Results Summary:');
    console.log('='.repeat(60));
    
    // Check for duplicates
    const urls = articles.map(a => a.url);
    const uniqueUrls = new Set(urls);
    
    for (const article of articles) {
      console.log(`\n📌 ${article.topic.toUpperCase()}`);
      console.log(`   Title: ${article.title.substring(0, 60)}...`);
      console.log(`   Source: ${article.sourceName} (${article.perspective})`);
      console.log(`   URL: ${article.url.substring(0, 60)}...`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Total articles: ${articles.length}`);
    console.log(`✅ Unique URLs: ${uniqueUrls.size}`);
    
    if (urls.length !== uniqueUrls.size) {
      console.log('⚠️  WARNING: Duplicate URLs detected!');
    } else {
      console.log('🎉 SUCCESS: All articles have unique URLs!');
    }
    
    // Note: Articles are now saved directly to Postgres via the backend API
    // See: /api/daily-briefing/save endpoint in authentic-reader-backend
    
  } catch (error) {
    console.error('❌ Error running worker:', error);
    process.exit(1);
  }
}

main();

