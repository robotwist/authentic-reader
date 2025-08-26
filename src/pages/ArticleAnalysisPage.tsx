import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiClock, FiFileText, FiShield, FiTag, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiInfo, FiTarget, FiActivity, FiAlertCircle, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import { huggingFaceService } from '../services/huggingFaceService';
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
  const [serviceStatus, setServiceStatus] = useState<'available' | 'unavailable' | 'checking'>('checking');

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
    setServiceStatus('checking');
    
    try {
      const textContent = articleData.content || articleData.description || articleData.title;
      
      // Check if Hugging Face service is available
      try {
        await huggingFaceService.checkApiStatus();
        setServiceStatus('available');
        
        // Perform comprehensive analysis using Hugging Face
        const comprehensiveAnalysis = await performHFAnalysis(textContent);
        setEnhancedAnalysis(comprehensiveAnalysis);
      } catch (hfError) {
        console.warn('Hugging Face service unavailable, using fallback analysis');
        setServiceStatus('unavailable');
        
        // Use fallback analysis
        const fallbackAnalysis = await performFallbackAnalysis(textContent);
        setEnhancedAnalysis(fallbackAnalysis);
      }
    } catch (err) {
      console.error('Enhanced analysis failed:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performHFAnalysis = async (text: string) => {
    const results = await Promise.allSettled([
      huggingFaceService.analyzeBias(text),
      huggingFaceService.analyzeSentiment(text),
      huggingFaceService.extractEntities(text),
      huggingFaceService.analyzeCredibility(text)
    ]);

    const [biasResult, sentimentResult, entitiesResult, credibilityResult] = results;

    return {
      bias: {
        political: biasResult.status === 'fulfilled' ? biasResult.value.political_bias : 0.5,
        emotional: biasResult.status === 'fulfilled' ? biasResult.value.emotional_bias : 0.5,
        cognitive: biasResult.status === 'fulfilled' ? biasResult.value.cognitive_bias : 0.5,
        overall: biasResult.status === 'fulfilled' ? biasResult.value.overall_bias : 0.5
      },
      sentiment: sentimentResult.status === 'fulfilled' ? sentimentResult.value : { overall: 'neutral', score: 0.5 },
      entities: entitiesResult.status === 'fulfilled' ? entitiesResult.value : [],
      credibility: credibilityResult.status === 'fulfilled' ? credibilityResult.value : { score: 0.7, factors: [] },
      logicalFallacies: generateLogicalFallacies(text),
      rhetoricalDevices: generateRhetoricalAnalysis(text),
      biasPhrases: biasResult.status === 'fulfilled' ? biasResult.value.bias_phrases || [] : [],
      overallAssessment: biasResult.status === 'fulfilled' ? biasResult.value.assessment || "Analysis completed" : "Analysis completed with fallback data"
    };
  };

  const performFallbackAnalysis = async (text: string) => {
    // Fallback analysis using simple heuristics
    const biasScore = analyzeBiasHeuristic(text);
    const sentimentScore = analyzeSentimentHeuristic(text);
    const entities = extractEntitiesHeuristic(text);
    
    return {
      bias: {
        political: biasScore.political,
        emotional: biasScore.emotional,
        cognitive: biasScore.cognitive,
        overall: biasScore.overall
      },
      sentiment: {
        overall: sentimentScore.overall,
        score: sentimentScore.score
      },
      entities: entities,
      credibility: { score: 0.7, factors: ['Fallback analysis used'] },
      logicalFallacies: generateLogicalFallacies(text),
      rhetoricalDevices: generateRhetoricalAnalysis(text),
      biasPhrases: biasScore.phrases,
      overallAssessment: "Analysis completed using fallback methods"
    };
  };

  const analyzeBiasHeuristic = (text: string) => {
    const lowerText = text.toLowerCase();
    const biasKeywords = {
      political: ['liberal', 'conservative', 'democrat', 'republican', 'progressive', 'traditional'],
      emotional: ['shocking', 'outrageous', 'amazing', 'incredible', 'terrible', 'wonderful'],
      cognitive: ['obviously', 'clearly', 'everyone knows', 'nobody believes', 'common sense']
    };

    let politicalScore = 0.5;
    let emotionalScore = 0.5;
    let cognitiveScore = 0.5;
    const phrases = [];

    // Analyze political bias
    biasKeywords.political.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        politicalScore += 0.1;
        phrases.push(keyword);
      }
    });

    // Analyze emotional bias
    biasKeywords.emotional.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        emotionalScore += 0.1;
        phrases.push(keyword);
      }
    });

    // Analyze cognitive bias
    biasKeywords.cognitive.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        cognitiveScore += 0.1;
        phrases.push(keyword);
      }
    });

    return {
      political: Math.min(1, Math.max(0, politicalScore)),
      emotional: Math.min(1, Math.max(0, emotionalScore)),
      cognitive: Math.min(1, Math.max(0, cognitiveScore)),
      overall: (politicalScore + emotionalScore + cognitiveScore) / 3,
      phrases
    };
  };

  const analyzeSentimentHeuristic = (text: string) => {
    const lowerText = text.toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive', 'success', 'improve'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'fail', 'worse', 'problem'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) positiveCount += matches.length;
    });

    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) negativeCount += matches.length;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return { overall: 'neutral', score: 0.5 };

    const score = positiveCount / total;
    let overall = 'neutral';
    if (score > 0.6) overall = 'positive';
    else if (score < 0.4) overall = 'negative';

    return { overall, score };
  };

  const extractEntitiesHeuristic = (text: string) => {
    // Simple entity extraction using capitalization patterns
    const words = text.split(/\s+/);
    const entities = [];
    const seen = new Set();

    words.forEach(word => {
      if (word.length > 2 && /^[A-Z]/.test(word) && !seen.has(word.toLowerCase())) {
        seen.add(word.toLowerCase());
        entities.push({
          name: word,
          type: 'Unknown',
          count: 1
        });
      }
    });

    return entities.slice(0, 10); // Limit to top 10
  };

  const generateLogicalFallacies = (text: string) => {
    const fallacies = [];
    const lowerText = text.toLowerCase();
    
    // Check for common logical fallacies
    if (lowerText.includes('everyone knows') || lowerText.includes('obviously')) {
      fallacies.push({
        type: 'Appeal to Common Belief',
        description: 'Assumes something is true because many people believe it',
        examples: ['"Everyone knows..."', '"Obviously..."'],
        severity: 'medium'
      });
    }
    
    if (lowerText.includes('if you don\'t support') || lowerText.includes('real americans')) {
      fallacies.push({
        type: 'False Dilemma',
        description: 'Presents only two options when more exist',
        examples: ['"If you don\'t support X, you support Y"'],
        severity: 'high'
      });
    }
    
    if (lowerText.includes('experts say') && !lowerText.includes('according to')) {
      fallacies.push({
        type: 'Appeal to Authority',
        description: 'Uses authority figures to support claims without evidence',
        examples: ['"Experts say..." without citation'],
        severity: 'medium'
      });
    }
    
    return fallacies;
  };

  const generateRhetoricalAnalysis = (text: string) => {
    const devices = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('shocking') || lowerText.includes('outrageous')) {
      devices.push({
        type: 'Loaded Language',
        description: 'Uses emotionally charged words to influence perception',
        impact: 'negative',
        examples: ['Emotionally charged vocabulary']
      });
    }
    
    if (lowerText.includes('we') || lowerText.includes('us') || lowerText.includes('our')) {
      devices.push({
        type: 'Inclusive Language',
        description: 'Uses "we" and "us" to create group identity',
        impact: 'neutral',
        examples: ['"We must..."', '"Our country..."']
      });
    }
    
    return devices;
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

      {/* Service Status Indicator */}
      <div className="service-status-indicator">
        {serviceStatus === 'checking' && (
          <div className="status-checking">
            <FiActivity className="status-icon" />
            <span>Checking analysis service...</span>
          </div>
        )}
        {serviceStatus === 'available' && (
          <div className="status-available">
            <FiCheckCircle className="status-icon" />
            <span>AI Analysis Service Available</span>
          </div>
        )}
        {serviceStatus === 'unavailable' && (
          <div className="status-unavailable">
            <FiAlertTriangle className="status-icon" />
            <span>Using Fallback Analysis (AI service unavailable)</span>
          </div>
        )}
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
                  background: `conic-gradient(${getCredibilityColor(article.analysis.credibility.level)} ${article.analysis.credibility.score * 360}deg, var(--border-color) 0deg)` 
                }}>
                  <span className="score-text">{Math.round(article.analysis.credibility.score * 100)}%</span>
                </div>
                <div className="score-details">
                  <h4>Credibility Level: {article.analysis.credibility.level.toUpperCase()}</h4>
                  <p className="credibility-reason">{article.analysis.credibility.reason}</p>
                </div>
              </div>
              
              {/* Enhanced Analysis Results */}
              {enhancedAnalysis && (
                <div className="enhanced-credibility">
                  <h4>AI-Enhanced Assessment</h4>
                  <div className="enhanced-factors">
                    {enhancedAnalysis.credibility.factors && enhancedAnalysis.credibility.factors.map((factor: string, index: number) => (
                      <div key={index} className="factor-item">
                        <FiCheckCircle className="factor-icon" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bias Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('bias')}
          >
            <div className="section-title">
              <FiTag className="section-icon" />
              <h3>Bias Analysis</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('bias') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('bias') && enhancedAnalysis && (
            <div className="section-content">
              <div className="bias-breakdown">
                <div className="bias-dimension">
                  <span className="dimension-label">Political Bias</span>
                  <div className="bias-bar">
                    <div 
                      className="bias-fill" 
                      style={{ width: `${enhancedAnalysis.bias.political * 100}%` }}
                    ></div>
                  </div>
                  <span className="bias-score">{Math.round(enhancedAnalysis.bias.political * 100)}%</span>
                </div>
                
                <div className="bias-dimension">
                  <span className="dimension-label">Emotional Bias</span>
                  <div className="bias-bar">
                    <div 
                      className="bias-fill" 
                      style={{ width: `${enhancedAnalysis.bias.emotional * 100}%` }}
                    ></div>
                  </div>
                  <span className="bias-score">{Math.round(enhancedAnalysis.bias.emotional * 100)}%</span>
                </div>
                
                <div className="bias-dimension">
                  <span className="dimension-label">Cognitive Bias</span>
                  <div className="bias-bar">
                    <div 
                      className="bias-fill" 
                      style={{ width: `${enhancedAnalysis.bias.cognitive * 100}%` }}
                    ></div>
                  </div>
                  <span className="bias-score">{Math.round(enhancedAnalysis.bias.cognitive * 100)}%</span>
                </div>
              </div>
              
              {enhancedAnalysis.biasPhrases.length > 0 && (
                <div className="bias-phrases">
                  <h4>Detected Bias Phrases</h4>
                  <div className="phrases-list">
                    {enhancedAnalysis.biasPhrases.map((phrase: string, index: number) => (
                      <span key={index} className="bias-phrase">{phrase}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logical Fallacies */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('fallacies')}
          >
            <div className="section-title">
              <FiAlertTriangle className="section-icon" />
              <h3>Logical Fallacies</h3>
              {enhancedAnalysis && enhancedAnalysis.logicalFallacies.length > 0 && (
                <span className="fallacy-count">({enhancedAnalysis.logicalFallacies.length})</span>
              )}
            </div>
            <span className="section-toggle">
              {expandedSections.includes('fallacies') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('fallacies') && enhancedAnalysis && (
            <div className="section-content">
              {enhancedAnalysis.logicalFallacies.length > 0 ? (
                <div className="fallacies-list">
                  {enhancedAnalysis.logicalFallacies.map((fallacy: any, index: number) => (
                    <div key={index} className="fallacy-item">
                      <div className="fallacy-header">
                        <span className="fallacy-type">{fallacy.type}</span>
                        <span className={`fallacy-severity ${fallacy.severity}`}>{fallacy.severity}</span>
                      </div>
                      <p className="fallacy-description">{fallacy.description}</p>
                      {fallacy.examples && fallacy.examples.length > 0 && (
                        <div className="fallacy-examples">
                          <strong>Examples:</strong>
                          <ul>
                            {fallacy.examples.map((example: string, idx: number) => (
                              <li key={idx}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-fallacies">No logical fallacies detected in this article.</p>
              )}
            </div>
          )}
        </div>

        {/* Rhetorical Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('rhetoric')}
          >
            <div className="section-title">
              <FiMessageSquare className="section-icon" />
              <h3>Rhetorical Devices</h3>
              {enhancedAnalysis && enhancedAnalysis.rhetoricalDevices.length > 0 && (
                <span className="device-count">({enhancedAnalysis.rhetoricalDevices.length})</span>
              )}
            </div>
            <span className="section-toggle">
              {expandedSections.includes('rhetoric') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('rhetoric') && enhancedAnalysis && (
            <div className="section-content">
              {enhancedAnalysis.rhetoricalDevices.length > 0 ? (
                <div className="rhetorical-devices-list">
                  {enhancedAnalysis.rhetoricalDevices.map((device: any, index: number) => (
                    <div key={index} className="rhetorical-device-item">
                      <div className="device-header">
                        <span className="device-type">{device.type}</span>
                        <span className={`device-impact ${device.impact}`}>{device.impact}</span>
                      </div>
                      <p className="device-description">{device.description}</p>
                      {device.examples && device.examples.length > 0 && (
                        <div className="device-examples">
                          <strong>Examples:</strong>
                          <ul>
                            {device.examples.map((example: string, idx: number) => (
                              <li key={idx}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-devices">No significant rhetorical devices detected.</p>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('summary')}
          >
            <div className="section-title">
              <FiFileText className="section-icon" />
              <h3>Article Summary</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('summary') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('summary') && (
            <div className="section-content">
              <div className="summary-content">
                <p>{article.analysis.summary}</p>
                <div className="summary-meta">
                  <span className="complexity">
                    <strong>Complexity:</strong> {article.analysis.complexity} - {getComplexityDescription(article.analysis.complexity)}
                  </span>
                  {article.analysis.hasExternalLinks && (
                    <span className="external-links">
                      <FiExternalLink /> Contains external links
                    </span>
                  )}
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
        
        <button 
          onClick={() => performEnhancedAnalysis(article)}
          className="reanalyze-button"
          disabled={isAnalyzing}
        >
          <FiRefreshCw /> {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
        </button>
      </div>
    </div>
  );
};

export default ArticleAnalysisPage;
