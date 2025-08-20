import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

/**
 * Fetches the HTML content of a given URL.
 * @param {string} url The URL to fetch.
 * @returns {Promise<string|null>} The HTML content as a string or null if fetching fails.
 */
async function fetchHtml(url) {
  console.log(`Fetching HTML for URL: ${url}`);
  try {
    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout
      headers: {
        // Add a user-agent to avoid being blocked by some sites
        'User-Agent': 'Mozilla/5.0 (compatible; AuthenticReaderBot/1.0; +https://yourdomain.com/bot)', 
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    console.log(`Successfully fetched HTML for ${url}, status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching HTML from ${url}: ${error.message}`, { status: error.response?.status });
    return null;
  }
}

/**
 * Extracts the main article content from HTML using Readability.
 * @param {string} html The HTML content as a string.
 * @param {string} url The original URL (used by Readability for context).
 * @returns {Object|null} An object containing the extracted title, content (HTML), textContent, excerpt, and length, or null if extraction fails.
 */
function extractArticleContent(html, url) {
  console.log(`Extracting content using Readability for URL: ${url}`);
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article) {
      console.log(`Readability successfully parsed content for ${url}. Title: ${article.title}`);
      return {
        title: article.title || 'Untitled',
        content: article.content || '', // Extracted main content HTML
        textContent: article.textContent || '', // Plain text version
        length: article.length || 0, // Character count
        excerpt: article.excerpt || '', // Short summary
        byline: article.byline || null // Author info if found
      };
    } else {
      console.warn(`Readability could not parse article content for ${url}`);
      return null;
    }
  } catch (error) {
    console.error(`Error during Readability parsing for ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Fetches a URL and extracts the main article content.
 * @param {string} url The URL of the article to fetch and process.
 * @returns {Promise<Object|null>} The extracted article content object or null if any step fails.
 */
export async function fetchAndExtractArticle(url) {
  const html = await fetchHtml(url);
  if (!html) {
    return null; // Fetching failed
  }
  
  const extractedContent = extractArticleContent(html, url);
  if (!extractedContent) {
    // If Readability fails, maybe return the raw HTML body as a fallback?
    // Or just return null as we do now.
    console.warn(`Content extraction failed for ${url}. Analysis might use snippet.`);
    return null; 
  }
  
  return extractedContent;
} 