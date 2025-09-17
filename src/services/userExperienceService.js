/**
 * User Experience Service
 * Personalized recommendations, credibility alerts, learning progress, and source comparison tools
 */
class UserExperienceService {
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
            value: 10 * 60 * 1000
        }); // 10 minutes
    }
    /**
     * Get user preferences
     */
    async getUserPreferences(userId) {
        const cacheKey = `preferences_${userId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/user/preferences/${userId}`);
            if (!response.ok)
                throw new Error('Failed to fetch user preferences');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error fetching user preferences:', error);
            return this.generateDefaultPreferences(userId);
        }
    }
    /**
     * Update user preferences
     */
    async updateUserPreferences(userId, preferences) {
        try {
            await fetch(`${this.API_BASE_URL}/api/user/preferences/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
            // Clear cache for this user
            this.cache.delete(`preferences_${userId}`);
        }
        catch (error) {
            console.error('Error updating user preferences:', error);
        }
    }
    /**
     * Get personalized recommendations
     */
    async getPersonalizedRecommendations(userId) {
        const cacheKey = `recommendations_${userId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/user/recommendations/${userId}`);
            if (!response.ok)
                throw new Error('Failed to fetch recommendations');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error fetching recommendations:', error);
            return this.generateFallbackRecommendations();
        }
    }
    /**
     * Get credibility alerts
     */
    async getCredibilityAlerts(userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/user/alerts/${userId}`);
            if (!response.ok)
                throw new Error('Failed to fetch credibility alerts');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching credibility alerts:', error);
            return [];
        }
    }
    /**
     * Mark alert as read
     */
    async markAlertAsRead(userId, alertId) {
        try {
            await fetch(`${this.API_BASE_URL}/api/user/alerts/${userId}/${alertId}/read`, {
                method: 'PUT'
            });
        }
        catch (error) {
            console.error('Error marking alert as read:', error);
        }
    }
    /**
     * Get learning progress
     */
    async getLearningProgress(userId) {
        const cacheKey = `progress_${userId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/user/progress/${userId}`);
            if (!response.ok)
                throw new Error('Failed to fetch learning progress');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error fetching learning progress:', error);
            return this.generateDefaultProgress(userId);
        }
    }
    /**
     * Update learning progress
     */
    async updateLearningProgress(userId, progress) {
        try {
            await fetch(`${this.API_BASE_URL}/api/user/progress/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(progress)
            });
            // Clear cache for this user
            this.cache.delete(`progress_${userId}`);
        }
        catch (error) {
            console.error('Error updating learning progress:', error);
        }
    }
    /**
     * Compare sources
     */
    async compareSources(sourceIds) {
        const cacheKey = `comparison_${sourceIds.join('_')}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
            return cached.data;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/user/compare-sources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceIds })
            });
            if (!response.ok)
                throw new Error('Failed to compare sources');
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: new Date() });
            return data;
        }
        catch (error) {
            console.error('Error comparing sources:', error);
            return this.generateFallbackComparison(sourceIds);
        }
    }
    /**
     * Record user activity
     */
    async recordActivity(userId, activity) {
        try {
            await fetch(`${this.API_BASE_URL}/api/user/activity/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activity)
            });
        }
        catch (error) {
            console.error('Error recording activity:', error);
        }
    }
    /**
     * Get user insights
     */
    async getUserInsights(userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/user/insights/${userId}`);
            if (!response.ok)
                throw new Error('Failed to fetch user insights');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching user insights:', error);
            return {
                readingPatterns: {},
                factCheckAccuracy: 0.5,
                sourceDiversity: 0.5,
                learningRecommendations: ['Consider diversifying your news sources.']
            };
        }
    }
    /**
     * Generate default user preferences
     */
    generateDefaultPreferences(userId) {
        return {
            userId,
            biasPreference: 'balanced',
            topicInterests: ['politics', 'technology', 'health', 'environment'],
            sourcePreferences: [],
            credibilityThreshold: 70,
            learningLevel: 'beginner',
            notificationSettings: {
                credibilityAlerts: true,
                factCheckUpdates: true,
                sourceRecommendations: true,
                learningReminders: true
            },
            readingHistory: [],
            factCheckHistory: []
        };
    }
    /**
     * Generate fallback recommendations
     */
    generateFallbackRecommendations() {
        return {
            recommendedSources: [
                {
                    sourceId: 'reuters',
                    sourceName: 'Reuters',
                    reason: 'High credibility and balanced reporting',
                    matchScore: 0.9,
                    category: 'international'
                },
                {
                    sourceId: 'bbc',
                    sourceName: 'BBC News',
                    reason: 'Reliable international news source',
                    matchScore: 0.85,
                    category: 'international'
                }
            ],
            recommendedTopics: [
                {
                    topic: 'Media Literacy',
                    reason: 'Improve your fact-checking skills',
                    relevance: 0.9,
                    sources: ['factcheck', 'snopes']
                }
            ],
            learningSuggestions: [
                {
                    type: 'tutorial',
                    title: 'How to Spot Misinformation',
                    description: 'Learn the basics of fact-checking',
                    difficulty: 'beginner',
                    estimatedTime: 15,
                    relevance: 0.9
                }
            ],
            factCheckSuggestions: []
        };
    }
    /**
     * Generate default learning progress
     */
    generateDefaultProgress(userId) {
        return {
            userId,
            overallProgress: 0,
            skills: {
                factChecking: 0,
                biasDetection: 0,
                sourceEvaluation: 0,
                criticalThinking: 0,
                mediaLiteracy: 0
            },
            achievements: [],
            currentStreak: 0,
            totalFactChecks: 0,
            accuracyImprovement: 0,
            learningPath: [
                {
                    step: 'Complete media literacy basics',
                    completed: false,
                    progress: 0
                },
                {
                    step: 'Learn fact-checking techniques',
                    completed: false,
                    progress: 0
                },
                {
                    step: 'Practice bias detection',
                    completed: false,
                    progress: 0
                }
            ]
        };
    }
    /**
     * Generate fallback source comparison
     */
    generateFallbackComparison(sourceIds) {
        return {
            sources: sourceIds.map(id => ({
                sourceId: id,
                sourceName: id,
                metrics: {
                    accuracy: 0.5,
                    bias: 0.5,
                    credibility: 0.5,
                    factCheckRate: 0.5
                },
                strengths: ['Limited data available'],
                weaknesses: ['Limited data available'],
                recommendations: ['More data needed for accurate assessment']
            })),
            comparison: {
                accuracyRange: [0.5, 0.5],
                biasDiversity: 0.5,
                credibilitySpread: 0.5,
                overallAssessment: 'Limited data available for comparison'
            },
            insights: ['More data needed for meaningful comparison'],
            recommendations: ['Consider adding more sources for better comparison']
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
export const userExperienceService = new UserExperienceService();
