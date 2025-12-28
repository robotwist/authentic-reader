/**
 * useEnhancedAnalysis Hook
 * 
 * React hook for using the LLM-powered enhanced cognitive analysis service.
 * Provides loading states, caching, and easy integration with components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import enhancedCognitiveAnalysisService, { 
  AnalysisResult, 
  Fallacy 
} from '../services/enhancedCognitiveAnalysisService';
import { 
  convertFallaciesToFallacyData,
  convertAnalysisResultToBriefingFormat,
  getBiasDescription,
  getReliabilityGrade
} from '../utils/analysisAdapter';
import { FallacyData } from '../utils/llmParser';

interface UseEnhancedAnalysisOptions {
  /** Auto-initialize the service on mount */
  autoInit?: boolean;
  /** Cache results by text hash */
  useCache?: boolean;
}

interface UseEnhancedAnalysisResult {
  /** Analyze article text */
  analyzeArticle: (text: string, metadata?: {
    title?: string;
    source?: string;
    author?: string;
  }) => Promise<AnalysisResult>;
  
  /** Latest analysis result */
  analysis: AnalysisResult | null;
  
  /** Fallacies in FallacyData format (for ReaderView) */
  fallacyData: FallacyData[];
  
  /** Analysis in briefing format (for DailyBriefingPage) */
  briefingFormat: ReturnType<typeof convertAnalysisResultToBriefingFormat> | null;
  
  /** Human-readable bias description */
  biasDescription: string | null;
  
  /** Reliability grade info */
  reliabilityGrade: ReturnType<typeof getReliabilityGrade> | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Whether LLM service is available */
  isLLMAvailable: boolean;
  
  /** Service initialization status */
  isInitialized: boolean;
  
  /** Clear current analysis */
  clearAnalysis: () => void;
}

// Simple hash function for caching
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// In-memory cache
const analysisCache = new Map<string, AnalysisResult>();

/**
 * Hook for enhanced LLM-powered article analysis
 */
export function useEnhancedAnalysis(
  options: UseEnhancedAnalysisOptions = {}
): UseEnhancedAnalysisResult {
  const { autoInit = true, useCache = true } = options;
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLLMAvailable, setIsLLMAvailable] = useState(false);
  
  const initializingRef = useRef(false);

  // Initialize service on mount
  useEffect(() => {
    if (autoInit && !isInitialized && !initializingRef.current) {
      initializingRef.current = true;
      
      enhancedCognitiveAnalysisService.initialize()
        .then((available) => {
          setIsLLMAvailable(available);
          setIsInitialized(true);
          initializingRef.current = false;
        })
        .catch((err) => {
          console.error('Failed to initialize analysis service:', err);
          setIsInitialized(true);
          setIsLLMAvailable(false);
          initializingRef.current = false;
        });
    }
  }, [autoInit, isInitialized]);

  // Main analysis function
  const analyzeArticle = useCallback(async (
    text: string,
    metadata?: { title?: string; source?: string; author?: string }
  ): Promise<AnalysisResult> => {
    setError(null);
    setIsLoading(true);

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = hashText(text);
        const cached = analysisCache.get(cacheKey);
        if (cached) {
          setAnalysis(cached);
          setIsLoading(false);
          return cached;
        }
      }

      // Perform analysis
      const result = await enhancedCognitiveAnalysisService.analyzeArticle(text, metadata);
      
      // Cache result
      if (useCache) {
        const cacheKey = hashText(text);
        analysisCache.set(cacheKey, result);
        
        // Limit cache size
        if (analysisCache.size > 50) {
          const firstKey = analysisCache.keys().next().value;
          if (firstKey) analysisCache.delete(firstKey);
        }
      }
      
      setAnalysis(result);
      setIsLoading(false);
      return result;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Analysis failed');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, [useCache]);

  // Clear analysis
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  // Derived values
  const fallacyData = analysis 
    ? convertFallaciesToFallacyData(analysis.fallacies)
    : [];
    
  const briefingFormat = analysis
    ? convertAnalysisResultToBriefingFormat(analysis)
    : null;
    
  const biasDescription = analysis
    ? getBiasDescription(analysis)
    : null;
    
  const reliabilityGrade = analysis
    ? getReliabilityGrade(analysis.reliabilityScore)
    : null;

  return {
    analyzeArticle,
    analysis,
    fallacyData,
    briefingFormat,
    biasDescription,
    reliabilityGrade,
    isLoading,
    error,
    isLLMAvailable,
    isInitialized,
    clearAnalysis
  };
}

/**
 * Batch analysis hook for multiple articles
 */
export function useEnhancedBatchAnalysis() {
  const [results, setResults] = useState<Map<string, AnalysisResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const analyzeMultiple = useCallback(async (
    articles: Array<{
      id: string;
      text: string;
      metadata?: { title?: string; source?: string; author?: string };
    }>
  ): Promise<Map<string, AnalysisResult>> => {
    setIsLoading(true);
    setProgress({ current: 0, total: articles.length });
    
    const newResults = new Map<string, AnalysisResult>();
    
    // Process sequentially to avoid overwhelming the LLM service
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      try {
        const result = await enhancedCognitiveAnalysisService.analyzeArticle(
          article.text,
          article.metadata
        );
        newResults.set(article.id, result);
      } catch (err) {
        console.error(`Failed to analyze article ${article.id}:`, err);
      }
      setProgress({ current: i + 1, total: articles.length });
    }
    
    setResults(newResults);
    setIsLoading(false);
    return newResults;
  }, []);
  
  return {
    analyzeMultiple,
    results,
    isLoading,
    progress
  };
}

export default useEnhancedAnalysis;

