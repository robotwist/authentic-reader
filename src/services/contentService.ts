// Use document parser for browser environments
import { Readability } from '@mozilla/readability';

export interface ExtractedArticle {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
  readingTimeMinutes: number;
  wordCount: number;
}

// API endpoint for backend proxy (change to production URL when deploying)
const API_BASE_URL = 'http://localhost:3000';

// Calculate reading time based on average reading speed
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Count the number of words in text
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

// Fetch and extract article content using Readability
export async function extractArticleContent(url: string): Promise<ExtractedArticle | null> {
  try {
    // Use our backend proxy for content fetching
    const proxyUrl = `${API_BASE_URL}/api/content?url=${encodeURIComponent(url)}`;
    
    // Fetch the HTML content
    console.log(`Extracting content from ${url}...`);
    
    let html = '';
    let response;
    
    try {
      // Try with our proxy first
      response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Proxy fetch failed with status ${response.status}`);
      }
      html = await response.text();
    } catch (proxyError) {
      console.warn(`Proxy fetch failed, attempting direct fetch: ${proxyError.message}`);
      
      // If proxy fails, try direct fetch as fallback (may not work due to CORS)
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AuthenticReader/1.0)',
          }
        });
        html = await response.text();
      } catch (directError) {
        console.error('Both proxy and direct fetch failed');
        throw directError;
      }
    }
    
    // If we got empty content, try to extract from summary
    if (!html || html.trim().length < 100) {
      console.warn('Retrieved content too short, may be incomplete');
    }
    
    // Parse the HTML content using browser's DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Create a new Readability object
    const reader = new Readability(doc, {
      // You can customize Readability options here
      debug: false,
      charThreshold: 500,
    });
    
    // Parse the content
    const article = reader.parse();
    
    if (!article) {
      throw new Error('Could not extract article content');
    }
    
    const textContent = article.textContent || '';
    
    return {
      title: article.title || doc.title || 'Untitled Article',
      content: article.content || '',
      textContent: textContent,
      excerpt: article.excerpt || textContent.substring(0, 150) + '...',
      byline: article.byline,
      siteName: article.siteName || new URL(url).hostname,
      readingTimeMinutes: calculateReadingTime(textContent),
      wordCount: countWords(textContent)
    };
  } catch (error) {
    console.error('Error extracting article content:', error);
    return null;
  }
}

// Detect outrage bait (basic implementation)
export function detectOutrageBait(title: string, content: string): boolean {
  const outrageTriggers = [
    'outrageous', 'shocking', 'appalling', 'unbelievable', 'disgraceful',
    'scandal', 'controversy', 'furious', 'disaster', 'catastrophe',
    'destroy', 'ruined', 'worst', 'terrible', 'nightmare', 'horrifying',
    'emergency', 'crisis', 'insane', 'disgusting', 'disturbing', 
    'you won\'t believe', 'jaw-dropping', 'completely lost it',
    'meltdown', 'epic fail', 'mind-blowing', 'viral'
  ];
  
  const text = `${title} ${content}`.toLowerCase();
  
  // Calculate a score based on number of trigger words
  const matchCount = outrageTriggers.reduce((count, trigger) => {
    const regex = new RegExp(`\\b${trigger}\\b`, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  // If more than 2 outrage triggers found, likely outrage bait
  return matchCount > 2;
}

// Detect doomscroll content (basic implementation)
export function detectDoomscrollContent(title: string, content: string): boolean {
  const doomscrollTriggers = [
    'death', 'dying', 'dead', 'killed', 'fatal', 'catastrophic',
    'disaster', 'tragedy', 'tragic', 'pandemic', 'epidemic', 'outbreak',
    'crisis', 'emergency', 'threat', 'danger', 'dangerous', 'risk',
    'warning', 'alert', 'alarming', 'devastating', 'destruction',
    'climate change', 'global warming', 'extinction', 'terrorism',
    'recession', 'depression', 'collapse', 'crash', 'violence',
    'conflict', 'war', 'disease', 'infection', 'suffering'
  ];
  
  const text = `${title} ${content}`.toLowerCase();
  
  // Calculate a score based on number of trigger words
  const matchCount = doomscrollTriggers.reduce((count, trigger) => {
    const regex = new RegExp(`\\b${trigger}\\b`, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  // If more than 3 doomscroll triggers found, likely doomscroll content
  return matchCount > 3;
} 