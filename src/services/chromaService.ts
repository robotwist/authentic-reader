/**
 * ChromaDB Service
 * 
 * Service for storing and retrieving vector embeddings and user feedback
 * for the AI feedback loop system
 */

import { logger } from '../utils/logger';

// Configuration options from environment
const CHROMA_HOST = import.meta.env?.VITE_CHROMA_HOST || window.env?.REACT_APP_CHROMA_HOST || 'localhost';
const CHROMA_PORT = import.meta.env?.VITE_CHROMA_PORT || window.env?.REACT_APP_CHROMA_PORT || '8000';

interface ChromaDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

interface FeedbackItem {
  userId?: string;
  articleId: string;
  analysisType: string;
  originalPrediction: any;
  userFeedback: any;
  timestamp: number;
  context?: Record<string, any>;
}

class ChromaService {
  private baseUrl: string;
  private isConfigured: boolean;
  private collectionName: string = 'authentic-reader';
  
  constructor() {
    this.baseUrl = `http://${CHROMA_HOST}:${CHROMA_PORT}`;
    
    // Check if ChromaDB config exists
    this.isConfigured = !!CHROMA_HOST && !!CHROMA_PORT;
    
    if (!this.isConfigured) {
      logger.warn('ChromaDB service is not configured. Vector storage unavailable.');
    } else {
      logger.info(`ChromaDB service initialized with endpoint: ${this.baseUrl}`);
      // Initialize collection
      this.initializeCollection().catch(e => {
        logger.error('Failed to initialize ChromaDB collection:', e);
      });
    }
  }
  
  /**
   * Initialize the ChromaDB collection
   */
  private async initializeCollection(): Promise<void> {
    if (!this.isConfigured) return;
    
    try {
      // Check if collection exists
      const response = await fetch(`${this.baseUrl}/api/v1/collections`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }
      
      const collections = await response.json();
      const collectionExists = collections.some(
        (collection: any) => collection.name === this.collectionName
      );
      
      // Create collection if it doesn't exist
      if (!collectionExists) {
        logger.info(`Creating ChromaDB collection "${this.collectionName}"`);
        
        const createResponse = await fetch(`${this.baseUrl}/api/v1/collections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: this.collectionName,
            metadata: {
              description: 'Authentic Reader vector storage for articles and feedback'
            }
          })
        });
        
        if (!createResponse.ok) {
          throw new Error(`Failed to create collection: ${createResponse.statusText}`);
        }
        
        logger.info(`ChromaDB collection "${this.collectionName}" created successfully`);
      } else {
        logger.info(`ChromaDB collection "${this.collectionName}" already exists`);
      }
    } catch (error) {
      logger.error('Error initializing ChromaDB collection:', error);
      throw error;
    }
  }
  
  /**
   * Store article embedding in ChromaDB
   */
  async storeArticleEmbedding(
    articleId: string, 
    embedding: number[], 
    metadata: Record<string, any>
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('ChromaDB not configured, skipping embedding storage');
      return false;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [articleId],
          embeddings: [embedding],
          metadatas: [{ ...metadata, type: 'article', timestamp: Date.now() }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store embedding: ${response.statusText}`);
      }
      
      logger.info(`Stored embedding for article ${articleId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to store article embedding ${articleId}:`, error);
      return false;
    }
  }
  
  /**
   * Store user feedback for training the feedback loop
   */
  async storeFeedback(feedback: FeedbackItem): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('ChromaDB not configured, storing feedback locally');
      
      // Store in localStorage as fallback
      const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
      localFeedback.push(feedback);
      localStorage.setItem('feedback', JSON.stringify(localFeedback));
      
      return true;
    }
    
    try {
      // Generate a unique ID for the feedback
      const feedbackId = `feedback-${feedback.articleId}-${Date.now()}`;
      
      // Store feedback as a document with zero embedding (placeholder)
      // In a real implementation, you would compute an embedding for the feedback
      const zeroEmbedding = new Array(1536).fill(0);
      
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [feedbackId],
          embeddings: [zeroEmbedding],
          metadatas: [{ 
            ...feedback,
            type: 'feedback'
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store feedback: ${response.statusText}`);
      }
      
      logger.info(`Stored feedback for article ${feedback.articleId}`);
      return true;
    } catch (error) {
      logger.error('Failed to store feedback:', error);
      
      // Fallback to localStorage
      logger.info('Falling back to localStorage for feedback storage');
      const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
      localFeedback.push(feedback);
      localStorage.setItem('feedback', JSON.stringify(localFeedback));
      
      return true;
    }
  }
  
  /**
   * Get similar articles based on embedding
   */
  async getSimilarArticles(
    embedding: number[], 
    limit: number = 5
  ): Promise<Record<string, any>[]> {
    if (!this.isConfigured) {
      logger.warn('ChromaDB not configured, cannot retrieve similar articles');
      return [];
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query_embeddings: [embedding],
          n_results: limit,
          where: { type: 'article' }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to query similar articles: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Format the results
      const articles = result.metadatas[0].map((metadata: any, i: number) => {
        return {
          id: result.ids[0][i],
          distance: result.distances[0][i],
          ...metadata
        };
      });
      
      return articles;
    } catch (error) {
      logger.error('Failed to get similar articles:', error);
      return [];
    }
  }
  
  /**
   * Get all feedback for a specific article
   */
  async getArticleFeedback(articleId: string): Promise<FeedbackItem[]> {
    if (!this.isConfigured) {
      logger.info('ChromaDB not configured, returning feedback from localStorage');
      
      // Return from localStorage as fallback
      const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
      return localFeedback.filter((item: FeedbackItem) => item.articleId === articleId);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionName}/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          where: { 
            type: 'feedback',
            articleId: articleId
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get article feedback: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return result.metadatas.map((metadata: any) => metadata as FeedbackItem);
    } catch (error) {
      logger.error(`Failed to get feedback for article ${articleId}:`, error);
      
      // Fallback to localStorage
      const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
      return localFeedback.filter((item: FeedbackItem) => item.articleId === articleId);
    }
  }
}

// Export singleton instance
export const chromaService = new ChromaService(); 