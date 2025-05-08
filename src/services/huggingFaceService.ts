/**
 * Hugging Face API Integration Service
 * 
 * This service provides integration with Hugging Face's Inference API for various
 * natural language processing tasks. It focuses on using models available in the
 * free tier while providing fallbacks and optimizing token usage.
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { 
  BiasType, 
  BiasRating, 
  MultidimensionalBias,
  RhetoricAnalysis,
  RhetoricType
} from '../types';

// Environment variables and configuration
const HF_API_TOKEN = import.meta.env.VITE_HF_API_TOKEN || '';
const HF_API_URL = 'https://api-inference.huggingface.co/models/';

// Free tier models for different analysis tasks
const MODELS = {
  // Text classification models
  SENTIMENT: 'distilbert-base-uncased-finetuned-sst-2-english',
  EMOTION: 'SamLowe/roberta-base-go_emotions',
  TOXICITY: 'Hate-speech-CNERG/bert-base-uncased-hatexplain',
  
  // Zero-shot classification
  ZERO_SHOT: 'facebook/bart-large-mnli',
  
  // Text generation models (useful for explaining analysis)
  TEXT_GENERATION: 'gpt2',
  SUMMARIZATION: 'facebook/bart-large-cnn',
  
  // Named entity recognition
  NER: 'dbmdz/bert-large-cased-finetuned-conll03-english',
  
  // Question answering
  QA: 'deepset/roberta-base-squad2',
  
  // Feature extraction (for custom analysis)
  EMBEDDINGS: 'sentence-transformers/all-MiniLM-L6-v2'
};

// API client with defaults
const hfClient = axios.create({
  headers: {
    'Authorization': `Bearer ${HF_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
});

// Helper to handle API rate limits
const withRetry = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        // Rate limit hit - wait and retry
        const waitTime = delay * Math.pow(2, attempt);
        logger.warn(`Rate limit hit, waiting ${waitTime}ms before retry ${attempt}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
};

// Fallback to local analysis when API is unavailable
const localFallback = (task: string, input: string) => {
  logger.warn(`Using local fallback for ${task}`);
  
  // Simple fallbacks based on heuristics
  switch (task) {
    case 'sentiment':
      // Very basic sentiment analysis
      const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'best', 'love'];
      const negativeWords = ['bad', 'terrible', 'negative', 'sad', 'worst', 'hate'];
      
      const posCount = positiveWords.reduce((count, word) => 
        count + (input.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'))?.length || 0), 0);
      
      const negCount = negativeWords.reduce((count, word) => 
        count + (input.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'))?.length || 0), 0);
      
      const total = posCount + negCount;
      if (total === 0) return { label: 'NEUTRAL', score: 0.5 };
      
      const sentiment = (posCount - negCount) / (posCount + negCount);
      return sentiment > 0 
        ? { label: 'POSITIVE', score: 0.5 + sentiment / 2 }
        : { label: 'NEGATIVE', score: 0.5 - Math.abs(sentiment) / 2 };
    
    case 'bias':
      // Very basic political bias detection
      const leftWords = ['progressive', 'liberal', 'democrat', 'equality', 'regulation'];
      const rightWords = ['conservative', 'republican', 'tradition', 'freedom', 'deregulation'];
      
      const leftCount = leftWords.reduce((count, word) => 
        count + (input.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'))?.length || 0), 0);
      
      const rightCount = rightWords.reduce((count, word) => 
        count + (input.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'))?.length || 0), 0);
      
      if (leftCount === 0 && rightCount === 0) return { type: BiasType.CENTER, confidence: 0.4 };
      
      if (leftCount > rightCount * 2) return { type: BiasType.LEFT_STRONG, confidence: 0.6 };
      if (leftCount > rightCount) return { type: BiasType.LEFT_MODERATE, confidence: 0.5 };
      if (rightCount > leftCount * 2) return { type: BiasType.RIGHT_STRONG, confidence: 0.6 };
      if (rightCount > leftCount) return { type: BiasType.RIGHT_MODERATE, confidence: 0.5 };
      
      return { type: BiasType.CENTER, confidence: 0.5 };
    
    default:
      return { label: 'UNKNOWN', score: 0.5 };
  }
};

/**
 * Get sentiment analysis for a piece of text
 */
