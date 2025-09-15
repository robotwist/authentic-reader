import axios from 'axios';
import { parseStringPromise } from 'xml2js';

async function testBackendRSS() {
  try {
    console.log('Testing backend RSS processing...');
    
    // Test the same URLs the backend uses
    const sources = {
      npr: 'https://feeds.npr.org/1001/rss.xml',
      bbc: 'https://feeds.bbci.co.uk/news/rss.xml',
      cnn: 'http://rss.cnn.com/rss/edition.rss',
      fox: 'http://feeds.foxnews.com/foxnews/latest'
    };
    
    for (const [sourceName, url] of Object.entries(sources)) {
      console.log(`\n=== Testing ${sourceName} ===`);
      console.log('URL:', url);
      
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response length:', response.data.length);
        
        // Parse the XML
        const parsed = await parseStringPromise(response.data);
        
        console.log('Parsed keys:', Object.keys(parsed));
        
        if (parsed.rss && parsed.rss.channel) {
          const channels = Array.isArray(parsed.rss.channel) ? parsed.rss.channel : [parsed.rss.channel];
          console.log('Channel count:', channels.length);
          
          for (const channel of channels) {
            if (channel.item) {
              const items = Array.isArray(channel.item) ? channel.item : [channel.item];
              console.log('Items count:', items.length);
              
              if (items[0]) {
                console.log('First item keys:', Object.keys(items[0]));
                console.log('First item title:', items[0].title);
                console.log('First item title type:', typeof items[0].title);
                console.log('First item title is array:', Array.isArray(items[0].title));
                
                // Test the title extraction logic
                let rawTitle = '';
                if (items[0].title && Array.isArray(items[0].title) && items[0].title[0]) {
                  rawTitle = items[0].title[0];
                } else if (items[0]['media:title'] && Array.isArray(items[0]['media:title']) && items[0]['media:title'][0]) {
                  rawTitle = items[0]['media:title'][0];
                }
                
                console.log('Extracted rawTitle:', rawTitle);
                console.log('RawTitle length:', rawTitle.length);
              }
              break;
            }
          }
        }
        
      } catch (error) {
        console.error(`Error fetching ${sourceName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error testing backend RSS:', error.message);
  }
}

testBackendRSS();
