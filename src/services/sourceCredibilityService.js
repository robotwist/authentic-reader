/**
 * Source Credibility Service
 * Tracks historical accuracy, bias consistency, and provides advanced source analysis
 */
class SourceCredibilityService {
    constructor() {
        Object.defineProperty(this, "API_BASE_URL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
        });
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "CACHE_DURATION", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 60 * 60 * 1000
        }); // 1 hour
    }
    /**
     * Get comprehensive credibility data for a source
     */
    async getSourceCredibility(sourceId) {
        const cacheKey = `credibility_${sourceId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.lastUpdated).getTime() < this.CACHE_DURATION) {
            return cached;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/sources/${sourceId}/credibility`);
            if (!response.ok)
                throw new Error('Failed to fetch source credibility');
            const credibility = await response.json();
            this.cache.set(cacheKey, credibility);
            return credibility;
        }
        catch (error) {
            console.error('Error fetching source credibility:', error);
            return this.generateFallbackCredibility(sourceId);
        }
    }
    /**
     * Get credibility comparison for multiple sources
     */
    async compareSources(sourceIds) {
        try {
            const credibilityData = await Promise.all(sourceIds.map(id => this.getSourceCredibility(id)));
            const comparison = credibilityData.map(source => ({
                sourceId: source.sourceId,
                sourceName: source.sourceName,
                accuracy: source.historicalAccuracy.overall,
                trustScore: source.sourceReputation.trustScore,
                biasConsistency: source.biasAnalysis.biasConsistency
            }));
            const insights = this.generateComparisonInsights(credibilityData);
            return { comparison, insights };
        }
        catch (error) {
            console.error('Error comparing sources:', error);
            return { comparison: [], insights: ['Unable to compare sources at this time.'] };
        }
    }
    /**
     * Update credibility data with new fact-check result
     */
    async updateCredibility(update) {
        try {
            await fetch(`${this.API_BASE_URL}/api/sources/credibility/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update)
            });
            // Clear cache for this source
            this.cache.delete(`credibility_${update.sourceId}`);
        }
        catch (error) {
            console.error('Error updating credibility:', error);
        }
    }
    /**
     * Get trending sources (sources with improving/declining credibility)
     */
    async getTrendingSources() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/sources/credibility/trends`);
            if (!response.ok)
                throw new Error('Failed to fetch trending sources');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching trending sources:', error);
            return { improving: [], declining: [] };
        }
    }
    /**
     * Get source recommendations based on topic
     */
    async getSourceRecommendations(topic, biasPreference) {
        try {
            const params = new URLSearchParams({ topic });
            if (biasPreference)
                params.append('bias', biasPreference);
            const response = await fetch(`${this.API_BASE_URL}/api/sources/recommendations?${params}`);
            if (!response.ok)
                throw new Error('Failed to fetch source recommendations');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching source recommendations:', error);
            return { recommended: [], avoid: [] };
        }
    }
    /**
     * Get echo chamber analysis for a source
     */
    async getEchoChamberAnalysis(sourceId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/sources/${sourceId}/echo-chamber`);
            if (!response.ok)
                throw new Error('Failed to fetch echo chamber analysis');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching echo chamber analysis:', error);
            return {
                riskLevel: 'medium',
                sharedSources: [],
                citationOverlap: 0.5,
                biasEcho: 0.5,
                recommendations: ['Unable to analyze echo chamber risk at this time.']
            };
        }
    }
    /**
     * Generate comparison insights
     */
    generateComparisonInsights(sources) {
        const insights = [];
        if (sources.length === 0)
            return insights;
        // Find most and least accurate sources
        const sortedByAccuracy = [...sources].sort((a, b) => b.historicalAccuracy.overall - a.historicalAccuracy.overall);
        const mostAccurate = sortedByAccuracy[0];
        const leastAccurate = sortedByAccuracy[sortedByAccuracy.length - 1];
        insights.push(`${mostAccurate.sourceName} has the highest accuracy rate at ${(mostAccurate.historicalAccuracy.overall * 100).toFixed(1)}%.`);
        if (leastAccurate.historicalAccuracy.overall < 0.5) {
            insights.push(`${leastAccurate.sourceName} has concerning accuracy issues with only ${(leastAccurate.historicalAccuracy.overall * 100).toFixed(1)}% accuracy.`);
        }
        // Analyze bias diversity
        const biasScores = sources.map(s => s.biasAnalysis.politicalBias);
        const biasRange = Math.max(...biasScores) - Math.min(...biasScores);
        if (biasRange > 0.8) {
            insights.push('These sources represent a diverse range of political perspectives, which is good for balanced coverage.');
        }
        else if (biasRange < 0.3) {
            insights.push('These sources have similar political leanings. Consider adding sources with different perspectives.');
        }
        // Check for high-reliability sources
        const highReliability = sources.filter(s => s.sourceReputation.reliabilityLevel === 'high');
        if (highReliability.length > 0) {
            insights.push(`${highReliability.length} source(s) have high reliability ratings, making them good primary sources.`);
        }
        return insights;
    }
    /**
     * Generate fallback credibility data
     */
    generateFallbackCredibility(sourceId) {
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
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}
// Export singleton instance
export const sourceCredibilityService = new SourceCredibilityService();
