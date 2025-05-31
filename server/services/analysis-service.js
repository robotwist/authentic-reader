import { ArticleModel, ArticleAnalysisModel } from '../models/index.js';
import onnxService from './onnxService.js';
import logger from '../utils/logger.js';

export async function analyzeArticle(articleId) {
  try {
    const article = await ArticleModel.findByPk(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Check if article is already analyzed
    const existingAnalysis = await ArticleAnalysisModel.findOne({
      where: { articleId }
    });

    if (existingAnalysis) {
      return existingAnalysis;
    }

    // Get the text content to analyze
    const textToAnalyze = article.content || article.summary || article.title;
    if (!textToAnalyze) {
      throw new Error('No content available for analysis');
    }

    // Perform sentiment analysis
    const sentimentResult = await onnxService.analyzeSentiment(textToAnalyze);
    
    // Perform analysis
    const analysis = await performAnalysis(article);

    // Create or update analysis record
    const [articleAnalysis, created] = await ArticleAnalysisModel.findOrCreate({
      where: { articleId },
      defaults: {
        sentiment: analysis.sentiment,
        subjectivity: analysis.subjectivity,
        bias: analysis.bias,
        reliability: analysis.reliability,
        analysis: analysis.details
      }
    });

    if (!created) {
      await articleAnalysis.update({
        sentiment: analysis.sentiment,
        subjectivity: analysis.subjectivity,
        bias: analysis.bias,
        reliability: analysis.reliability,
        analysis: analysis.details
      });
    }

    // Update article status
    await article.update({ isAnalyzed: true });

    return articleAnalysis;
  } catch (error) {
    logger.error(`Error analyzing article ${articleId}:`, error);
    throw error;
  }
}

export async function analyzeUnanalyzedArticles() {
  try {
    const unanalyzedArticles = await ArticleModel.findAll({
      where: { isAnalyzed: false },
      limit: 10 // Process in batches
    });

    const results = [];
    for (const article of unanalyzedArticles) {
      try {
        const analysis = await analyzeArticle(article.id);
        results.push(analysis);
      } catch (error) {
        logger.error(`Failed to analyze article ${article.id}:`, error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error in analyzeUnanalyzedArticles:', error);
    throw error;
  }
}

async function performAnalysis(article) {
  const biasAnalysis = await performBiasAnalysis(article);
  const rhetoricalAnalysis = await performRhetoricalAnalysis(article);
  const networkAnalysis = await performNetworkAnalysis(article);
  const manipulationAnalysis = await performManipulationAnalysis(article);
  const emotionAnalysis = await performEmotionAnalysis(article);

  return {
    sentiment: 0.5, // Placeholder
    subjectivity: 0.5, // Placeholder
    bias: biasAnalysis.bias,
    reliability: biasAnalysis.reliability,
    details: {
      bias: biasAnalysis.details,
      rhetorical: rhetoricalAnalysis.details,
      network: networkAnalysis.details,
      manipulation: manipulationAnalysis.details,
      emotion: emotionAnalysis.details
    }
  };
}

// Implement real analysis logic for each analysis tab
async function performBiasAnalysis(article) {
  // Placeholder for bias analysis logic
  return {
    bias: 'neutral',
    reliability: 'medium',
    details: {
      // Bias analysis details will go here
    }
  };
}

async function performRhetoricalAnalysis(article) {
  // Placeholder for rhetorical analysis logic
  return {
    details: {
      // Rhetorical analysis details will go here
    }
  };
}

async function performNetworkAnalysis(article) {
  // Placeholder for network analysis logic
  return {
    details: {
      // Network analysis details will go here
    }
  };
}

async function performManipulationAnalysis(article) {
  // Placeholder for manipulation analysis logic
  return {
    details: {
      // Manipulation analysis details will go here
    }
  };
}

async function performEmotionAnalysis(article) {
  // Placeholder for emotion analysis logic
  return {
    details: {
      // Emotion analysis details will go here
    }
  };
} 