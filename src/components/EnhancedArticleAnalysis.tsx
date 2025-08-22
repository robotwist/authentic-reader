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
  FiBookOpen
} from 'react-icons/fi';
import { Article } from '../types/Article';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/EnhancedArticleAnalysis.css';

interface AnalysisResult {
  bias: {
    political: number;
    emotional: number;
    cognitive: number;
    overall: number;
  };
  logicalFallacies: Array<{
    type: string;
    description: string;
    examples: string[];
    severity: 'low' | 'medium' | 'high';
  }>;
  rhetoricalDevices: Array<{
    type: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    examples: string[];
  }>;
  credibility: {
    score: number;
    factors: string[];
    warnings: string[];
  };
  summary: {
    keyPoints: string[];
    biasSummary: string;
    recommendations: string[];
  };
}

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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { analyzeBias, serviceStatus } = useLlamaAnalysis();

  useEffect(() => {
    if (isOpen && article && !analysis) {
      performAnalysis();
    }
  }, [isOpen, article]);

  const performAnalysis = async () => {
    if (!article.content && !article.description) {
      setError('No content available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Get the text content for analysis
      const textContent = article.content || article.description || article.title;
      
      // Perform bias analysis
      const biasResult = await analyzeBias(textContent);
      
      if (biasResult) {
        // Generate comprehensive analysis
        const comprehensiveAnalysis = await generateComprehensiveAnalysis(textContent, biasResult);
        setAnalysis(comprehensiveAnalysis);
      } else {
        setError('Failed to analyze bias');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateComprehensiveAnalysis = async (text: string, biasResult: any): Promise<AnalysisResult> => {
    // This would ideally call a more comprehensive AI analysis endpoint
    // For now, we'll create a sophisticated analysis based on the bias results
    
    const politicalBias = biasResult.political_bias || 5;
    const emotionalBias = biasResult.emotional_bias || 5;
    const cognitiveBias = biasResult.cognitive_bias || 5;
    const overallBias = (politicalBias + emotionalBias + cognitiveBias) / 3;

    // Generate logical fallacies based on bias patterns
    const logicalFallacies = generateLogicalFallacies(text, biasResult);
    
    // Generate rhetorical analysis
    const rhetoricalDevices = generateRhetoricalAnalysis(text, biasResult);
    
    // Generate credibility assessment
    const credibility = generateCredibilityAssessment(article, biasResult);
    
    // Generate summary and recommendations
    const summary = generateSummaryAndRecommendations(biasResult, logicalFallacies, credibility);

    return {
      bias: {
        political: politicalBias,
        emotional: emotionalBias,
        cognitive: cognitiveBias,
        overall: overallBias
      },
      logicalFallacies,
      rhetoricalDevices,
      credibility,
      summary
    };
  };

  const generateLogicalFallacies = (text: string, biasResult: any) => {
    const fallacies = [];
    
    // Analyze for common logical fallacies based on bias patterns
    if (biasResult.emotional_bias > 6) {
      fallacies.push({
        type: 'Appeal to Emotion',
        description: 'Uses emotional language to manipulate rather than reason',
        examples: ['Fear-mongering language', 'Emotional appeals without evidence'],
        severity: 'high' as const
      });
    }
    
    if (biasResult.political_bias > 7) {
      fallacies.push({
        type: 'Ad Hominem',
        description: 'Attacks the person rather than the argument',
        examples: ['Personal attacks', 'Character assassination'],
        severity: 'high' as const
      });
    }
    
    if (biasResult.cognitive_bias > 5) {
      fallacies.push({
        type: 'Confirmation Bias',
        description: 'Selectively presents information that confirms preexisting beliefs',
        examples: ['Cherry-picked facts', 'One-sided evidence'],
        severity: 'medium' as const
      });
    }
    
    // Add more fallacy detection based on text patterns
    const textLower = text.toLowerCase();
    
    if (textLower.includes('everyone knows') || textLower.includes('obviously')) {
      fallacies.push({
        type: 'Appeal to Common Belief',
        description: 'Assumes something is true because many people believe it',
        examples: ['"Everyone knows..."', '"Obviously..."'],
        severity: 'medium' as const
      });
    }
    
    if (textLower.includes('slippery slope') || textLower.includes('domino effect')) {
      fallacies.push({
        type: 'Slippery Slope',
        description: 'Assumes one action will inevitably lead to extreme consequences',
        examples: ['"This will lead to..."', 'Chain reaction predictions'],
        severity: 'medium' as const
      });
    }

    return fallacies;
  };

  const generateRhetoricalAnalysis = (text: string, biasResult: any) => {
    const devices = [];
    const textLower = text.toLowerCase();
    
    // Analyze rhetorical devices
    if (biasResult.emotional_bias > 5) {
      devices.push({
        type: 'Loaded Language',
        description: 'Uses emotionally charged words to influence perception',
        impact: 'negative' as const,
        examples: ['Emotional adjectives', 'Polarizing terms']
      });
    }
    
    if (textLower.includes('?')) {
      devices.push({
        type: 'Rhetorical Questions',
        description: 'Questions asked for effect rather than to get answers',
        impact: 'neutral' as const,
        examples: ['Leading questions', 'Implied answers']
      });
    }
    
    if (biasResult.political_bias > 6) {
      devices.push({
        type: 'Us vs. Them',
        description: 'Creates division between groups',
        impact: 'negative' as const,
        examples: ['Group polarization', 'Tribal language']
      });
    }
    
    if (textLower.includes('studies show') || textLower.includes('research indicates')) {
      devices.push({
        type: 'Appeal to Authority',
        description: 'Uses expert opinions or studies to support claims',
        impact: 'positive' as const,
        examples: ['Scientific references', 'Expert testimony']
      });
    }

    return devices;
  };

  const generateCredibilityAssessment = (article: Article, biasResult: any) => {
    const factors = [];
    const warnings = [];
    let score = 70; // Base score
    
    // Assess source credibility
    if (article.source?.name) {
      const sourceName = article.source.name.toLowerCase();
      
      // Known reliable sources
      if (['reuters', 'ap', 'bbc', 'npr'].includes(sourceName)) {
        factors.push('Reputable news source');
        score += 15;
      }
      
      // Known biased sources
      if (['infowars', 'breitbart', 'dailykos'].includes(sourceName)) {
        warnings.push('Known for significant bias');
        score -= 20;
      }
    }
    
    // Assess content quality
    if (article.content && article.content.length > 500) {
      factors.push('Detailed content');
      score += 10;
    }
    
    if (biasResult.overall_bias > 7) {
      warnings.push('High bias detected');
      score -= 15;
    }
    
    if (biasResult.emotional_bias > 6) {
      warnings.push('Emotional manipulation detected');
      score -= 10;
    }
    
    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));
    
    return { score, factors, warnings };
  };

  const generateSummaryAndRecommendations = (biasResult: any, fallacies: any[], credibility: any) => {
    const keyPoints = [];
    const recommendations = [];
    
    // Key points based on analysis
    if (biasResult.political_bias > 6) {
      keyPoints.push('Strong political bias detected');
      recommendations.push('Seek alternative viewpoints');
    }
    
    if (biasResult.emotional_bias > 6) {
      keyPoints.push('High emotional manipulation');
      recommendations.push('Read with emotional distance');
    }
    
    if (fallacies.length > 0) {
      keyPoints.push(`${fallacies.length} logical fallacies identified`);
      recommendations.push('Fact-check claims independently');
    }
    
    if (credibility.score < 60) {
      keyPoints.push('Low credibility score');
      recommendations.push('Verify information with reliable sources');
    }
    
    const biasSummary = biasResult.overall_bias > 6 
      ? 'This content shows significant bias and should be read critically.'
      : 'This content appears relatively balanced but still requires critical reading.';
    
    return { keyPoints, biasSummary, recommendations };
  };

  const getBiasLevelText = (score: number): string => {
    if (score < 3) return 'Very Low';
    if (score < 5) return 'Low';
    if (score < 7) return 'Moderate';
    if (score < 9) return 'High';
    return 'Very High';
  };

  const getBiasLevelColor = (score: number): string => {
    if (score < 3) return '#28a745';
    if (score < 5) return '#5cb85c';
    if (score < 7) return '#ffc107';
    if (score < 9) return '#fd7e14';
    return '#dc3545';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="enhanced-article-analysis-overlay">
      <div className="enhanced-article-analysis-modal">
        <div className="analysis-header">
          <div className="header-content">
            <h2>
              <FiShield className="header-icon" />
              Article Analysis
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
            <p>Detecting bias, logical fallacies, and rhetorical devices</p>
          </div>
        )}

        {error && (
          <div className="error-section">
            <FiAlertTriangle className="error-icon" />
            <h3>Analysis Error</h3>
            <p>{error}</p>
          </div>
        )}

        {analysis && (
          <div className="analysis-content">
            {/* Quick Summary */}
            <div className="quick-summary">
              <div className="summary-header">
                <FiInfo className="summary-icon" />
                <h3>Quick Assessment</h3>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">Overall Bias:</span>
                  <span 
                    className="value" 
                    style={{ color: getBiasLevelColor(analysis.bias.overall) }}
                  >
                    {getBiasLevelText(analysis.bias.overall)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Credibility:</span>
                  <span 
                    className="value" 
                    style={{ color: analysis.credibility.score > 70 ? '#28a745' : '#ffc107' }}
                  >
                    {analysis.credibility.score}/100
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Fallacies:</span>
                  <span className="value">{analysis.logicalFallacies.length}</span>
                </div>
              </div>
            </div>

            {/* Bias Analysis */}
            <div className="analysis-section">
              <h3>
                <FiTarget className="section-icon" />
                Bias Analysis
              </h3>
              <div className="bias-grid">
                <div className="bias-item">
                  <div className="bias-label">Political Bias</div>
                  <div className="bias-score" style={{ color: getBiasLevelColor(analysis.bias.political) }}>
                    {analysis.bias.political.toFixed(1)}/10
                  </div>
                  <div className="bias-bar">
                    <div 
                      className="bias-fill"
                      style={{ 
                        width: `${analysis.bias.political * 10}%`,
                        backgroundColor: getBiasLevelColor(analysis.bias.political)
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bias-item">
                  <div className="bias-label">Emotional Bias</div>
                  <div className="bias-score" style={{ color: getBiasLevelColor(analysis.bias.emotional) }}>
                    {analysis.bias.emotional.toFixed(1)}/10
                  </div>
                  <div className="bias-bar">
                    <div 
                      className="bias-fill"
                      style={{ 
                        width: `${analysis.bias.emotional * 10}%`,
                        backgroundColor: getBiasLevelColor(analysis.bias.emotional)
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bias-item">
                  <div className="bias-label">Cognitive Bias</div>
                  <div className="bias-score" style={{ color: getBiasLevelColor(analysis.bias.cognitive) }}>
                    {analysis.bias.cognitive.toFixed(1)}/10
                  </div>
                  <div className="bias-bar">
                    <div 
                      className="bias-fill"
                      style={{ 
                        width: `${analysis.bias.cognitive * 10}%`,
                        backgroundColor: getBiasLevelColor(analysis.bias.cognitive)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logical Fallacies */}
            {analysis.logicalFallacies.length > 0 && (
              <div className="analysis-section">
                <h3>
                  <FiAlertTriangle className="section-icon" />
                  Logical Fallacies Detected
                </h3>
                <div className="fallacies-list">
                  {analysis.logicalFallacies.map((fallacy, index) => (
                    <div key={index} className="fallacy-item">
                      <div className="fallacy-header">
                        <span className="fallacy-type">{fallacy.type}</span>
                        <span 
                          className="severity-badge"
                          style={{ backgroundColor: getSeverityColor(fallacy.severity) }}
                        >
                          {fallacy.severity}
                        </span>
                      </div>
                      <p className="fallacy-description">{fallacy.description}</p>
                      {fallacy.examples.length > 0 && (
                        <div className="fallacy-examples">
                          <strong>Examples:</strong>
                          <ul>
                            {fallacy.examples.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rhetorical Analysis */}
            {analysis.rhetoricalDevices.length > 0 && (
              <div className="analysis-section">
                <h3>
                  <FiBookOpen className="section-icon" />
                  Rhetorical Devices
                </h3>
                <div className="rhetorical-list">
                  {analysis.rhetoricalDevices.map((device, index) => (
                    <div key={index} className={`rhetorical-item ${device.impact}`}>
                      <div className="rhetorical-header">
                        <span className="device-type">{device.type}</span>
                        <span className={`impact-badge ${device.impact}`}>
                          {device.impact}
                        </span>
                      </div>
                      <p className="device-description">{device.description}</p>
                      {device.examples.length > 0 && (
                        <div className="device-examples">
                          <strong>Examples:</strong>
                          <ul>
                            {device.examples.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credibility Assessment */}
            <div className="analysis-section">
              <h3>
                <FiCheckCircle className="section-icon" />
                Credibility Assessment
              </h3>
              <div className="credibility-content">
                <div className="credibility-score">
                  <div className="score-circle" style={{ 
                    background: `conic-gradient(${analysis.credibility.score > 70 ? '#28a745' : '#ffc107'} 0deg ${analysis.credibility.score * 3.6}deg, #e9ecef ${analysis.credibility.score * 3.6}deg)`
                  }}>
                    <span>{analysis.credibility.score}</span>
                  </div>
                  <p>Credibility Score</p>
                </div>
                <div className="credibility-details">
                  {analysis.credibility.factors.length > 0 && (
                    <div className="credibility-factors">
                      <h4>Positive Factors:</h4>
                      <ul>
                        {analysis.credibility.factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.credibility.warnings.length > 0 && (
                    <div className="credibility-warnings">
                      <h4>Warnings:</h4>
                      <ul>
                        {analysis.credibility.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="analysis-section">
              <h3>
                <FiTrendingUp className="section-icon" />
                Key Insights & Recommendations
              </h3>
              <div className="recommendations-content">
                <div className="key-points">
                  <h4>Key Points:</h4>
                  <ul>
                    {analysis.summary.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div className="bias-summary">
                  <h4>Bias Summary:</h4>
                  <p>{analysis.summary.biasSummary}</p>
                </div>
                <div className="recommendations">
                  <h4>Recommendations:</h4>
                  <ul>
                    {analysis.summary.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedArticleAnalysis;
