import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiInfo, 
  FiTarget,
  FiShield,
  FiTrendingUp,
  FiActivity,
  FiX,
  FiEye,
  FiBarChart,
  FiAward,
  FiClock
} from 'react-icons/fi';
import { Article } from '../types/Article';
import comprehensiveAnalysisService, { ComprehensiveAnalysisResult } from '../services/comprehensiveAnalysisService';
import '../styles/EnhancedArticleAnalysis.css';

interface EnhancedArticleAnalysisProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedArticleAnalysis: React.FC<EnhancedArticleAnalysisProps> = ({
  article,
  isOpen,
  onClose
}) => {
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fallacies' | 'bias' | 'credibility' | 'readability'>('overview');

  const performAnalysisCallback = React.useCallback(async () => {
    if (!article.title && !article.content && !article.summary) {
      setError('No content available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🚀 Starting comprehensive article analysis...');
      
      const comprehensiveResult = await comprehensiveAnalysisService.analyzeArticle(article, {
        includeAI: true,
        includeFallacies: true,
        includeBias: true,
        includeCredibility: true,
        includeReadability: true,
        includeFactChecking: true
      });
      
      setAnalysis(comprehensiveResult);
      console.log('✅ Analysis complete:', comprehensiveResult);
      
      // Debug: Check for potential object rendering issues
      console.log('🔍 Analysis structure check:');
      console.log('- logicalFallacies:', typeof comprehensiveResult.logicalFallacies);
      console.log('- biasAnalysis:', typeof comprehensiveResult.biasAnalysis);
      console.log('- credibility:', typeof comprehensiveResult.credibility);
      console.log('- readability:', typeof comprehensiveResult.readability);
    } catch (err) {
      console.error('❌ Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [article]);

  useEffect(() => {
    if (isOpen && article && !analysis) {
      performAnalysisCallback();
    }
  }, [isOpen, article, analysis, performAnalysisCallback]);

  // Helper functions for UI display
  const getBiasLevelText = (score: number): string => {
    if (score < 30) return 'Very Low';
    if (score < 50) return 'Low';
    if (score < 70) return 'Moderate';
    if (score < 90) return 'High';
    return 'Very High';
  };

  const getBiasLevelColor = (score: number): string => {
    if (score < 30) return '#28a745';
    if (score < 50) return '#5cb85c';
    if (score < 70) return '#ffc107';
    if (score < 90) return '#fd7e14';
    return '#dc3545';
  };

  const getEmotionColor = (emotion: string): string => {
    const colors: { [key: string]: string } = {
      fear: '#ff6b6b',
      anger: '#ff4757',
      hope: '#2ed573',
      disgust: '#a55eea',
      sadness: '#5352ed',
      joy: '#ffa726'
    };
    return colors[emotion] || '#6c757d';
  };

  if (!isOpen) return null;

  return (
    <div className="enhanced-article-analysis-overlay">
      <div className="enhanced-article-analysis-modal">
        <div className="analysis-header">
          <div className="header-content">
            <h2>
              <FiShield className="header-icon" />
              Advanced Article Analysis
            </h2>
            <p>Comprehensive analysis of "{article.title}"</p>
          </div>
          <button onClick={onClose} className="close-button">
            <FiX />
          </button>
        </div>

        {isAnalyzing && (
          <div className="loading-section">
            <FiActivity className="spinner" />
            <h3>Analyzing Article...</h3>
            <p>Running comprehensive analysis including bias detection, logical fallacies, and credibility assessment...</p>
          </div>
        )}

        {error && (
          <div className="error-section">
            <FiAlertTriangle className="error-icon" />
            <h3>Analysis Error</h3>
            <p>{error}</p>
          </div>
        )}

        {analysis && analysis.logicalFallacies && analysis.biasAnalysis && analysis.credibility && analysis.readability && (
          <div className="analysis-content">
            <div className="analysis-tabs">
              <button 
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <FiInfo className="tab-icon" />
                Overview
              </button>
              <button 
                className={`tab-button ${activeTab === 'fallacies' ? 'active' : ''}`}
                onClick={() => setActiveTab('fallacies')}
              >
                <FiAlertTriangle className="tab-icon" />
                Fallacies ({analysis.logicalFallacies?.fallacies?.length || 0})
              </button>
              <button 
                className={`tab-button ${activeTab === 'bias' ? 'active' : ''}`}
                onClick={() => setActiveTab('bias')}
              >
                <FiTarget className="tab-icon" />
                Bias Analysis
              </button>
              <button 
                className={`tab-button ${activeTab === 'credibility' ? 'active' : ''}`}
                onClick={() => setActiveTab('credibility')}
              >
                <FiShield className="tab-icon" />
                Credibility ({Math.round(analysis.credibility?.score || 0)})
              </button>
              <button 
                className={`tab-button ${activeTab === 'readability' ? 'active' : ''}`}
                onClick={() => setActiveTab('readability')}
              >
                <FiEye className="tab-icon" />
                Readability
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  <div className="quality-score-section">
                    <div className="quality-score-header">
                      <FiAward className="section-icon" />
                      <h3>Overall Quality Assessment</h3>
                    </div>
                    <div className="quality-score-display">
                      <div className={`grade-badge grade-${(analysis.overallQuality?.grade || 'c').toLowerCase()}`}>
                        {analysis.overallQuality?.grade || 'C'}
                      </div>
                      <div className="quality-details">
                        <div className="quality-score">{analysis.overallQuality?.score || 0}/100</div>
                        <div className="quality-summary">{typeof analysis.overallQuality?.summary === 'string' ? analysis.overallQuality.summary : 'No summary available'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="quick-summary">
                    <div className="summary-header">
                      <FiBarChart className="summary-icon" />
                      <h3>Key Metrics</h3>
                    </div>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="label">Bias Level:</span>
                        <span 
                          className="value" 
                          style={{ color: getBiasLevelColor(analysis.biasAnalysis?.scores?.overall || 0) }}
                        >
                          {getBiasLevelText(analysis.biasAnalysis?.scores?.overall || 0)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Credibility:</span>
                        <span 
                          className="value" 
                          style={{ color: (analysis.credibility?.score || 0) > 70 ? '#28a745' : (analysis.credibility?.score || 0) > 50 ? '#ffc107' : '#dc3545' }}
                        >
                          {Math.round(analysis.credibility?.score || 0)}/100
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Logical Issues:</span>
                        <span className="value">{analysis.logicalFallacies?.fallacies?.length || 0}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Reading Level:</span>
                        <span className="value">Grade {analysis.readability?.gradeLevel || 'N/A'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Reading Time:</span>
                        <span className="value">{analysis.readability?.readingTime || 0} min</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Claims Detected:</span>
                        <span className="value">{analysis.factChecking?.claimsDetected || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="recommendations-section">
                    <div className="recommendations-header">
                      <FiTrendingUp className="section-icon" />
                      <h3>Key Recommendations</h3>
                    </div>
                    <div className="recommendations-content">
                      {analysis.recommendations?.forReaders && analysis.recommendations.forReaders.length > 0 && (
                        <div className="recommendation-category">
                          <h4>For Readers:</h4>
                          <ul>
                            {analysis.recommendations.forReaders.slice(0, 3).map((rec, index) => (
                              <li key={index}>{typeof rec === 'string' ? rec : 'Recommendation item'}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'fallacies' && (
                <div className="fallacies-tab">
                  <div className="analysis-section">
                    <div className="section-header">
                      <FiAlertTriangle className="section-icon" />
                      <h3>Logical Fallacies Analysis</h3>
                      <div className="fallacy-score">
                        Score: {analysis.logicalFallacies?.overallScore || 0}/100
                      </div>
                    </div>
                    
                    {(analysis.logicalFallacies?.fallacies?.length || 0) > 0 ? (
                      <div className="fallacies-list">
                        {(analysis.logicalFallacies?.fallacies || []).map((fallacy, index) => (
                          <div key={index} className={`fallacy-item severity-${fallacy.severity}`}>
                            <div className="fallacy-header">
                              <span className="fallacy-name">{fallacy.name}</span>
                              <div className="fallacy-meta">
                                <span className={`severity-badge severity-${fallacy.severity}`}>
                                  {fallacy.severity}
                                </span>
                                <span className="confidence-badge">
                                  {Math.round(fallacy.confidence * 100)}% confidence
                                </span>
                              </div>
                            </div>
                            <p className="fallacy-description">{fallacy.description || 'No description available'}</p>
                            <div className="fallacy-explanation">
                              <strong>Why this matters:</strong> {fallacy.explanation || 'No explanation available'}
                            </div>
                            {fallacy.examples && fallacy.examples.length > 0 && (
                              <div className="fallacy-examples">
                                <strong>Examples found:</strong>
                                <ul>
                                  {fallacy.examples.map((example, i) => (
                                    <li key={i}>{typeof example === 'string' ? example : JSON.stringify(example)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {fallacy.counterargument && (
                              <div className="counterargument">
                                <strong>Counter-approach:</strong> {typeof fallacy.counterargument === 'string' ? fallacy.counterargument : 'No counter-approach available'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-fallacies">
                        <FiCheckCircle className="success-icon" />
                        <p>No significant logical fallacies detected. The argumentation appears sound.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'bias' && (
                <div className="bias-tab">
                  <div className="analysis-section">
                    <div className="section-header">
                      <FiTarget className="section-icon" />
                      <h3>Multi-Dimensional Bias Analysis</h3>
                      <div className="neutrality-score">
                        Neutrality: {analysis.biasAnalysis?.summary?.neutralityScore || 0}/100
                      </div>
                    </div>

                    <div className="bias-dimension">
                      <h4>Political Bias</h4>
                      <div className="political-bias-display">
                        <div className="bias-spectrum">
                          <span className="spectrum-label left">Left</span>
                          <div className="spectrum-bar">
                            <div 
                              className="spectrum-indicator"
                              style={{ left: `${analysis.biasAnalysis?.scores?.political?.leftRight || 50}%` }}
                            ></div>
                          </div>
                          <span className="spectrum-label right">Right</span>
                        </div>
                        <div className="bias-confidence">
                          Confidence: {Math.round((analysis.biasAnalysis?.scores?.political?.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="bias-dimension">
                      <h4>Emotional Bias</h4>
                      <div className="emotional-bias-grid">
                        {Object.entries(analysis.biasAnalysis.scores.emotional || {}).map(([emotion, score]) => {
                          if (emotion === 'overall') return null;
                          const numericScore = typeof score === 'number' ? score : 0;
                          return (
                            <div key={emotion} className="emotion-item">
                              <span className="emotion-label">{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
                              <div className="emotion-bar">
                                <div 
                                  className="emotion-fill"
                                  style={{ 
                                    width: `${numericScore}%`,
                                    backgroundColor: getEmotionColor(emotion)
                                  }}
                                ></div>
                              </div>
                              <span className="emotion-score">{Math.round(numericScore)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'credibility' && (
                <div className="credibility-tab">
                  <div className="analysis-section">
                    <div className="section-header">
                      <FiShield className="section-icon" />
                      <h3>Credibility Assessment</h3>
                      <div className="credibility-score-display">
                        <div className={`credibility-score ${(analysis.credibility?.score || 0) > 70 ? 'high' : (analysis.credibility?.score || 0) > 50 ? 'medium' : 'low'}`}>
                          {Math.round(analysis.credibility?.score || 0)}/100
                        </div>
                      </div>
                    </div>

                    <div className="credibility-factors">
                      <h4>Assessment Factors</h4>
                      <div className="factors-grid">
                        {Object.entries(analysis.credibility.factors || {}).map(([factor, score]) => {
                          const numericScore = typeof score === 'number' ? score : 0;
                          return (
                            <div key={factor} className="factor-item">
                              <span className="factor-label">
                                {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              <div className="factor-bar">
                                <div 
                                  className="factor-fill"
                                  style={{ 
                                    width: `${numericScore}%`,
                                    backgroundColor: numericScore > 70 ? '#28a745' : numericScore > 50 ? '#ffc107' : '#dc3545'
                                  }}
                                ></div>
                              </div>
                              <span className="factor-score">{Math.round(numericScore)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {analysis.credibility.strengths && analysis.credibility.strengths.length > 0 && (
                      <div className="credibility-strengths">
                        <h4>Strengths</h4>
                        <ul>
                          {analysis.credibility.strengths.map((strength, index) => (
                            <li key={index} className="strength-item">
                              <FiCheckCircle className="strength-icon" />
                              {typeof strength === 'string' ? strength : 'Assessment item'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.credibility.warnings && analysis.credibility.warnings.length > 0 && (
                      <div className="credibility-warnings">
                        <h4>Concerns</h4>
                        <ul>
                          {analysis.credibility.warnings.map((warning, index) => (
                            <li key={index} className="warning-item">
                              <FiAlertTriangle className="warning-icon" />
                              {typeof warning === 'string' ? warning : 'Assessment item'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'readability' && (
                <div className="readability-tab">
                  <div className="analysis-section">
                    <div className="section-header">
                      <FiEye className="section-icon" />
                      <h3>Readability Analysis</h3>
                      <div className="reading-time">
                        <FiClock className="time-icon" />
                        {analysis.readability?.readingTime || 0} min read
                      </div>
                    </div>

                    <div className="readability-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Grade Level</span>
                        <span className="metric-value">{analysis.readability?.gradeLevel || 'N/A'}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Complexity</span>
                        <span className={`metric-value complexity-${analysis.readability?.complexity || 'moderate'}`}>
                          {(analysis.readability?.complexity || 'moderate').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Word Count</span>
                        <span className="metric-value">{(analysis.readability?.wordCount || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="fact-checking-section">
                      <h4>Fact-Checking Indicators</h4>
                      <div className="fact-check-metrics">
                        <div className="fact-metric">
                          <span className="metric-label">Claims Detected</span>
                          <span className="metric-value">{analysis.factChecking?.claimsDetected || 0}</span>
                        </div>
                        <div className="fact-metric">
                          <span className="metric-label">External Links</span>
                          <span className="metric-value">{analysis.factChecking?.externalLinksCount || 0}</span>
                        </div>
                        <div className="fact-metric">
                          <span className="metric-label">Sources Provided</span>
                          <span className={`metric-value ${analysis.factChecking?.sourcesProvided ? 'positive' : 'negative'}`}>
                            {analysis.factChecking?.sourcesProvided ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedArticleAnalysis;