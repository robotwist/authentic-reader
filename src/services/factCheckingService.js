/**
 * Comprehensive Fact-Checking Service
 * Integrates with multiple fact-checking APIs for real-time verification
 */
class FactCheckingService {
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
            value: 24 * 60 * 60 * 1000
        }); // 24 hours
    }
    /**
     * Perform comprehensive fact-checking across multiple sources
     */
    async checkFact(claim, context) {
        const cacheKey = this.generateCacheKey(claim);
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached;
        }
        try {
            // Step 1: Analyze claim for bias and context
            const biasAnalysis = await this.analyzeClaimBias(claim);
            // Step 2: Check against fact-checking databases
            const factCheckResults = await Promise.allSettled([
                this.checkSnopes(claim),
                this.checkPolitiFact(claim),
                this.checkReutersFactCheck(claim),
                this.checkFactCheckOrg(claim)
            ]);
            // Step 3: Analyze results and generate verdict
            const result = this.synthesizeResults(claim, factCheckResults, biasAnalysis);
            // Cache the result
            this.cache.set(cacheKey, result);
            return result;
        }
        catch (error) {
            console.error('Fact-checking failed:', error);
            return this.generateFallbackResult(claim, error);
        }
    }
    /**
     * Check claim against Snopes database
     */
    async checkSnopes(claim) {
        try {
            // Use Snopes RSS feed to search for related fact checks
            const response = await fetch(`${this.API_BASE_URL}/api/fact-check/snopes?claim=${encodeURIComponent(claim)}`);
            if (!response.ok)
                throw new Error('Snopes check failed');
            return await response.json();
        }
        catch (error) {
            console.warn('Snopes check failed:', error);
            return null;
        }
    }
    /**
     * Check claim against PolitiFact database
     */
    async checkPolitiFact(claim) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/fact-check/politifact?claim=${encodeURIComponent(claim)}`);
            if (!response.ok)
                throw new Error('PolitiFact check failed');
            return await response.json();
        }
        catch (error) {
            console.warn('PolitiFact check failed:', error);
            return null;
        }
    }
    /**
     * Check claim against Reuters Fact Check
     */
    async checkReutersFactCheck(claim) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/fact-check/reuters?claim=${encodeURIComponent(claim)}`);
            if (!response.ok)
                throw new Error('Reuters fact check failed');
            return await response.json();
        }
        catch (error) {
            console.warn('Reuters fact check failed:', error);
            return null;
        }
    }
    /**
     * Check claim against FactCheck.org
     */
    async checkFactCheckOrg(claim) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/fact-check/factcheck-org?claim=${encodeURIComponent(claim)}`);
            if (!response.ok)
                throw new Error('FactCheck.org check failed');
            return await response.json();
        }
        catch (error) {
            console.warn('FactCheck.org check failed:', error);
            return null;
        }
    }
    /**
     * Analyze claim for bias and context using AI
     */
    async analyzeClaimBias(claim) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/analysis/bias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: claim })
            });
            if (!response.ok)
                throw new Error('Bias analysis failed');
            return await response.json();
        }
        catch (error) {
            console.warn('Bias analysis failed:', error);
            return { bias_scores: { political: 0.5, emotional: 0.5, cognitive: 0.5 } };
        }
    }
    /**
     * Synthesize results from multiple fact-checking sources
     */
    synthesizeResults(claim, results, biasAnalysis) {
        const successfulResults = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
        if (successfulResults.length === 0) {
            return this.generateFallbackResult(claim, new Error('No fact-checking sources available'));
        }
        // Analyze consensus among sources
        const statusCounts = new Map();
        const sources = [];
        const supporting = [];
        const contradicting = [];
        const neutral = [];
        successfulResults.forEach(result => {
            if (result.status) {
                statusCounts.set(result.status, (statusCounts.get(result.status) || 0) + 1);
            }
            if (result.sources) {
                sources.push(...result.sources);
            }
            if (result.evidence) {
                if (result.evidence.supporting)
                    supporting.push(...result.evidence.supporting);
                if (result.evidence.contradicting)
                    contradicting.push(...result.evidence.contradicting);
                if (result.evidence.neutral)
                    neutral.push(...result.evidence.neutral);
            }
        });
        // Determine overall status
        const status = this.determineOverallStatus(statusCounts, biasAnalysis);
        const confidence = this.calculateConfidence(successfulResults.length, statusCounts);
        const explanation = this.generateExplanation(status, statusCounts, sources);
        const aiInsight = this.generateAIInsight(claim, status, biasAnalysis, sources);
        return {
            claim,
            status,
            confidence,
            sources,
            evidence: { supporting, contradicting, neutral },
            explanation,
            aiInsight,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Determine overall fact-check status based on consensus
     */
    determineOverallStatus(statusCounts, biasAnalysis) {
        const total = Array.from(statusCounts.values()).reduce((sum, count) => sum + count, 0);
        if (total === 0)
            return 'unverified';
        const verifiedCount = statusCounts.get('verified') || 0;
        const disputedCount = statusCounts.get('disputed') || 0;
        const falseCount = statusCounts.get('false') || 0;
        const misleadingCount = statusCounts.get('misleading') || 0;
        // High bias might indicate misleading content
        const biasScore = biasAnalysis.bias_scores?.political || 0.5;
        const isHighBias = biasScore > 0.7 || biasScore < 0.3;
        if (verifiedCount > total * 0.6)
            return 'verified';
        if (falseCount > total * 0.5)
            return 'false';
        if (misleadingCount > total * 0.4 || (isHighBias && disputedCount > 0))
            return 'misleading';
        if (disputedCount > total * 0.3)
            return 'disputed';
        return 'unverified';
    }
    /**
     * Calculate confidence score based on source agreement
     */
    calculateConfidence(sourceCount, statusCounts) {
        if (sourceCount === 0)
            return 0.3;
        const total = Array.from(statusCounts.values()).reduce((sum, count) => sum + count, 0);
        const maxCount = Math.max(...statusCounts.values());
        // Base confidence on source agreement
        const agreementScore = maxCount / total;
        // Boost confidence with more sources
        const sourceScore = Math.min(sourceCount / 4, 1);
        return Math.min(agreementScore * 0.7 + sourceScore * 0.3, 1);
    }
    /**
     * Generate explanation for the fact-check result
     */
    generateExplanation(status, statusCounts, sources) {
        const total = Array.from(statusCounts.values()).reduce((sum, count) => sum + count, 0);
        switch (status) {
            case 'verified':
                return `This claim has been verified by ${sources.length} fact-checking sources. Multiple independent sources confirm this information.`;
            case 'false':
                return `This claim has been debunked by ${sources.length} fact-checking sources. The evidence contradicts this statement.`;
            case 'misleading':
                return `This claim contains misleading information according to ${sources.length} fact-checking sources. The statement may be partially true but presented in a way that creates a false impression.`;
            case 'disputed':
                return `This claim is disputed among fact-checking sources. ${sources.length} sources have reviewed this claim with conflicting conclusions.`;
            default:
                return `This claim has not been thoroughly fact-checked by our sources. We found ${sources.length} related fact checks but cannot provide a definitive verdict.`;
        }
    }
    /**
     * Generate AI-powered insights about the claim
     */
    generateAIInsight(claim, status, biasAnalysis, sources) {
        const biasScore = biasAnalysis.bias_scores?.political || 0.5;
        const isHighBias = biasScore > 0.7 || biasScore < 0.3;
        let insight = '';
        if (status === 'verified' && isHighBias) {
            insight = 'While this claim is factually accurate, it may be presented with a particular bias. Consider seeking additional perspectives.';
        }
        else if (status === 'misleading') {
            insight = 'This claim uses selective facts or omits important context. Always verify with multiple sources.';
        }
        else if (status === 'disputed') {
            insight = 'Experts disagree on this claim. This suggests the issue is complex and may require deeper research.';
        }
        else if (sources.length === 0) {
            insight = 'No fact-checking sources have reviewed this specific claim. Consider the source and seek additional verification.';
        }
        else {
            insight = 'This claim has been reviewed by multiple fact-checking organizations. Consider their findings alongside other sources.';
        }
        return insight;
    }
    /**
     * Generate fallback result when fact-checking fails
     */
    generateFallbackResult(claim, error) {
        return {
            claim,
            status: 'unverified',
            confidence: 0.3,
            sources: [],
            evidence: { supporting: [], contradicting: [], neutral: [] },
            explanation: 'Unable to verify this claim due to technical issues. Please try again later or verify with other sources.',
            aiInsight: 'When fact-checking services are unavailable, consider checking multiple sources and looking for primary evidence.',
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Generate cache key for claim
     */
    generateCacheKey(claim) {
        return claim.toLowerCase().replace(/\s+/g, ' ').trim();
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
export const factCheckingService = new FactCheckingService();
