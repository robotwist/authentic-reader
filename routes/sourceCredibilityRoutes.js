import express from 'express';
import fs from 'fs/promises';
import path from 'path';
const router = express.Router();

// Path to credibility data storage
const CREDIBILITY_DATA_PATH = path.join(process.cwd(), 'data', 'sourceCredibility.json');

// Initialize credibility data structure
const initializeCredibilityData = () => {
  return {
    sources: {},
    factCheckHistory: [],
    retractionHistory: [],
    networkAnalysis: {},
    lastUpdated: new Date().toISOString()
  };
};

// Load credibility data
async function loadCredibilityData() {
  try {
    const data = await fs.readFile(CREDIBILITY_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing credibility data found, initializing new data');
    const initialData = initializeCredibilityData();
    await saveCredibilityData(initialData);
    return initialData;
  }
}

// Save credibility data
async function saveCredibilityData(data) {
  try {
    await fs.mkdir(path.dirname(CREDIBILITY_DATA_PATH), { recursive: true });
    await fs.writeFile(CREDIBILITY_DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving credibility data:', error);
  }
}

/**
 * Get comprehensive credibility data for a source
 */
router.get('/:sourceId/credibility', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const data = await loadCredibilityData();
    
    const sourceData = data.sources[sourceId];
    if (!sourceData) {
      // Generate initial credibility data for new source
      const initialCredibility = generateInitialCredibility(sourceId);
      data.sources[sourceId] = initialCredibility;
      await saveCredibilityData(data);
      return res.json(initialCredibility);
    }
    
    // Update with latest analysis
    const updatedCredibility = await updateSourceCredibility(sourceId, sourceData, data);
    res.json(updatedCredibility);
    
  } catch (error) {
    console.error('Error fetching source credibility:', error);
    res.status(500).json({ 
      error: 'Failed to fetch source credibility',
      details: error.message 
    });
  }
});

/**
 * Update credibility data with new fact-check result
 */
router.post('/credibility/update', async (req, res) => {
  try {
    const { sourceId, articleId, claim, factCheckResult, confidence, timestamp } = req.body;
    
    if (!sourceId || !factCheckResult) {
      return res.status(400).json({ error: 'sourceId and factCheckResult are required' });
    }
    
    const data = await loadCredibilityData();
    
    // Initialize source if it doesn't exist
    if (!data.sources[sourceId]) {
      data.sources[sourceId] = generateInitialCredibility(sourceId);
    }
    
    // Update fact check history
    data.factCheckHistory.push({
      sourceId,
      articleId,
      claim,
      result: factCheckResult,
      confidence,
      timestamp: timestamp || new Date().toISOString()
    });
    
    // Update source credibility
    data.sources[sourceId] = await updateSourceCredibility(sourceId, data.sources[sourceId], data);
    
    await saveCredibilityData(data);
    
    res.json({ 
      success: true, 
      message: 'Credibility data updated successfully',
      sourceId 
    });
    
  } catch (error) {
    console.error('Error updating credibility:', error);
    res.status(500).json({ 
      error: 'Failed to update credibility',
      details: error.message 
    });
  }
});

/**
 * Get trending sources (improving/declining credibility)
 */
router.get('/credibility/trends', async (req, res) => {
  try {
    const data = await loadCredibilityData();
    const trends = analyzeTrendingSources(data);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trending sources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trending sources',
      details: error.message 
    });
  }
});

/**
 * Get source recommendations based on topic
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { topic, bias } = req.query;
    const data = await loadCredibilityData();
    
    const recommendations = generateSourceRecommendations(data, topic, bias);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error.message 
    });
  }
});

/**
 * Get echo chamber analysis for a source
 */
router.get('/:sourceId/echo-chamber', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const data = await loadCredibilityData();
    
    const echoChamberAnalysis = analyzeEchoChamber(sourceId, data);
    res.json(echoChamberAnalysis);
  } catch (error) {
    console.error('Error analyzing echo chamber:', error);
    res.status(500).json({ 
      error: 'Failed to analyze echo chamber',
      details: error.message 
    });
  }
});

/**
 * Get credibility comparison for multiple sources
 */
router.post('/credibility/compare', async (req, res) => {
  try {
    const { sourceIds } = req.body;
    
    if (!sourceIds || !Array.isArray(sourceIds)) {
      return res.status(400).json({ error: 'sourceIds array is required' });
    }
    
    const data = await loadCredibilityData();
    const comparison = await compareSources(sourceIds, data);
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing sources:', error);
    res.status(500).json({ 
      error: 'Failed to compare sources',
      details: error.message 
    });
  }
});

/**
 * Generate initial credibility data for a new source
 */
