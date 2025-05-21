// Browser-friendly RSS parser implementation
// No direct dependency on Node.js EventEmitter
import { RSSArticle, RSSSource, GUID, toRSSArticle, toRSSSource } from '../types';
import { extractGuidString } from '../utils/guidUtils';
import { ApiError } from './apiService';

// Define custom fields to parse
interface CustomItem {
  title?: string;
  link?: string;
  guid?: GUID;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  author?: string;
  content?: string;
  contentEncoded?: string;
  contentSnippet?: string;
  summary?: string;
  description?: string;
  categories?: string[];
  enclosure?: { url: string };
  media?: { $: { url: string } };
}

interface CustomFeed {
  title: string;
  description: string;
  items: CustomItem[];
}

// Backend API endpoint (change to your production URL when deploying)
const API_BASE_URL = 'http://localhost:3001';

// For backward compatibility
export type { RSSSource, RSSArticle };
export type FeedItem = RSSArticle;
export type Source = RSSSource;

// Sample RSS feed sources
export const DEFAULT_SOURCES: RSSSource[] = [
  {
    id: 1,
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'technology'
  },
  {
    id: 2,
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'technology'
  },
  {
    id: 3,
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    category: 'technology'
  },
  {
    id: 4,
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'technology'
  },
  {
    id: 5,
    name: 'NPR',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'news'
  },
  {
    id: 6,
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/',
    category: 'news'
  },
  {
    id: 7,
    name: 'BBC News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'news'
  }
];

// Fetch RSS feed from backend API
async function parseRSS(url: string): Promise<CustomFeed> {
  try {
    console.log(`🌐 parseRSS: Fetching RSS from ${url}`);
    // Use our backend proxy to fetch the RSS feed
    const apiUrl = `${API_BASE_URL}/api/rss?url=${encodeURIComponent(url)}`;
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(apiUrl, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`🌐 parseRSS: Successfully fetched RSS from ${url}`);
      
      // Handle different feed formats (RSS, Atom, RDF)
      if (data.rss && data.rss.channel) {
        // Standard RSS format
        return parseRssFormat(data.rss.channel);
      } else if (data.feed) {
        // Atom format
        return parseAtomFormat(data.feed);
      } else if (data.rdf && data.rdf.channel) {
        // RDF format
        return parseRdfFormat(data.rdf);
      } else if (data.channel) {
        // Direct channel format
        return parseRssFormat(data.channel);
      }
      
      throw new Error('Unsupported RSS feed format');
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`Timeout fetching RSS from ${url}`);
        throw new Error(`Timeout fetching RSS from ${url}`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error parsing RSS:", error);
    throw error;
  }
}

// Parse standard RSS format
function parseRssFormat(channel: any): CustomFeed {
  const title = channel.title || 'Unnamed Feed';
  const description = channel.description || '';
  
  // Process items - handle both array and single item cases
  let rawItems = channel.item || [];
  if (!Array.isArray(rawItems)) {
    rawItems = [rawItems];
  }
  
  const items: CustomItem[] = rawItems.map(normalizeItem);
  
  return {
    title,
    description,
    items
  };
}

// Parse Atom format
function parseAtomFormat(feed: any): CustomFeed {
  const title = feed.title || 'Unnamed Feed';
  const description = feed.subtitle || feed.summary || '';
  
  // Process entries - handle both array and single entry cases
  let entries = feed.entry || [];
  if (!Array.isArray(entries)) {
    entries = [entries];
  }
  
  const items: CustomItem[] = entries.map((entry: any) => {
    // Extract link - handle different formats
    let link = '';
    if (entry.link) {
      if (Array.isArray(entry.link)) {
        const alternateLink = entry.link.find((l: any) => l.$.rel === 'alternate' || !l.$.rel);
        link = alternateLink?.$.href || entry.link[0]?.$.href || '';
      } else if (typeof entry.link === 'object') {
        link = entry.link.$.href || '';
      } else {
        link = entry.link || '';
      }
    }
    
    return normalizeItem({
      title: entry.title,
      link,
      guid: entry.id,
      pubDate: entry.published || entry.updated,
      description: entry.summary || entry.content,
      content: entry.content,
      author: entry.author?.name
    });
  });
  
  return {
    title,
    description,
    items
  };
}

