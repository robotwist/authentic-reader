import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import logger from '../utils/logger.js';
import { RSS_CONFIG } from '../config/rssConfig.js';

/**
 * Optimized RSS Service
 * 
 * Best practices:
 * - Uses ETag/Last-Modified headers for caching
 * - Efficient XML parsing with xml2js
 * - Proper concurrency handling
 * - No unnecessary full-content fetching
 * - Streamlined response format
 */

class RSSService {
  constructor() {
    // Cache for ETags and Last-Modified headers
    this.cache = new Map();
    this.cacheTimeout = RSS_CONFIG.CACHE_TIMEOUT;
  }

  /**
   * Fetch RSS feed with caching support
   */
  async fetchFeed(url, options = {}) {
    const {
      timeout = RSS_CONFIG.DEFAULT_TIMEOUT,
      maxItems = RSS_CONFIG.DEFAULT_MAX_ITEMS,
      useCache = true
    } = options;

    const cacheKey = url;
    const cached = this.cache.get(cacheKey);

    // Check cache
    if (useCache && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logger.debug(`Cache hit for ${url}`);
      return cached.data;
    }

    try {
      // Prepare headers for conditional requests
      const headers = {
        'User-Agent': RSS_CONFIG.USER_AGENT,
        'Accept': RSS_CONFIG.ACCEPT_HEADERS,
        'Accept-Encoding': 'gzip, deflate'
      };

      // Add conditional headers if we have cached data
      if (useCache && cached) {
        if (cached.etag) headers['If-None-Match'] = cached.etag;
        if (cached.lastModified) headers['If-Modified-Since'] = cached.lastModified;
      }

      // Fetch feed
      const response = await axios.get(url, {
        headers,
        timeout,
        validateStatus: (status) => status === 200 || status === 304, // Accept 304 Not Modified
        maxRedirects: RSS_CONFIG.MAX_REDIRECTS
      });

      // Handle 304 Not Modified
      if (response.status === 304 && cached) {
        logger.debug(`Feed not modified: ${url}`);
        return cached.data;
      }

      // Parse feed
      const feed = await this.parseFeed(response.data);
      
      // Extract items
      const items = this.extractItems(feed).slice(0, maxItems);

      // Store cache metadata
      const etag = response.headers.etag;
      const lastModified = response.headers['last-modified'];

      const result = {
        title: this.extractTitle(feed),
        description: this.extractDescription(feed),
        link: this.extractLink(feed) || url,
        items: items,
        fetchedAt: new Date().toISOString()
      };

      // Update cache
      if (useCache) {
        this.cache.set(cacheKey, {
          data: result,
          etag,
          lastModified,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      logger.error(`Error fetching RSS feed ${url}:`, error.message);
      
      // Return cached data if available, even if stale
      if (cached) {
        logger.warn(`Using stale cache for ${url}`);
        return cached.data;
      }
      
      throw error;
    }
  }

  /**
   * Parse XML feed to object
   */
  async parseFeed(xmlData) {
    try {
      return await parseStringPromise(xmlData, {
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        trim: true,
        ignoreAttrs: false
      });
    } catch (error) {
      logger.error('Error parsing XML:', error);
      throw new Error('Invalid RSS feed format');
    }
  }

  /**
   * Extract items from parsed feed (handles RSS, Atom, RDF)
   */
  extractItems(feed) {
    // RSS 2.0 format
    if (feed.rss?.channel) {
      const channel = Array.isArray(feed.rss.channel) 
        ? feed.rss.channel[0] 
        : feed.rss.channel;
      const items = channel.item || [];
      return Array.isArray(items) ? items : [items];
    }

    // Atom format
    if (feed.feed?.entry) {
      const entries = feed.feed.entry || [];
      return Array.isArray(entries) ? entries : [entries];
    }

    // RDF format
    if (feed.rdf?.item) {
      const items = feed.rdf.item || [];
      return Array.isArray(items) ? items : [items];
    }

    return [];
  }

  /**
   * Extract feed title
   */
  extractTitle(feed) {
    if (feed.rss?.channel) {
      const channel = Array.isArray(feed.rss.channel) 
        ? feed.rss.channel[0] 
        : feed.rss.channel;
      return this.normalizeText(channel.title);
    }
    if (feed.feed?.title) {
      return this.normalizeText(feed.feed.title);
    }
    return 'Untitled Feed';
  }

  /**
   * Extract feed description
   */
  extractDescription(feed) {
    if (feed.rss?.channel) {
      const channel = Array.isArray(feed.rss.channel) 
        ? feed.rss.channel[0] 
        : feed.rss.channel;
      return this.normalizeText(channel.description);
    }
    if (feed.feed?.subtitle || feed.feed?.description) {
      return this.normalizeText(feed.feed.subtitle || feed.feed.description);
    }
    return '';
  }

  /**
   * Extract feed link
   */
  extractLink(feed) {
    if (feed.rss?.channel) {
      const channel = Array.isArray(feed.rss.channel) 
        ? feed.rss.channel[0] 
        : feed.rss.channel;
      return this.normalizeText(channel.link);
    }
    if (feed.feed?.link) {
      const link = feed.feed.link;
      if (Array.isArray(link)) {
        const alternate = link.find(l => l.$.rel === 'alternate' || !l.$.rel);
        return alternate?.$.href || link[0]?.$.href || '';
      }
      if (typeof link === 'object' && link.$) {
        return link.$.href || '';
      }
      return typeof link === 'string' ? link : '';
    }
    return '';
  }

  /**
   * Normalize item to standard format
   */
  normalizeItem(item, sourceName = '') {
    // Extract title
    const title = this.normalizeText(
      item.title || 
      item['media:title'] || 
      ''
    );

    // Extract link
    let link = '';
    if (item.link) {
      if (Array.isArray(item.link)) {
        link = typeof item.link[0] === 'string' 
          ? item.link[0] 
          : (item.link[0]?.$?.href || item.link[0]?.href || '');
      } else if (typeof item.link === 'object' && item.link.$) {
        link = item.link.$.href || '';
      } else {
        link = typeof item.link === 'string' ? item.link : '';
      }
    }

    // Extract GUID/ID
    let guid = link;
    if (item.guid) {
      if (typeof item.guid === 'string') {
        guid = item.guid;
      } else if (item.guid._) {
        guid = item.guid._;
      } else if (item.guid.textContent) {
        guid = item.guid.textContent;
      }
    } else if (item.id) {
      guid = typeof item.id === 'string' ? item.id : (item.id[0] || link);
    }

    // Extract description/summary
    const description = this.normalizeText(
      item.description || 
      item.summary || 
      item['media:description'] || 
      item.content?._ || 
      item.content || 
      ''
    );

    // Extract content (prefer encoded content)
    const content = this.normalizeText(
      item['content:encoded'] || 
      item.content?._ || 
      item.content || 
      description
    );

    // Extract publish date
    const pubDate = this.normalizeText(
      item.pubDate || 
      item.published || 
      item.updated || 
      item.date || 
      new Date().toISOString()
    );

    // Extract author
    let author = sourceName;
    if (item.author) {
      if (typeof item.author === 'string') {
        author = item.author;
      } else if (item.author.name) {
        author = item.author.name;
      } else if (Array.isArray(item.author) && item.author[0]) {
        author = typeof item.author[0] === 'string' 
          ? item.author[0] 
          : (item.author[0].name || sourceName);
      }
    } else if (item['dc:creator']) {
      author = this.normalizeText(item['dc:creator']);
    }

    // Extract categories
    const categories = [];
    if (item.category) {
      const cats = Array.isArray(item.category) ? item.category : [item.category];
      categories.push(...cats.map(cat => {
        if (typeof cat === 'string') return cat;
        return cat._ || cat.$.term || '';
      }).filter(Boolean));
    }

    return {
      title: this.decodeHtmlEntities(title),
      link,
      guid: guid || link,
      author,
      publishDate: pubDate,
      description: this.cleanHtml(description),
      content: this.cleanHtml(content),
      categories,
      source: sourceName
    };
  }

  /**
   * Normalize text (handle arrays, objects, etc.)
   */
  normalizeText(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value[0] || '';
    if (typeof value === 'object' && value._) return value._;
    if (typeof value === 'object' && value.textContent) return value.textContent;
    return String(value);
  }

  /**
   * Clean HTML tags from text
   */
  cleanHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Decode HTML entities
   */
  decodeHtmlEntities(text) {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"');
  }

  /**
   * Fetch multiple feeds concurrently
   */
  async fetchFeeds(urls, options = {}) {
    const {
      concurrency = RSS_CONFIG.DEFAULT_CONCURRENCY,
      timeout = RSS_CONFIG.DEFAULT_TIMEOUT,
      maxItems = RSS_CONFIG.DEFAULT_MAX_ITEMS
    } = options;

    // Process in batches
    const results = [];
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => 
        this.fetchFeed(url, { timeout, maxItems })
          .then(data => ({ url, data, error: null }))
          .catch(error => ({ url, data: null, error: error.message }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { url: '', data: null, error: result.reason }
      ));
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache(url = null) {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }
}

export default new RSSService();

