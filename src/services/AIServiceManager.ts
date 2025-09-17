/**
 * AI Service Manager
 * 
 * Centralized manager for all AI services with authentication handling
 * and proper fallbacks between different services
 */

import { aiAnalysisService } from './aiAnalysisService';

// Import other services as needed
// import { openaiService } from './openaiService';
// import { localOnnxService } from './localOnnxService';
// import { llamaService } from './llamaService';
// import { chromaService } from './chromaService';

export enum AIServiceProvider {
  LLAMA = 'llama',
  LOCAL_ONNX = 'localOnnx',
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
    
    // Configure Llama (primary service)
    this.serviceConfigs.set(AIServiceProvider.LLAMA, {
      name: 'Llama 3.2',
      isConfigured: true,
      priority: 1
    });
    
    // Configure Local ONNX (always available since it's local)
    this.serviceConfigs.set(AIServiceProvider.LOCAL_ONNX, {
      name: 'Local ONNX',
      isConfigured: true,
      priority: 2
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
    // Use the centralized AI analysis service
    try {
      const biasResult = await aiAnalysisService.analyzeBias(text);
      return {
        fallacies: [],
        biasAnalysis: biasResult,
        success: true
      };
    } catch (error) {
      console.error('Error analyzing logical fallacies:', error);
      return {
        fallacies: [],
        biasAnalysis: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Analyze sentiment using the best available service
   */
  async analyzeSentiment(text: string): Promise<any> {
    try {
      return await aiAnalysisService.analyzeSentiment(text);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        sentiment: 'neutral',
        confidence: 50,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Extract entities using the best available service
   */
  async extractEntities(text: string): Promise<any> {
    try {
      return await aiAnalysisService.extractEntities(text);
    } catch (error) {
      console.error('Error extracting entities:', error);
      return {
        entities: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Analyze credibility using the best available service
   */
  async analyzeCredibility(text: string): Promise<any> {
    try {
      return await aiAnalysisService.analyzeCredibility(text);
    } catch (error) {
      console.error('Error analyzing credibility:', error);
      return {
        credibilityScore: 50,
        credibilityLevel: 'medium',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get service status information
   */
  getServiceStatus() {
    return aiAnalysisService.getServiceStatus();
  }
  
  /**
   * Toggle local fallbacks
   */
  toggleLocalFallbacks(useLocal: boolean) {
    this.useLocalFallbacks = useLocal;
    localStorage.setItem('use_local_fallbacks', useLocal.toString());
    console.info(`Local fallbacks ${useLocal ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager(); 