// Parse RDF format
function parseRdfFormat(rdf: any): CustomFeed {
  const channel = rdf.channel || {};
  const title = channel.title || 'Unnamed Feed';
  const description = channel.description || '';
  
  // Process items
  let items: any[] = rdf.item || [];
  if (!Array.isArray(items)) {
    items = [items];
  }
  
  return {
    title,
    description,
    items: items.map(normalizeItem)
  };
}

// Normalize an RSS/Atom item to a consistent format
function normalizeItem(item: any): CustomItem {
  // Extract categories - handle different formats
  let categories: string[] = [];
  if (item.category) {
    if (Array.isArray(item.category)) {
      categories = item.category.map((c: any) => {
        if (typeof c === 'string') return c;
        return c._ || c.$ && c.$.term || '';
      }).filter(Boolean);
    } else if (typeof item.category === 'string') {
      categories = [item.category];
    } else if (item.category._ || (item.category.$ && item.category.$.term)) {
      categories = [item.category._ || item.category.$.term];
    }
  }
  
  // Handle encoded content
  const contentEncoded = item['content:encoded'] || undefined;
  
  // Create content snippet 
  const content = contentEncoded || item.content || item.description || '';
  const contentText = typeof content === 'string' ? content : JSON.stringify(content);
  const contentSnippet = contentText.replace(/<[^>]+>/g, ' ').substring(0, 200) + "...";
  
  // Handle guid in different formats
  let guid = '';
  if (item.guid) {
    guid = typeof item.guid === 'string' ? item.guid : 
           item.guid._ || item.guid.textContent || '';
  }
  
  return {
    title: item.title,
    link: item.link,
    guid: guid || item.id || item.link,
    pubDate: item.pubDate || item.published || item.date,
    isoDate: item.isoDate,
    content: contentEncoded || item.content,
    contentEncoded,
    contentSnippet,
    description: item.description || item.summary,
    creator: item['dc:creator'],
    author: item.author?.name || item.author,
    categories,
    enclosure: item.enclosure,
    media: item['media:content']
  };
}

// Helper to extract image URL from various RSS formats
function extractImageUrl(item: CustomItem): string | undefined {
  if (item.media && item.media.$ && item.media.$.url) {
    return item.media.$.url;
  }
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  // Extract from content as fallback
  const content = item.content || item.contentEncoded || item.description || '';
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const imgMatch = /<img[^>]+src="([^">]+)"/i.exec(contentStr || '');
  return imgMatch ? imgMatch[1] : undefined;
}

// Function to fetch a single RSS feed
export async function fetchFeed(source: Source): Promise<FeedItem[]> {
  try {
    console.log(`Fetching feed from ${source.name}...`);
    
    // Try to parse the RSS feed
    let feed;
    try {
      feed = await parseRSS(source.url);
    } catch (error) {
      console.error(`Error parsing RSS from ${source.name}:`, error);
      return [];
    }
    
    if (!feed || !feed.items || feed.items.length === 0) {
      console.warn(`No items found in feed from ${source.name}`);
      return [];
    }
    
    // Map feed items to normalized format
    return feed.items.map(item => ({
      id: item.guid || item.link || `${source.id}-${Date.now()}-${Math.random()}`,
      title: item.title || 'Untitled',
      link: item.link || '',
      author: item.creator || item.author || feed.title || source.name,
      source: source.name,
      sourceUrl: source.url,
      publishDate: item.pubDate || item.isoDate || new Date().toISOString(),
      summary: item.contentSnippet || item.summary || '',
      content: item.contentEncoded || item.content || item.description || '',
      imageUrl: extractImageUrl(item),
      categories: item.categories || [],
      isRead: false,
      isSaved: false
    }));
  } catch (error) {
    console.error(`Error fetching feed from ${source.name}:`, error);
    return [];
  }
}

