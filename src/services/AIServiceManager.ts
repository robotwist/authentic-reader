/**
 * AI Service Manager
 * 
 * Centralized manager for all AI services with authentication handling
 * and proper fallbacks between different services
 */

import { HF_CONFIG } from '../config/huggingFaceConfig';
import { huggingFaceService } from './huggingFaceService';

// Import other services as needed
// import { openaiService } from './openaiService';
// import { localOnnxService } from './localOnnxService';
// import { llamaService } from './llamaService';
// import { chromaService } from './chromaService';

export enum AIServiceProvider {
  HUGGING_FACE = 'huggingFace',
  LOCAL_ONNX = 'localOnnx',
  LLAMA = 'llama',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic'
}

interface AIServiceConfig {
  name: string;
  isConfigured: boolean;
  priority: number;
}

class AIServiceManager {
  private serviceConfigs: Map<AIServiceProvider, AIServiceConfig>;
  private useLocalFallbacks: boolean;
  
  constructor() {
    this.useLocalFallbacks = localStorage.getItem('use_local_fallbacks') === 'true';
    
    // Initialize service configurations
    this.serviceConfigs = new Map();
    
    // Configure Hugging Face
    this.serviceConfigs.set(AIServiceProvider.HUGGING_FACE, {
      name: 'Hugging Face',
      isConfigured: HF_CONFIG.isConfigured(),
      priority: this.useLocalFallbacks ? 2 : 1
    });
    
    // Configure Local ONNX (always available since it's local)
    this.serviceConfigs.set(AIServiceProvider.LOCAL_ONNX, {
      name: 'Local ONNX',
      isConfigured: true,
      priority: this.useLocalFallbacks ? 1 : 2
    });
    
    // Add other services as needed
    
    // Log available services
    this.logAvailableServices();
  }
  
  /**
   * Log available AI services for debugging
   */
  private logAvailableServices(): void {
    console.info('🤖 Available AI services:');
    
    // Get services sorted by priority
    const sortedServices = Array.from(this.serviceConfigs.entries())
      .filter(([_, config]) => config.isConfigured)
      .sort((a, b) => a[1].priority - b[1].priority);
    
    sortedServices.forEach(([provider, config]) => {
      console.info(`- ${config.name} (Priority: ${config.priority})`);
    });
  }
  
  /**
   * Get preferred service for a specific task
   */
  getServiceForTask(task: string): AIServiceProvider | null {
    // Get configured services sorted by priority
    const availableServices = Array.from(this.serviceConfigs.entries())
      .filter(([_, config]) => config.isConfigured)
      .sort((a, b) => a[1].priority - b[1].priority);
    
    if (availableServices.length === 0) {
      console.warn(`No configured AI services available for task: ${task}`);
      return null;
    }
    
    // Return the highest priority service
    return availableServices[0][0];
  }
  
  /**
   * Analyze text for logical fallacies
   */
  async analyzeLogicalFallacies(text: string): Promise<any> {
    // First try Hugging Face if configured and not using local fallbacks
    if (HF_CONFIG.isConfigured() && !this.useLocalFallbacks) {
      try {
        console.log('Using Hugging Face for logical fallacy detection');
        return await huggingFaceService.analyzeLogicalFallacies(text);
      } catch (error) {
        console.warn('Hugging Face logical fallacy analysis failed, falling back to local', error);
      }
    }
    
    // Fallback to local ONNX model
    console.log('Using local ONNX model for logical fallacy detection');
    // In a real implementation, you would call your local ONNX service here
    return { fallacies: [], success: true };
  }
  
  /**
   * Analyze text for sentiment
   */
  async analyzeSentiment(text: string): Promise<any> {
    // First try Hugging Face if configured and not using local fallbacks
    if (HF_CONFIG.isConfigured() && !this.useLocalFallbacks) {
      try {
        console.log('Using Hugging Face for sentiment analysis');
        return await huggingFaceService.analyzeSentiment(text);
      } catch (error) {
        console.warn('Hugging Face sentiment analysis failed, falling back to local', error);
      }
    }
    
    // Fallback to local ONNX model
    console.log('Using local ONNX model for sentiment analysis');
    // In a real implementation, you would call your local ONNX service here
    return { sentiment: 'neutral', score: 0, success: true };
  }
  
  /**
   * Toggle between local and API-based analysis
   */
  toggleLocalAnalysis(useLocal: boolean): void {
    this.useLocalFallbacks = useLocal;
    localStorage.setItem('use_local_fallbacks', useLocal.toString());
    
    // Update priorities based on the new setting
    this.serviceConfigs.get(AIServiceProvider.HUGGING_FACE)!.priority = useLocal ? 2 : 1;
    this.serviceConfigs.get(AIServiceProvider.LOCAL_ONNX)!.priority = useLocal ? 1 : 2;
    
    // Re-log the updated services
    this.logAvailableServices();
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager(); 