export async function analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
  try {
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.SENTIMENT}`, { inputs: text })
    );
    
    return response.data[0];
  } catch (error) {
    logger.error('Error analyzing sentiment with HF API:', error);
    return localFallback('sentiment', text);
  }
}

/**
 * Analyze the emotions expressed in a text
 */
export async function analyzeEmotions(text: string): Promise<Array<{ label: string; score: number }>> {
  try {
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.EMOTION}`, { inputs: text })
    );
    
    return response.data[0];
  } catch (error) {
    logger.error('Error analyzing emotions with HF API:', error);
    
    // Fallback with simple emotion detection
    const emotions = [
      { label: 'joy', score: text.toLowerCase().includes('happy') || text.toLowerCase().includes('joy') ? 0.7 : 0.1 },
      { label: 'sadness', score: text.toLowerCase().includes('sad') || text.toLowerCase().includes('upset') ? 0.7 : 0.1 },
      { label: 'anger', score: text.toLowerCase().includes('angry') || text.toLowerCase().includes('mad') ? 0.7 : 0.1 },
      { label: 'fear', score: text.toLowerCase().includes('afraid') || text.toLowerCase().includes('scared') ? 0.7 : 0.1 },
      { label: 'surprise', score: text.toLowerCase().includes('surprise') || text.toLowerCase().includes('shocked') ? 0.7 : 0.1 }
    ];
    
    return emotions;
  }
}

/**
 * Zero-shot classification of text into given categories
 */
export async function classifyText(
  text: string, 
  categories: string[]
): Promise<Array<{ label: string; score: number }>> {
  try {
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.ZERO_SHOT}`, {
        inputs: text,
        parameters: { candidate_labels: categories }
      })
    );
    
    const results = response.data.labels.map((label: string, index: number) => ({
      label,
      score: response.data.scores[index]
    }));
    
    return results;
  } catch (error) {
    logger.error('Error classifying text with HF API:', error);
    
    // Simple fallback
    return categories.map(category => ({
      label: category,
      score: text.toLowerCase().includes(category.toLowerCase()) ? 0.7 : 0.3
    }));
  }
}

/**
 * Extract named entities from text
 */
export async function extractEntities(text: string): Promise<Array<{ entity: string; type: string; score: number }>> {
  try {
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.NER}`, { inputs: text })
    );
    
    // Format the entity results
    const entities = response.data.map((item: any) => ({
      entity: text.substring(item.start, item.end),
      type: item.entity_group,
      score: item.score
    }));
    
    return entities;
  } catch (error) {
    logger.error('Error extracting entities with HF API:', error);
    
    // Simple entity extraction fallback
    const entities = [];
    const entityRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g;
    let match;
    
    while ((match = entityRegex.exec(text)) !== null) {
      entities.push({
        entity: match[0],
        type: 'MISC',
        score: 0.6
      });
    }
    
    return entities;
  }
}

/**
 * Generate embeddings for text (useful for similarity comparison)
 */
