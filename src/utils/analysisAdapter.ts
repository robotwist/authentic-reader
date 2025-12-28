/**
 * Analysis Adapter
 * 
 * Bridges the new EnhancedCognitiveAnalysis format with the existing
 * FallacyData interface used by ReaderView and other components.
 */

import { FallacyData } from './llmParser';
import { Fallacy, AnalysisResult } from '../services/enhancedCognitiveAnalysisService';

/**
 * Convert new Fallacy format to legacy FallacyData format
 */
export function convertFallacyToFallacyData(fallacy: Fallacy, index: number): FallacyData {
  return {
    id: `enhanced-fallacy-${index}-${Date.now()}`,
    type: fallacy.type,
    excerpt: fallacy.excerpt,
    severity: fallacy.severity,
    explanation: fallacy.explanation,
    mechanism: `The author uses ${fallacy.type} to manipulate the reader's perception.`,
    motive: fallacy.betterAlternative 
      ? `A fair argument would instead: ${fallacy.betterAlternative}`
      : 'To influence reader perception through faulty logic.'
  };
}

/**
 * Convert an array of Fallacies to FallacyData array
 */
export function convertFallaciesToFallacyData(fallacies: Fallacy[]): FallacyData[] {
  return fallacies.map((fallacy, index) => convertFallacyToFallacyData(fallacy, index));
}

/**
 * Convert AnalysisResult to the format expected by DailyBriefingPage
 */
export function convertAnalysisResultToBriefingFormat(analysis: AnalysisResult): {
  keySentences: Array<{
    sentence: string;
    manipulationTechniques: string[];
    biasIndicators: string[];
  }>;
  manipulationAnalysis: {
    logicalFallacies: Array<{
      type: string;
      location: string;
      explanation: string;
    }>;
  };
  overallAssessment: {
    reliabilityScore: number;
  };
  biasAnalysis?: {
    direction: string;
    score: number;
    confidence: number;
    explanation: string;
  };
  summary?: string;
} {
  return {
    keySentences: analysis.fallacies.map(f => ({
      sentence: f.excerpt,
      manipulationTechniques: [f.type],
      biasIndicators: analysis.manipulationTechniques.slice(0, 2)
    })),
    manipulationAnalysis: {
      logicalFallacies: analysis.fallacies.map(f => ({
        type: f.type,
        location: f.excerpt,
        explanation: f.explanation
      }))
    },
    overallAssessment: {
      reliabilityScore: analysis.reliabilityScore
    },
    biasAnalysis: {
      direction: analysis.bias,
      score: analysis.bias === 'center' ? 50 : 
             analysis.bias === 'center-left' || analysis.bias === 'center-right' ? 65 :
             80,
      confidence: analysis.biasConfidence / 100,
      explanation: `The article displays a ${analysis.bias} political lean with ${analysis.tone.toLowerCase()} tone.`
    },
    summary: analysis.summary
  };
}

/**
 * Merge enhanced analysis with existing article analysis
 * (for backward compatibility during migration)
 */
export function mergeWithExistingAnalysis(
  existingAnalysis: any,
  enhancedAnalysis: AnalysisResult
): any {
  const converted = convertAnalysisResultToBriefingFormat(enhancedAnalysis);
  
  return {
    ...existingAnalysis,
    // Override with enhanced analysis
    manipulationAnalysis: converted.manipulationAnalysis,
    overallAssessment: converted.overallAssessment,
    biasAnalysis: converted.biasAnalysis,
    // Add new fields
    enhancedSummary: converted.summary,
    enhancedTone: enhancedAnalysis.tone,
    // Keep existing keySentences if enhanced has none
    keySentences: converted.keySentences.length > 0 
      ? converted.keySentences 
      : existingAnalysis?.keySentences || []
  };
}

/**
 * Extract display-ready fallacy annotations for ReaderView
 */
export function extractFallacyAnnotations(analysis: AnalysisResult): FallacyData[] {
  return convertFallaciesToFallacyData(analysis.fallacies);
}

/**
 * Get a human-readable bias description
 */
export function getBiasDescription(analysis: AnalysisResult): string {
  const biasLabels: Record<AnalysisResult['bias'], string> = {
    'left': 'Strong Left-Leaning',
    'center-left': 'Moderate Left-Leaning',
    'center': 'Centrist/Balanced',
    'center-right': 'Moderate Right-Leaning',
    'right': 'Strong Right-Leaning'
  };
  
  const confidenceLabel = analysis.biasConfidence >= 80 ? 'High confidence' :
                          analysis.biasConfidence >= 50 ? 'Moderate confidence' :
                          'Low confidence';
  
  return `${biasLabels[analysis.bias]} (${confidenceLabel}: ${analysis.biasConfidence}%)`;
}

/**
 * Get a reliability grade from score
 */
export function getReliabilityGrade(score: number): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  class: 'high' | 'medium' | 'low';
} {
  if (score >= 85) return { grade: 'A', label: 'Highly Reliable', class: 'high' };
  if (score >= 70) return { grade: 'B', label: 'Generally Reliable', class: 'high' };
  if (score >= 55) return { grade: 'C', label: 'Mixed Reliability', class: 'medium' };
  if (score >= 40) return { grade: 'D', label: 'Questionable', class: 'low' };
  return { grade: 'F', label: 'Unreliable', class: 'low' };
}

