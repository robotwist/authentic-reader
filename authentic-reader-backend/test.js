import express from 'express';
import jsonStorage from './services/jsonStorageService.js';

const app = express();
app.use(express.json());

// Helper functions
function extractKeyTopics(title, content) {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  const topics = [];
  
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
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summary = sentences.slice(0, 2).join('. ') + '.';
  
  return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
}

// Test endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { title, content, url } = req.body;
    
    console.log('Received request:', { title, content: content?.substring(0, 50), url });
    
    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required' });
    }

    const analysis = {
      wordCount: content ? content.split(' ').length : 0,
      readingTime: content ? Math.ceil(content.split(' ').length / 200) : 0,
      hasExternalLinks: content ? (content.includes('http') || content.includes('www')) : false,
      complexity: 'medium',
      keyTopics: extractKeyTopics(title, content),
      credibility: assessBasicCredibility(url, title),
      summary: generateBasicSummary(content),
      timestamp: new Date().toISOString()
    };

    console.log('Analysis created:', analysis);

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
