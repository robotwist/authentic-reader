import { analyzeEmotions as hfAnalyzeEmotions } from './huggingFaceService';
import { logger } from '../utils/logger';

/**
 * Interface for the emotion response from Hugging Face
 */
interface HFEmotionResponse {
  label: string;
  score: number;
}

/**
 * Standardized emotions mapped from various models
 */
export type EmotionType = 
  | 'joy' 
  | 'sadness' 
  | 'anger' 
  | 'fear' 
  | 'surprise' 
  | 'disgust' 
  | 'neutral';

/**
 * Represents a detected emotion with its intensity score
 */
export interface EmotionData {
  type: EmotionType;
  score: number;
  label: string; // User-friendly label (Low, Medium, High)
}

/**
 * Full emotion analysis result
 */
export interface EmotionAnalysisResult {
  emotions: EmotionData[];
  dominantEmotion: EmotionData | null;
  emotionalAppeal: number; // 0-100 score of how emotionally appealing the content is
  success: boolean;
  error?: string;
}

/**
 * Maps raw emotion labels from the model to standardized emotion types
 */
const emotionMapping: Record<string, EmotionType> = {
  // From j-hartmann/emotion-english-distilroberta-base
  'joy': 'joy',
  'sadness': 'sadness',
  'anger': 'anger',
  'fear': 'fear',
  'surprise': 'surprise',
  'disgust': 'disgust',
  'neutral': 'neutral',
  
  // Handle possible variations from other models
  'happy': 'joy',
  'sad': 'sadness',
  'mad': 'anger',
  'scared': 'fear',
  'shocked': 'surprise',
  'disgusted': 'disgust'
};

/**
 * Get a user-friendly label for an emotion score
 */
function getEmotionScoreLabel(score: number): string {
  if (score >= 0.67) return 'High';
  if (score >= 0.33) return 'Medium';
  return 'Low';
}

/**
 * Calculate emotional appeal score based on emotion intensity and distribution
 */
function calculateEmotionalAppealScore(emotions: EmotionData[]): number {
  if (!emotions || emotions.length === 0) {
    return 0;
  }
  
  // Sum the scores of non-neutral emotions
  const emotionSum = emotions
    .filter(e => e.type !== 'neutral')
    .reduce((sum, emotion) => sum + emotion.score, 0);
  
  // Scale to 0-100
  return Math.round(emotionSum * 100 / Math.min(emotions.length, 3));
}

/**
 * Service for analyzing emotions in text content
 */
class EmotionAnalysisService {
  /**
   * Analyze text for emotional content
   */
  async analyzeEmotions(text: string): Promise<EmotionAnalysisResult> {
    logger.debug('Analyzing emotions in text');
    
    try {
      // Skip empty or very short text
      if (!text || text.length < 10) {
        return {
          emotions: [],
          dominantEmotion: null,
          emotionalAppeal: 0,
          success: true
        };
      }
      
      // Use Hugging Face service to get emotion predictions
      const response = await hfAnalyzeEmotions(text);
      
      if (!response || response.length === 0) {
        logger.error('Failed to get emotion analysis from Hugging Face');
        return {
          emotions: [],
          dominantEmotion: null,
          emotionalAppeal: 0,
          success: false,
          error: 'Failed to analyze emotions'
        };
      }
      
      // Map and normalize the emotions
      const mappedEmotions: EmotionData[] = response
        .map((result: HFEmotionResponse) => {
          const type = emotionMapping[result.label] || 'neutral';
          return {
            type,
            score: result.score,
            label: getEmotionScoreLabel(result.score)
          };
        })
        .sort((a, b) => b.score - a.score); // Sort by score descending
      
      // Find the dominant emotion (highest scoring non-neutral)
      const dominantEmotion = mappedEmotions.find(e => e.type !== 'neutral') || null;
      
      // Calculate emotional appeal score
      const emotionalAppeal = calculateEmotionalAppealScore(mappedEmotions);
      
      return {
        emotions: mappedEmotions,
        dominantEmotion,
        emotionalAppeal,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in emotion analysis:', error);
      
      return {
        emotions: [],
        dominantEmotion: null,
        emotionalAppeal: 0,
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Generate a qualitative description of the emotional content
   */
  generateEmotionalDescription(result: EmotionAnalysisResult): string {
    if (!result.success || !result.dominantEmotion) {
      return 'No significant emotional content detected.';
    }
    
    const { dominantEmotion, emotionalAppeal } = result;
    
    let appealLevel = 'minimal';
    if (emotionalAppeal >= 75) appealLevel = 'very strong';
    else if (emotionalAppeal >= 50) appealLevel = 'strong';
    else if (emotionalAppeal >= 25) appealLevel = 'moderate';
    
    // Generate description based on dominant emotion and appeal level
    const emotionDescriptions: Record<EmotionType, string> = {
      'joy': 'positive and uplifting',
      'sadness': 'somber and melancholic',
      'anger': 'angry and confrontational',
      'fear': 'fearful and anxious',
      'surprise': 'surprising and unexpected',
      'disgust': 'disgusting or repulsive',
      'neutral': 'neutral and balanced'
    };
    
    const description = emotionDescriptions[dominantEmotion.type] || 'emotional';
    
    return `This content has a ${appealLevel} emotional appeal, primarily ${description} in tone.`;
  }
}

// Export a singleton instance
export const emotionAnalysisService = new EmotionAnalysisService();

// Direct export of the emotion analysis function for easier import
export const analyzeEmotions = async (text: string): Promise<EmotionAnalysisResult> => {
  return emotionAnalysisService.analyzeEmotions(text);
}; 