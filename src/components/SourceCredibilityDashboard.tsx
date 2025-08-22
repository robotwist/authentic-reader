import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiShield, 
  FiAlertTriangle, 
  FiCheckCircle,
  FiBarChart2,
  FiTarget,
  FiUsers,
  FiGlobe,
  FiClock,
  FiStar,
  FiActivity,
  FiInfo
} from 'react-icons/fi';
import { sourceCredibilityService, SourceCredibility } from '../services/sourceCredibilityService';
import AnalysisTooltip from './AnalysisTooltip';
import '../styles/SourceCredibilityDashboard.css';

interface SourceCredibilityDashboardProps {
  sourceId?: string;
  onSourceSelect?: (sourceId: string) => void;
}

const SourceCredibilityDashboard: React.FC<SourceCredibilityDashboardProps> = ({ 
  sourceId, 
  onSourceSelect 
}) => {
  const [selectedSource, setSelectedSource] = useState<SourceCredibility | null>(null);
  const [trendingSources, setTrendingSources] = useState<{
    improving: Array<{ sourceId: string; sourceName: string; improvement: number }>;
    declining: Array<{ sourceId: string; sourceName: string; decline: number }>;
  }>({ improving: [], declining: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sourceId) {
      loadSourceCredibility(sourceId);
    }
    loadTrendingSources();
  }, [sourceId]);

  const loadSourceCredibility = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const credibility = await sourceCredibilityService.getSourceCredibility(id);
      setSelectedSource(credibility);
    } catch (err) {
      setError('Failed to load source credibility data');
      console.error('Error loading source credibility:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingSources = async () => {
    try {
      const trends = await sourceCredibilityService.getTrendingSources();
      setTrendingSources(trends);
    } catch (err) {
      console.error('Error loading trending sources:', err);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return '#10b981';
    if (accuracy >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getBiasColor = (bias: number) => {
    if (bias < -0.5) return '#dc2626'; // Far left
    if (bias < -0.1) return '#ef4444'; // Left
    if (bias > 0.5) return '#7c3aed'; // Far right
    if (bias > 0.1) return '#8b5cf6'; // Right
    return '#3b82f6'; // Center
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="source-credibility-dashboard">
        <div className="loading-state">
          <div className="loader-spinner"></div>
          <p>Loading source credibility data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="source-credibility-dashboard">
        <div className="error-state">
          <FiAlertTriangle className="error-icon" />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={() => sourceId && loadSourceCredibility(sourceId)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="source-credibility-dashboard">
      <div className="dashboard-header">
        <h2>
          <FiShield className="header-icon" />
          Source Credibility Analysis
        </h2>
        <p>Comprehensive analysis of news source reliability and accuracy</p>
      </div>

      {/* Trending Sources Section */}
      <div className="trending-sources-section">
        <h3>
          <FiTrendingUp className="section-icon" />
          Trending Sources
        </h3>
        
        <div className="trending-grid">
          <div className="trending-column">
            <h4>
              <FiTrendingUp className="trend-icon improving" />
              Improving Credibility
            </h4>
            {trendingSources.improving.length > 0 ? (
              <div className="trending-list">
                {trendingSources.improving.map((source, index) => (
                  <div key={source.sourceId} className="trending-item improving">
                    <div className="trending-info">
                      <span className="source-name">{source.sourceName}</span>
                      <span className="improvement">+{(source.improvement * 100).toFixed(1)}%</span>
                    </div>
                    <div className="trending-bar">
                      <div 
                        className="trending-fill improving"
                        style={{ width: `${Math.min(source.improvement * 500, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No sources showing significant improvement</p>
            )}
          </div>

          <div className="trending-column">
            <h4>
              <FiTrendingDown className="trend-icon declining" />
              Declining Credibility
            </h4>
            {trendingSources.declining.length > 0 ? (
              <div className="trending-list">
                {trendingSources.declining.map((source, index) => (
                  <div key={source.sourceId} className="trending-item declining">
                    <div className="trending-info">
                      <span className="source-name">{source.sourceName}</span>
                      <span className="decline">-{(source.decline * 100).toFixed(1)}%</span>
                    </div>
                    <div className="trending-bar">
                      <div 
                        className="trending-fill declining"
                        style={{ width: `${Math.min(source.decline * 500, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No sources showing significant decline</p>
            )}
          </div>
        </div>
      </div>

      {/* Selected Source Analysis */}
      {selectedSource && (
        <div className="source-analysis-section">
          <h3>
            <FiTarget className="section-icon" />
            {selectedSource.sourceName} - Credibility Analysis
          </h3>

          <div className="analysis-grid">
            {/* Historical Accuracy */}
            <div className="analysis-card">
              <div className="card-header">
                <FiBarChart2 className="card-icon" />
                <h4>Historical Accuracy</h4>
              </div>
              
              <div className="accuracy-metrics">
                <div className="metric-item">
                  <span className="metric-label">Overall Accuracy</span>
                  <span 
                    className="metric-value"
                    style={{ color: getAccuracyColor(selectedSource.historicalAccuracy.overall) }}
                  >
                    {formatPercentage(selectedSource.historicalAccuracy.overall)}
                  </span>
                </div>
                
                <div className="timeframe-accuracy">
                  <div className="timeframe-item">
                    <span>30 Days</span>
                    <span>{formatPercentage(selectedSource.historicalAccuracy.byTimeframe.last30Days)}</span>
                  </div>
                  <div className="timeframe-item">
                    <span>90 Days</span>
                    <span>{formatPercentage(selectedSource.historicalAccuracy.byTimeframe.last90Days)}</span>
                  </div>
                  <div className="timeframe-item">
                    <span>1 Year</span>
                    <span>{formatPercentage(selectedSource.historicalAccuracy.byTimeframe.lastYear)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Reputation */}
            <div className="analysis-card">
              <div className="card-header">
                <FiStar className="card-icon" />
                <h4>Source Reputation</h4>
              </div>
              
              <div className="reputation-metrics">
                <div className="metric-item">
                  <span className="metric-label">Trust Score</span>
                  <span 
                    className="metric-value"
                    style={{ color: getTrustScoreColor(selectedSource.sourceReputation.trustScore) }}
                  >
                    {selectedSource.sourceReputation.trustScore}/100
                  </span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Reliability Level</span>
                  <span className={`reliability-badge ${selectedSource.sourceReputation.reliabilityLevel}`}>
                    {selectedSource.sourceReputation.reliabilityLevel}
                  </span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Verification Speed</span>
                  <span>{formatPercentage(selectedSource.sourceReputation.verificationSpeed)}</span>
                </div>
              </div>
            </div>

            {/* Bias Analysis */}
            <div className="analysis-card">
              <div className="card-header">
                <FiTarget className="card-icon" />
                <h4>Bias Analysis</h4>
              </div>
              
              <div className="bias-metrics">
                <div className="metric-item">
                  <span className="metric-label">Political Bias</span>
                  <span 
                    className="metric-value"
                    style={{ color: getBiasColor(selectedSource.biasAnalysis.politicalBias) }}
                  >
                    {selectedSource.biasAnalysis.politicalBias > 0.3 ? 'Right' :
                     selectedSource.biasAnalysis.politicalBias < -0.3 ? 'Left' : 'Center'}
                  </span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Bias Consistency</span>
                  <span>{formatPercentage(selectedSource.biasAnalysis.biasConsistency)}</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Bias Trend</span>
                  <span className={`trend-badge ${selectedSource.biasAnalysis.biasTrend}`}>
                    {selectedSource.biasAnalysis.biasTrend}
                  </span>
                </div>
              </div>
            </div>

            {/* Fact Check Record */}
            <div className="analysis-card">
              <div className="card-header">
                <FiCheckCircle className="card-icon" />
                <h4>Fact Check Record</h4>
              </div>
              
              <div className="fact-check-metrics">
                <div className="metric-item">
                  <span className="metric-label">Total Checks</span>
                  <span>{selectedSource.factCheckRecord.totalChecks}</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Verified Claims</span>
                  <span className="verified">{selectedSource.factCheckRecord.verified}</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Disputed Claims</span>
                  <span className="disputed">{selectedSource.factCheckRecord.disputed}</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">False Claims</span>
                  <span className="false">{selectedSource.factCheckRecord.false}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations-section">
            <h4>
              <FiInfo className="section-icon" />
              Analysis & Recommendations
            </h4>
            
            <div className="recommendations-content">
              <div className="overall-assessment">
                <p className="assessment-text">{selectedSource.recommendations.overall}</p>
              </div>
              
              <div className="recommendations-grid">
                {selectedSource.recommendations.strengths.length > 0 && (
                  <div className="recommendation-group strengths">
                    <h5>Strengths</h5>
                    <ul>
                      {selectedSource.recommendations.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedSource.recommendations.weaknesses.length > 0 && (
                  <div className="recommendation-group weaknesses">
                    <h5>Areas of Concern</h5>
                    <ul>
                      {selectedSource.recommendations.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedSource.recommendations.improvementSuggestions.length > 0 && (
                  <div className="recommendation-group suggestions">
                    <h5>Improvement Suggestions</h5>
                    <ul>
                      {selectedSource.recommendations.improvementSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source Selection */}
      {!selectedSource && (
        <div className="source-selection-section">
          <h3>
            <FiUsers className="section-icon" />
            Select a Source for Analysis
          </h3>
          <p>Choose a news source from the trending lists above or enter a source ID to analyze its credibility.</p>
        </div>
      )}
    </div>
  );
};

export default SourceCredibilityDashboard;
