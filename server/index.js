import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import helmet from 'helmet';
import { parseStringPromise } from 'xml2js';
import jsonStorage from './services/jsonStorageService.js';
// import comprehensiveAnalysis from './services/comprehensiveAnalysisService.js';

// Import monitoring tools
import monitorService from './services/monitorService.js';
import { errorMonitor } from './middleware/monitorMiddleware.js';
import monitorRoutes from './routes/monitorRoutes.js';

// Import services
import onnxService from './services/onnxService.js';

// Import routes
import userRoutes from './routes/user.js';
import sourceRoutes from './routes/source.js';
import articleRoutes from './routes/article.js';
import adminRoutes from './routes/admin.js';
import onnxRoutes from './routes/onnx.js';
import analysisRoutes from './routes/analysis.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize monitoring service
monitorService.init();

// Enhanced balanced sources with comprehensive coverage
const balancedSources = [
  // Far Left Sources
  { id: 'jacobin', name: 'Jacobin', url: 'https://jacobin.com/feed.xml', category: 'far-left', description: 'Socialist perspective on politics and economics', biasRating: 'far-left', reliability: 'medium' },
  { id: 'commondreams', name: 'Common Dreams', url: 'https://www.commondreams.org/feed', category: 'far-left', description: 'Progressive news and views', biasRating: 'far-left', reliability: 'medium' },
  { id: 'truthout', name: 'Truthout', url: 'https://truthout.org/feed/', category: 'far-left', description: 'Progressive investigative journalism', biasRating: 'far-left', reliability: 'medium' },
  { id: 'counterpunch', name: 'CounterPunch', url: 'https://www.counterpunch.org/feed/', category: 'far-left', description: 'Radical left perspectives', biasRating: 'far-left', reliability: 'low' },
  
  // Left Sources
  { id: 'npr', name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'left', description: 'Center-left public radio news', biasRating: 'left', reliability: 'high' },
  { id: 'msnbc', name: 'MSNBC', url: 'https://www.msnbc.com/feeds/latest.xml', category: 'left', description: 'Liberal cable news network', biasRating: 'left', reliability: 'medium' },
  { id: 'huffpost', name: 'HuffPost', url: 'https://www.huffpost.com/section/front-page/feed', category: 'left', description: 'Liberal digital media outlet', biasRating: 'left', reliability: 'medium' },
  { id: 'vox', name: 'Vox', url: 'https://www.vox.com/rss/index.xml', category: 'left', description: 'Liberal explanatory journalism', biasRating: 'left', reliability: 'medium' },
  { id: 'motherjones', name: 'Mother Jones', url: 'https://www.motherjones.com/feed/', category: 'left', description: 'Progressive investigative journalism', biasRating: 'left', reliability: 'medium' },
  { id: 'slate', name: 'Slate', url: 'https://slate.com/feed', category: 'left', description: 'Liberal online magazine', biasRating: 'left', reliability: 'medium' },
  
  // Center Sources
  { id: 'reuters', name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews', category: 'center', description: 'International news agency', biasRating: 'center', reliability: 'high' },
  { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'center', description: 'British public service broadcaster', biasRating: 'center', reliability: 'high' },
  { id: 'ap', name: 'Associated Press', url: 'https://feeds.ap.org/ap/topnews', category: 'center', description: 'Non-profit news cooperative', biasRating: 'center', reliability: 'high' },
  { id: 'pbs', name: 'PBS NewsHour', url: 'https://www.pbs.org/newshour/feed/podcast/newshour-full-show', category: 'center', description: 'Public broadcasting news', biasRating: 'center', reliability: 'high' },
  { id: 'npr-politics', name: 'NPR Politics', url: 'https://feeds.npr.org/510313/rss.xml', category: 'center', description: 'NPR political coverage', biasRating: 'center', reliability: 'high' },
  { id: 'cspan', name: 'C-SPAN', url: 'https://www.c-span.org/rss/', category: 'center', description: 'Unfiltered government coverage', biasRating: 'center', reliability: 'high' },
  { id: 'politico', name: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml', category: 'center', description: 'Political news and analysis', biasRating: 'center', reliability: 'high' },
  { id: 'rollcall', name: 'Roll Call', url: 'https://www.rollcall.com/feed/', category: 'center', description: 'Congressional news and analysis', biasRating: 'center', reliability: 'high' },
  
  // Right Sources
  { id: 'wsj', name: 'Wall Street Journal', url: 'https://feeds.wsj.com/public/rss/2_0.xml', category: 'right', description: 'Conservative business newspaper', biasRating: 'right', reliability: 'high' },
  { id: 'nationalreview', name: 'National Review', url: 'https://www.nationalreview.com/feed/', category: 'right', description: 'Conservative magazine', biasRating: 'right', reliability: 'medium' },
  { id: 'foxnews', name: 'Fox News', url: 'https://feeds.foxnews.com/foxnews/latest', category: 'right', description: 'Conservative cable news network', biasRating: 'right', reliability: 'medium' },
  { id: 'nypost', name: 'New York Post', url: 'https://nypost.com/feed/', category: 'right', description: 'Conservative tabloid', biasRating: 'right', reliability: 'medium' },
  { id: 'washingtontimes', name: 'Washington Times', url: 'https://www.washingtontimes.com/rss/headlines/', category: 'right', description: 'Conservative newspaper', biasRating: 'right', reliability: 'medium' },
  { id: 'washingtonexaminer', name: 'Washington Examiner', url: 'https://www.washingtonexaminer.com/feed', category: 'right', description: 'Conservative news outlet', biasRating: 'right', reliability: 'medium' },
  { id: 'dailycaller', name: 'Daily Caller', url: 'https://dailycaller.com/feed/', category: 'right', description: 'Conservative news website', biasRating: 'right', reliability: 'low' },
  { id: 'townhall', name: 'Townhall', url: 'https://townhall.com/rss.xml', category: 'right', description: 'Conservative news and opinion', biasRating: 'right', reliability: 'low' },
  
  // Far Right Sources
  { id: 'breitbart', name: 'Breitbart', url: 'https://www.breitbart.com/feed/', category: 'far-right', description: 'Far-right news and opinion', biasRating: 'far-right', reliability: 'low' },
  { id: 'infowars', name: 'InfoWars', url: 'https://www.infowars.com/feed/', category: 'far-right', description: 'Far-right conspiracy theory outlet', biasRating: 'far-right', reliability: 'low' },
  { id: 'gatewaypundit', name: 'Gateway Pundit', url: 'https://www.thegatewaypundit.com/feed/', category: 'far-right', description: 'Far-right news blog', biasRating: 'far-right', reliability: 'low' },
  { id: 'zerohedge', name: 'Zero Hedge', url: 'https://feeds.feedburner.com/zerohedge/feed', category: 'far-right', description: 'Far-right financial news', biasRating: 'far-right', reliability: 'low' },
  
  // International Sources
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'international', description: 'Qatar-based international news', biasRating: 'center-left', reliability: 'medium' },
  { id: 'dw', name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all', category: 'international', description: 'German international broadcaster', biasRating: 'center', reliability: 'high' },
  { id: 'france24', name: 'France 24', url: 'https://www.france24.com/en/rss', category: 'international', description: 'French international news', biasRating: 'center', reliability: 'high' },
  { id: 'scmp', name: 'South China Morning Post', url: 'https://www.scmp.com/rss/91/feed', category: 'international', description: 'Hong Kong-based international news', biasRating: 'center', reliability: 'medium' },
  
  // Fact-Checking Sources
  { id: 'factcheck', name: 'FactCheck.org', url: 'https://www.factcheck.org/feed/', category: 'fact-checking', description: 'Non-partisan fact-checking', biasRating: 'center', reliability: 'high' },
  { id: 'snopes', name: 'Snopes', url: 'https://www.snopes.com/feed/', category: 'fact-checking', description: 'Fact-checking and urban legend debunking', biasRating: 'center', reliability: 'high' },
  { id: 'politifact', name: 'PolitiFact', url: 'https://www.politifact.com/rss/all/', category: 'fact-checking', description: 'Political fact-checking', biasRating: 'center', reliability: 'high' },
  { id: 'reuters-factcheck', name: 'Reuters Fact Check', url: 'https://www.reuters.com/fact-check/feed', category: 'fact-checking', description: 'Reuters fact-checking service', biasRating: 'center', reliability: 'high' }
];

// Helper functions for comprehensive analysis
function extractKeyTopics(title, content) {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  const topics = [];
  
  // Enhanced keyword extraction with more categories
  const keywords = {
    'politics': ['election', 'vote', 'democrat', 'republican', 'congress', 'senate', 'president', 'government', 'policy', 'legislation'],
    'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'digital', 'computer', 'algorithm', 'machine learning', 'automation'],
    'health': ['health', 'medical', 'doctor', 'hospital', 'disease', 'vaccine', 'treatment', 'medicine', 'healthcare'],
    'economy': ['economy', 'market', 'stock', 'business', 'finance', 'money', 'inflation', 'recession', 'employment'],
    'environment': ['climate', 'environment', 'green', 'pollution', 'sustainability', 'carbon', 'renewable'],
    'science': ['research', 'study', 'scientists', 'discovery', 'experiment', 'data', 'analysis'],
    'education': ['school', 'university', 'education', 'student', 'learning', 'academic'],
    'entertainment': ['movie', 'music', 'celebrity', 'film', 'entertainment', 'culture'],
    'sports': ['sport', 'football', 'basketball', 'baseball', 'athlete', 'team', 'championship'],
    'international': ['world', 'global', 'international', 'foreign', 'diplomacy', 'trade']
  };

  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some(word => text && text.includes(word))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ['general'];
}

function assessBasicCredibility(url, title, content) {
  const domain = url ? new URL(url).hostname.toLowerCase() : '';
  const titleText = (title || '').toLowerCase();
  const contentText = (content || '').toLowerCase();
  
  // Enhanced credibility assessment
  const credibleDomains = [
    'bbc.com', 'reuters.com', 'ap.org', 'npr.org', 'pbs.org', 'nytimes.com', 
    'washingtonpost.com', 'wsj.com', 'economist.com', 'nature.com', 'science.org'
  ];
  
  const suspiciousWords = [
    'shocking', 'amazing', 'you won\'t believe', 'incredible', 'secret', 'conspiracy',
    'they don\'t want you to know', 'hidden truth', 'exposed', 'revealed', 'scandal'
  ];
  
  const sensationalistPatterns = [
    /!\s*$/, // Exclamation marks at end
    /BREAKING/, // Breaking news
    /URGENT/, // Urgent alerts
    /\d+\s+ways/, // Numbered lists
    /you'll never guess/, // Clickbait patterns
  ];
  
  let score = 0.5; // Base score
  let reasons = [];
  
  // Domain reputation
  if (domain && credibleDomains.some(d => domain.includes(d))) {
    score += 0.3;
    reasons.push('Reputable news source');
  }
  
  // Sensationalist language detection
  const suspiciousCount = suspiciousWords.filter(word => titleText.includes(word)).length;
  if (suspiciousCount > 0) {
    score -= 0.2 * suspiciousCount;
    reasons.push(`${suspiciousCount} sensationalist words detected`);
  }
  
  // Sensationalist patterns
  const patternMatches = sensationalistPatterns.filter(pattern => pattern.test(titleText)).length;
  if (patternMatches > 0) {
    score -= 0.1 * patternMatches;
    reasons.push('Clickbait patterns detected');
  }
  
  // Content length and structure
  if (contentText.length > 500) {
    score += 0.1;
    reasons.push('Substantial content length');
  }
  
  // External links presence
  if (contentText.includes('http') || contentText.includes('www')) {
    score += 0.1;
    reasons.push('Contains external references');
  }
  
  // Balance score
  score = Math.max(0.1, Math.min(1.0, score));
  
  let level = 'medium';
  if (score >= 0.7) level = 'high';
  else if (score <= 0.4) level = 'low';
  
  return { 
    score: Math.round(score * 100) / 100, 
    level, 
    reason: reasons.length > 0 ? reasons.join('; ') : 'Standard content assessment'
  };
}

function generateBasicSummary(content) {
  if (!content) return '';
  
  // Remove HTML tags and clean content
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extract meaningful sentences
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length === 0) return '';
  
  // Take first 2-3 meaningful sentences
  const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
  
  // Limit length for readability
  return summary.length > 300 ? summary.substring(0, 300) + '...' : summary;
}

function analyzeContentComplexity(content) {
  if (!content) return 'medium';
  
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanContent.split(/\s+/);
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate average sentence length
  const avgSentenceLength = words.length / sentences.length;
  
  // Calculate average word length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Determine complexity
  if (avgSentenceLength > 25 || avgWordLength > 6) {
    return 'hard';
  } else if (avgSentenceLength < 15 && avgWordLength < 5) {
    return 'easy';
  } else {
    return 'medium';
  }
}

function detectBiasIndicators(title, content) {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  
  const biasIndicators = {
    emotional: ['outrageous', 'disgusting', 'terrible', 'wonderful', 'amazing', 'horrible'],
    political: ['liberal', 'conservative', 'left-wing', 'right-wing', 'democrat', 'republican'],
    sensationalist: ['shocking', 'scandal', 'exposed', 'revealed', 'secret'],
    opinionated: ['clearly', 'obviously', 'undoubtedly', 'certainly', 'definitely']
  };
  
  const detectedBias = {};
  
  for (const [type, words] of Object.entries(biasIndicators)) {
    const matches = words.filter(word => text.includes(word));
    if (matches.length > 0) {
      detectedBias[type] = matches;
    }
  }
  
  return detectedBias;
}

// Logical fallacy detection utilities
function splitIntoSentences(text) {
  if (!text) return [];
  return String(text).replace(/\s+/g, ' ').split(/[.!?]+\s+/).filter(s => s && s.trim().length > 0);
}

const fallacyPatterns = {
  AD_HOMINEM: [
    /(liar|corrupt|stupid|ignorant|crazy|insane|extremist)/i,
    /cannot\s+be\s+trusted/i,
    /has\s+no\s+credibility/i,
    /typical\s+(liberal|conservative|leftist|right[- ]wing)/i
  ],
  STRAW_MAN: [
    /they\s+would\s+have\s+you\s+believe/i,
    /they\s+claim\s+that/i,
    /their\s+argument\s+boils\s+down\s+to/i
  ],
  APPEAL_TO_EMOTION: [
    /(horrific|terrifying|devastating|heartbreaking|outrageous)/i,
    /think(\s+of)?\s+the\s+children/i,
    /(fear|anger|outrage|panic)/i
  ],
  FALSE_DICHOTOMY: [
    /either\s+.*\s+or/i,
    /only\s+two\s+choices/i,
    /you\'re\s+either\s+with\s+us\s+or\s+against\s+us/i
  ],
  SLIPPERY_SLOPE: [
    /will\s+lead\s+to/i,
    /opens\s+the\s+door\s+to/i,
    /before\s+you\s+know\s+it/i
  ],
  HASTY_GENERALIZATION: [
    /they\s+always/i,
    /all\s+of\s+them\s+are/i,
    /never\s+once\s+has/i
  ]
};

function getFallacyExplanation(type) {
  const map = {
    AD_HOMINEM: 'Ad Hominem: Attacking the person instead of the argument.',
    STRAW_MAN: 'Straw Man: Misrepresenting an argument to make it easier to attack.',
    APPEAL_TO_EMOTION: 'Appeal to Emotion: Manipulating emotions instead of using facts.',
    FALSE_DICHOTOMY: 'False Dichotomy: Presenting only two options when others exist.',
    SLIPPERY_SLOPE: 'Slippery Slope: Claiming a small step will inevitably lead to a severe outcome.',
    HASTY_GENERALIZATION: 'Hasty Generalization: Drawing a broad conclusion from insufficient evidence.'
  };
  return map[type] || 'Logical fallacy detected.';
}

function calculateFallacyConfidence(matchText) {
  if (!matchText) return 0.6;
  return matchText.length > 10 ? 0.8 : 0.65;
}

function detectLogicalFallacies(text) {
  const results = [];
  if (!text) return results;
  const sentences = splitIntoSentences(text);
  sentences.forEach(sentence => {
    const startIndex = text.indexOf(sentence);
    const endIndex = startIndex + sentence.length;
    for (const [type, patterns] of Object.entries(fallacyPatterns)) {
      for (const pattern of patterns) {
        const match = sentence.match(pattern);
        if (match) {
          results.push({
            type,
            confidence: calculateFallacyConfidence(match[0]),
            explanation: getFallacyExplanation(type),
            excerpt: sentence.trim(),
            startIndex,
            endIndex
          });
        }
      }
    }
  });
  return results;
}

// Simple HTML entity decoder to handle titles like \'Home Improvement\'
function decodeHtmlEntities(input) {
  if (!input) return input;
  let str = String(input);
  const map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#8216;': "'",
    '&#8217;': "'",
    '&#8220;': '"',
    '&#8221;': '"',
    '&#8211;': '–',
    '&#8212;': '—'
  };
  Object.entries(map).forEach(([k, v]) => {
    str = str.split(k).join(v);
  });
  // Numeric entities
  str = str.replace(/&#(\d+);/g, (_m, code) => {
    const c = Number(code);
    if (!Number.isFinite(c)) return _m;
    try { return String.fromCharCode(c); } catch { return _m; }
  });
  return str;
}