function generateInitialCredibility(sourceId) {
  return {
    sourceId,
    sourceName: sourceId,
    domain: sourceId,
    historicalAccuracy: {
      overall: 0.5,
      byCategory: {},
      byTimeframe: {
        last30Days: 0.5,
        last90Days: 0.5,
        lastYear: 0.5,
        allTime: 0.5
      },
      totalArticles: 0,
      verifiedClaims: 0,
      disputedClaims: 0,
      falseClaims: 0
    },
    biasAnalysis: {
      politicalBias: 0,
      biasConsistency: 0.5,
      biasTrend: 'stable',
      biasCategories: {
        farLeft: 0,
        left: 0,
        center: 1,
        right: 0,
        farRight: 0
      }
    },
    factCheckRecord: {
      totalChecks: 0,
      verified: 0,
      disputed: 0,
      false: 0,
      misleading: 0,
      accuracyRate: 0.5,
      lastUpdated: new Date().toISOString()
    },
    retractionHistory: {
      totalRetractions: 0,
      retractionRate: 0,
      recentRetractions: []
    },
    sourceReputation: {
      trustScore: 50,
      reliabilityLevel: 'medium',
      verificationSpeed: 0.5,
      citationQuality: 0.5,
      transparencyScore: 0.5
    },
    networkAnalysis: {
      sharedSources: [],
      citationPatterns: {},
      influenceMetrics: {
        reach: 0.5,
        authority: 0.5,
        credibility: 0.5
      },
      echoChamberRisk: 0.5
    },
    recommendations: {
      overall: 'Limited data available for this source.',
      strengths: [],
      weaknesses: [],
      improvementSuggestions: ['More data needed for accurate assessment.']
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Update source credibility with latest data
 */
async function updateSourceCredibility(sourceId, sourceData, fullData) {
  // Get recent fact checks for this source
  const recentChecks = fullData.factCheckHistory
    .filter(check => check.sourceId === sourceId)
    .slice(-50); // Last 50 checks
  
  if (recentChecks.length === 0) {
    return sourceData;
  }
  
  // Calculate accuracy metrics
  const verified = recentChecks.filter(check => check.result === 'verified').length;
  const disputed = recentChecks.filter(check => check.result === 'disputed').length;
  const false_claims = recentChecks.filter(check => check.result === 'false').length;
  const misleading = recentChecks.filter(check => check.result === 'misleading').length;
  const total = recentChecks.length;
  
  const accuracyRate = total > 0 ? (verified + disputed * 0.5) / total : 0.5;
  
  // Update historical accuracy
  sourceData.historicalAccuracy = {
    overall: accuracyRate,
    byCategory: sourceData.historicalAccuracy.byCategory,
    byTimeframe: {
      last30Days: calculateTimeframeAccuracy(recentChecks, 30),
      last90Days: calculateTimeframeAccuracy(recentChecks, 90),
      lastYear: calculateTimeframeAccuracy(recentChecks, 365),
      allTime: accuracyRate
    },
    totalArticles: sourceData.historicalAccuracy.totalArticles + 1,
    verifiedClaims: verified,
    disputedClaims: disputed,
    falseClaims: false_claims
  };
  
  // Update fact check record
  sourceData.factCheckRecord = {
    totalChecks: total,
    verified,
    disputed,
    false: false_claims,
    misleading,
    accuracyRate,
    lastUpdated: new Date().toISOString()
  };
  
  // Update source reputation
  sourceData.sourceReputation = {
    trustScore: Math.min(100, Math.max(0, accuracyRate * 100)),
    reliabilityLevel: accuracyRate > 0.8 ? 'high' : accuracyRate > 0.6 ? 'medium' : 'low',
    verificationSpeed: calculateVerificationSpeed(recentChecks),
    citationQuality: sourceData.sourceReputation.citationQuality,
    transparencyScore: sourceData.sourceReputation.transparencyScore
  };
  
  // Generate recommendations
  sourceData.recommendations = generateRecommendations(sourceData, recentChecks);
  
  sourceData.lastUpdated = new Date().toISOString();
  
  return sourceData;
}

/**
 * Calculate accuracy for specific timeframe
 */
function calculateTimeframeAccuracy(checks, days) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const timeframeChecks = checks.filter(check => new Date(check.timestamp) > cutoff);
  
  if (timeframeChecks.length === 0) return 0.5;
  
  const verified = timeframeChecks.filter(check => check.result === 'verified').length;
  const disputed = timeframeChecks.filter(check => check.result === 'disputed').length;
  const total = timeframeChecks.length;
  
  return total > 0 ? (verified + disputed * 0.5) / total : 0.5;
}

/**
 * Calculate verification speed
 */
function calculateVerificationSpeed(checks) {
  // This would ideally track actual verification times
  // For now, return a reasonable estimate based on accuracy
  const accuracyRate = checks.length > 0 ? 
    checks.filter(check => check.result === 'verified').length / checks.length : 0.5;
  
  return Math.max(0.1, Math.min(1, accuracyRate * 1.2));
}

/**
 * Generate recommendations for a source
 */
function generateRecommendations(sourceData, recentChecks) {
  const recommendations = {
    overall: '',
    strengths: [],
    weaknesses: [],
    improvementSuggestions: []
  };
  
  const accuracy = sourceData.historicalAccuracy.overall;
  
  if (accuracy > 0.8) {
    recommendations.overall = 'This source demonstrates high accuracy and reliability.';
    recommendations.strengths = [
      'High fact-check accuracy rate',
      'Consistent verification of claims',
      'Good track record for reliability'
    ];
  } else if (accuracy > 0.6) {
    recommendations.overall = 'This source shows moderate accuracy with room for improvement.';
    recommendations.strengths = ['Moderate accuracy rate'];
    recommendations.weaknesses = ['Some claims have been disputed or proven false'];
    recommendations.improvementSuggestions = [
      'Improve fact-checking processes',
      'Increase verification of claims before publication'
    ];
  } else {
    recommendations.overall = 'This source has concerning accuracy issues.';
    recommendations.weaknesses = [
      'Low fact-check accuracy rate',
      'Multiple disputed or false claims'
    ];
    recommendations.improvementSuggestions = [
      'Implement stricter fact-checking procedures',
      'Review editorial standards',
      'Consider corrections for past errors'
    ];
  }
  
  return recommendations;
}

/**
 * Analyze trending sources
 */
function analyzeTrendingSources(data) {
  const sources = Object.values(data.sources);
  const improving = [];
  const declining = [];
  
  sources.forEach(source => {
    const recentAccuracy = source.historicalAccuracy.byTimeframe.last30Days;
    const overallAccuracy = source.historicalAccuracy.overall;
    const change = recentAccuracy - overallAccuracy;
    
    if (change > 0.1) {
      improving.push({
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        improvement: change
      });
    } else if (change < -0.1) {
      declining.push({
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        decline: Math.abs(change)
      });
    }
  });
  
  return {
    improving: improving.slice(0, 5),
    declining: declining.slice(0, 5)
  };
}

/**
 * Generate source recommendations
 */
function generateSourceRecommendations(data, topic, biasPreference) {
  const sources = Object.values(data.sources);
  const recommended = [];
  const avoid = [];
  
  sources.forEach(source => {
    const accuracy = source.historicalAccuracy.overall;
    const trustScore = source.sourceReputation.trustScore;
    
    if (accuracy > 0.7 && trustScore > 70) {
      recommended.push({
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        reason: 'High accuracy and trust score',
        score: (accuracy + trustScore / 100) / 2
      });
    } else if (accuracy < 0.4 || trustScore < 30) {
      avoid.push({
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        reason: 'Low accuracy or trust score'
      });
    }
  });
  
  return {
    recommended: recommended.sort((a, b) => b.score - a.score).slice(0, 5),
    avoid: avoid.slice(0, 3)
  };
}

/**
 * Analyze echo chamber risk
 */
function analyzeEchoChamber(sourceId, data) {
  // This is a simplified analysis - in a real implementation,
  // you'd analyze citation patterns, shared sources, and bias overlap
  
  return {
    riskLevel: 'medium',
    sharedSources: [],
    citationOverlap: 0.5,
    biasEcho: 0.5,
    recommendations: [
      'Consider diversifying your news sources',
      'Look for sources with different perspectives',
      'Verify claims across multiple outlets'
    ]
  };
}

/**
 * Compare multiple sources
 */
async function compareSources(sourceIds, data) {
  const sources = sourceIds.map(id => data.sources[id]).filter(Boolean);
  
  const comparison = sources.map(source => ({
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    accuracy: source.historicalAccuracy.overall,
    trustScore: source.sourceReputation.trustScore,
    biasConsistency: source.biasAnalysis.biasConsistency
  }));
  
  const insights = generateComparisonInsights(sources);
  
  return { comparison, insights };
}

/**
 * Generate comparison insights
 */
function generateComparisonInsights(sources) {
  const insights = [];
  
  if (sources.length === 0) return insights;
  
  const sortedByAccuracy = [...sources].sort((a, b) => 
    b.historicalAccuracy.overall - a.historicalAccuracy.overall
  );
  
  const mostAccurate = sortedByAccuracy[0];
  const leastAccurate = sortedByAccuracy[sortedByAccuracy.length - 1];
  
  insights.push(`${mostAccurate.sourceName} has the highest accuracy rate at ${(mostAccurate.historicalAccuracy.overall * 100).toFixed(1)}%.`);
  
  if (leastAccurate.historicalAccuracy.overall < 0.5) {
    insights.push(`${leastAccurate.sourceName} has concerning accuracy issues with only ${(leastAccurate.historicalAccuracy.overall * 100).toFixed(1)}% accuracy.`);
  }
  
  return insights;
}

export default router;
