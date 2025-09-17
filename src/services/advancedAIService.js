/**
 * Advanced AI Service
 * Semantic similarity, context-aware analysis, predictive fact-checking, and automated claim extraction
 */
class AdvancedAIService {
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
            value: 15 * 60 * 1000
        }); // 15 minutes
    }
    /**
     * Perform semantic analysis of text
     */
    async analyzeSemantics(text) {
        const cacheKey = `semantic_${this.hashText(text)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/ai/semantic-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!response.ok)
                throw new Error('Failed to analyze semantics');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error analyzing semantics:', error);
            return this.generateFallbackSemanticAnalysis(text);
        }
    }
    /**
     * Calculate semantic similarity between two texts
     */
    async calculateSimilarity(text1, text2) {
        const cacheKey = `similarity_${this.hashText(text1)}_${this.hashText(text2)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/ai/semantic-similarity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text1, text2 })
            });
            if (!response.ok)
                throw new Error('Failed to calculate similarity');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error calculating similarity:', error);
            return this.generateFallbackSimilarity(text1, text2);
        }
    }
    /**
     * Predict fact-check results for a claim
     */
    async predictFactCheck(claim) {
        const cacheKey = `prediction_${this.hashText(claim)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/ai/predict-fact-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim })
            });
            if (!response.ok)
                throw new Error('Failed to predict fact-check');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error predicting fact-check:', error);
            return this.generateFallbackPrediction(claim);
        }
    }
    /**
     * Extract claims from text
     */
    async extractClaims(text) {
        const cacheKey = `claims_${this.hashText(text)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/ai/extract-claims`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!response.ok)
                throw new Error('Failed to extract claims');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error extracting claims:', error);
            return this.generateFallbackClaimExtraction(text);
        }
    }
    /**
     * Perform context-aware analysis
     */
    async analyzeContext(text) {
        const cacheKey = `context_${this.hashText(text)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/ai/context-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!response.ok)
                throw new Error('Failed to analyze context');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error analyzing context:', error);
            return this.generateFallbackContextAnalysis(text);
        }
    }
    /**
     * Compare multiple texts for comprehensive analysis
     */
    async compareTexts(texts) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/ai/compare-texts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts })
            });
            if (!response.ok)
                throw new Error('Failed to compare texts');
            return await response.json();
        }
        catch (error) {
            console.error('Error comparing texts:', error);
            return {
                similarities: [],
                commonThemes: [],
                differences: [],
                recommendations: ['Unable to compare texts at this time.']
            };
        }
    }
    /**
     * Generate AI-powered insights
     */
    async generateInsights(text) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/ai/generate-insights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!response.ok)
                throw new Error('Failed to generate insights');
            return await response.json();
        }
        catch (error) {
            console.error('Error generating insights:', error);
            return {
                keyInsights: ['Unable to generate insights at this time.'],
                potentialIssues: ['Limited analysis available.'],
                recommendations: ['Consider manual fact-checking.'],
                factCheckSuggestions: ['Verify claims with multiple sources.']
            };
        }
    }
    /**
     * Hash text for cache key generation
     */
    hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    /**
     * Generate fallback semantic analysis
     */
    generateFallbackSemanticAnalysis(text) {
        return {
            text,
            embeddings: new Array(768).fill(0).map(() => Math.random() - 0.5),
            semanticFeatures: {
                topics: ['general'],
                entities: [],
                sentiment: {
                    overall: 0,
                    components: {
                        political: 0,
                        emotional: 0,
                        factual: 0.5
                    }
                },
                complexity: 0.5,
                readability: 0.5
            },
            contextAnalysis: {
                historicalContext: [],
                relatedEvents: [],
                backgroundInfo: [],
                implications: []
            }
        };
    }
    /**
     * Generate fallback similarity analysis
     */
    generateFallbackSimilarity(text1, text2) {
        return {
            text1,
            text2,
            similarity: 0.5,
            similarityType: 'semantic',
            sharedFeatures: {
                topics: [],
                entities: [],
                concepts: []
            },
            differences: {
                topics: [],
                entities: [],
                concepts: []
            },
            analysis: {
                agreement: 0.5,
                disagreement: 0.2,
                neutral: 0.3
            }
        };
    }
    /**
     * Generate fallback prediction
     */
    generateFallbackPrediction(claim) {
        return {
            claim,
            prediction: {
                likelihood: 0.5,
                confidence: 0.3,
                factors: [
                    {
                        factor: 'Limited data available',
                        impact: 'neutral',
                        weight: 1.0
                    }
                ]
            },
            evidence: {
                supporting: [],
                contradicting: [],
                neutral: []
            },
            recommendations: {
                verificationSteps: ['Manual fact-checking recommended'],
                sourcesToCheck: [],
                redFlags: []
            },
            timeline: {
                estimatedVerificationTime: 'Unknown',
                priority: 'medium',
                urgency: 0.5
            }
        };
    }
    /**
     * Generate fallback claim extraction
     */
    generateFallbackClaimExtraction(text) {
        return {
            text,
            claims: [],
            summary: {
                totalClaims: 0,
                factualClaims: 0,
                opinionClaims: 0,
                verifiableClaims: 0,
                highImpactClaims: 0
            },
            recommendations: {
                priorityClaims: [],
                verificationOrder: [],
                factCheckSuggestions: ['Manual review recommended']
            }
        };
    }
    /**
     * Generate fallback context analysis
     */
    generateFallbackContextAnalysis(text) {
        return {
            text,
            context: {
                historical: [],
                political: [],
                social: [],
                economic: [],
                cultural: []
            },
            biasDetection: {
                explicitBias: [],
                implicitBias: [],
                overallBias: {
                    political: 0,
                    emotional: 0,
                    cognitive: 0
                }
            },
            credibilityFactors: {
                sourceReliability: 0.5,
                evidenceQuality: 0.5,
                logicalConsistency: 0.5,
                factualAccuracy: 0.5,
                overallScore: 0.5
            },
            recommendations: {
                biasMitigation: [],
                credibilityImprovement: [],
                factCheckPriority: []
            }
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
export const advancedAIService = new AdvancedAIService();
