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
    
    // Create analysis record
    const analysis = await ArticleAnalysisModel.create({
      articleId,
      sentiment: sentimentResult.sentiment,
      subjectivity: sentimentResult.subjectivity,
      bias: article.Source?.bias || 'Unknown',
      reliability: article.Source?.reliability || 'Unknown',
      analysis: {
        sentiment: sentimentResult.sentiment,
        subjectivity: sentimentResult.subjectivity,
        confidence: sentimentResult.confidence,
        keywords: sentimentResult.keywords
      }
    });

    // Update article status
    await article.update({ isAnalyzed: true });

    return analysis;
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
  // Placeholder for actual analysis logic
  return {
    sentiment: 0.5,
    subjectivity: 0.5,
    bias: 'neutral',
    reliability: 'medium',
    details: {
      // Analysis details will go here
    }
  };
} 