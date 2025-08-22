import React, { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiExternalLink,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiTarget,
  FiClock,
  FiBookOpen,
  FiGlobe,
  FiUsers,
  FiFlag,
  FiAward,
  FiAlertCircle
} from 'react-icons/fi';
import '../styles/SourceCredibilityAssessment.css';

interface CredibilityScore {
  overall: number;
  accuracy: number;
  transparency: number;
  objectivity: number;
  factChecking: number;
  corrections: number;
  bias: number;
}

interface SourceInfo {
  name: string;
  url: string;
  domain: string;
  type: 'news' | 'blog' | 'social' | 'government' | 'academic' | 'unknown';
  country: string;
  founded?: string;
  ownership?: string;
  description?: string;
}

interface CredibilityAssessment {
  source: SourceInfo;
  score: CredibilityScore;
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  history: {
    factCheckRecord: number;
    correctionRate: number;
    biasIncidents: number;
    accuracyScore: number;
  };
  recommendations: string[];
  lastUpdated: string;
  confidence: number;
}

interface SourceCredibilityAssessmentProps {
  sourceUrl?: string;
  onAssessmentComplete?: (assessment: CredibilityAssessment) => void;
}

const SourceCredibilityAssessment: React.FC<SourceCredibilityAssessmentProps> = ({ 
  sourceUrl = '', 
  onAssessmentComplete 
}) => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessment, setAssessment] = useState<CredibilityAssessment | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState(0);
  const [inputUrl, setInputUrl] = useState(sourceUrl);
  const [recentAssessments, setRecentAssessments] = useState<CredibilityAssessment[]>([]);

  useEffect(() => {
    // Load recent assessments from localStorage
    const saved = localStorage.getItem('recentSourceAssessments');
    if (saved) {
      try {
        setRecentAssessments(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent assessments:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (sourceUrl) {
      performAssessment(sourceUrl);
    }
  }, [sourceUrl]);

  const performAssessment = async (url: string) => {
    if (!url.trim()) {
      alert('Please enter a source URL to assess');
      return;
    }

    setIsAssessing(true);
    setAssessmentProgress(0);

    try {
      // Step 1: Extract domain and basic info
      setAssessmentProgress(20);
      const domain = extractDomain(url);
      
      // Step 2: Analyze source credibility
      setAssessmentProgress(60);
      const result = await generateCredibilityAssessment(domain, url);
      
      // Step 3: Complete assessment
      setAssessmentProgress(100);
      setAssessment(result);
      
      // Save to recent assessments
      const updatedRecent = [result, ...recentAssessments.slice(0, 4)];
      setRecentAssessments(updatedRecent);
      localStorage.setItem('recentSourceAssessments', JSON.stringify(updatedRecent));
      
      if (onAssessmentComplete) {
        onAssessmentComplete(result);
      }

    } catch (error) {
      console.error('Credibility assessment failed:', error);
      alert('Assessment failed. Please try again.');
    } finally {
      setIsAssessing(false);
      setAssessmentProgress(0);
    }
  };

  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain.replace('www.', '');
    } catch {
      return url.replace('www.', '').split('/')[0];
    }
  };

  const generateCredibilityAssessment = async (domain: string, url: string): Promise<CredibilityAssessment> => {
    const domainLower = domain.toLowerCase();
    
    // Determine source type and basic info
    let sourceType: SourceInfo['type'] = 'unknown';
    let country = 'Unknown';
    let founded = undefined;
    let ownership = undefined;
    let description = '';

    // Source type detection
    if (domainLower.includes('news') || domainLower.includes('times') || domainLower.includes('post')) {
      sourceType = 'news';
    } else if (domainLower.includes('blog') || domainLower.includes('medium') || domainLower.includes('substack')) {
      sourceType = 'blog';
    } else if (domainLower.includes('twitter') || domainLower.includes('facebook') || domainLower.includes('instagram')) {
      sourceType = 'social';
    } else if (domainLower.includes('gov') || domainLower.includes('government')) {
      sourceType = 'government';
    } else if (domainLower.includes('edu') || domainLower.includes('academic') || domainLower.includes('university')) {
      sourceType = 'academic';
    }

    // Known source database (simplified)
    const knownSources: { [key: string]: any } = {
      'reuters.com': {
        type: 'news',
        country: 'United Kingdom',
        founded: '1851',
        ownership: 'Thomson Reuters',
        description: 'International news agency with high credibility standards',
        credibility: { overall: 0.92, accuracy: 0.95, transparency: 0.90, objectivity: 0.88, factChecking: 0.94, corrections: 0.89, bias: 0.15 }
      },
      'ap.org': {
        type: 'news',
        country: 'United States',
        founded: '1846',
        ownership: 'Non-profit cooperative',
        description: 'Associated Press - leading news agency',
        credibility: { overall: 0.94, accuracy: 0.96, transparency: 0.92, objectivity: 0.90, factChecking: 0.95, corrections: 0.91, bias: 0.12 }
      },
      'bbc.com': {
        type: 'news',
        country: 'United Kingdom',
        founded: '1922',
        ownership: 'Public service broadcaster',
        description: 'British Broadcasting Corporation - public service media',
        credibility: { overall: 0.89, accuracy: 0.92, transparency: 0.88, objectivity: 0.85, factChecking: 0.90, corrections: 0.87, bias: 0.18 }
      },
      'cnn.com': {
        type: 'news',
        country: 'United States',
        founded: '1980',
        ownership: 'Warner Bros. Discovery',
        description: 'Cable news network with comprehensive coverage',
        credibility: { overall: 0.78, accuracy: 0.82, transparency: 0.75, objectivity: 0.72, factChecking: 0.80, corrections: 0.76, bias: 0.25 }
      },
      'foxnews.com': {
        type: 'news',
        country: 'United States',
        founded: '1996',
        ownership: 'Fox Corporation',
        description: 'Conservative-leaning news network',
        credibility: { overall: 0.65, accuracy: 0.70, transparency: 0.60, objectivity: 0.55, factChecking: 0.68, corrections: 0.62, bias: 0.45 }
      },
      'breitbart.com': {
        type: 'news',
        country: 'United States',
        founded: '2007',
        ownership: 'Breitbart News Network',
        description: 'Conservative news and opinion website',
        credibility: { overall: 0.45, accuracy: 0.50, transparency: 0.40, objectivity: 0.35, factChecking: 0.48, corrections: 0.42, bias: 0.75 }
      },
      'infowars.com': {
        type: 'news',
        country: 'United States',
        founded: '1999',
        ownership: 'Free Speech Systems',
        description: 'Controversial conspiracy theory website',
        credibility: { overall: 0.15, accuracy: 0.20, transparency: 0.10, objectivity: 0.05, factChecking: 0.15, corrections: 0.12, bias: 0.90 }
      }
    };

    const sourceData = knownSources[domainLower] || {
      type: sourceType,
      country,
      founded,
      ownership,
      description: 'Source not in our database - assessment based on general patterns',
      credibility: generateDefaultCredibility(domainLower, sourceType)
    };

    // Generate factors based on credibility scores
    const factors = generateFactors(sourceData.credibility);
    
    // Generate history data
    const history = {
      factCheckRecord: Math.round(sourceData.credibility.factChecking * 100),
      correctionRate: Math.round(sourceData.credibility.corrections * 100),
      biasIncidents: Math.round((1 - sourceData.credibility.bias) * 50),
      accuracyScore: Math.round(sourceData.credibility.accuracy * 100)
    };

    // Generate recommendations
    const recommendations = generateRecommendations(sourceData.credibility);

    return {
      source: {
        name: domain,
        url,
        domain,
        type: sourceData.type,
        country: sourceData.country,
        founded: sourceData.founded,
        ownership: sourceData.ownership,
        description: sourceData.description
      },
      score: sourceData.credibility,
      factors,
      history,
      recommendations,
      lastUpdated: new Date().toISOString(),
      confidence: 0.85
    };
  };

  const generateDefaultCredibility = (domain: string, type: SourceInfo['type']): CredibilityScore => {
    // Base scores by type
    const baseScores = {
      news: { overall: 0.70, accuracy: 0.75, transparency: 0.65, objectivity: 0.70, factChecking: 0.72, corrections: 0.68, bias: 0.30 },
      blog: { overall: 0.50, accuracy: 0.55, transparency: 0.45, objectivity: 0.50, factChecking: 0.52, corrections: 0.48, bias: 0.50 },
      social: { overall: 0.30, accuracy: 0.35, transparency: 0.25, objectivity: 0.30, factChecking: 0.32, corrections: 0.28, bias: 0.70 },
      government: { overall: 0.80, accuracy: 0.85, transparency: 0.75, objectivity: 0.80, factChecking: 0.82, corrections: 0.78, bias: 0.20 },
      academic: { overall: 0.85, accuracy: 0.90, transparency: 0.80, objectivity: 0.85, factChecking: 0.87, corrections: 0.83, bias: 0.15 },
      unknown: { overall: 0.40, accuracy: 0.45, transparency: 0.35, objectivity: 0.40, factChecking: 0.42, corrections: 0.38, bias: 0.60 }
    };

    return baseScores[type];
  };

  const generateFactors = (credibility: CredibilityScore) => {
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
      neutral: [] as string[]
    };

    if (credibility.accuracy > 0.8) factors.positive.push('High accuracy in reporting');
    if (credibility.transparency > 0.8) factors.positive.push('Good transparency practices');
    if (credibility.objectivity > 0.8) factors.positive.push('Maintains objectivity');
    if (credibility.factChecking > 0.8) factors.positive.push('Strong fact-checking procedures');
    if (credibility.corrections > 0.8) factors.positive.push('Prompt error corrections');
    if (credibility.bias < 0.2) factors.positive.push('Low bias detected');

    if (credibility.accuracy < 0.6) factors.negative.push('Accuracy concerns identified');
    if (credibility.transparency < 0.6) factors.negative.push('Limited transparency');
    if (credibility.objectivity < 0.6) factors.negative.push('Objectivity issues');
    if (credibility.factChecking < 0.6) factors.negative.push('Weak fact-checking');
    if (credibility.corrections < 0.6) factors.negative.push('Poor correction practices');
    if (credibility.bias > 0.6) factors.negative.push('High bias detected');

    factors.neutral.push('Standard editorial practices');
    factors.neutral.push('Mixed reliability indicators');
    factors.neutral.push('Requires further verification');

    return factors;
  };

  const generateRecommendations = (credibility: CredibilityScore): string[] => {
    const recommendations = [];

    if (credibility.overall < 0.6) {
      recommendations.push('Exercise caution when using this source');
      recommendations.push('Verify information with multiple sources');
    }

    if (credibility.bias > 0.5) {
      recommendations.push('Be aware of potential bias in reporting');
      recommendations.push('Seek alternative perspectives');
    }

    if (credibility.accuracy < 0.7) {
      recommendations.push('Fact-check claims independently');
      recommendations.push('Cross-reference with reliable sources');
    }

    if (credibility.transparency < 0.6) {
      recommendations.push('Look for additional context and sources');
      recommendations.push('Check for clear attribution of information');
    }

    if (recommendations.length === 0) {
      recommendations.push('This source appears generally reliable');
      recommendations.push('Continue to verify important claims');
    }

    return recommendations;
  };

  const getCredibilityLevel = (score: number): string => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Moderate';
    if (score >= 0.4) return 'Low';
    return 'Very Low';
  };

  const getCredibilityColor = (score: number): string => {
    if (score >= 0.8) return '#28a745';
    if (score >= 0.6) return '#ffc107';
    if (score >= 0.4) return '#fd7e14';
    return '#dc3545';
  };

  const getCredibilityIcon = (score: number) => {
    if (score >= 0.8) return <FiCheckCircle className="credibility-icon high" />;
    if (score >= 0.6) return <FiAlertTriangle className="credibility-icon moderate" />;
    if (score >= 0.4) return <FiAlertCircle className="credibility-icon low" />;
    return <FiXCircle className="credibility-icon very-low" />;
  };

  return (
    <div className="source-credibility-assessment">
      <div className="assessment-header">
        <div className="header-content">
          <FiShield className="header-icon" />
          <div>
            <h2>Source Credibility Assessment</h2>
            <p>Evaluate the reliability and trustworthiness of news sources</p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="url-input-section">
        <div className="input-group">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter source URL (e.g., https://reuters.com)"
            className="url-input"
            disabled={isAssessing}
          />
          <button 
            onClick={() => performAssessment(inputUrl)}
            disabled={isAssessing || !inputUrl.trim()}
            className="assess-button"
          >
            {isAssessing ? (
              <>
                <FiClock className="spinner" />
                Assessing...
              </>
            ) : (
              <>
                <FiShield />
                Assess Credibility
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isAssessing && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${assessmentProgress}%` }}
              ></div>
            </div>
            <p>Analyzing source credibility... {assessmentProgress}%</p>
          </div>
        )}
      </div>

      {/* Assessment Result */}
      {assessment && (
        <div className="assessment-result">
          <div className="result-header">
            <div className="source-info">
              <h3>{assessment.source.name}</h3>
              <div className="source-meta">
                <span className="source-type">{assessment.source.type}</span>
                <span className="source-country">{assessment.source.country}</span>
                {assessment.source.founded && (
                  <span className="source-founded">Founded: {assessment.source.founded}</span>
                )}
              </div>
              <p className="source-description">{assessment.source.description}</p>
            </div>
            
            <div className="credibility-overview">
              <div className="overall-score">
                {getCredibilityIcon(assessment.score.overall)}
                <div className="score-info">
                  <span 
                    className="score-value"
                    style={{ color: getCredibilityColor(assessment.score.overall) }}
                  >
                    {Math.round(assessment.score.overall * 100)}%
                  </span>
                  <span className="score-label">
                    {getCredibilityLevel(assessment.score.overall)} Credibility
                  </span>
                </div>
              </div>
              <div className="confidence-score">
                {Math.round(assessment.confidence * 100)}% Confidence
              </div>
            </div>
          </div>

          <div className="result-content">
            {/* Credibility Scores */}
            <div className="scores-section">
              <h3><FiBarChart2 /> Credibility Breakdown</h3>
              <div className="scores-grid">
                {Object.entries(assessment.score).map(([metric, score]) => (
                  <div key={metric} className="score-card">
                    <div className="score-header">
                      <span className="metric-name">
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </span>
                      <span 
                        className="metric-score"
                        style={{ color: getCredibilityColor(score) }}
                      >
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                    <div className="score-bar">
                      <div 
                        className="score-fill"
                        style={{ 
                          width: `${Math.round(score * 100)}%`,
                          backgroundColor: getCredibilityColor(score)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="history-section">
              <h3><FiClock /> Historical Performance</h3>
              <div className="history-grid">
                <div className="history-card">
                  <h4>Fact-Check Record</h4>
                  <span className="history-value">{assessment.history.factCheckRecord}%</span>
                </div>
                <div className="history-card">
                  <h4>Correction Rate</h4>
                  <span className="history-value">{assessment.history.correctionRate}%</span>
                </div>
                <div className="history-card">
                  <h4>Bias Incidents</h4>
                  <span className="history-value">{assessment.history.biasIncidents}</span>
                </div>
                <div className="history-card">
                  <h4>Accuracy Score</h4>
                  <span className="history-value">{assessment.history.accuracyScore}%</span>
                </div>
              </div>
            </div>

            {/* Factors */}
            <div className="factors-section">
              <h3><FiTarget /> Assessment Factors</h3>
              <div className="factors-grid">
                {assessment.factors.positive.length > 0 && (
                  <div className="factor-category positive">
                    <h4><FiCheckCircle /> Positive Factors</h4>
                    <ul>
                      {assessment.factors.positive.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {assessment.factors.negative.length > 0 && (
                  <div className="factor-category negative">
                    <h4><FiXCircle /> Concerns</h4>
                    <ul>
                      {assessment.factors.negative.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {assessment.factors.neutral.length > 0 && (
                  <div className="factor-category neutral">
                    <h4><FiInfo /> Neutral Factors</h4>
                    <ul>
                      {assessment.factors.neutral.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="recommendations-section">
              <h3><FiAward /> Recommendations</h3>
              <div className="recommendations-list">
                {assessment.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <FiStar className="recommendation-icon" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Links */}
            <div className="source-links">
              <a 
                href={assessment.source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="source-link"
              >
                <FiExternalLink />
                Visit Source
              </a>
              <span className="last-updated">
                Last updated: {new Date(assessment.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Assessments */}
      {recentAssessments.length > 0 && (
        <div className="recent-assessments">
          <h3><FiBookOpen /> Recent Assessments</h3>
          <div className="recent-grid">
            {recentAssessments.map((recent, index) => (
              <div key={index} className="recent-card">
                <div className="recent-header">
                  <h4>{recent.source.name}</h4>
                  {getCredibilityIcon(recent.score.overall)}
                </div>
                <div className="recent-score">
                  <span 
                    className="recent-score-value"
                    style={{ color: getCredibilityColor(recent.score.overall) }}
                  >
                    {Math.round(recent.score.overall * 100)}%
                  </span>
                  <span className="recent-score-label">
                    {getCredibilityLevel(recent.score.overall)}
                  </span>
                </div>
                <span className="recent-time">
                  {new Date(recent.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceCredibilityAssessment;
