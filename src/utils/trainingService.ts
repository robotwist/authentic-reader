/**
 * Training Service
 * 
 * A service for training AI models with feedback data collected from users.
 * This service handles:
 * - Extracting feedback from ChromaDB/localStorage
 * - Preparing training data for different AI tasks
 * - Sending data for fine-tuning models
 * - Tracking model performance over time
 */

import { logger } from './logger';
import { chromaService } from '../services/chromaService';

interface TrainingMetrics {
  modelId: string;
  task: string;
  accuracyBefore: number;
  accuracyAfter: number;
  f1ScoreBefore: number;
  f1ScoreAfter: number;
  trainingDate: Date;
  datasetSize: number;
  epochsRun: number;
}

export class TrainingService {
  private isTraining: boolean = false;
  private modelRegistry: Map<string, string> = new Map(); // Map task -> modelId
  private metrics: TrainingMetrics[] = [];
  
  constructor() {
    this.loadModelRegistry();
  }
  
  /**
   * Load the model registry from localStorage
   * In a production environment, this would load from a database
   */
  private loadModelRegistry(): void {
    try {
      const registry = localStorage.getItem('model_registry');
      if (registry) {
        const parsed = JSON.parse(registry);
        Object.entries(parsed).forEach(([task, modelId]) => {
          this.modelRegistry.set(task, modelId as string);
        });
        logger.info('Model registry loaded');
      }
    } catch (error) {
      logger.error('Failed to load model registry:', error);
    }
  }
  
  /**
   * Save the model registry to localStorage
   * In a production environment, this would save to a database
   */
  private saveModelRegistry(): void {
    try {
      const registry: Record<string, string> = {};
      this.modelRegistry.forEach((modelId, task) => {
        registry[task] = modelId;
      });
      localStorage.setItem('model_registry', JSON.stringify(registry));
    } catch (error) {
      logger.error('Failed to save model registry:', error);
    }
  }
  
  /**
   * Get feedback for training for a specific task
   */
  private async getFeedbackForTask(task: string): Promise<any[]> {
    try {
      // Get feedback from ChromaDB
      // For demo purposes, we'll use localStorage as fallback
      const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
      const relevantFeedback = localFeedback.filter((item: any) => 
        item.analysisType === task && 
        item.userFeedback?.isCorrect !== null
      );
      
      return relevantFeedback;
    } catch (error) {
      logger.error(`Failed to get feedback for task ${task}:`, error);
      return [];
    }
  }
  
  /**
   * Prepare training data for a specific task
   */
  private prepareTrainingData(task: string, feedbackItems: any[]): any {
    if (feedbackItems.length === 0) {
      return null;
    }
    
    // Different preparation based on task type
    switch (task) {
      case 'fallacy': {
        // Prepare data for logical fallacy detection
        const trainingExamples = feedbackItems.map(item => ({
          text: item.originalPrediction?.excerpt || '',
          fallacyType: item.userFeedback.isCorrect 
            ? item.originalPrediction.type 
            : 'NOT_FALLACY',
          confidence: item.userFeedback.rating ? item.userFeedback.rating / 5 : 0.5
        }));
        
        return {
          task: 'fallacy_detection',
          examples: trainingExamples,
          metadata: {
            datasetSize: trainingExamples.length,
            source: 'user_feedback',
            timestamp: new Date().toISOString()
          }
        };
      }
        
      case 'bias': {
        // Prepare data for bias analysis
        const trainingExamples = feedbackItems.map(item => ({
          biasExplanation: item.originalPrediction?.explanation || '',
          biasType: item.userFeedback.isCorrect 
            ? item.originalPrediction.type 
            : 'UNKNOWN',
          confidence: item.userFeedback.rating ? item.userFeedback.rating / 5 : 0.5
        }));
        
        return {
          task: 'bias_analysis',
          examples: trainingExamples,
          metadata: {
            datasetSize: trainingExamples.length,
            source: 'user_feedback',
            timestamp: new Date().toISOString()
          }
        };
      }
      
      case 'sentiment': 
      case 'emotion': {
        // Prepare data for sentiment analysis
        const trainingExamples = feedbackItems.map(item => ({
          text: item.originalPrediction?.text || '',
          sentiment: item.userFeedback.isCorrect 
            ? item.originalPrediction.sentiment 
            : (item.userFeedback.comment || 'neutral'),
          confidence: item.userFeedback.rating ? item.userFeedback.rating / 5 : 0.5
        }));
        
        return {
          task: 'sentiment_analysis',
          examples: trainingExamples,
          metadata: {
            datasetSize: trainingExamples.length,
            source: 'user_feedback',
            timestamp: new Date().toISOString()
          }
        };
      }
      
      default:
        logger.warn(`No data preparation method for task ${task}`);
        return null;
    }
  }
  
  /**
   * Train model for a specific task
   */
  public async trainModel(task: string): Promise<boolean> {
    if (this.isTraining) {
      logger.warn('Training already in progress. Please wait.');
      return false;
    }
    
    try {
      this.isTraining = true;
      logger.info(`Starting training for task: ${task}`);
      
      // Get feedback data
      const feedbackItems = await this.getFeedbackForTask(task);
      
      if (feedbackItems.length < 10) {
        logger.warn(`Not enough feedback data for task ${task}. Need at least 10 examples.`);
        return false;
      }
      
      // Prepare training data
      const trainingData = this.prepareTrainingData(task, feedbackItems);
      
      if (!trainingData) {
        logger.error(`Failed to prepare training data for task ${task}`);
        return false;
      }
      
      // In a real implementation, this would send data to a model training service
      // For demo, we'll simulate model training
      logger.info(`Training model for task ${task} with ${trainingData.examples.length} examples`);
      
      // Simulate training completion
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate a new model ID
      const newModelId = `model-${task}-${Date.now()}`;
      this.modelRegistry.set(task, newModelId);
      this.saveModelRegistry();
      
      // Record metrics
      const newMetrics: TrainingMetrics = {
        modelId: newModelId,
        task,
        accuracyBefore: 0.65 + Math.random() * 0.15,
        accuracyAfter: 0.75 + Math.random() * 0.15,
        f1ScoreBefore: 0.6 + Math.random() * 0.15,
        f1ScoreAfter: 0.7 + Math.random() * 0.15,
        trainingDate: new Date(),
        datasetSize: trainingData.examples.length,
        epochsRun: 5
      };
      
      this.metrics.push(newMetrics);
      
      logger.info(`Model training complete for task ${task}`);
      logger.info(`New model ID: ${newModelId}`);
      logger.info(`Accuracy improved from ${newMetrics.accuracyBefore.toFixed(2)} to ${newMetrics.accuracyAfter.toFixed(2)}`);
      
      return true;
    } catch (error) {
      logger.error(`Error training model for task ${task}:`, error);
      return false;
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Get the current best model for a task
   */
  public getModelForTask(task: string): string | null {
    return this.modelRegistry.get(task) || null;
  }
  
  /**
   * Get training metrics history
   */
  public getTrainingMetrics(): TrainingMetrics[] {
    return [...this.metrics];
  }
}

// Export a singleton instance
export const trainingService = new TrainingService(); 