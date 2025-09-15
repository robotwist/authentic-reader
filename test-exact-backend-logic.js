import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// Replicate the exact backend logic
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"');
}

function extractItems(feed) {
  let items = [];
  
  if (feed.rss && feed.rss.channel) {
    // Handle both single channel and array of channels
    const channels = Array.isArray(feed.rss.channel) ? feed.rss.channel : [feed.rss.channel];
    for (const channel of channels) {
      if (channel.item) {
        const channelItems = Array.isArray(channel.item) ? channel.item : [channel.item];
        items = items.concat(channelItems);
      }
    }
  } else if (feed.feed) {
    items = feed.feed.entry || [];
  } else if (feed.rdf && feed.rdf.item) {
    items = feed.rdf.item || [];
  }

  // Ensure items is an array
  if (!Array.isArray(items)) {
    items = [items];
  }

  return items;
}

function processArticleItem(item, sourceName) {
  // Safely extract title - EXACT backend logic
  let rawTitle = '';
  if (item.title && Array.isArray(item.title) && item.title[0]) {
    rawTitle = item.title[0];
  } else if (item['media:title'] && Array.isArray(item['media:title']) && item['media:title'][0]) {
    rawTitle = item['media:title'][0];
  }
  
  console.log(`Processing article from ${sourceName}:`, {
    rawTitle,
    titleType: typeof rawTitle,
    titleLength: rawTitle ? rawTitle.length : 0,
    itemKeys: Object.keys(item),
    itemTitle: item.title,
    itemTitleType: typeof item.title,
    itemTitleIsArray: Array.isArray(item.title)
  });
  
  const title = decodeHtmlEntities(rawTitle);
  
  return {
    rawTitle,
    title,
    success: title.length > 0
  };
}

async function testExactBackendLogic() {
  try {
    console.log('Testing exact backend logic...');
    
    // Test NPR (same URL as backend)
    const response = await axios.get('https://feeds.npr.org/1001/rss.xml', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const parsed = await parseStringPromise(response.data);
    const items = extractItems(parsed);
    
    console.log('Extracted items count:', items.length);
    
    if (items[0]) {
      const result = processArticleItem(items[0], 'NPR');
      console.log('Processing result:', result);
    }
    
  } catch (error) {
    console.error('Error testing exact backend logic:', error.message);
  }
}

testExactBackendLogic();