// Basic bias assessment (left/right/center) using simple keyword counts
function assessBiasDirection(title, content) {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  const leftTerms = ['social justice','equity','progressive','climate crisis','gun control','reproductive rights','wealth tax','green new deal','medicare for all','systemic'];
  const rightTerms = ['free market','law and order','border security','small government','second amendment','pro-life','lower taxes','states\' rights','america first','patriotic'];
  let leftScore = 0; let rightScore = 0;
  leftTerms.forEach(t => { if (text.includes(t)) leftScore++; });
  rightTerms.forEach(t => { if (text.includes(t)) rightScore++; });
  let direction = 'center';
  let confidence = 0.5;
  if (leftScore > rightScore) {
    direction = 'left';
    confidence = Math.min(1, (leftScore - rightScore) / Math.max(1, leftScore + rightScore) + 0.5);
  } else if (rightScore > leftScore) {
    direction = 'right';
    confidence = Math.min(1, (rightScore - leftScore) / Math.max(1, leftScore + rightScore) + 0.5);
  }
  const explanation = direction === 'center'
    ? 'No strong directional bias detected.'
    : `Detected more ${direction}-leaning indicators in language.`;
  return {
    direction,
    confidence: Math.round(confidence * 100) / 100,
    explanation,
    indicators: {
      left: leftScore,
      right: rightScore
    }
  };
}

