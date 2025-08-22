/**
 * User Experience Service
 * Personalized recommendations, credibility alerts, learning progress, and source comparison tools
 */

interface UserPreferences {
  userId: string;
  biasPreference: 'balanced' | 'left' | 'right' | 'center' | 'diverse';
  topicInterests: string[];
  sourcePreferences: string[];
  credibilityThreshold: number; // 0-100
  learningLevel: 'beginner' | 'intermediate' | 'advanced';
  notificationSettings: {
    credibilityAlerts: boolean;
    factCheckUpdates: boolean;
    sourceRecommendations: boolean;
    learningReminders: boolean;
  };
  readingHistory: Array<{
    articleId: string;
    sourceId: string;
    timestamp: string;
    timeSpent: number;
    factChecked: boolean;
  }>;
  factCheckHistory: Array<{
    claim: string;
    result: 'verified' | 'disputed' | 'false' | 'misleading';
    timestamp: string;
    confidence: number;
  }>;
}

interface PersonalizedRecommendations {
  recommendedSources: Array<{
    sourceId: string;
    sourceName: string;
    reason: string;
    matchScore: number;
    category: string;
  }>;
  recommendedTopics: Array<{
    topic: string;
    reason: string;
    relevance: number;
    sources: string[];
  }>;
  learningSuggestions: Array<{
    type: 'article' | 'exercise' | 'tutorial' | 'quiz';
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
    relevance: number;
  }>;
  factCheckSuggestions: Array<{
    claim: string;
    source: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
}

interface CredibilityAlert {
  id: string;
  type: 'source_decline' | 'fact_check_update' | 'echo_chamber' | 'bias_detection';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceId?: string;
  articleId?: string;
  claim?: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  actions: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

interface LearningProgress {
  userId: string;
  overallProgress: number; // 0-100
  skills: {
    factChecking: number;
    biasDetection: number;
    sourceEvaluation: number;
    criticalThinking: number;
    mediaLiteracy: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earnedAt: string;
    icon: string;
  }>;
  currentStreak: number;
  totalFactChecks: number;
  accuracyImprovement: number;
  learningPath: Array<{
    step: string;
    completed: boolean;
    progress: number;
    nextStep?: string;
  }>;
}

interface SourceComparison {
  sources: Array<{
    sourceId: string;
    sourceName: string;
    metrics: {
      accuracy: number;
      bias: number;
      credibility: number;
      factCheckRate: number;
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }>;
  comparison: {
    accuracyRange: [number, number];
    biasDiversity: number;
    credibilitySpread: number;
    overallAssessment: string;
  };
  insights: string[];
  recommendations: string[];
}

class UserExperienceService {
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  private readonly cache = new Map<string, any>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const cacheKey = `preferences_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/user/preferences/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user preferences');
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: new Date() });
      
      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return this.generateDefaultPreferences(userId);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/api/user/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      // Clear cache for this user
      this.cache.delete(`preferences_${userId}`);
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendations> {
    const cacheKey = `recommendations_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/user/recommendations/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: new Date() });
      
      return data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return this.generateFallbackRecommendations();
    }
  }

  /**
   * Get credibility alerts
   */
  async getCredibilityAlerts(userId: string): Promise<CredibilityAlert[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/user/alerts/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch credibility alerts');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching credibility alerts:', error);
      return [];
    }
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(userId: string, alertId: string): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/api/user/alerts/${userId}/${alertId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }

  /**
   * Get learning progress
   */
  async getLearningProgress(userId: string): Promise<LearningProgress> {
    const cacheKey = `progress_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/user/progress/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch learning progress');
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: new Date() });
      
      return data;
    } catch (error) {
      console.error('Error fetching learning progress:', error);
      return this.generateDefaultProgress(userId);
    }
  }

  /**
   * Update learning progress
   */
  async updateLearningProgress(userId: string, progress: Partial<LearningProgress>): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/api/user/progress/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
      
      // Clear cache for this user
      this.cache.delete(`progress_${userId}`);
    } catch (error) {
      console.error('Error updating learning progress:', error);
    }
  }

  /**
   * Compare sources
   */
  async compareSources(sourceIds: string[]): Promise<SourceComparison> {
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
      
      if (!response.ok) throw new Error('Failed to compare sources');
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: new Date() });
      
      return data;
    } catch (error) {
      console.error('Error comparing sources:', error);
      return this.generateFallbackComparison(sourceIds);
    }
  }

  /**
   * Record user activity
   */
  async recordActivity(userId: string, activity: {
    type: 'article_read' | 'fact_check' | 'source_visit' | 'learning_completed';
    data: any;
    timestamp: string;
  }): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/api/user/activity/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }

  /**
   * Get user insights
   */
  async getUserInsights(userId: string): Promise<{
    readingPatterns: any;
    factCheckAccuracy: number;
    sourceDiversity: number;
    learningRecommendations: string[];
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/user/insights/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user insights');
      
      return await response.json();
    } catch (error) {
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
  private generateDefaultPreferences(userId: string): UserPreferences {
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
  private generateFallbackRecommendations(): PersonalizedRecommendations {
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
  private generateDefaultProgress(userId: string): LearningProgress {
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
  private generateFallbackComparison(sourceIds: string[]): SourceComparison {
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
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const userExperienceService = new UserExperienceService();
export type { 
  UserPreferences, 
  PersonalizedRecommendations, 
  CredibilityAlert, 
  LearningProgress, 
  SourceComparison 
};
