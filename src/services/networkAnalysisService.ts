/**
 * Network Analysis Service
 * Advanced source relationship mapping, citation networks, and echo chamber detection
 */

interface SourceRelationship {
  sourceId: string;
  sourceName: string;
  relatedSources: Array<{
    sourceId: string;
    sourceName: string;
    relationshipType: 'citation' | 'shared_topic' | 'bias_similarity' | 'fact_check_overlap';
    strength: number; // 0-1
    evidence: string[];
  }>;
  influenceMetrics: {
    reach: number; // How many other sources cite this one
    authority: number; // How often this source is cited by high-authority sources
    credibility: number; // Weighted credibility score
    centrality: number; // Position in the information network
  };
  networkPosition: {
    cluster: string; // Which information cluster this source belongs to
    bridgeSources: string[]; // Sources that connect different clusters
    isolatedSources: string[]; // Sources with minimal connections
  };
}

interface CitationNetwork {
  nodes: Array<{
    id: string;
    name: string;
    type: 'source' | 'article' | 'claim';
    size: number; // Based on influence/importance
    color: string; // Based on bias or credibility
    cluster: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'cites' | 'shared_topic' | 'similar_bias' | 'fact_check';
    weight: number;
    evidence: string[];
  }>;
  clusters: Array<{
    id: string;
    name: string;
    sources: string[];
    biasProfile: {
      averageBias: number;
      biasDiversity: number;
      dominantBias: string;
    };
    credibilityProfile: {
      averageCredibility: number;
      credibilityRange: [number, number];
      highCredibilityCount: number;
    };
  }>;
}

interface EchoChamberAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sources: string[];
  characteristics: {
    biasHomogeneity: number; // How similar the biases are
    citationInsularity: number; // How much they only cite each other
    topicOverlap: number; // How much they cover the same topics
    factCheckAgreement: number; // How often they agree on fact checks
  };
  recommendations: string[];
  mitigationStrategies: string[];
}

interface InformationFlow {
  sourceId: string;
  flowMetrics: {
    informationVelocity: number; // How quickly information spreads
    amplificationFactor: number; // How much this source amplifies information
    verificationDelay: number; // Time between claim and verification
    correctionRate: number; // How often corrections are made
  };
  propagationPatterns: {
    primarySources: string[]; // Sources this one primarily cites
    secondarySources: string[]; // Sources that cite this one
    amplificationSources: string[]; // Sources that amplify this one's claims
    verificationSources: string[]; // Sources that verify this one's claims
  };
}

class NetworkAnalysisService {
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  private readonly cache = new Map<string, any>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Analyze source relationships and network position
   */
  async analyzeSourceRelationships(sourceId: string): Promise<SourceRelationship> {
    const cacheKey = `relationships_${sourceId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/network/relationships/${sourceId}`);
      if (!response.ok) throw new Error('Failed to fetch source relationships');
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: new Date() });
      
      return data;
    } catch (error) {
      console.error('Error analyzing source relationships:', error);
      return this.generateFallbackRelationships(sourceId);
    }
  }

  /**
   * Generate comprehensive citation network
   */
  async generateCitationNetwork(sourceIds?: string[]): Promise<CitationNetwork> {
    const cacheKey = `citation_network_${sourceIds?.join('_') || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const url = sourceIds 
        ? `${this.API_BASE_URL}/api/network/citation?sourceIds=${sourceIds.join(',')}`
        : `${this.API_BASE_URL}/api/network/citation`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to generate citation network');
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: new Date() });
      
      return data;
    } catch (error) {
      console.error('Error generating citation network:', error);
      return this.generateFallbackCitationNetwork(sourceIds);
    }
  }

  /**
   * Detect echo chambers in the network
   */
  async detectEchoChambers(sourceIds?: string[]): Promise<EchoChamberAnalysis[]> {
    try {
      const url = sourceIds 
        ? `${this.API_BASE_URL}/api/network/echo-chambers?sourceIds=${sourceIds.join(',')}`
        : `${this.API_BASE_URL}/api/network/echo-chambers`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to detect echo chambers');
      
      return await response.json();
    } catch (error) {
      console.error('Error detecting echo chambers:', error);
      return [];
    }
  }

  /**
   * Analyze information flow patterns
   */
  async analyzeInformationFlow(sourceId: string): Promise<InformationFlow> {
    const cacheKey = `information_flow_${sourceId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/network/information-flow/${sourceId}`);
      if (!response.ok) throw new Error('Failed to analyze information flow');
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: new Date() });
      
      return data;
    } catch (error) {
      console.error('Error analyzing information flow:', error);
      return this.generateFallbackInformationFlow(sourceId);
    }
  }

  /**
   * Get network insights and recommendations
   */
  async getNetworkInsights(sourceIds: string[]): Promise<{
    insights: string[];
    recommendations: string[];
    riskFactors: string[];
    opportunities: string[];
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/network/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds })
      });
      
      if (!response.ok) throw new Error('Failed to get network insights');
      
      return await response.json();
    } catch (error) {
      console.error('Error getting network insights:', error);
      return {
        insights: ['Unable to analyze network at this time.'],
        recommendations: ['Consider diversifying your news sources.'],
        riskFactors: ['Limited network analysis available.'],
        opportunities: ['Expand your source selection for better coverage.']
      };
    }
  }

  /**
   * Compare network positions of multiple sources
   */
  async compareNetworkPositions(sourceIds: string[]): Promise<{
    comparison: Array<{
      sourceId: string;
      sourceName: string;
      networkMetrics: {
        centrality: number;
        influence: number;
        diversity: number;
        isolation: number;
      };
      position: 'central' | 'peripheral' | 'bridge' | 'isolated';
    }>;
    insights: string[];
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/network/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds })
      });
      
      if (!response.ok) throw new Error('Failed to compare network positions');
      
      return await response.json();
    } catch (error) {
      console.error('Error comparing network positions:', error);
      return { comparison: [], insights: ['Unable to compare network positions.'] };
    }
  }

  /**
   * Generate fallback relationships data
   */
  private generateFallbackRelationships(sourceId: string): SourceRelationship {
    return {
      sourceId,
      sourceName: sourceId,
      relatedSources: [],
      influenceMetrics: {
        reach: 0.5,
        authority: 0.5,
        credibility: 0.5,
        centrality: 0.5
      },
      networkPosition: {
        cluster: 'unknown',
        bridgeSources: [],
        isolatedSources: []
      }
    };
  }

  /**
   * Generate fallback citation network
   */
  private generateFallbackCitationNetwork(sourceIds?: string[]): CitationNetwork {
    return {
      nodes: sourceIds?.map(id => ({
        id,
        name: id,
        type: 'source',
        size: 1,
        color: '#3b82f6',
        cluster: 'default'
      })) || [],
      edges: [],
      clusters: []
    };
  }

  /**
   * Generate fallback information flow
   */
  private generateFallbackInformationFlow(sourceId: string): InformationFlow {
    return {
      sourceId,
      flowMetrics: {
        informationVelocity: 0.5,
        amplificationFactor: 1.0,
        verificationDelay: 0.5,
        correctionRate: 0.5
      },
      propagationPatterns: {
        primarySources: [],
        secondarySources: [],
        amplificationSources: [],
        verificationSources: []
      }
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
export const networkAnalysisService = new NetworkAnalysisService();
export type { 
  SourceRelationship, 
  CitationNetwork, 
  EchoChamberAnalysis, 
  InformationFlow 
};