// Very simple network context: extract capitalized tokens as entities and rank by frequency
function buildNetworkSummary(text) {
  if (!text) return { entities: [], topEntities: [], entityCount: 0 };
  const entityCounts = new Map();
  const words = String(text).split(/\s+/);
  for (const w of words) {
    const token = w.replace(/[^A-Za-z]/g, '');
    if (token.length >= 3 && token[0] === token[0].toUpperCase() && token.slice(1) === token.slice(1).toLowerCase()) {
      entityCounts.set(token, (entityCounts.get(token) || 0) + 1);
    }
  }
  const entities = Array.from(entityCounts.entries()).map(([name, count]) => ({ name, count }));
  entities.sort((a, b) => b.count - a.count);
  return {
    entities,
    topEntities: entities.slice(0, 5),
    entityCount: entities.length
  };
}

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://authentic-reader.netlify.app', 'https://authentic-reader-3069d55d-ae95-404d-9983-3dd4f5b3795f.netlify.app', 'http://localhost:5173', 'http://localhost:5174']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
//       fontSrc: ["'self'", "https://fonts.gstatic.com"],
//       scriptSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "https:"],
//       connectSrc: ["'self'", "https://api.huggingface.co", "https://authentic-reader-api-8b0a83fb7d96.herokuapp.com"],
//       frameSrc: ["'none'"],
//       objectSrc: ["'none'"],
//       upgradeInsecureRequests: []
//     }
//   },
//   hsts: {
//     maxAge: 31536000,
//     includeSubDomains: true,
//     preload: true
//   }
// }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Proxy endpoint for fetching RSS feeds
 * Example: /api/rss?url=https://feeds.bbci.co.uk/news/world/rss.xml
 */
