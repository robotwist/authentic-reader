/**
 * RSS Fetcher Configuration
 * Centralized configuration for RSS fetching and processing
 */

export const RSS_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 8000,
  LONG_TIMEOUT: 15000,
  CONTENT_FETCH_TIMEOUT: 5000,
  
  // Caching
  CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  ANALYSIS_CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  
  // Limits
  DEFAULT_MAX_ITEMS: 50,
  DEFAULT_MAX_ARTICLES_PER_SOURCE: 10,
  DEFAULT_CONCURRENCY: 5,
  DEFAULT_BATCH_SIZE: 3,
  
  // HTTP
  MAX_REDIRECTS: 3,
  USER_AGENT: 'Authentic Reader RSS Fetcher/2.0',
  
  // Reading speed
  WORDS_PER_MINUTE: 200,
  
  // Content thresholds
  MIN_CONTENT_LENGTH: 50,
  SHORT_CONTENT_THRESHOLD: 1000,
  LONG_CONTENT_THRESHOLD: 2000,
  
  // Accept headers
  ACCEPT_HEADERS: 'application/rss+xml, application/xml, text/xml, */*'
};

export const CREDIBILITY_SOURCES = {
  HIGH: [
    'bbc.com', 'reuters.com', 'ap.org', 'npr.org', 'pbs.org',
    'nytimes.com', 'washingtonpost.com', 'wsj.com', 'economist.com',
    'nature.com', 'science.org', 'propublica.org', 'factcheck.org', 'snopes.com'
  ],
  MEDIUM: [
    'cnn.com', 'msnbc.com', 'foxnews.com', 'abcnews.go.com',
    'cbsnews.com', 'nbcnews.com', 'usatoday.com', 'latimes.com', 'chicagotribune.com'
  ],
  LOW: [
    'infowars.com', 'breitbart.com', 'dailywire.com',
    'theblaze.com', 'occupy.com', 'truthdig.com'
  ]
};

export const BIAS_RATINGS = {
  'BBC News': 'center',
  'Reuters': 'center',
  'Associated Press': 'center',
  'NPR': 'center-left',
  'The Guardian': 'center-left',
  'New York Times': 'center-left',
  'Wall Street Journal': 'center-right',
  'The Economist': 'center',
  'CNN': 'center-left',
  'Fox News': 'right'
};

export const CREDIBILITY_RATINGS = {
  'BBC News': 'high',
  'Reuters': 'high',
  'Associated Press': 'high',
  'NPR': 'high',
  'The Guardian': 'high',
  'New York Times': 'high',
  'Wall Street Journal': 'high',
  'The Economist': 'high',
  'CNN': 'medium',
  'Fox News': 'medium'
};

