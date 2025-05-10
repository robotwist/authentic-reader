import { useState, useEffect, useCallback } from 'react';
import llamaService, { 
  LlamaResponse, 
  LlamaServiceStatus,
  AnalyzeRequest
} from '../services/LlamaService';

// Types for analysis results
export interface AnalysisResult {
  text: string;
  processing_time: number;
  model_used: string;
  timestamp: number;
}

export interface BiasAnalysisResult extends AnalysisResult {
  bias_scores: {
    political: number;
    ideological: number;
    partisan: number;
  };
  detected_bias_phrases: string[];
  overall_bias_assessment: string;
}

export interface EntityAnalysisResult extends AnalysisResult {
  entities: {
    name: string;
    type: string;
    sentiment: number;
    mentions: number;
    relationships: Array<{
      entity: string;
      relationship: string;
      confidence: number;
    }>;
  }[];
}

export interface RhetoricalAnalysisResult extends AnalysisResult {
  techniques: {
    technique: string;
    description: string;
    examples: string[];
    impact: string;
  }[];
  overall_assessment: string;
}

export interface DarkPatternAnalysisResult extends AnalysisResult {
  patterns: {
    pattern: string;
    description: string;
    examples: string[];
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }[];
  overall_assessment: string;
}

// Hook for using Llama service for content analysis
export function useLlamaAnalysis() {
  const [serviceStatus, setServiceStatus] = useState<LlamaServiceStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the Llama service is available
  const checkServiceStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    setError(null);
    
    try {
      const status = await llamaService.checkStatus();
      setServiceStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking service status';
      setError(errorMessage);
      setServiceStatus({
        status: 'error',
        model: 'unknown',
        error: errorMessage
      });
      return null;
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  // Run service status check on mount
  useEffect(() => {
    checkServiceStatus();
    
    // Optional: Set up a periodic check
    const intervalId = setInterval(() => {
      // Only check if not already checking and if there was an error before
      if (!isCheckingStatus && serviceStatus?.status === 'error') {
        checkServiceStatus();
      }
    }, 30000); // Check every 30 seconds if there was an error
    
    return () => clearInterval(intervalId);
  }, [checkServiceStatus, isCheckingStatus, serviceStatus]);

  // Generic function to analyze text using the Llama service
  const analyzeText = useCallback(async <T extends AnalysisResult>(
    text: string,
    analysisType: string,
    parseResult: (response: LlamaResponse) => T
  ): Promise<T | null> => {
    if (!text || !text.trim()) {
      setError('Please provide text to analyze');
      return null;
    }
    
    // Check service status first if unknown
    if (!serviceStatus) {
      const status = await checkServiceStatus();
      if (!status || status.status !== 'healthy') {
        setError('Llama service is not available. Please check the service status.');
        return null;
      }
    } else if (serviceStatus.status !== 'healthy') {
      setError('Llama service is not available. Please check the service status.');
      return null;
    }
    
    setAnalysisInProgress(true);
    setError(null);
    
    try {
      const request: AnalyzeRequest = {
        text,
        analysis_type: analysisType
      };
      
      const response = await llamaService.analyzeText(request);
      
      // Parse the response using the provided parser function
      const result = parseResult(response);
      
      return {
        ...result,
        timestamp: Date.now()
      } as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during analysis';
      setError(errorMessage);
      return null;
    } finally {
      setAnalysisInProgress(false);
    }
  }, [serviceStatus, checkServiceStatus]);

  // Specific analysis functions for each type
  const analyzeBias = useCallback(async (text: string): Promise<BiasAnalysisResult | null> => {
    return analyzeText<BiasAnalysisResult>(
      text,
      'bias',
      (response) => {
        // Parse the response to extract bias information
        // This is a simple implementation and might need to be adapted based on actual response format
        try {
          // Here we'd typically parse structured data from the response.text
          // For now, we'll create a mock interpretation
          return {
            text: response.text,
            processing_time: response.processing_time,
            model_used: response.model_used,
            timestamp: Date.now(),
            bias_scores: {
              political: Math.random() * 10,  // Mock values, would be parsed from response
              ideological: Math.random() * 10,
              partisan: Math.random() * 10
            },
            detected_bias_phrases: ["example phrase 1", "example phrase 2"],
            overall_bias_assessment: "Mock assessment - would be extracted from the response"
          };
        } catch (e) {
          console.error("Error parsing bias analysis result:", e);
          return {
            text: response.text,
            processing_time: response.processing_time,
            model_used: response.model_used,
            timestamp: Date.now(),
            bias_scores: { political: 0, ideological: 0, partisan: 0 },
            detected_bias_phrases: [],
            overall_bias_assessment: "Error parsing analysis result"
          };
        }
      }
    );
  }, [analyzeText]);

  const analyzeEntities = useCallback(async (text: string): Promise<EntityAnalysisResult | null> => {
    return analyzeText<EntityAnalysisResult>(
      text,
      'entities',
      (response) => {
        // Mock implementation - would need to be updated with actual parsing logic
        return {
          text: response.text,
          processing_time: response.processing_time,
          model_used: response.model_used,
          timestamp: Date.now(),
          entities: [
            {
              name: "Example Entity",
              type: "Person",
              sentiment: 0.5,
              mentions: 3,
              relationships: [
                {
                  entity: "Related Entity",
                  relationship: "works for",
                  confidence: 0.8
                }
              ]
            }
          ]
        };
      }
    );
  }, [analyzeText]);

  const analyzeRhetoric = useCallback(async (text: string): Promise<RhetoricalAnalysisResult | null> => {
    return analyzeText<RhetoricalAnalysisResult>(
      text,
      'rhetoric',
      (response) => {
        // Mock implementation - would need to be updated with actual parsing logic
        return {
          text: response.text,
          processing_time: response.processing_time,
          model_used: response.model_used,
          timestamp: Date.now(),
          techniques: [
            {
              technique: "Example Technique",
              description: "Description of the technique",
              examples: ["Example 1", "Example 2"],
              impact: "Description of impact"
            }
          ],
          overall_assessment: "Mock rhetorical assessment"
        };
      }
    );
  }, [analyzeText]);

  const analyzeDarkPatterns = useCallback(async (text: string): Promise<DarkPatternAnalysisResult | null> => {
    return analyzeText<DarkPatternAnalysisResult>(
      text,
      'darkpatterns',
      (response) => {
        // Mock implementation - would need to be updated with actual parsing logic
        return {
          text: response.text,
          processing_time: response.processing_time,
          model_used: response.model_used,
          timestamp: Date.now(),
          patterns: [
            {
              pattern: "Example Pattern",
              description: "Description of the pattern",
              examples: ["Example 1", "Example 2"],
              severity: "medium",
              impact: "Description of impact"
            }
          ],
          overall_assessment: "Mock dark pattern assessment"
        };
      }
    );
  }, [analyzeText]);

  return {
    serviceStatus,
    isCheckingStatus,
    analysisInProgress,
    error,
    checkServiceStatus,
    analyzeBias,
    analyzeEntities,
    analyzeRhetoric,
    analyzeDarkPatterns
  };
}

export default useLlamaAnalysis; 