// RSS endpoint with comprehensive analysis
app.get('/api/rss', async (req, res) => {
  try {
    const feedUrl = req.query.url;
    
    if (!feedUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`Fetching RSS feed from: ${feedUrl}`);
    
    const response = await axios.get(feedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const feed = await parseStringPromise(response.data);
    const items = feed.rss?.channel?.[0]?.item || feed.feed?.entry || [];
    
    console.log(`Found ${items.length} items in RSS feed`);
    
    // Process and analyze each article with comprehensive analysis
    const processedItems = await Promise.all(items.slice(0, 20).map(async (item, index) => {
      const rawTitle = item.title?.[0] || item['media:title']?.[0] || '';
      const title = decodeHtmlEntities(rawTitle);
      const link = item.link?.[0] || item.link?.[0]?.$?.href || '';
      const rawDesc = item.description?.[0] || item.summary?.[0] || item['media:description']?.[0] || '';
      const description = decodeHtmlEntities(rawDesc);
      const pubDate = item.pubDate?.[0] || item.published?.[0] || '';
      const author = item.author?.[0] || item['dc:creator']?.[0] || '';
      
      // Extract full content if available
      let fullContent = item['content:encoded']?.[0] || description;
      
      // Try to fetch full article content if we have a link
      if (link && fullContent.length < 1000) {
        try {
          const contentResponse = await axios.get(link, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          // Extract main content from HTML (basic extraction)
          const htmlContent = contentResponse.data;
          const contentMatch = htmlContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                              htmlContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                              htmlContent.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          
          if (contentMatch && contentMatch[1]) {
            const extractedContent = contentMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (extractedContent.length > fullContent.length) {
              fullContent = extractedContent;
            }
          }
        } catch (contentError) {
          console.log(`Could not fetch full content for ${link}:`, contentError.message);
        }
      }
      
      // Prepare article data for comprehensive analysis
      const articleData = {
        title,
        link,
        description,
        pubDate,
        author,
        content: fullContent,
        source: feedUrl,
        fetchedAt: new Date().toISOString()
      };
      
      // Perform comprehensive analysis
      // const comprehensiveAnalysisResult = await comprehensiveAnalysis.analyzeFullArticle(articleData);
      
      // Create enhanced article data with detailed analysis
      const articleId = `article_${Date.now()}_${index}`;
      const analysis = {
        wordCount: fullContent ? fullContent.split(' ').length : 0,
        readingTime: fullContent ? Math.ceil(fullContent.split(' ').length / 200) : 0,
        hasExternalLinks: fullContent ? (fullContent.includes('http') || fullContent.includes('www')) : false,
        complexity: analyzeContentComplexity(fullContent),
        keyTopics: extractKeyTopics(title, fullContent),
        credibility: assessBasicCredibility(link, title, fullContent),
        summary: generateBasicSummary(fullContent),
        biasIndicators: detectBiasIndicators(title, fullContent),
        logicalFallacies: detectLogicalFallacies(fullContent),
        bias: assessBiasDirection(title, fullContent),
        network: buildNetworkSummary(fullContent),
        timestamp: new Date().toISOString()
      };

      // Create enhanced article data with detailed analysis
      const enhancedArticle = {
        ...item,
        articleId: `article_${Date.now()}_${index}`,
        content: fullContent,
        analysis: {
          wordCount: analysis.wordCount,
          readingTime: analysis.readingTime,
          hasExternalLinks: analysis.hasExternalLinks,
          complexity: analysis.complexity,
          keyTopics: analysis.keyTopics,
          credibility: {
            score: analysis.credibility.score,
            level: analysis.credibility.level,
            reason: analysis.credibility.reason
          },
          summary: analysis.summary,
          biasIndicators: analysis.biasIndicators,
          logicalFallacies: analysis.logicalFallacies,
          biasAnalysis: analysis.bias,
          networkAnalysis: analysis.network,
          timestamp: analysis.timestamp
        }
      };

      // Save to storage
      await jsonStorage.saveArticle(articleId, enhancedArticle);
      await jsonStorage.saveAnalysis(`analysis_${articleId}`, analysis);

      return {
        title,
        link,
        description,
        pubDate,
        author,
        content: fullContent.substring(0, 500) + (fullContent.length > 500 ? '...' : ''),
        analysis: enhancedArticle.analysis,
        articleId,
        source: feedUrl
      };
    }));

    const feedInfo = {
      title: feed.rss?.channel?.[0]?.title?.[0] || feed.feed?.title?.[0] || 'Unknown Feed',
      description: feed.rss?.channel?.[0]?.description?.[0] || feed.feed?.subtitle?.[0] || '',
      link: feed.rss?.channel?.[0]?.link?.[0] || feedUrl,
      itemCount: processedItems.length,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      ...feedInfo,
      items: processedItems
    });

  } catch (error) {
    console.error('RSS fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      message: error.message,
      url: req.query.url
    });
  }
});

