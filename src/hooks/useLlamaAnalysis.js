import { useState, useEffect, useCallback } from 'react';
import llamaService from '../services/LlamaService';
// Hook for using Llama service for content analysis
export function useLlamaAnalysis() {
    const [serviceStatus, setServiceStatus] = useState(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [analysisInProgress, setAnalysisInProgress] = useState(false);
    const [error, setError] = useState(null);
    // Check if the Llama service is available
    const checkServiceStatus = useCallback(async () => {
        setIsCheckingStatus(true);
        setError(null);
        try {
            const status = await llamaService.checkStatus();
            setServiceStatus(status);
            return status;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error checking service status';
            setError(errorMessage);
            setServiceStatus({
                status: 'error',
                model: 'unknown',
                error: errorMessage
            });
            return null;
        }
        finally {
            setIsCheckingStatus(false);
        }
    }, []);
    // Run service status check on mount only
    useEffect(() => {
        checkServiceStatus();
    }, []); // Empty dependency array - only run on mount
    // Generic function to analyze text using the Llama service
    const analyzeText = useCallback(async (text, analysisType, parseResult) => {
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
        }
        else if (serviceStatus.status !== 'healthy') {
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
            const request = {
                text,
                analysis_type: analysisType
            };
            const response = await llamaService.analyzeText(request);
            // Parse the response using the provided parser function
            const result = parseResult(response);
            return {
                ...result,
                timestamp: Date.now()
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error during analysis';
            setError(errorMessage);
            return null;
        }
        finally {
            setAnalysisInProgress(false);
        }
    }, [serviceStatus, checkServiceStatus]);
    // Specific analysis functions for each type
    const analyzeBias = useCallback(async (text) => {
        return analyzeText(text, 'bias', (response) => {
            try {
                // First, try to parse structured analysis from the backend
                if (response.result && typeof response.result === 'object') {
                    const result = response.result;
                    // Handle different response structures
                    if (result.bias_scores) {
                        return {
                            text: response.text || text,
                            processing_time: response.processing_time || 0,
                            model_used: response.model_used || 'unknown',
                            timestamp: Date.now(),
                            bias_scores: {
                                political: result.bias_scores.political || 0,
                                ideological: result.bias_scores.ideological || 0,
                                partisan: result.bias_scores.partisan || 0
                            },
                            detected_bias_phrases: result.detected_bias_phrases || [],
                            overall_bias_assessment: result.overall_bias_assessment || "Analysis completed",
                            analysis_method: result.analysis_method || "llama_ai",
                            fallback_reason: result.fallback_reason,
                            confidence: result.confidence || 0.5
                        };
                    }
                    // Handle parsed_analysis structure
                    if (result.parsed_analysis && result.parsed_analysis.bias_scores) {
                        const analysis = result.parsed_analysis;
                        return {
                            text: response.text || text,
                            processing_time: response.processing_time || 0,
                            model_used: response.model_used || 'unknown',
                            timestamp: Date.now(),
                            bias_scores: {
                                political: analysis.bias_scores.political || 0,
                                ideological: analysis.bias_scores.ideological || 0,
                                partisan: analysis.bias_scores.partisan || 0
                            },
                            detected_bias_phrases: analysis.detected_bias_phrases || [],
                            overall_bias_assessment: analysis.overall_bias_assessment || "Analysis completed",
                            analysis_method: analysis.analysis_method || "llama_ai",
                            fallback_reason: analysis.fallback_reason,
                            confidence: analysis.confidence || 0.5
                        };
                    }
                }
                // Second, try to extract JSON from raw response text
                if (response.text) {
                    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            const parsed = JSON.parse(jsonMatch[0]);
                            if (parsed.bias_scores || parsed.political_score || parsed.ideological_score) {
                                return {
                                    text: response.text,
                                    processing_time: response.processing_time || 0,
                                    model_used: response.model_used || 'unknown',
                                    timestamp: Date.now(),
                                    bias_scores: {
                                        political: parsed.bias_scores?.political || parsed.political_score || 0,
                                        ideological: parsed.bias_scores?.ideological || parsed.ideological_score || 0,
                                        partisan: parsed.bias_scores?.partisan || parsed.partisan_score || 0
                                    },
                                    detected_bias_phrases: parsed.detected_bias_phrases || parsed.bias_phrases || [],
                                    overall_bias_assessment: parsed.overall_bias_assessment || parsed.assessment || "Analysis completed",
                                    analysis_method: "json_extraction",
                                    confidence: parsed.confidence || 0.5
                                };
                            }
                        }
                        catch (jsonError) {
                            console.warn("Failed to parse JSON from response text:", jsonError);
                        }
                    }
                }
                // Third, try to extract bias information from unstructured text
                if (response.text) {
                    const biasInfo = extractBiasFromText(response.text);
                    if (biasInfo) {
                        return {
                            text: response.text,
                            processing_time: response.processing_time || 0,
                            model_used: response.model_used || 'unknown',
                            timestamp: Date.now(),
                            bias_scores: biasInfo.scores,
                            detected_bias_phrases: biasInfo.phrases,
                            overall_bias_assessment: biasInfo.assessment,
                            analysis_method: "text_analysis",
                            confidence: biasInfo.confidence
                        };
                    }
                }
                // Final fallback: return basic structure with warning
                console.warn("Could not parse structured bias analysis, using fallback");
                return {
                    text: response.text || "No response text available",
                    processing_time: response.processing_time || 0,
                    model_used: response.model_used || "unknown",
                    timestamp: Date.now(),
                    bias_scores: { political: 0.5, ideological: 0.5, partisan: 0.5 },
                    detected_bias_phrases: [],
                    overall_bias_assessment: "Analysis completed but parsing failed - using neutral scores",
                    analysis_method: "fallback",
                    confidence: 0.3
                };
            }
            catch (e) {
                console.error("Error parsing bias analysis result:", e);
                return {
                    text: response.text || "No response text available",
                    processing_time: response.processing_time || 0,
                    model_used: response.model_used || "unknown",
                    timestamp: Date.now(),
                    bias_scores: { political: 0.5, ideological: 0.5, partisan: 0.5 },
                    detected_bias_phrases: [],
                    overall_bias_assessment: "Error parsing analysis result - using neutral scores",
                    analysis_method: "error_fallback",
                    confidence: 0.2
                };
            }
        });
    }, [analyzeText]);
    // Helper function to extract bias information from unstructured text
    const extractBiasFromText = (text) => {
        const lowerText = text.toLowerCase();
        // Extract bias scores from text patterns
        const politicalMatch = lowerText.match(/political.*?(\d+(?:\.\d+)?)/);
        const ideologicalMatch = lowerText.match(/ideological.*?(\d+(?:\.\d+)?)/);
        const partisanMatch = lowerText.match(/partisan.*?(\d+(?:\.\d+)?)/);
        // Extract bias phrases
        const biasPhrases = [];
        const biasKeywords = [
            'liberal', 'conservative', 'progressive', 'traditional', 'radical', 'moderate',
            'left-wing', 'right-wing', 'democrat', 'republican', 'socialist', 'capitalist'
        ];
        biasKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                biasPhrases.push(keyword);
            }
        });
        // Determine overall assessment
        let assessment = "Neutral analysis";
        if (lowerText.includes('bias') || lowerText.includes('biased')) {
            assessment = "Bias detected in content";
        }
        else if (lowerText.includes('neutral') || lowerText.includes('balanced')) {
            assessment = "Content appears balanced";
        }
        // Calculate confidence based on extracted information
        const confidence = Math.min(0.8, 0.3 + (biasPhrases.length * 0.1) + (politicalMatch ? 0.2 : 0) + (ideologicalMatch ? 0.2 : 0) + (partisanMatch ? 0.2 : 0));
        return {
            scores: {
                political: politicalMatch ? parseFloat(politicalMatch[1]) / 10 : 0.5,
                ideological: ideologicalMatch ? parseFloat(ideologicalMatch[1]) / 10 : 0.5,
                partisan: partisanMatch ? parseFloat(partisanMatch[1]) / 10 : 0.5
            },
            phrases: biasPhrases,
            assessment,
            confidence
        };
    };
    const analyzeEntities = useCallback(async (text) => {
        return analyzeText(text, 'entities', (response) => {
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
        });
    }, [analyzeText]);
    const analyzeRhetoric = useCallback(async (text) => {
        return analyzeText(text, 'rhetoric', (response) => {
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
        });
    }, [analyzeText]);
    const analyzeDarkPatterns = useCallback(async (text) => {
        return analyzeText(text, 'darkpatterns', (response) => {
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
        });
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