export async function getTextEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.EMBEDDINGS}`, { inputs: text })
    );
    
    return response.data;
  } catch (error) {
    logger.error('Error getting embeddings with HF API:', error);
    
    // Return a dummy embedding (this is not a good fallback but prevents errors)
    return new Array(384).fill(0).map(() => Math.random() * 2 - 1);
  }
}

/**
 * Analyze multi-dimensional bias in text
 */
export async function analyzeMultidimensionalBias(text: string): Promise<MultidimensionalBias> {
  try {
    // Use zero-shot classification for each dimension
    const politicalCategories = ['liberal', 'moderate', 'conservative'];
    const economicCategories = ['pro-regulation', 'balanced economy', 'free market'];
    const socialCategories = ['progressive', 'moderate', 'traditional'];
    const identityCategories = ['identity-focused', 'balanced', 'identity-neutral'];
    const geopoliticalCategories = ['globalist', 'balanced', 'nationalist'];
    const epistemologicalCategories = ['empirical', 'balanced', 'intuitive'];
    
    // Run all classifications in parallel
    const [
      politicalResults,
      economicResults,
      socialResults,
      identityResults,
      geopoliticalResults,
      epistemologicalResults
    ] = await Promise.all([
      classifyText(text, politicalCategories),
      classifyText(text, economicCategories),
      classifyText(text, socialCategories),
      classifyText(text, identityCategories),
      classifyText(text, geopoliticalCategories),
      classifyText(text, epistemologicalCategories)
    ]);
    
    // Converts classification results to a BiasRating
    const toBiasRating = (results: Array<{ label: string; score: number }>, leftLabel: string, rightLabel: string): BiasRating => {
      const leftScore = results.find(r => r.label === leftLabel)?.score || 0;
      const rightScore = results.find(r => r.label === rightLabel)?.score || 0;
      const centerScore = results.find(r => !([leftLabel, rightLabel].includes(r.label)))?.score || 0;
      
      // Create a value between -1 (left) and 1 (right)
      const value = (rightScore - leftScore) / Math.max(0.1, leftScore + rightScore + centerScore);
      
      // Find highest confidence classification
      const highestScore = Math.max(leftScore, centerScore, rightScore);
      
      return {
        value,
        confidence: highestScore,
        evidence: [text.substring(0, 100) + '...'] // Just a placeholder, ideally we'd extract relevant sentences
      };
    };
    
    // Convert classifications to BiasRatings
    const political = toBiasRating(politicalResults, 'liberal', 'conservative');
    const economic = toBiasRating(economicResults, 'pro-regulation', 'free market');
    const social = toBiasRating(socialResults, 'progressive', 'traditional');
    const identity = toBiasRating(identityResults, 'identity-focused', 'identity-neutral');
    const geopolitical = toBiasRating(geopoliticalResults, 'globalist', 'nationalist');
    const epistemological = toBiasRating(epistemologicalResults, 'empirical', 'intuitive');
    
    // Determine overall bias type for compatibility with existing code
    const overallValue = (political.value * 1.5 + economic.value + social.value + geopolitical.value * 0.5) / 4;
    
    let overallBias: BiasType;
    if (overallValue < -0.6) overallBias = BiasType.LEFT_STRONG;
    else if (overallValue < -0.2) overallBias = BiasType.LEFT_MODERATE;
    else if (overallValue < 0.2) overallBias = BiasType.CENTER;
    else if (overallValue < 0.6) overallBias = BiasType.RIGHT_MODERATE;
    else overallBias = BiasType.RIGHT_STRONG;
    
    // Calculate overall confidence across all dimensions
    const confidenceValues = [
      political.confidence, 
      economic.confidence, 
      social.confidence, 
      identity.confidence,
      geopolitical.confidence,
      epistemological.confidence
    ];
    const overallConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    
    return {
      political,
      economic,
      social,
      identity,
      geopolitical,
      epistemological,
      overallBias,
      confidence: overallConfidence
    };
  } catch (error) {
    logger.error('Error analyzing multidimensional bias:', error);
    
    // Fallback to basic bias analysis
    const basicBias = localFallback('bias', text) as { type: BiasType; confidence: number };
    
    // Create a default bias rating
    const defaultRating: BiasRating = {
      value: 0,
      confidence: 0.4,
      evidence: []
    };
    
    // Create default multidimensional bias with the basic analysis
    return {
      political: { ...defaultRating, value: basicBias.type === BiasType.CENTER ? 0 : 
        (basicBias.type === BiasType.LEFT_STRONG || basicBias.type === BiasType.LEFT_MODERATE) ? -0.5 : 0.5 },
      economic: defaultRating,
      social: defaultRating,
      identity: defaultRating,
      geopolitical: defaultRating,
      epistemological: defaultRating,
      overallBias: basicBias.type,
      confidence: basicBias.confidence
    };
  }
}

/**
 * Analyze rhetoric techniques used in text
 */
export async function analyzeRhetoric(text: string): Promise<RhetoricAnalysis> {
  try {
    // Use zero-shot classification for rhetoric types
    const rhetoricCategories = ['appeal to authority', 'appeal to emotion', 'appeal to logic', 'appeal to opportunity'];
    const techniqueCategories = [
      'statistics and data', 'expert quotes', 'emotional language', 'personal stories',
      'logical reasoning', 'historical examples', 'urgency', 'metaphors and analogies'
    ];
    
    const [rhetoricResults, techniqueResults] = await Promise.all([
      classifyText(text, rhetoricCategories),
      classifyText(text, techniqueCategories)
    ]);
    
    // Map categories to RhetoricType
    const categoryToType: Record<string, RhetoricType> = {
      'appeal to authority': RhetoricType.ETHOS,
      'appeal to emotion': RhetoricType.PATHOS,
      'appeal to logic': RhetoricType.LOGOS,
      'appeal to opportunity': RhetoricType.KAIROS
    };
    
    // Sort rhetoric results by score
    const sortedRhetoric = [...rhetoricResults].sort((a, b) => b.score - a.score);
    
    // Get primary and secondary rhetoric types
    const primary = categoryToType[sortedRhetoric[0].label] || RhetoricType.LOGOS;
    const secondary = sortedRhetoric.length > 1 ? categoryToType[sortedRhetoric[1].label] : undefined;
    
    // Get top techniques
    const topTechniques = techniqueResults
      .filter(t => t.score > 0.3) // Only include techniques with reasonable confidence
      .map(t => t.label)
      .slice(0, 3); // Top 3 techniques
    
    // Simple effectiveness score based on primary rhetoric confidence
    const effectiveness = sortedRhetoric[0].score;
    
    // Extract examples (future improvement: use a more targeted approach)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const examples = sentences.length > 2 ? [sentences[0], sentences[1]] : sentences;
    
    return {
      primary,
      secondary,
      techniques: topTechniques,
      effectiveness,
      examples
    };
  } catch (error) {
    logger.error('Error analyzing rhetoric:', error);
    
    // Fallback to simple rhetoric analysis
    return {
      primary: RhetoricType.LOGOS,
      techniques: ['basic argumentation'],
      effectiveness: 0.5,
      examples: [text.substring(0, 100) + '...']
    };
  }
}

/**
 * Answer questions about text using a Q&A model
 */
export async function answerQuestion(context: string, question: string): Promise<string> {
  try {
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.QA}`, {
        inputs: {
          question,
          context
        }
      })
    );
    
    return response.data.answer;
  } catch (error) {
    logger.error('Error answering question with HF API:', error);
    return "I couldn't find an answer to that question in the provided context.";
  }
}

