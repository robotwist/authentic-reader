import { ArticleModel, ArticleAnalysisModel } from '../models/index.js';
import onnxService from './onnxService.js';
import logger from '../utils/logger.js';
import chromaService from './chromaService.js';
import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

// Helper function to extract text content from article
function extractTextContent(article) {
  return article.content || article.summary || article.title || '';
}

// Helper function to calculate text statistics
function calculateTextStats(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    paragraphCount: paragraphs.length,
    averageSentenceLength: words.length / sentences.length,
    averageParagraphLength: sentences.length / paragraphs.length
  };
}

// Helper function to detect emotional language
function detectEmotionalLanguage(text) {
  const emotionalWords = {
    positive: ['excellent', 'amazing', 'wonderful', 'great', 'fantastic'],
    negative: ['terrible', 'awful', 'horrible', 'bad', 'poor'],
    intense: ['incredible', 'unbelievable', 'shocking', 'stunning', 'devastating']
  };

  const words = tokenizer.tokenize(text.toLowerCase());
  const counts = {
    positive: 0,
    negative: 0,
    intense: 0
  };

  words.forEach(word => {
    if (emotionalWords.positive.includes(word)) counts.positive++;
    if (emotionalWords.negative.includes(word)) counts.negative++;
    if (emotionalWords.intense.includes(word)) counts.intense++;
  });

  return counts;
}

async function performBiasAnalysis(article) {
  try {
    const text = extractTextContent(article);
    const stats = calculateTextStats(text);
    const emotionalLanguage = detectEmotionalLanguage(text);
    
    // Analyze source bias
    const sourceBias = article.Source?.bias || 0.5;
    
    // Analyze language patterns for bias indicators
    const biasIndicators = {
      emotionalLanguage: (emotionalLanguage.positive + emotionalLanguage.negative) / stats.wordCount,
      loadedTerms: emotionalLanguage.intense / stats.wordCount,
      subjectivePhrases: sentiment.getSentiment(tokenizer.tokenize(text)) / stats.wordCount
    };
    
    // Get similar articles from ChromaDB for comparison
    let similarArticles = [];
    try {
      similarArticles = await chromaService.queryEmbeddings(
        await onnxService.getEmbedding(text),
        5
      );
    } catch (error) {
      logger.warn('ChromaDB query failed, continuing without similar articles:', error);
    }
    
    // Calculate bias score based on various factors
    const biasScore = (sourceBias + 
      (biasIndicators.emotionalLanguage * 0.3) +
      (biasIndicators.loadedTerms * 0.3) +
      (biasIndicators.subjectivePhrases * 0.4)) / 2;
    
    return {
      bias: biasScore > 0.7 ? 'high' : biasScore > 0.4 ? 'medium' : 'low',
      reliability: sourceBias > 0.7 ? 'high' : sourceBias > 0.4 ? 'medium' : 'low',
      details: {
        sourceBias,
        biasIndicators,
        textStats: stats,
        emotionalLanguage,
        similarArticles: similarArticles.map(article => ({
          id: article.id,
          similarity: article.similarity
        })),
        confidence: 0.8
      }
    };
  } catch (error) {
    logger.error('Error in bias analysis:', error);
    throw new Error('Failed to perform bias analysis');
  }
}

