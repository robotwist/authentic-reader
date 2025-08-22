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
  analysis_method?: string;
  fallback_reason?: string;
  confidence?: number;
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

  // Run service status check on mount only
  useEffect(() => {
    checkServiceStatus();
  }, []); // Empty dependency array - only run on mount

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
      // Do not loop on error; surface a clear disabled message
      const msg = serviceStatus.error?.includes('disabled')
        ? 'Llama service disabled in this environment.'
        : 'Llama service is not available. Please check the service status.';
      setError(msg);
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
        try {
          // Check if we have parsed analysis from the backend
          if (response.parsed_analysis && response.parsed_analysis.bias_scores) {
            const analysis = response.parsed_analysis;
            return {
              text: response.text,
              processing_time: response.processing_time,
              model_used: response.model_used,
              timestamp: Date.now(),
              bias_scores: {
                political: analysis.bias_scores.political || 0,
                ideological: analysis.bias_scores.ideological || 0,
                partisan: analysis.bias_scores.partisan || 0
              },
              detected_bias_phrases: analysis.detected_bias_phrases || [],
              overall_bias_assessment: analysis.overall_bias_assessment || "Analysis completed",
              analysis_method: analysis.analysis_method || "unknown",
              fallback_reason: analysis.fallback_reason,
              confidence: analysis.confidence
            };
          }
          
          // Fallback: try to extract JSON from raw response
          const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              text: response.text,
              processing_time: response.processing_time,
              model_used: response.model_used,
              timestamp: Date.now(),
              bias_scores: {
                political: parsed.bias_scores?.political || 0,
                ideological: parsed.bias_scores?.ideological || 0,
                partisan: parsed.bias_scores?.partisan || 0
              },
              detected_bias_phrases: parsed.detected_bias_phrases || [],
              overall_bias_assessment: parsed.overall_bias_assessment || "Analysis completed"
            };
          }
          
          // Final fallback: return basic structure
          console.warn("Could not parse structured bias analysis, using fallback");
          return {
            text: response.text || "No response text available",
            processing_time: response.processing_time || 0,
            model_used: response.model_used || "unknown",
            timestamp: Date.now(),
            bias_scores: { political: 0, ideological: 0, partisan: 0 },
            detected_bias_phrases: [],
            overall_bias_assessment: "Analysis completed but parsing failed"
          };
        } catch (e) {
          console.error("Error parsing bias analysis result:", e);
          return {
            text: response.text || "No response text available",
            processing_time: response.processing_time || 0,
            model_used: response.model_used || "unknown",
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