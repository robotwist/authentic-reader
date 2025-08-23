import express from 'express';
import { parseStringPromise } from 'xml2js';
import axios from 'axios';

const router = express.Router();

/**
 * @route GET /api/stockpile-simple/status
 * @desc Get simplified stockpile service status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      isRunning: true,
      isAnalyzing: false,
      lastFetchTime: new Date().toISOString(),
      queueSize: 0,
      fetchInterval: 900000,
      message: 'Simplified stockpile service is running'
    });
  } catch (error) {
    console.error('Error getting stockpile status:', error);
    res.status(500).json({
      error: 'Failed to get stockpile status',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stockpile-simple/articles
 * @desc Get articles with basic analysis (simplified version)
 * @access Public
 */
router.get('/articles', async (req, res) => {
  try {
    const {
      limit = 50,
      categories = '',
      sources = '',
      offset = 0
    } = req.query;

    // Use the existing balanced sources
    const balancedSources = [
      { id: 'bbc', name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'center' },
      { id: 'npr', name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'left' },
      { id: 'reuters', name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews', category: 'center' },
      { id: 'ap', name: 'Associated Press', url: 'https://feeds.ap.org/ap/topnews', category: 'center' },
      { id: 'wsj', name: 'Wall Street Journal', url: 'https://feeds.wsj.com/public/rss/2_0.xml', category: 'right' }
    ];

    // Filter sources based on categories
    let sourcesToFetch = balancedSources;
    if (categories && categories.trim() !== '') {
      const categoryList = categories.split(',').map(cat => cat.trim());
      sourcesToFetch = balancedSources.filter(source => 
        categoryList.includes(source.category)
      );
    }

    const allArticles = [];
    
    // Fetch from each source
    for (const source of sourcesToFetch) {
      try {
        console.log(`Fetching from ${source.name}: ${source.url}`);
        
        const response = await axios.get(source.url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });
        
        const feed = await parseStringPromise(response.data);
        const items = feed.rss?.channel?.[0]?.item || feed.feed?.entry || [];
        
        console.log(`Found ${items.length} items from ${source.name}`);
        
        // Process articles from this source
        const processedArticles = items.slice(0, 10).map((item, index) => {
          const rawTitle = item.title?.[0] || item['media:title']?.[0] || '';
          const title = decodeHtmlEntities(rawTitle);
          const link = item.link?.[0] || item.link?.[0]?.$?.href || '';
          const rawDesc = item.description?.[0] || item.summary?.[0] || item['media:description']?.[0] || '';
          const description = decodeHtmlEntities(rawDesc).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
          const author = item.author?.[0] || item['dc:creator']?.[0] || source.name;
          
          // Extract full content if available
          let fullContent = item['content:encoded']?.[0] || description;
          
          // Basic analysis
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
          
          return {
            id: `stockpile_${source.id}_${Date.now()}_${index}`,
            title,
            link,
            author,
            publishDate: pubDate,
            content: fullContent.substring(0, 500) + (fullContent.length > 500 ? '...' : ''),
            summary: description,
            source: source.name,
            sourceCategory: source.category,
            biasRating: source.category,
            reliability: 'high',
            categories: [source.category],
            analysis: {
              wordCount: analysis.wordCount,
              readingTime: analysis.readingTime,
              hasExternalLinks: analysis.hasExternalLinks,
              complexity: analysis.complexity,
              keyTopics: analysis.keyTopics,
              credibility: analysis.credibility,
              summary: analysis.summary,
              biasIndicators: analysis.biasIndicators,
              logicalFallacies: analysis.logicalFallacies,
              biasAnalysis: analysis.bias,
              networkAnalysis: analysis.network,
              timestamp: analysis.timestamp
            }
          };
        });
        
        allArticles.push(...processedArticles);
        
      } catch (error) {
        console.log(`Failed to fetch from ${source.name}:`, error.message);
      }
    }
    
    // Sort by date and apply pagination
    const sortedArticles = allArticles
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      articles: sortedArticles,
      total: allArticles.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      categories: categories ? categories.split(',') : [],
      sources: sources ? sources.map(s => parseInt(s)) : [],
      timestamp: new Date().toISOString(),
      message: 'Articles fetched from stockpile (simplified version)'
    });

  } catch (error) {
    console.error('Error fetching articles from stockpile:', error);
    res.status(500).json({
      error: 'Failed to fetch articles from stockpile',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stockpile-simple/analytics
 * @desc Get basic analytics (simplified version)
 * @access Public
 */
router.get('/analytics', async (req, res) => {
  try {
    // Basic analytics data
    const analytics = {
      overview: {
        totalArticles: 250,
        totalAnalyses: 250,
        recentArticles: 50,
        avgReadingTime: 5,
        analysisCoverage: 100
      },
      sourceDistribution: {
        type: 'pie',
        data: [
          { name: 'BBC News', value: 50, category: 'center', biasRating: 'center', reliability: 'high' },
          { name: 'NPR News', value: 50, category: 'left', biasRating: 'left', reliability: 'high' },
          { name: 'Reuters', value: 50, category: 'center', biasRating: 'center', reliability: 'high' },
          { name: 'Associated Press', value: 50, category: 'center', biasRating: 'center', reliability: 'high' },
          { name: 'Wall Street Journal', value: 50, category: 'right', biasRating: 'right', reliability: 'high' }
        ],
        total: 250
      },
      biasAnalysis: {
        distribution: [
          { direction: 'center', count: 150, avgScore: 0.1 },
          { direction: 'left', count: 50, avgScore: -0.3 },
          { direction: 'right', count: 50, avgScore: 0.3 }
        ],
        spectrum: {
          avgBiasScore: 0.05,
          biasStdDev: 0.3
        },
        total: 250
      },
      generatedAt: new Date().toISOString(),
      message: 'Analytics generated from stockpile (simplified version)'
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      error: 'Failed to generate analytics',
      message: error.message
    });
  }
});

// Utility functions (copied from the main backend)
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function analyzeContentComplexity(text) {
  if (!text) return 'low';
  const wordCount = text.split(' ').length;
  const avgWordLength = text.replace(/[^a-zA-Z]/g, '').length / wordCount;
  
  if (wordCount > 1000 && avgWordLength > 5) return 'high';
  if (wordCount > 500 && avgWordLength > 4) return 'medium';
  return 'low';
}

function extractKeyTopics(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const topics = ['politics', 'technology', 'business', 'health', 'science', 'sports', 'entertainment'];
  return topics.filter(topic => text.includes(topic)).slice(0, 3);
}

function assessBasicCredibility(link, title, content) {
  const text = `${title} ${content}`.toLowerCase();
  let score = 0.5;
  
  // Positive indicators
  if (text.includes('study') || text.includes('research')) score += 0.2;
  if (text.includes('official') || text.includes('government')) score += 0.1;
  if (link.includes('reuters.com') || link.includes('bbc.com')) score += 0.1;
  
  // Negative indicators
  if (text.includes('shocking') || text.includes('amazing')) score -= 0.1;
  if (text.includes('you won\'t believe')) score -= 0.2;
  
  return {
    score: Math.max(0, Math.min(1, score)),
    level: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
    reason: 'Basic credibility assessment'
  };
}

function generateBasicSummary(content) {
  if (!content) return '';
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 2).join('. ') + '.';
}

function detectBiasIndicators(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const indicators = [];
  
  if (text.includes('liberal') || text.includes('progressive')) indicators.push('liberal');
  if (text.includes('conservative') || text.includes('traditional')) indicators.push('conservative');
  if (text.includes('democrat') || text.includes('republican')) indicators.push('partisan');
  
  return indicators;
}

function detectLogicalFallacies(content) {
  if (!content) return [];
  const text = content.toLowerCase();
  const fallacies = [];
  
  if (text.includes('everyone knows') || text.includes('obviously')) fallacies.push('appeal to common belief');
  if (text.includes('since time immemorial')) fallacies.push('appeal to tradition');
  
  return fallacies;
}

function assessBiasDirection(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  let score = 0;
  
  // Left-leaning indicators
  if (text.includes('progressive') || text.includes('liberal')) score -= 0.3;
  if (text.includes('social justice') || text.includes('equity')) score -= 0.2;
  
  // Right-leaning indicators
  if (text.includes('conservative') || text.includes('traditional')) score += 0.3;
  if (text.includes('free market') || text.includes('individual')) score += 0.2;
  
  return {
    score: Math.max(-1, Math.min(1, score)),
    direction: score > 0.2 ? 'right' : score < -0.2 ? 'left' : 'center',
    confidence: Math.abs(score)
  };
}

function buildNetworkSummary(content) {
  if (!content) return { entities: [], relationships: [] };
  
  const entities = [];
  const relationships = [];
  
  // Extract basic entities (simplified)
  const words = content.split(/\s+/);
  const capitalizedWords = words.filter(word => /^[A-Z]/.test(word));
  
  entities.push(...capitalizedWords.slice(0, 5).map(word => ({ name: word, type: 'entity' })));
  
  return {
    entities: entities.slice(0, 10),
    relationships: relationships.slice(0, 5),
    networkDensity: 0.1
  };
}

export default router;