// Endpoint to fetch articles from all balanced sources
app.get('/api/balanced-feed', async (req, res) => {
  try {
    const { categories = 'all', limit = 50 } = req.query;
    
    // Filter sources based on categories
    let sourcesToFetch = balancedSources;
    if (categories !== 'all') {
      const categoryList = categories.split(',');
      sourcesToFetch = balancedSources.filter(source => 
        categoryList.includes(source.category)
      );
    }
    
    console.log(`Fetching from ${sourcesToFetch.length} sources`);
    
    const allArticles = [];
    
    // Fetch from each source (with concurrency limit to avoid overwhelming servers)
    const concurrencyLimit = 5;
    for (let i = 0; i < sourcesToFetch.length; i += concurrencyLimit) {
      const batch = sourcesToFetch.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (source) => {
        try {
          const response = await axios.get(`/api/rss?url=${encodeURIComponent(source.url)}`, {
            baseURL: `http://localhost:${PORT}`,
            timeout: 15000
          });
          
          if (response.data && response.data.items) {
            return response.data.items.map(article => ({
              ...article,
              source: source.name,
              sourceCategory: source.category,
              biasRating: source.biasRating,
              reliability: source.reliability,
              sourceDescription: source.description
            }));
          }
          return [];
        } catch (error) {
          console.log(`Failed to fetch from ${source.name}:`, error.message);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      allArticles.push(...batchResults.flat());
    }
    
    // Sort by date and limit results
    const sortedArticles = allArticles
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, parseInt(limit));
    
    res.json({
      articles: sortedArticles,
      totalSources: sourcesToFetch.length,
      totalArticles: sortedArticles.length,
      categories: categories,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Balanced feed error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balanced feed',
      message: error.message
    });
  }
});

// Endpoint to get source statistics
app.get('/api/source-stats', async (req, res) => {
  try {
    const stats = {
      totalSources: balancedSources.length,
      byCategory: {},
      byReliability: {},
      byBias: {}
    };
    
    // Calculate statistics
    balancedSources.forEach(source => {
      // By category
      stats.byCategory[source.category] = (stats.byCategory[source.category] || 0) + 1;
      
      // By reliability
      stats.byReliability[source.reliability] = (stats.byReliability[source.reliability] || 0) + 1;
      
      // By bias
      stats.byBias[source.biasRating] = (stats.byBias[source.biasRating] || 0) + 1;
    });
    
    res.json(stats);
    
  } catch (error) {
    console.error('Source stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get source statistics',
      message: error.message
    });
  }
});

