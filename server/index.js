import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import helmet from 'helmet';
import { parseStringPromise } from 'xml2js';
import jsonStorage from './services/jsonStorageService.js';

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

// Helper functions for basic analysis
function extractKeyTopics(title, content) {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  const topics = [];
  
  // Simple keyword extraction
  const keywords = {
    'politics': ['election', 'vote', 'democrat', 'republican', 'congress', 'senate', 'president'],
    'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'digital', 'computer'],
    'health': ['health', 'medical', 'doctor', 'hospital', 'disease', 'vaccine'],
    'economy': ['economy', 'market', 'stock', 'business', 'finance', 'money'],
    'environment': ['climate', 'environment', 'green', 'pollution', 'sustainability']
  };

  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some(word => text && text.includes(word))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ['general'];
}

function assessBasicCredibility(url, title) {
  const domain = url ? new URL(url).hostname.toLowerCase() : '';
  const titleText = (title || '').toLowerCase();
  
  // Basic credibility indicators
  const credibleDomains = ['bbc.com', 'reuters.com', 'ap.org', 'npr.org', 'pbs.org'];
  const suspiciousWords = ['shocking', 'amazing', 'you won\'t believe', 'incredible', 'secret'];
  
  if (domain && credibleDomains.some(d => domain.includes(d))) {
    return { score: 0.8, level: 'high', reason: 'Reputable news source' };
  }
  
  if (suspiciousWords.some(word => titleText.includes(word))) {
    return { score: 0.3, level: 'low', reason: 'Sensationalist language detected' };
  }
  
  return { score: 0.6, level: 'medium', reason: 'Standard content' };
}

function generateBasicSummary(content) {
  if (!content) return '';
  
  // Simple extractive summarization (first few sentences)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summary = sentences.slice(0, 2).join('. ') + '.';
  
  return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
}

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://authentic-reader.netlify.app', 'https://authentic-reader-3069d55d-ae95-404d-9983-3dd4f5b3795f.netlify.app', 'http://localhost:5173']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
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

// Simple article analysis endpoint (no authentication required) - REGISTER FIRST
app.post('/api/analyze-article', async (req, res) => {
  console.log('Analysis endpoint hit!');
  try {
    const { title, content, url } = req.body;
    
    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required' });
    }

    // Basic content analysis (no external AI services needed)
    const analysis = {
      wordCount: content ? content.split(' ').length : 0,
      readingTime: content ? Math.ceil(content.split(' ').length / 200) : 0, // 200 words per minute
      hasExternalLinks: content ? (content.includes('http') || content.includes('www')) : false,
      complexity: 'medium', // Basic complexity assessment
      keyTopics: extractKeyTopics(title, content),
      credibility: assessBasicCredibility(url, title),
      summary: generateBasicSummary(content),
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

/**
 * Proxy endpoint for fetching RSS feeds
 * Example: /api/rss?url=https://feeds.bbci.co.uk/news/world/rss.xml
 */
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
        'User-Agent': 'AuthenticReader/1.0 (RSS Reader)'
      }
    });

    console.log(`Feed response status: ${response.status}, Content type: ${response.headers['content-type']}`);

    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch RSS feed',
        status: response.status 
      });
    }

    const xmlData = response.data;
    const result = await parseStringPromise(xmlData);
    
    if (!result.rss && !result.feed) {
      return res.status(400).json({ error: 'Invalid RSS/Atom feed format' });
    }

    // Extract feed information
    const feed = result.rss?.channel?.[0] || result.feed;
    const items = feed.item || feed.entry || [];
    
    // Process and analyze each article
    const processedItems = await Promise.all(items.map(async (item, index) => {
      const title = item.title?.[0] || item['media:title']?.[0] || '';
      const link = item.link?.[0] || item.link?.[0]?.$?.href || '';
      const description = item.description?.[0] || item.summary?.[0] || item['media:description']?.[0] || '';
      const pubDate = item.pubDate?.[0] || item.published?.[0] || '';
      const author = item.author?.[0] || item['dc:creator']?.[0] || '';
      
      // Basic content extraction
      const content = item['content:encoded']?.[0] || description;
      
      // Analyze the article
      const analysis = {
        wordCount: content ? content.split(' ').length : 0,
        readingTime: content ? Math.ceil(content.split(' ').length / 200) : 0,
        hasExternalLinks: content ? (content.includes('http') || content.includes('www')) : false,
        complexity: 'medium',
        keyTopics: extractKeyTopics(title, content),
        credibility: assessBasicCredibility(link, title),
        summary: generateBasicSummary(content),
        timestamp: new Date().toISOString()
      };

      // Save article and analysis to storage
      const articleId = `article_${Date.now()}_${index}`;
      const articleData = {
        title,
        link,
        description,
        pubDate,
        author,
        content,
        analysis,
        source: feedUrl,
        fetchedAt: new Date().toISOString()
      };

      await jsonStorage.saveArticle(articleId, articleData);
      await jsonStorage.saveAnalysis(`analysis_${articleId}`, analysis);

      return {
        title,
        link,
        description,
        pubDate,
        author,
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Truncate for response
        analysis,
        articleId
      };
    }));

    const feedInfo = {
      title: feed.title?.[0] || 'Unknown Feed',
      description: feed.description?.[0] || feed.subtitle?.[0] || '',
      link: feed.link?.[0] || feedUrl,
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

// Fallback route
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

/**
 * Proxy endpoint for fetching article content
 * Example: /api/content?url=https://www.bbc.com/news/world-us-canada-12345
 */

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