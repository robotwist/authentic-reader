/**
 * Runner script to execute the daily briefing worker
 * Usage: npx tsx run-briefing-worker.ts
 */

import { fetchDailySpectrum } from './src/worker/dailyBriefing.js';
import * as fs from 'fs/promises';
import * as path from 'path';

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
    
    // Save to daily_briefing.json in the expected format
    const briefingData = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      topics: {} as Record<string, any>
    };
    
    // Topic metadata
    const topicMeta: Record<string, { label: string; icon: string }> = {
      'ukraine': { label: 'War in Ukraine', icon: '🇺🇦' },
      'gaza': { label: 'War in Gaza/Palestine', icon: '🇵🇸' },
      'epstein': { label: 'Jeffrey Epstein', icon: '👤' },
      'diseases': { label: 'Emerging Infectious Diseases', icon: '🦠' },
      'trump': { label: 'Donald Trump', icon: '🇺🇸' },
    };
    
    for (const article of articles) {
      const meta = topicMeta[article.topic] || { label: article.topic, icon: '📰' };
      briefingData.topics[article.topic] = {
        topic: meta.label,
        icon: meta.icon,
        article: {
          title: article.title,
          url: article.url,
          source: article.sourceName,
          publishDate: new Date().toISOString(),
          author: article.sourceName,
          content: article.content
        },
        analysis: {
          articleId: `article_${Date.now()}`,
          timestamp: new Date().toISOString(),
          version: '2.0.0-enhanced',
          keySentences: [],
          manipulationAnalysis: { logicalFallacies: [] },
          overallAssessment: { reliabilityScore: null }
        }
      };
    }
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'data', 'daily_briefing.json');
    await fs.writeFile(outputPath, JSON.stringify(briefingData, null, 2));
    console.log(`\n💾 Saved to ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error running worker:', error);
    process.exit(1);
  }
}

main();