/**
 * Summarize text (useful for article summaries)
 */
export async function summarizeText(text: string, maxLength = 150): Promise<string> {
  try {
    // We need to trim the input to avoid token limits
    const trimmedText = text.length > 1024 ? text.substring(0, 1024) + '...' : text;
    
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.SUMMARIZATION}`, {
        inputs: trimmedText,
        parameters: {
          max_length: maxLength,
          min_length: Math.min(30, maxLength - 1)
        }
      })
    );
    
    return response.data[0].summary_text;
  } catch (error) {
    logger.error('Error summarizing text with HF API:', error);
    
    // Simple fallback - return first few sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ') + '.';
  }
}

/**
 * The "Virgil" feature - generate an explanation of an analysis
 */
export async function generateAnalysisExplanation(
  passage: string, 
  analysisResults: any
): Promise<string> {
  try {
    // Create a prompt for the text generation model
    let prompt = `The following text was analyzed for bias and persuasion techniques:\n\n"${passage.substring(0, 200)}..."\n\n`;
    prompt += `Analysis results:\n`;
    
    if (analysisResults.bias) {
      const bias = analysisResults.bias;
      prompt += `- Political bias: ${bias.political.value < 0 ? 'Left-leaning' : bias.political.value > 0 ? 'Right-leaning' : 'Centrist'}\n`;
      prompt += `- Economic perspective: ${bias.economic.value < 0 ? 'Pro-regulation' : bias.economic.value > 0 ? 'Free market' : 'Balanced'}\n`;
    }
    
    if (analysisResults.rhetoric) {
      const rhetoric = analysisResults.rhetoric;
      prompt += `- Primary rhetoric: ${rhetoric.primary}\n`;
      prompt += `- Techniques: ${rhetoric.techniques.join(', ')}\n`;
    }
    
    prompt += `\nExplain this analysis in a clear, helpful way:`;
    
    // Use the text generation model
    const response = await withRetry(() => 
      hfClient.post(`${HF_API_URL}${MODELS.TEXT_GENERATION}`, {
        inputs: prompt,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          num_return_sequences: 1
        }
      })
    );
    
    // Extract and clean the generated text
    let explanation = response.data[0].generated_text;
    explanation = explanation.replace(prompt, '').trim();
    
    return explanation;
  } catch (error) {
    logger.error('Error generating analysis explanation:', error);
    
    // Fallback with simple explanation
    let explanation = "This passage ";
    
    if (analysisResults.bias?.political.value < -0.3) {
      explanation += "appears to have a left-leaning political perspective. ";
    } else if (analysisResults.bias?.political.value > 0.3) {
      explanation += "appears to have a right-leaning political perspective. ";
    } else {
      explanation += "appears to be relatively balanced politically. ";
    }
    
    if (analysisResults.rhetoric) {
      explanation += `It primarily uses ${analysisResults.rhetoric.primary} (${
        analysisResults.rhetoric.primary === RhetoricType.ETHOS ? "appeal to authority/credibility" :
        analysisResults.rhetoric.primary === RhetoricType.PATHOS ? "appeal to emotion" :
        analysisResults.rhetoric.primary === RhetoricType.LOGOS ? "appeal to logic" : "appeal to timeliness"
      }).`;
    }
    
    return explanation;
  }
} 