// Simple article analysis endpoint (no authentication required) - REGISTER FIRST
app.post('/api/analyze-article', async (req, res) => {
  console.log('Analysis endpoint hit!');
  try {
    const { title, content, url } = req.body;
    
    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required' });
    }

    // Enhanced content analysis with comprehensive analysis
    // const comprehensiveAnalysisResult = await comprehensiveAnalysis.analyzeFullArticle(articleData);
    
    // Basic analysis for now
    const analysis = {
      wordCount: content ? content.split(' ').length : 0,
      readingTime: content ? Math.ceil(content.split(' ').length / 200) : 0,
      hasExternalLinks: content ? (content.includes('http') || content.includes('www')) : false,
      complexity: analyzeContentComplexity(content),
      keyTopics: extractKeyTopics(title, content),
      credibility: assessBasicCredibility(url, title, content),
      summary: generateBasicSummary(content),
      biasIndicators: detectBiasIndicators(title, content),
      logicalFallacies: detectLogicalFallacies(content || ''),
      bias: assessBiasDirection(title, content),
      network: buildNetworkSummary(content),
      timestamp: new Date().toISOString()
    };

    // Save analysis to JSON storage
    const analysisId = `analysis_${Date.now()}`;
    await jsonStorage.saveAnalysis(analysisId, analysis);

    res.json({
      success: true,
      analysis,
      analysisId
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

// Get stored analyses (no authentication required) - REGISTER FIRST
app.get('/api/analyses-list', async (req, res) => {
  console.log('Analyses endpoint hit!');
  try {
    const analyses = await jsonStorage.getAnalysis();
    const analysisList = Object.entries(analyses).map(([id, analysis]) => ({
      id,
      ...analysis
    }));

    res.json({
      success: true,
      analyses: analysisList,
      count: analysisList.length
    });

  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analyses',
      message: error.message 
    });
  }
});

// Test endpoint to verify route registration
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

/**
 * Proxy endpoint for fetching article content
 * Example: /api/content?url=https://www.bbc.com/news/world-us-canada-12345
 */
app.get('/api/content', async (req, res) => {
  try {
    const contentUrl = req.query.url;
    
    if (!contentUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`Fetching content from: ${contentUrl}`);
    
    // Try multiple user agents if the first one fails
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
    ];
    
    let response;
    let error;
    
    // Try with different user agents
    for (const userAgent of userAgents) {
      try {
        response = await axios.get(contentUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/'
          },
          timeout: 15000 // 15 second timeout
        });
        
        if (response && response.data) {
          break; // Success, exit the loop
        }
      } catch (err) {
        console.error(`Attempt with user agent "${userAgent}" failed:`, err.message);
        error = err;
      }
    }
    
    if (!response || !response.data) {
      throw error || new Error('Failed to fetch content with all user agents');
    }
    
    // Return the content
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'text/html');
    res.send(response.data);
    
  } catch (error) {
    console.error(`Error fetching content: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      message: error.message,
      url: req.query.url
    });
  }
});

// API routes - REGISTER AFTER CUSTOM ROUTES
app.use('/api/users', userRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onnx', onnxRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/monitor', monitorRoutes);

// Apply error monitoring middleware
app.use(errorMonitor);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    status: err.status || 500
  });
});

/**
 * Proxy endpoint for fetching article content
 * Example: /api/content?url=https://www.bbc.com/news/world-us-canada-12345
 */

// Fallback route - must be last
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

let serverInstance = null;

// Function to start the server (if not in test mode)
const startServer = async () => {
  if (process.env.NODE_ENV !== 'test') {
    serverInstance = app.listen(PORT, '0.0.0.0', async () => {
      console.log(`Server running on port ${PORT} and bound to all interfaces`);
      // Initialize JSON storage and run maintenance
      try {
        await jsonStorage.ensureDataDir();
        console.log('JSON storage initialized successfully.');
        
        // Initialize default data if needed
        await initializeDefaultData();
        
      } catch (error) {
        console.error('Unable to initialize JSON storage:', error);
        monitorService.recordError('startup', error);
        process.exit(1);
      }
    });

    // Handle server errors
    serverInstance.on('error', (error) => {
      if (error.syscall !== 'listen') {
        monitorService.recordError('server', error);
        throw error;
      }
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          monitorService.recordError('server', new Error(`Port ${PORT} requires elevated privileges`));
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          monitorService.recordError('server', new Error(`Port ${PORT} is already in use`));
          // Attempt to gracefully handle or notify, instead of exiting immediately
          // process.exit(1);
          break;
        default:
          monitorService.recordError('server', error);
          throw error;
      }
    });

  } else {
    console.log('Test environment detected, server will not start automatically.');
    // In test mode, the app instance is exported for supertest
  }
};

// Initialize default data
async function initializeDefaultData() {
  const sources = await jsonStorage.getSources();
  if (Object.keys(sources).length === 0) {
    // Add default sources
    await jsonStorage.saveSource('npr', {
      name: 'NPR',
      url: 'https://feeds.npr.org/1001/rss.xml',
      description: 'National Public Radio'
    });
    await jsonStorage.saveSource('bbc', {
      name: 'BBC News',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      description: 'BBC News'
    });
    console.log('Default sources initialized.');
  }
}

// Helper function to generate detailed credibility explanations
function generateCredibilityExplanation(credibilityAssessment) {
  const { sourceReputation, authorCredibility, historicalAccuracy, transparency } = credibilityAssessment;
  
  let explanation = '';
  
  // Source reputation explanation
  if (sourceReputation.score > 0.8) {
    explanation += `This source has a strong reputation for accuracy and fact-checking. `;
  } else if (sourceReputation.score < 0.4) {
    explanation += `This source has a history of publishing unreliable or sensationalist content. `;
  }
  
  // Historical accuracy explanation
  if (historicalAccuracy.accuracyRate > 0.8) {
    explanation += `Fact-checking organizations have found this source to be accurate ${Math.round(historicalAccuracy.accuracyRate * 100)}% of the time. `;
  } else if (historicalAccuracy.accuracyRate < 0.6) {
    explanation += `Fact-checking organizations have found this source to be inaccurate ${Math.round((1 - historicalAccuracy.accuracyRate) * 100)}% of the time. `;
  }
  
  // Author credibility explanation
  if (authorCredibility.score > 0.8) {
    explanation += `The author has a strong track record of accurate reporting. `;
  } else if (authorCredibility.score < 0.4) {
    explanation += `The author has a history of publishing questionable content. `;
  }
  
  // Transparency explanation
  if (transparency.score > 0.8) {
    explanation += `The article provides clear sources and citations. `;
  } else if (transparency.score < 0.4) {
    explanation += `The article lacks transparency in its sources and methodology. `;
  }
  
  return explanation || 'Standard credibility assessment based on source reputation and content analysis.';
}

// Helper function to generate enhanced summaries
function generateEnhancedSummary(content) {
  if (!content) return '';
  
  // Remove HTML tags and clean content
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extract meaningful sentences
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length === 0) return '';
  
  // Take first 2-3 meaningful sentences
  const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
  
  // Limit length for readability
  return summary.length > 300 ? summary.substring(0, 300) + '...' : summary;
}

/**
 * Proxy endpoint for fetching article content
 * Example: /api/content?url=https://www.bbc.com/news/world-us-canada-12345
 */

// Call startServer only if this file is run directly (not required by tests)
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  startServer();
}

// Graceful shutdown (optional but recommended)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('HTTP server closed');
      monitorService.shutdown();
    });
  }
});

// Export the Express app instance for testing
export default app; 