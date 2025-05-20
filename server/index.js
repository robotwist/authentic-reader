import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { parseStringPromise } from 'xml2js';

// Import monitoring tools
import monitorService from './services/monitorService.js';
import { requestMonitor, errorMonitor } from './middleware/monitorMiddleware.js';
import monitorRoutes from './routes/monitorRoutes.js';

// Import database models and utilities
import db from './models/index.js';
const { sequelize } = db;

// Import user maintenance utilities
import { ensureAdminUsers, verifyUserPasswords } from './utils/userMaintenance.js';

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply monitoring middleware to all requests
app.use(requestMonitor);

// API routes
app.use('/api/users', userRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onnx', onnxRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/monitor', monitorRoutes);

// Enable verbose login debugging
app.use((req, res, next) => {
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    console.log('LOGIN ATTEMPT DETECTED:');
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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
    
    // Fix for Reuters feed which may have special handling needs
    let adjustedFeedUrl = feedUrl;
    if (feedUrl.includes('reuters.com')) {
      // Use alternative Reuters feed URL if needed
      if (feedUrl === 'https://feeds.reuters.com/reuters/topNews') {
        // Reuters API has changed, use a different news source as fallback
        adjustedFeedUrl = 'https://www.cnbc.com/id/100003114/device/rss/rss.html';
        console.log(`Redirecting Reuters feed to CNBC News feed: ${adjustedFeedUrl}`);
      }
    }
    
    // Fetch the RSS feed with retry logic
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        response = await axios.get(adjustedFeedUrl, {
          headers: {
            'User-Agent': 'Authentic Reader RSS Fetcher/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          },
          timeout: 15000, // 15 second timeout
          validateStatus: status => status < 500 // Accept any status < 500
        });
        
        if (response.status === 200) {
          break; // Success, exit the retry loop
        } else {
          console.log(`Attempt ${attempts} failed with status ${response.status}. ${attempts < maxAttempts ? 'Retrying...' : 'Giving up.'}`);
          
          if (attempts >= maxAttempts) {
            throw new Error(`Failed after ${maxAttempts} attempts. Last status: ${response.status}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Attempt ${attempts} error:`, error.message);
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Log response details for debugging
    console.log(`Feed response status: ${response.status}, Content type: ${response.headers['content-type']}`);
    
    try {
      // Parse XML to JSON with more forgiving options
      const result = await parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        normalizeTags: false,
        trim: true
      });
      
      // Check if the result has a valid RSS structure
      if (!result || (!result.rss && !result.feed && !result.rdf)) {
        console.error('Invalid RSS structure detected', JSON.stringify(result).substring(0, 200) + '...');
        return res.status(422).json({ 
          error: 'Invalid RSS feed structure',
          feedUrl: adjustedFeedUrl
        });
      }
      
      // Return the parsed feed
      res.json(result);
    } catch (parseError) {
      console.error(`XML parsing error:`, parseError);
      
      // Return a more meaningful error
      res.status(422).json({ 
        error: 'Failed to parse XML feed',
        message: parseError.message,
        feedUrl: adjustedFeedUrl
      });
    }
  } catch (error) {
    console.error(`Error fetching RSS feed from ${req.query.url}:`, error);
    
    // Return a meaningful error response
    res.status(500).json({ 
      error: 'Failed to fetch RSS feed',
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

// Apply error monitoring middleware
app.use(errorMonitor);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Fallback route
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

let serverInstance = null;

// Function to start the server (if not in test mode)
const startServer = async () => {
  if (process.env.NODE_ENV !== 'test') {
    serverInstance = app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
      // Initialize database connection and run maintenance
      try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Run user maintenance tasks
        await ensureAdminUsers();
        await verifyUserPasswords();
        
      } catch (error) {
        console.error('Unable to connect to the database or run maintenance:', error);
        console.error('Is the database server running and accessible?');
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

// Call startServer only if this file is run directly (not required by tests)
if (import.meta.url === import.meta.main) {
  startServer();
}

// Graceful shutdown (optional but recommended)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('HTTP server closed');
      sequelize.close().then(() => console.log('DB connection closed'));
      monitorService.shutdown();
    });
  }
});

// Export the Express app instance for testing
export default app; 