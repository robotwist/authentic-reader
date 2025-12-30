/**
 * Transparent Logic Score Calculation
 * 
 * Calculates a logic score for articles based on detected logical fallacies and tone.
 * The score starts at 100 and deducts points based on fallacy severity and problematic tone.
 * 
 * This builds user trust by showing the "math" behind the score.
 */

import { Article } from '../types/Article';
import { FallacyData } from './llmParser';

export interface ScoreBreakdown {
  total: number; // 0-100
  base: number; // Always 100
  deductions: Array<{ reason: string; points: number; type: 'fallacy' | 'tone' | 'bias' }>;
  ratingColor: string; // Hex color
}

/**
 * Calculate logic score based on article analysis
 * 
 * @param article - Article object with analysis containing fallacies and tone
 * @returns ScoreBreakdown with total, base, deductions, and ratingColor
 * 
 * Scoring rules:
 * - Base score: 100
 * - High severity fallacy: -10 points
 * - Medium severity fallacy: -5 points
 * - Low severity fallacy: -2 points
 * - Alarmist/Aggressive/Vitriolic tone: -5 points
 * - Minimum score: 0 (floor)
 */
export function calculateLogicScore(article: Article): ScoreBreakdown {
  let score = 100;
  const deductions: ScoreBreakdown['deductions'] = [];

  if (!article.analysis) {
    // If no analysis, return perfect score
    return {
      total: 100,
      base: 100,
      deductions: [],
      ratingColor: score >= 90 ? '#2A2A2A' : score >= 70 ? '#5A5A5A' : '#8A8A8A'
    };
  }

  const analysis = article.analysis;

  // 1. Fallacy Deductions
  // Handle both analysis.fallacies (Article type) and analysis.manipulationAnalysis.logicalFallacies (DailyBriefing format)
  const fallacies = analysis.fallacies || 
    (analysis as any).manipulationAnalysis?.logicalFallacies || 
    [];

  fallacies.forEach((f: any) => {
    let points = 0;
    const severity = (f.severity || 'medium').toLowerCase();
    
    if (severity === 'high') {
      points = 10;
    } else if (severity === 'medium') {
      points = 5;
    } else {
      points = 2;
    }
    
    score -= points;
    deductions.push({ 
      reason: f.type || 'Unknown Fallacy', 
      points: -points, 
      type: 'fallacy' 
    });
  });

  // 2. Tone Deductions (If tone is Alarmist/Aggressive/Vitriolic)
  const tone = analysis.tone?.toLowerCase() || '';
  if (['alarmist', 'aggressive', 'vitriolic'].includes(tone)) {
    score -= 5;
    deductions.push({ 
      reason: `Tone: ${analysis.tone}`, 
      points: -5, 
      type: 'tone' 
    });
  }

  // 3. Cap at 0
  const finalScore = Math.max(0, score);

  return {
    total: finalScore,
    base: 100,
    deductions,
    ratingColor: finalScore >= 90 ? '#2A2A2A' : finalScore >= 70 ? '#5A5A5A' : '#8A8A8A' // Neutral grey shading
  };
}

// ============================================
// LEGACY INTERFACES (for backward compatibility)
// ============================================

export interface LogicScoreResult {
  totalScore: number;
  deductions: Array<{
    reason: string;
    points: number;
  }>;
}

/**
 * Calculate logic score from FallacyData array (legacy interface for backward compatibility)
 * 
 * @param fallacies - Array of FallacyData objects
 * @returns LogicScoreResult with totalScore and deductions array
 */
export function calculateLogicScoreFromFallacies(fallacies: FallacyData[]): LogicScoreResult {
  let score = 100;
  const deductions: LogicScoreResult['deductions'] = [];

  // Process each fallacy
  for (const fallacy of fallacies) {
    const severity = (fallacy.severity || 'medium').toLowerCase() as 'high' | 'medium' | 'low';
    let points: number;
    
    // Determine deduction based on severity
    switch (severity) {
      case 'high':
        points = -10;
        break;
      case 'medium':
        points = -5;
        break;
      case 'low':
        points = -2;
        break;
      default:
        points = -5; // Default to medium if severity is invalid
    }

    // Add deduction record
    deductions.push({
      reason: fallacy.type || 'Unknown Fallacy',
      points
    });

    // Apply deduction
    score += points;
  }

  // Apply floor (score cannot go below 0)
  const finalScore = Math.max(0, score);

  return {
    totalScore: finalScore,
    deductions
  };
}

/**
 * Get color class for score display (legacy function for backward compatibility)
 * 
 * @param score - Logic score (0-100)
 * @returns CSS class name for color coding
 */
export function getScoreColorClass(score: number): 'score-high' | 'score-medium' | 'score-low' {
  if (score >= 90) return 'score-high';
  if (score >= 70) return 'score-medium';
  return 'score-low';
}

/**
 * Format score breakdown for tooltip display (supports both new and legacy formats)
 * 
 * @param result - ScoreBreakdown or LogicScoreResult
 * @returns Formatted string showing the calculation breakdown
 */
export function formatScoreBreakdown(
  result: ScoreBreakdown | LogicScoreResult
): string {
  const lines: string[] = ['Base: 100'];
  
  // Handle both new and legacy formats
  if ('total' in result) {
    // New ScoreBreakdown format
    for (const deduction of result.deductions) {
      lines.push(`${deduction.points}: ${deduction.reason}`);
    }
    lines.push(`= ${result.total}`);
  } else {
    // Legacy LogicScoreResult format
    for (const deduction of result.deductions) {
      lines.push(`${deduction.points}: ${deduction.reason}`);
    }
    lines.push(`= ${result.totalScore}`);
  }
  
  return lines.join('\n');
}