async function performRhetoricalAnalysis(article) {
  const text = extractTextContent(article);
  const stats = calculateTextStats(text);
  
  // Analyze rhetorical devices
  const rhetoricalDevices = {
    metaphors: (text.match(/like|as|metaphor|symbolize/gi) || []).length,
    analogies: (text.match(/similar to|compared to|analogous to/gi) || []).length,
    repetition: (text.match(/(\b\w+\b)(?:\s+\1\b)+/gi) || []).length,
    questions: (text.match(/\?/g) || []).length
  };
  
  // Analyze argument structure using TF-IDF
  const tfidf = new TfIdf();
  tfidf.addDocument(text);
  
  const argumentStructure = {
    claims: tfidf.listTerms(0).filter(term => 
      term.term.match(/claim|argue|assert|propose/gi)
    ).length,
    evidence: tfidf.listTerms(0).filter(term => 
      term.term.match(/evidence|proof|data|research/gi)
    ).length,
    reasoning: tfidf.listTerms(0).filter(term => 
      term.term.match(/because|therefore|thus|consequently/gi)
    ).length
  };
  
  return {
    details: {
      rhetoricalDevices,
      argumentStructure,
      textStats: stats,
      complexity: stats.averageSentenceLength > 20 ? 'high' : stats.averageSentenceLength > 15 ? 'medium' : 'low',
      argumentStrength: (argumentStructure.evidence + argumentStructure.reasoning) / 
                       (argumentStructure.claims || 1)
    }
  };
}

async function performNetworkAnalysis(article) {
  try {
    const text = extractTextContent(article);
    
    // Get article embedding
    const embedding = await onnxService.getEmbedding(text);
    
    // Analyze connections to other articles and sources
    let similarArticles = [];
    try {
      similarArticles = await chromaService.queryEmbeddings(embedding, 10);
    } catch (error) {
      logger.warn('ChromaDB query failed, continuing without similar articles:', error);
    }
    
    const networkMetrics = {
      relatedArticles: similarArticles.length,
      sourceConnections: new Set(similarArticles.map(a => a.metadata?.sourceId)).size,
      topicConnections: new Set(similarArticles.map(a => a.metadata?.topic)).size
    };
    
    // Analyze information flow
    const informationFlow = {
      citations: (text.match(/\[\d+\]|\(\d{4}\)|et al\./gi) || []).length,
      references: (text.match(/referenced|cited|source/gi) || []).length,
      externalLinks: (text.match(/https?:\/\/[^\s]+/gi) || []).length
    };
    
    return {
      details: {
        networkMetrics,
        informationFlow,
        centrality: networkMetrics.relatedArticles > 7 ? 'high' : 
                   networkMetrics.relatedArticles > 3 ? 'medium' : 'low',
        influence: (networkMetrics.sourceConnections + networkMetrics.topicConnections) / 2 > 0.7 ? 'high' :
                  (networkMetrics.sourceConnections + networkMetrics.topicConnections) / 2 > 0.4 ? 'medium' : 'low',
        similarArticles: similarArticles.map(article => ({
          id: article.id,
          similarity: article.similarity,
          source: article.metadata?.sourceName
        }))
      }
    };
  } catch (error) {
    logger.error('Error in network analysis:', error);
    throw new Error('Failed to perform network analysis');
  }
}

