const axios = require('axios');
const { Article, Analysis, User } = require('../models');

// Fetch content from a URL
exports.fetchContent = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`Fetching content from: ${url}`);
    
    // Fetch the content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000 // 15 second timeout
    });
    
    // Return the content
    res.send(response.data);
    
  } catch (error) {
    console.error(`Error fetching content: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      message: error.message,
      url: req.query.url
    });
  }
};

// Save article analysis
exports.saveAnalysis = async (req, res) => {
  try {
    const { articleId, biasScore, biasDirection, sentiment, entities, 
            topKeywords, readingLevel, clickbaitScore, outrageBaitScore, 
            summaryText } = req.body;
    
    // Check if article exists
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Check if analysis already exists
    let analysis = await Analysis.findOne({ 
      where: { 
        articleId,
        userId: req.user.id
      }
    });
    
    if (analysis) {
      // Update existing analysis
      Object.assign(analysis, {
        biasScore,
        biasDirection,
        sentiment,
        entities,
        topKeywords,
        readingLevel,
        clickbaitScore,
        outrageBaitScore,
        summaryText
      });
      
      await analysis.save();
    } else {
      // Create new analysis
      analysis = await Analysis.create({
        articleId,
        userId: req.user.id,
        biasScore,
        biasDirection,
        sentiment,
        entities,
        topKeywords,
        readingLevel,
        clickbaitScore,
        outrageBaitScore,
        summaryText
      });
    }
    
    res.status(200).json({
      message: 'Analysis saved successfully',
      analysis
    });
    
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
};

// Get analysis for an article
exports.getAnalysis = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    // Check if article exists
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Find analysis
    const analysis = await Analysis.findOne({
      where: {
        articleId,
        userId: req.user.id
      },
      include: [{ model: User, attributes: ['id', 'username'] }]
    });
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.status(200).json(analysis);
    
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
};

// Get all analyses for a user
exports.getUserAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.findAll({
      where: { userId: req.user.id },
      include: [{ model: Article }],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(analyses);
    
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
};

// Delete an analysis
exports.deleteAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await Analysis.findByPk(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Check if user owns the analysis
    if (analysis.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this analysis' });
    }
    
    await analysis.destroy();
    
    res.status(204).send();
    
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
}; 