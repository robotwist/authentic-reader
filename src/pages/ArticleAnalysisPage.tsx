import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiClock, FiFileText, FiShield, FiTag, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiInfo, FiTarget, FiActivity, FiAlertCircle, FiMessageSquare } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/ArticleAnalysisPage.css';

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  content: string;
  analysis: {
    wordCount: number;
    readingTime: number;
    hasExternalLinks: boolean;
    complexity: string;
    keyTopics: string[];
    credibility: {
      score: number;
      level: string;
      reason: string;
      detailedReasons?: string[];
      sourceReputation?: {
        score: number;
        factors: string[];
      };
      authorCredibility?: {
        score: number;
        factors: string[];
      };
      historicalAccuracy?: {
        accuracyRate: number;
      };
      transparency?: {
        score: number;
        factors: string[];
      };
    };
    summary: string;
    timestamp: string;
  };
  articleId: string;
}

const ArticleAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['credibility', 'summary', 'bias']);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { analyzeBias, serviceStatus } = useLlamaAnalysis();

  useEffect(() => {
    // Get article data from navigation state
    const passedArticle = location.state?.article;
    
    if (passedArticle) {
      setArticle(passedArticle);
      setLoading(false);
      // Perform enhanced analysis immediately
      performEnhancedAnalysis(passedArticle);
    } else {
      // Fallback to mock data if no article passed
      const mockArticle: Article = {
        title: "Sample Article Title",
        link: "https://example.com/article",
        description: "This is a sample article description for testing purposes.",
        pubDate: new Date().toISOString(),
        author: "Sample Author",
        content: "This is sample content for testing the analysis page functionality.",
        analysis: {
          wordCount: 150,
          readingTime: 1,
          hasExternalLinks: true,
          complexity: "medium",
          keyTopics: ["technology", "innovation"],
          credibility: {
            score: 0.8,
            level: "high",
            reason: "Reputable source with fact-checking"
          },
          summary: "This is a sample summary of the article content for testing purposes.",
          timestamp: new Date().toISOString()
        },
        articleId: id || 'mock'
      };
      
      setArticle(mockArticle);
      setLoading(false);
      // Perform enhanced analysis immediately
      performEnhancedAnalysis(mockArticle);
    }
  }, [id, location.state]);

  const performEnhancedAnalysis = async (articleData: Article) => {
    if (!articleData.content && !articleData.description) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const textContent = articleData.content || articleData.description || articleData.title;
      const biasResult = await analyzeBias(textContent);
      
      if (biasResult) {
        const comprehensiveAnalysis = await generateComprehensiveAnalysis(textContent, biasResult);
        setEnhancedAnalysis(comprehensiveAnalysis);
      }
    } catch (err) {
      console.error('Enhanced analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateComprehensiveAnalysis = async (text: string, biasResult: any): Promise<any> => {
    // Enhanced analysis with more sophisticated detection
    const politicalBias = biasResult.bias_scores?.political || biasResult.political_bias || 5;
    const emotionalBias = biasResult.bias_scores?.ideological || biasResult.emotional_bias || 5;
    const cognitiveBias = biasResult.bias_scores?.partisan || biasResult.cognitive_bias || 5;
    const overallBias = (politicalBias + emotionalBias + cognitiveBias) / 3;

    const logicalFallacies = generateLogicalFallacies(text, biasResult);
    const rhetoricalDevices = generateRhetoricalAnalysis(text, biasResult);
    const credibility = generateCredibilityAssessment(article, biasResult);

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
      biasPhrases: biasResult.detected_bias_phrases || [],
      overallAssessment: biasResult.overall_bias_assessment || "Analysis completed"
    };
  };

  const generateLogicalFallacies = (text: string, biasResult: any) => {
    const fallacies = [];
    const biasLevel = biasResult.overall_bias_assessment || biasResult.overall_bias || 5;
    
    // Enhanced logical fallacy detection
    if (biasLevel > 6 || text.toLowerCase().includes('everyone knows') || text.toLowerCase().includes('obviously')) {
      fallacies.push({
        type: 'Appeal to Common Belief',
        description: 'Assumes something is true because many people believe it',
        examples: ['"Everyone knows..."', '"Obviously..."', 'Appeals to popular opinion'],
        severity: 'medium'
      });
    }
    
    if (biasLevel > 7 || text.toLowerCase().includes('if you don\'t support') || text.toLowerCase().includes('real americans')) {
      fallacies.push({
        type: 'False Dilemma',
        description: 'Presents only two options when more exist',
        examples: ['"If you don\'t support X, you support Y"', '"Real Americans believe..."'],
        severity: 'high'
      });
    }
    
    if (text.toLowerCase().includes('appeals to authority') || text.toLowerCase().includes('experts say')) {
      fallacies.push({
        type: 'Appeal to Authority',
        description: 'Uses authority figures to support claims without evidence',
        examples: ['"Experts say..." without citation', 'Appeals to unnamed authorities'],
        severity: 'medium'
      });
    }
    
    if (text.toLowerCase().includes('slippery slope') || text.toLowerCase().includes('if we allow')) {
      fallacies.push({
        type: 'Slippery Slope',
        description: 'Suggests one action will inevitably lead to extreme consequences',
        examples: ['"If we allow X, then Y will happen"', 'Chain of unlikely events'],
        severity: 'high'
      });
    }
    
    return fallacies;
  };

  const generateRhetoricalAnalysis = (text: string, biasResult: any) => {
    const devices = [];
    const biasLevel = biasResult.overall_bias_assessment || biasResult.overall_bias || 5;
    
    // Enhanced rhetorical device detection
    if (biasLevel > 5 || text.toLowerCase().includes('shocking') || text.toLowerCase().includes('outrageous')) {
      devices.push({
        type: 'Loaded Language',
        description: 'Uses emotionally charged words to influence perception',
        impact: 'negative',
        examples: ['Emotionally charged vocabulary', '"Shocking"', '"Outrageous"']
      });
    }
    
    if (text.toLowerCase().includes('we') || text.toLowerCase().includes('us') || text.toLowerCase().includes('our')) {
      devices.push({
        type: 'Inclusive Language',
        description: 'Uses "we" and "us" to create group identity',
        impact: 'neutral',
        examples: ['"We must..."', '"Our country..."', 'Group identification']
      });
    }
    
    if (text.toLowerCase().includes('rhetorical questions') || text.match(/\?/g)?.length > 3) {
      devices.push({
        type: 'Rhetorical Questions',
        description: 'Asks questions not meant to be answered',
        impact: 'persuasive',
        examples: ['Questions without expected answers', 'Leading questions']
      });
    }
    
    if (text.toLowerCase().includes('repetition') || text.toLowerCase().includes('again and again')) {
      devices.push({
        type: 'Repetition',
        description: 'Repeats key phrases for emphasis',
        impact: 'emphasizing',
        examples: ['Repeated phrases', 'Key term repetition']
      });
    }
    
    return devices;
  };

  const generateCredibilityAssessment = (articleData: Article | null, biasResult: any) => {
    if (!articleData) return { score: 5, factors: [], warnings: [] };
    
    const factors = [];
    const warnings = [];
    let score = 7; // Base score
    
    if (biasResult.overall_bias_assessment && biasResult.overall_bias_assessment.toLowerCase().includes('high bias')) {
      score -= 2;
      warnings.push('High bias detected may affect objectivity');
    }
    
    if (articleData.analysis.credibility.score > 0.8) {
      score += 1;
      factors.push('Good source reputation');
    }
    
    return { score, factors, warnings };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCredibilityColor = (level: string) => {
    switch (level) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCredibilityIcon = (level: string) => {
    switch (level) {
      case 'high': return <FiCheckCircle className="credibility-icon high" />;
      case 'medium': return <FiInfo className="credibility-icon medium" />;
      case 'low': return <FiAlertTriangle className="credibility-icon low" />;
      default: return <FiInfo className="credibility-icon" />;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getComplexityDescription = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'Simple language, easy to understand';
      case 'medium': return 'Moderate complexity, some technical terms';
      case 'hard': return 'Complex language, requires background knowledge';
      default: return 'Standard reading level';
    }
  };

  if (loading) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading article analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <h2>Analysis Not Found</h2>
          <p>{error || 'The requested article analysis could not be found.'}</p>
          <button onClick={() => navigate('/')} className="back-button">
            <FiArrowLeft /> Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Articles
        </button>
        <h1>Article Analysis</h1>
        <p className="analysis-subtitle">Understanding the truth behind the content</p>
      </div>

      <div className="article-overview">
        <div className="article-main-info">
          <h2 className="article-title">{article.title}</h2>
          <div className="article-meta">
            <span className="article-author">
              <strong>Author:</strong> {article.author}
            </span>
            <span className="article-date">
              <strong>Published:</strong> {formatDate(article.pubDate)}
            </span>
            <span className="article-source">
              <strong>Source:</strong> {new URL(article.link).hostname}
            </span>
          </div>
          <p className="article-description">{article.description}</p>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <FiClock className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{article.analysis.readingTime} min</span>
              <span className="stat-label">Reading Time</span>
            </div>
          </div>
          
          <div className="stat-card">
            <FiFileText className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{article.analysis.wordCount}</span>
              <span className="stat-label">Word Count</span>
            </div>
          </div>
          
          <div className="stat-card">
            <FiShield className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{Math.round(article.analysis.credibility.score * 100)}%</span>
              <span className="stat-label">Credibility Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Analysis Summary - Always Visible */}
      <div className="immediate-analysis-summary">
        <div className="summary-header">
          <FiTarget className="summary-icon" />
          <h3>AI Analysis Summary</h3>
          {isAnalyzing && <span className="analyzing-badge">Analyzing...</span>}
        </div>
        
        {isAnalyzing ? (
          <div className="analysis-loading">
            <div className="loading-spinner"></div>
            <p>Performing comprehensive AI analysis...</p>
          </div>
        ) : enhancedAnalysis ? (
          <div className="analysis-results">
            {/* Overall Bias Score */}
            <div className="overall-bias-card">
              <div className="bias-score-display">
                <span className="bias-score-value">{enhancedAnalysis.bias.overall.toFixed(1)}</span>
                <span className="bias-score-label">Overall Bias Score</span>
              </div>
              <div className="bias-assessment">
                <p>{enhancedAnalysis.overallAssessment}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-analysis-stats">
              <div className="analysis-stat">
                <span className="stat-number">{enhancedAnalysis.logicalFallacies.length}</span>
                <span className="stat-label">Logical Fallacies</span>
              </div>
              <div className="analysis-stat">
                <span className="stat-number">{enhancedAnalysis.rhetoricalDevices.length}</span>
                <span className="stat-label">Rhetorical Devices</span>
              </div>
              <div className="analysis-stat">
                <span className="stat-number">{enhancedAnalysis.biasPhrases.length}</span>
                <span className="stat-label">Bias Phrases</span>
              </div>
            </div>

            {/* Critical Issues */}
            {(enhancedAnalysis.logicalFallacies.length > 0 || enhancedAnalysis.rhetoricalDevices.length > 0) && (
              <div className="critical-issues">
                <h4><FiAlertCircle /> Critical Issues Detected</h4>
                <div className="issues-list">
                  {enhancedAnalysis.logicalFallacies.slice(0, 2).map((fallacy: any, index: number) => (
                    <div key={index} className="issue-item fallacy">
                      <span className="issue-type">{fallacy.type}</span>
                      <span className="issue-severity">{fallacy.severity}</span>
                    </div>
                  ))}
                  {enhancedAnalysis.rhetoricalDevices.slice(0, 2).map((device: any, index: number) => (
                    <div key={index} className="issue-item rhetorical">
                      <span className="issue-type">{device.type}</span>
                      <span className="issue-impact">{device.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-analysis">
            <p>Analysis not available. Please try refreshing the page.</p>
          </div>
        )}
      </div>

      <div className="analysis-sections">
        {/* Credibility Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('credibility')}
          >
            <div className="section-title">
              {getCredibilityIcon(article.analysis.credibility.level)}
              <h3>Credibility Assessment</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('credibility') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('credibility') && (
            <div className="section-content">
              <div className="credibility-score">
                <div className="score-circle" style={{ 
                  background: `conic-gradient(${getCredibilityColor(typeof article.analysis.credibility.level === 'string' 
                    ? article.analysis.credibility.level 
                    : typeof article.analysis.credibility.level === 'object' 
                      ? (article.analysis.credibility.level.level || 
                         article.analysis.credibility.level.type || 
                         'unknown') 
                      : 'unknown')} ${article.analysis.credibility.score * 360}deg, var(--border-color) 0deg)` 
                }}>
                  <span className="score-text">{Math.round(article.analysis.credibility.score * 100)}%</span>
                </div>
                <div className="score-details">
                  <h4>Credibility Level: {(typeof article.analysis.credibility.level === 'string' 
                    ? article.analysis.credibility.level 
                    : typeof article.analysis.credibility.level === 'object' 
                      ? (article.analysis.credibility.level.level || 
                         article.analysis.credibility.level.type || 
                         'unknown') 
                      : 'unknown').toUpperCase()}</h4>
                  <p className="credibility-reason">{article.analysis.credibility.reason}</p>
                </div>
              </div>
              
              {/* Detailed Credibility Breakdown */}
              {article.analysis.credibility.detailedReasons && (
                <div className="credibility-breakdown">
                  <h4>Detailed Assessment:</h4>
                  <ul className="credibility-factors">
                    {article.analysis.credibility.detailedReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Source Reputation */}
              {article.analysis.credibility.sourceReputation && (
                <div className="source-reputation">
                  <h4>Source Reputation:</h4>
                  <div className="reputation-score">
                    <span className="score-label">Reputation Score:</span>
                    <span className="score-value">{Math.round(article.analysis.credibility.sourceReputation.score * 100)}%</span>
                  </div>
                  <ul className="reputation-factors">
                    {article.analysis.credibility.sourceReputation.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Author Credibility */}
              {article.analysis.credibility.authorCredibility && (
                <div className="author-credibility">
                  <h4>Author Assessment:</h4>
                  <div className="author-score">
                    <span className="score-label">Author Score:</span>
                    <span className="score-value">{Math.round(article.analysis.credibility.authorCredibility.score * 100)}%</span>
                  </div>
                  <ul className="author-factors">
                    {article.analysis.credibility.authorCredibility.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Historical Accuracy */}
              {article.analysis.credibility.historicalAccuracy && (
                <div className="historical-accuracy">
                  <h4>Historical Accuracy:</h4>
                  <div className="accuracy-rate">
                    <span className="rate-label">Accuracy Rate:</span>
                    <span className="rate-value">{Math.round(article.analysis.credibility.historicalAccuracy.accuracyRate * 100)}%</span>
                  </div>
                  <p className="accuracy-description">
                    Based on fact-checking organizations' assessments of this source's past reporting.
                  </p>
                </div>
              )}
              
              {/* Transparency Assessment */}
              {article.analysis.credibility.transparency && (
                <div className="transparency-assessment">
                  <h4>Transparency:</h4>
                  <div className="transparency-score">
                    <span className="score-label">Transparency Score:</span>
                    <span className="score-value">{Math.round(article.analysis.credibility.transparency.score * 100)}%</span>
                  </div>
                  <ul className="transparency-factors">
                    {article.analysis.credibility.transparency.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Summary */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('summary')}
          >
            <div className="section-title">
              <FiFileText />
              <h3>Content Summary</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('summary') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('summary') && (
            <div className="section-content">
              <div className="summary-content">
                <p>{article.analysis.summary || 'No summary available for this article.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Topic Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('topics')}
          >
            <div className="section-title">
              <FiTag />
              <h3>Topic Analysis</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('topics') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('topics') && (
            <div className="section-content">
              <div className="topics-grid">
                {article.analysis.keyTopics.map((topic, index) => (
                  <span key={index} className="topic-tag">{topic}</span>
                ))}
              </div>
              <p className="topics-description">
                These topics were identified through natural language processing analysis of the article content.
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Bias Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('bias')}
          >
            <div className="section-title">
              <FiTarget />
              <h3>Enhanced Bias Analysis</h3>
              {isAnalyzing && <span className="analyzing-indicator">Analyzing...</span>}
            </div>
            <span className="section-toggle">
              {expandedSections.includes('bias') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('bias') && (
            <div className="section-content">
              {isAnalyzing ? (
                <div className="loading-analysis">
                  <div className="spinner"></div>
                  <p>Performing comprehensive bias analysis...</p>
                </div>
              ) : enhancedAnalysis ? (
                <div className="enhanced-analysis-content">
                  {/* Bias Scores */}
                  <div className="bias-scores">
                    <h4>Multi-Dimensional Bias Assessment</h4>
                    <div className="bias-grid">
                      <div className="bias-item">
                        <span className="bias-label">Political Bias</span>
                        <div className="bias-bar">
                          <div 
                            className="bias-fill" 
                            style={{ width: `${(enhancedAnalysis.bias.political / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="bias-value">{enhancedAnalysis.bias.political.toFixed(1)}/10</span>
                      </div>
                      <div className="bias-item">
                        <span className="bias-label">Emotional Bias</span>
                        <div className="bias-bar">
                          <div 
                            className="bias-fill" 
                            style={{ width: `${(enhancedAnalysis.bias.emotional / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="bias-value">{enhancedAnalysis.bias.emotional.toFixed(1)}/10</span>
                      </div>
                      <div className="bias-item">
                        <span className="bias-label">Cognitive Bias</span>
                        <div className="bias-bar">
                          <div 
                            className="bias-fill" 
                            style={{ width: `${(enhancedAnalysis.bias.cognitive / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="bias-value">{enhancedAnalysis.bias.cognitive.toFixed(1)}/10</span>
                      </div>
                    </div>
                    <div className="overall-bias">
                      <strong>Overall Bias Score: {enhancedAnalysis.bias.overall.toFixed(1)}/10</strong>
                    </div>
                  </div>

                  {/* Logical Fallacies */}
                  {enhancedAnalysis.logicalFallacies.length > 0 && (
                    <div className="fallacies-section">
                      <h4>Logical Fallacies Detected</h4>
                      <div className="fallacies-list">
                        {enhancedAnalysis.logicalFallacies.map((fallacy: any, index: number) => (
                          <div key={index} className="fallacy-item">
                            <div className="fallacy-header">
                              <span className="fallacy-type">{typeof fallacy.type === 'string' 
                                ? fallacy.type 
                                : typeof fallacy.type === 'object' 
                                  ? (fallacy.type.type || 
                                     fallacy.type.name || 
                                     JSON.stringify(fallacy.type)) 
                                  : 'Unknown'}</span>
                              <span className={`severity-badge ${fallacy.severity}`}>{fallacy.severity}</span>
                            </div>
                            <p className="fallacy-description">{typeof fallacy.description === 'string' 
                              ? fallacy.description 
                              : typeof fallacy.description === 'object' 
                                ? (fallacy.description.description || 
                                   fallacy.description.text || 
                                   fallacy.description.content || 
                                   JSON.stringify(fallacy.description)) 
                                : 'No description available'}</p>
                            {fallacy.examples && fallacy.examples.length > 0 && (
                              <div className="fallacy-examples">
                                <strong>Examples:</strong>
                                <ul>
                                  {fallacy.examples.map((example: string, i: number) => (
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

                  {/* Rhetorical Devices */}
                  {enhancedAnalysis.rhetoricalDevices.length > 0 && (
                    <div className="rhetorical-section">
                      <h4>Rhetorical Devices Identified</h4>
                      <div className="rhetorical-list">
                        {enhancedAnalysis.rhetoricalDevices.map((device: any, index: number) => (
                          <div key={index} className="rhetorical-item">
                            <div className="rhetorical-header">
                              <span className="device-type">{typeof device.type === 'string' 
                                ? device.type 
                                : typeof device.type === 'object' 
                                  ? (device.type.type || 
                                     device.type.name || 
                                     JSON.stringify(device.type)) 
                                  : 'Unknown'}</span>
                              <span className={`impact-badge ${device.impact}`}>{device.impact}</span>
                            </div>
                            <p className="device-description">{typeof device.description === 'string' 
                              ? device.description 
                              : typeof device.description === 'object' 
                                ? (device.description.description || 
                                   device.description.text || 
                                   device.description.content || 
                                   JSON.stringify(device.description)) 
                                : 'No description available'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-analysis">
                  <p>Enhanced analysis not available for this article.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Complexity */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('complexity')}
          >
            <div className="section-title">
              <FiTrendingUp />
              <h3>Content Complexity</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('complexity') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('complexity') && (
            <div className="section-content">
              <div className="complexity-info">
                <div className="complexity-level">
                  <span className="complexity-badge">{article.analysis.complexity}</span>
                  <p>{getComplexityDescription(article.analysis.complexity)}</p>
                </div>
                
                <div className="complexity-details">
                  <h4>Reading Level Indicators:</h4>
                  <ul>
                    <li><strong>Vocabulary:</strong> {article.analysis.complexity === 'easy' ? 'Simple, everyday words' : 
                       article.analysis.complexity === 'medium' ? 'Some technical terms' : 'Complex terminology'}</li>
                    <li><strong>Sentence Structure:</strong> {article.analysis.complexity === 'easy' ? 'Short, clear sentences' : 
                       article.analysis.complexity === 'medium' ? 'Mixed sentence lengths' : 'Complex sentence structures'}</li>
                    <li><strong>Background Knowledge:</strong> {article.analysis.complexity === 'easy' ? 'Minimal required' : 
                       article.analysis.complexity === 'medium' ? 'Some familiarity helpful' : 'Significant background needed'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* External Links Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('links')}
          >
            <div className="section-title">
              <FiExternalLink />
              <h3>External References</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('links') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('links') && (
            <div className="section-content">
              <div className="links-analysis">
                <p>
                  {article.analysis.hasExternalLinks 
                    ? 'This article contains external links and references, which can indicate thorough research and fact-checking.'
                    : 'This article does not contain external links or references.'
                  }
                </p>
                <div className="links-importance">
                  <h4>Why External Links Matter:</h4>
                  <ul>
                    <li>Provide sources for claims and statistics</li>
                    <li>Allow readers to verify information independently</li>
                    <li>Demonstrate thorough research and fact-checking</li>
                    <li>Increase transparency and credibility</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="analysis-actions">
        <a 
          href={article.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="read-original-button"
        >
          <FiExternalLink /> Read Original Article
        </a>
        
        <button onClick={() => navigate('/')} className="back-to-feed-button">
          <FiArrowLeft /> Back to Article Feed
        </button>
      </div>
    </div>
  );
};

export default ArticleAnalysisPage;