async function performManipulationAnalysis(article) {
  const text = extractTextContent(article);
  const emotionalLanguage = detectEmotionalLanguage(text);
  
  // Analyze manipulation techniques
  const manipulationTechniques = {
    emotionalAppeals: emotionalLanguage.intense / calculateTextStats(text).wordCount,
    logicalFallacies: (text.match(/all|never|always|everyone|no one/gi) || []).length,
    misleadingClaims: (text.match(/studies show|experts say|research suggests/gi) || []).length,
    selectiveEvidence: (text.match(/however|but|although|despite/gi) || []).length
  };
  
  // Analyze content manipulation
  const contentManipulation = {
    clickbait: (text.match(/shocking|you won't believe|mind-blowing/gi) || []).length,
    sensationalism: emotionalLanguage.intense / calculateTextStats(text).wordCount,
    misdirection: (text.match(/actually|in fact|contrary to/gi) || []).length
  };
  
  const manipulationScore = (
    manipulationTechniques.emotionalAppeals * 0.3 +
    manipulationTechniques.logicalFallacies * 0.2 +
    manipulationTechniques.misleadingClaims * 0.3 +
    manipulationTechniques.selectiveEvidence * 0.2
  );
  
  return {
    details: {
      manipulationTechniques,
      contentManipulation,
      manipulationScore,
      riskLevel: manipulationScore > 0.7 ? 'high' : manipulationScore > 0.4 ? 'medium' : 'low',
      recommendations: manipulationScore > 0.7 ? 
        'High risk of manipulation detected. Consider fact-checking claims and verifying sources.' :
        manipulationScore > 0.4 ?
        'Moderate risk of manipulation. Review claims and check for balanced reporting.' :
        'Low risk of manipulation detected.'
    }
  };
}

async function performEmotionAnalysis(article) {
  const text = extractTextContent(article);
  const emotionalLanguage = detectEmotionalLanguage(text);
  
  // Analyze emotional content using sentiment analysis
  const sentimentScore = sentiment.getSentiment(tokenizer.tokenize(text));
  
  // Analyze emotional intensity
  const emotionalIntensity = {
    high: emotionalLanguage.intense / calculateTextStats(text).wordCount,
    medium: (emotionalLanguage.positive + emotionalLanguage.negative) / calculateTextStats(text).wordCount,
    low: 1 - (emotionalLanguage.intense + emotionalLanguage.positive + emotionalLanguage.negative) / calculateTextStats(text).wordCount
  };
  
  // Determine dominant emotion
  const emotions = {
    joy: emotionalLanguage.positive / calculateTextStats(text).wordCount,
    sadness: emotionalLanguage.negative / calculateTextStats(text).wordCount,
    anger: (text.match(/angry|furious|outrage/gi) || []).length / calculateTextStats(text).wordCount,
    fear: (text.match(/fear|afraid|scared/gi) || []).length / calculateTextStats(text).wordCount,
    surprise: (text.match(/surprise|shock|amazing/gi) || []).length / calculateTextStats(text).wordCount
  };
  
  const dominantEmotion = Object.entries(emotions)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  return {
    details: {
      emotions,
      emotionalIntensity,
      dominantEmotion,
      emotionalScore: sentimentScore,
      sentimentAnalysis: {
        positive: emotionalLanguage.positive / calculateTextStats(text).wordCount,
        negative: emotionalLanguage.negative / calculateTextStats(text).wordCount,
        neutral: 1 - (emotionalLanguage.positive + emotionalLanguage.negative) / calculateTextStats(text).wordCount
      }
    }
  };
}

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
    const textToAnalyze = extractTextContent(article);
    if (!textToAnalyze) {
      throw new Error('No content available for analysis');
    }

    // Perform sentiment analysis
    const sentimentResult = await onnxService.analyzeSentiment(textToAnalyze);
    
    // Perform all analyses
    const biasAnalysis = await performBiasAnalysis(article);
    const rhetoricalAnalysis = await performRhetoricalAnalysis(article);
    const networkAnalysis = await performNetworkAnalysis(article);
    const manipulationAnalysis = await performManipulationAnalysis(article);
    const emotionAnalysis = await performEmotionAnalysis(article);

    // Create or update analysis record
    const [articleAnalysis, created] = await ArticleAnalysisModel.findOrCreate({
      where: { articleId },
      defaults: {
        sentiment: sentimentResult.sentiment,
        subjectivity: sentimentResult.subjectivity,
        bias: biasAnalysis.bias,
        reliability: biasAnalysis.reliability,
        analysis: {
          bias: biasAnalysis.details,
          rhetorical: rhetoricalAnalysis.details,
          network: networkAnalysis.details,
          manipulation: manipulationAnalysis.details,
          emotion: emotionAnalysis.details
        }
      }
    });

    if (!created) {
      await articleAnalysis.update({
        sentiment: sentimentResult.sentiment,
        subjectivity: sentimentResult.subjectivity,
        bias: biasAnalysis.bias,
        reliability: biasAnalysis.reliability,
        analysis: {
          bias: biasAnalysis.details,
          rhetorical: rhetoricalAnalysis.details,
          network: networkAnalysis.details,
          manipulation: manipulationAnalysis.details,
          emotion: emotionAnalysis.details
        }
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