import express from 'express';

const app = express();
app.use(express.json());

// Simple analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { title, content, url } = req.body;
    
    console.log('Received:', { title, content: content?.substring(0, 20), url });
    
    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required' });
    }

    // Simple analysis without complex functions
    const analysis = {
      wordCount: content ? content.split(' ').length : 0,
      readingTime: content ? Math.ceil(content.split(' ').length / 200) : 0,
      hasExternalLinks: content ? (content.includes('http') || content.includes('www')) : false,
      complexity: 'medium',
      keyTopics: ['general'],
      credibility: { score: 0.6, level: 'medium', reason: 'Standard content' },
      summary: content ? content.substring(0, 100) + '...' : '',
      timestamp: new Date().toISOString()
    };

    console.log('Analysis created successfully');

    res.json({
      success: true,
      analysis,
      analysisId: `analysis_${Date.now()}`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});
