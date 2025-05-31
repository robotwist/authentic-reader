import { ChromaClient } from 'chromadb';
import logger from '../utils/logger.js';

class ChromaService {
  private client: ChromaClient;
  private collection: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000; // 2 seconds

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_ENDPOINT || 'http://localhost:8080'
    });
  }

  async initializeCollection(collectionName: string) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        logger.info(`Attempting to initialize ChromaDB collection: ${collectionName} (Attempt ${retries + 1}/${this.maxRetries})`);
        
        // Check if collection exists
        const collections = await this.client.listCollections();
        const exists = collections.some((col: any) => col.name === collectionName);
        
        if (exists) {
          this.collection = await this.client.getCollection(collectionName);
        } else {
          this.collection = await this.client.createCollection({
            name: collectionName,
            metadata: {
              description: "Article analysis embeddings"
            }
          });
        }
        
        logger.info(`Successfully initialized ChromaDB collection: ${collectionName}`);
        return this.collection;
      } catch (error) {
        retries++;
        logger.error(`Error initializing ChromaDB collection (Attempt ${retries}/${this.maxRetries}):`, error);
        
        if (retries === this.maxRetries) {
          logger.error('Max retries reached. Falling back to local storage.');
          // Fallback to local storage or alternative solution
          return null;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async addEmbedding(id: string, embedding: number[], metadata: any) {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }
      
      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        metadatas: [metadata]
      });
      
      return true;
    } catch (error) {
      logger.error('Error adding embedding to ChromaDB:', error);
      return false;
    }
  }

  async queryEmbeddings(embedding: number[], limit: number = 5) {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }
      
      const results = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: limit
      });
      
      return results;
    } catch (error) {
      logger.error('Error querying embeddings from ChromaDB:', error);
      return [];
    }
  }
}

export default new ChromaService(); 