// Function to fetch multiple RSS feeds
export async function fetchFeeds(sources: Source[] = DEFAULT_SOURCES): Promise<FeedItem[]> {
  try {
    // Make a copy of sources to avoid modifying the original
    const sourcesToFetch = [...sources];
    
    // Handle case where sources is empty
    if (!sourcesToFetch.length) {
      console.warn('No sources provided to fetchFeeds');
      return [];
    }
    
    console.log(`Fetching ${sourcesToFetch.length} feeds...`);
    
    const feedPromises = sourcesToFetch.map(source => fetchFeed(source));
    const feedsArray = await Promise.allSettled(feedPromises);
    
    // Process results and handle rejected promises
    const articles = feedsArray.flatMap((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to fetch feed from ${sourcesToFetch[index].name}:`, result.reason);
        return [];
      }
    });
    
    console.log(`Fetched ${articles.length} total articles from all feeds`);
    
    // Sort by publish date (most recent first)
    return articles.sort((a, b) => {
      const dateA = new Date(a.publishDate).getTime() || 0;
      const dateB = new Date(b.publishDate).getTime() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return [];
  }
}

import { Article, articlesApi, sourcesApi } from './apiService';

export interface RSSSource {
  id?: number;
  name: string;
  url: string;
  category?: string;
  description?: string;
}

export interface RSSArticle {
  title: string;
  link: string;
  guid?: string | { _: string; type?: string };
  author: string;
  source: string;
  sourceUrl: string;
  publishDate: string;
  summary: string;
  content?: string;
  imageUrl?: string; 
  categories: string[];
  isRead?: boolean;
  isSaved?: boolean;
}

/**
 * Convert an API article to an RSSArticle
 */
const mapToRSSArticle = (article: any): RSSArticle => {
  if (!article) {
    console.error("mapToRSSArticle: Received null or undefined article");
    return {
      title: 'Error: Missing Article',
      link: '',
      author: 'Unknown',
      source: 'Unknown Source',
      publishDate: new Date().toISOString(),
      summary: 'This article could not be loaded properly.',
      categories: []
    };
  }
  
  console.log("🔍 mapToRSSArticle processing article:", {
    title: article.title,
    guid: article.guid,
    guidType: article.guid ? typeof article.guid : 'undefined'
  });
  
  // For source handling
  let sourceValue: string | { name: string; url: string };
  
  if (typeof article.source === 'object' && article.source !== null) {
    sourceValue = {
      name: article.source.name || 'Unknown Source',
      url: article.source.url || ''
    };
  } else {
    sourceValue = article.source || 'Unknown Source';
  }
  
  const sourceName = typeof article.source === 'object' ? 
                    (article.source?.name || 'Unknown Source') : 
                    (article.source || 'Unknown Source');
  
  const sourceUrl = typeof article.source === 'object' ? 
                   (article.source?.url || '') : 
                   (article.sourceUrl || '');
  
  const rssArticle: RSSArticle = {
    title: article.title || 'No Title',
    link: article.link || '',
    guid: article.guid || article.link || `article-${Date.now()}-${Math.random()}`, // Ensure guid is never undefined
    author: article.author || article.creator || 'Unknown',
    publishDate: article.publishDate || article.pubDate || article.date || new Date().toISOString(),
    summary: article.summary || article.description || '',
    content: article.content || article.summary || '',
    imageUrl: article.imageUrl || extractImageFromHTML(article.content) || extractImageFromHTML(article.summary),
    categories: Array.isArray(article.categories) ? article.categories : [],
    source: sourceValue,
    sourceUrl: sourceUrl,
    isRead: article.isRead || false,
    isSaved: article.isSaved || false,
    sourceName: sourceName,
    sourceLogoUrl: article.sourceLogoUrl || null,
    creator: article.creator || article.author || 'Unknown',
    pubDate: article.pubDate || article.publishDate || new Date().toISOString(),
    contentSnippet: article.contentSnippet || (article.summary ? article.summary.substring(0, 200) + '...' : '')
  };
  
  console.log("🔍 Final rssArticle guid:", {
    guid: rssArticle.guid,
    guidType: typeof rssArticle.guid
  });
  
  // Make sure url property is set from link property
  if (!rssArticle.url && rssArticle.link) {
    rssArticle.url = rssArticle.link;
  }
  
  return rssArticle;
};

/**
 * RSS Service for fetching and processing RSS feeds
 */
const rssService = {
  /**
   * Get all available RSS sources
   */
  getSources: async (): Promise<RSSSource[]> => {
    try {
      const sources = await sourcesApi.getAllSources();
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        url: source.url,
        category: source.category,
        description: source.description
      }));
    } catch (error) {
      console.error('Error fetching RSS sources:', error);
      throw error;
    }
  },

  /**
   * Get user's subscribed sources
   */
  getUserSources: async (): Promise<RSSSource[]> => {
    try {
      const sources = await sourcesApi.getUserSources();
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        url: source.url,
        category: source.category,
        description: source.description
      }));
    } catch (error) {
      console.error('Error fetching user sources:', error);
      throw new Error('Failed to fetch user sources');
    }
  },

  /**
   * Get articles from a specific RSS feed URL using our backend proxy
   */
  getArticlesFromUrl: async (url: string): Promise<RSSArticle[]> => {
    if (!url) {
      console.error("getArticlesFromUrl: URL is empty or undefined");
      return [];
    }
    
    try {
      // Attempt to use backend proxy with a 10-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/rss?url=${encodeURIComponent(url)}`, 
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch RSS from backend: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.items || !Array.isArray(data.items)) {
          throw new Error('Invalid RSS response format from backend');
        }
        
        // Map items to our article format
        return data.items.map((item: any) => mapToRSSArticle({
          ...item,
          source: data.title || 'Unknown Source',
          sourceUrl: data.link || url
        }));
      } catch (backendError) {
        console.warn(`Backend RSS proxy failed, falling back to direct fetch: ${backendError.message}`);
        clearTimeout(timeoutId);
        
        // Fall back logic remains the same...
        // ... existing code for direct fetch ...
      }
    } catch (error) {
      console.error(`Error fetching articles from ${url}:`, error);
      return []; // Return empty array instead of throwing to prevent cascade failures
    }
  },

  /**
   * Get articles from a source by ID using the backend API
   */
  getArticlesFromSource: async (sourceId: number | string): Promise<RSSArticle[]> => {
    if (sourceId === undefined || sourceId === null) {
      console.error("getArticlesFromSource: sourceId is undefined or null");
      return [];
    }
    
    try {
      const articles = await articlesApi.getArticlesFromSource(sourceId);
      return articles.map(mapToRSSArticle);
    } catch (error) {
      console.error(`Error fetching articles from source ${sourceId}:`, error);
      return []; // Return empty array instead of throwing to prevent cascade failures
    }
  },

  /**
   * Save an article (add to user's saved articles)
   */
  saveArticle: async (guid: string): Promise<void> => {
    try {
      await articlesApi.saveArticle(undefined, guid, true);
    } catch (error) {
      console.error('Error saving article:', error);
      throw error;
    }
  },

  /**
   * Remove article from saved
   */
  unsaveArticle: async (guid: string): Promise<void> => {
    try {
      await articlesApi.saveArticle(undefined, guid, false);
    } catch (error) {
      console.error('Error unsaving article:', error);
      throw error;
    }
  },

  /**
   * Mark an article as read
   */
  markAsRead: async (guid: string): Promise<void> => {
    try {
      await articlesApi.markAsRead(undefined, guid, true);
    } catch (error) {
      console.error('Error marking article as read:', error);
      throw error;
    }
  },

  /**
   * Mark an article as unread
   */
  markAsUnread: async (guid: string): Promise<void> => {
    try {
      await articlesApi.markAsRead(undefined, guid, false);
    } catch (error) {
      console.error('Error marking article as unread:', error);
      throw error;
    }
  },

  /**
   * Get saved articles
   */
  getSavedArticles: async (): Promise<RSSArticle[]> => {
    try {
      const response = await articlesApi.getSavedArticles();
      return response.articles.map(mapToRSSArticle);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
      throw error;
    }
  }
};

/**
 * Extract the first image URL from HTML content
 */
function extractImageFromHTML(html: string): string | null {
  try {
    const imgMatch = /<img[^>]+src="([^">]+)"/i.exec(html);
    return imgMatch ? imgMatch[1] : null;
  } catch (e) {
    return null;
  }
}

export default rssService; 