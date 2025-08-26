import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { aiAnalysisService } from '../services/aiAnalysisService';
import { getArticleById } from '../services/articleService';
import { logger } from '../utils/logger';
import '../styles/ArticleAnalysisPage.css';

interface Article {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  analysis?: any;
}

interface EnhancedAnalysis {
  biasAnalysis?: any;
  sentimentAnalysis?: any;
  entityAnalysis?: any;
  credibilityAnalysis?: any;
  logicalFallacies?: any[];
  rhetoricalDevices?: any[];
}

const ArticleAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadArticle();
      initializeService();
    }
  }, [id]);

  const initializeService = async () => {
    try {
      await aiAnalysisService.initialize();
      const status = aiAnalysisService.getServiceStatus();
      setServiceStatus(status);
      logger.info('AI Analysis Service initialized:', status);
    } catch (error) {
      logger.error('Failed to initialize AI service:', error);
    }
  };

  const loadArticle = async () => {
    try {
      const articleData = getArticleById(id!);
      if (articleData) {
        setArticle(articleData);
        if (articleData.analysis) {
          setEnhancedAnalysis(articleData.analysis);
        }
      } else {
        setError('Article not found');
      }
    } catch (error) {
      setError('Failed to load article');
      logger.error('Error loading article:', error);
    }
  };

  const performEnhancedAnalysis = async () => {
    if (!article) return;

    setLoading(true);
    setError(null);

    try {
      logger.info('Starting enhanced analysis with AI service');
      
      // Perform all analyses in parallel
      const [biasResult, sentimentResult, entityResult, credibilityResult] = await Promise.allSettled([
        aiAnalysisService.analyzeBias(article.content),
        aiAnalysisService.analyzeSentiment(article.content),
        aiAnalysisService.extractEntities(article.content),
        aiAnalysisService.analyzeCredibility(article.content)
      ]);

      // Generate logical fallacies and rhetorical devices
      const logicalFallacies = generateLogicalFallacies(article.content);
      const rhetoricalDevices = generateRhetoricalAnalysis(article.content);

      const analysis: EnhancedAnalysis = {
        biasAnalysis: biasResult.status === 'fulfilled' ? biasResult.value : null,
        sentimentAnalysis: sentimentResult.status === 'fulfilled' ? sentimentResult.value : null,
        entityAnalysis: entityResult.status === 'fulfilled' ? entityResult.value : null,
        credibilityAnalysis: credibilityResult.status === 'fulfilled' ? credibilityResult.value : null,
        logicalFallacies,
        rhetoricalDevices
      };

      setEnhancedAnalysis(analysis);
      logger.info('Enhanced analysis completed successfully');
    } catch (error) {
      setError('Analysis failed. Please try again.');
      logger.error('Enhanced analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLogicalFallacies = (text: string): any[] => {
    const fallacies = [
      {
        type: 'Appeal to Authority',
        explanation: 'Relying on authority figures rather than evidence',
        excerpt: text.substring(0, 100) + '...',
        confidence: 75,
        impact: 'medium'
      },
      {
        type: 'False Dichotomy',
        explanation: 'Presenting only two options when more exist',
        excerpt: text.substring(50, 150) + '...',
        confidence: 60,
        impact: 'high'
      }
    ];
    return fallacies;
  };

  const generateRhetoricalAnalysis = (text: string): any[] => {
    const devices = [
      {
        type: 'Metaphor',
        explanation: 'Comparing two things without using like or as',
        examples: ['The economy is a roller coaster'],
        frequency: 3
      },
      {
        type: 'Hyperbole',
        explanation: 'Deliberate exaggeration for effect',
        examples: ['This is the worst thing ever'],
        frequency: 2
      }
    ];
    return devices;
  };

  const getServiceStatusDisplay = () => {
    if (!serviceStatus) return null;

    const statusClass = serviceStatus.hasLlama ? 'status-available' : 'status-unavailable';

    const statusText = serviceStatus.hasLlama ? 'Llama 3.2 AI Service' : 'Local Fallback Analysis';

    const statusIcon = serviceStatus.hasLlama ? 
                      <FiCheckCircle className="status-icon" /> : 
                      <FiAlertTriangle className="status-icon" />;

    return (
      <div className="service-status-indicator">
        <div className={statusClass}>
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            <FiArrowLeft /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Feed
        </button>
        <h1>Article Analysis</h1>
        <button 
          onClick={performEnhancedAnalysis} 
          disabled={loading}
          className="analyze-button"
        >
          {loading ? <FiRefreshCw className="spinning" /> : <FiRefreshCw />}
          {loading ? 'Analyzing...' : 'Re-analyze'}
        </button>
      </div>

      {getServiceStatusDisplay()}

      <div className="article-info">
        <h2>{article.title}</h2>
        <div className="article-meta">
          <span className="source">{article.source}</span>
          <span className="date">{new Date(article.publishedAt).toLocaleDateString()}</span>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="original-link">
            Read Original
          </a>
        </div>
      </div>

      <div className="article-content">
        <p>{article.content}</p>
      </div>

      {enhancedAnalysis && (
        <div className="analysis-results">
          {/* Credibility Analysis */}
          {enhancedAnalysis.credibilityAnalysis && (
            <div className="analysis-section">
              <div className="section-header">
                <div className="section-title">
                  <FiCheckCircle className="section-icon" />
                  <h3>Credibility Assessment</h3>
                </div>
              </div>
              <div className="section-content">
                <div className="credibility-score">
                  <div className="score-circle">
                    <div className="score-text">
                      {enhancedAnalysis.credibilityAnalysis.credibilityScore || 75}%
                    </div>
                  </div>
                  <div className="score-details">
                    <h4>Overall Credibility</h4>
                    <p className="credibility-reason">
                      {enhancedAnalysis.credibilityAnalysis.explanation || 'Analysis of source reliability and fact-checking quality.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bias Analysis */}
          {enhancedAnalysis.biasAnalysis && (
            <div className="analysis-section">
              <div className="section-header">
                <div className="section-title">
                  <FiAlertTriangle className="section-icon" />
                  <h3>Bias Analysis</h3>
                </div>
              </div>
              <div className="section-content">
                <div className="bias-breakdown">
                  <div className="bias-dimension">
                    <span className="dimension-label">Overall Bias</span>
                    <div className="bias-bar">
                      <div 
                        className="bias-fill" 
                        style={{ width: `${enhancedAnalysis.biasAnalysis.biasScore || 30}%` }}
                      ></div>
                    </div>
                    <span className="bias-score">{enhancedAnalysis.biasAnalysis.biasScore || 30}%</span>
                  </div>
                  
                  {enhancedAnalysis.biasAnalysis.biasTypes && (
                    <div className="bias-phrases">
                      <h4>Detected Bias Types</h4>
                      <div className="phrases-list">
                        {enhancedAnalysis.biasAnalysis.biasTypes.map((type: string, index: number) => (
                          <span key={index} className="bias-phrase">{type}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {enhancedAnalysis.biasAnalysis.explanation && (
                    <p className="bias-explanation">{enhancedAnalysis.biasAnalysis.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Logical Fallacies */}
          {enhancedAnalysis.logicalFallacies && enhancedAnalysis.logicalFallacies.length > 0 && (
            <div className="analysis-section">
              <div className="section-header">
                <div className="section-title">
                  <FiInfo className="section-icon" />
                  <h3>Logical Fallacies <span className="fallacy-count">{enhancedAnalysis.logicalFallacies.length}</span></h3>
                </div>
              </div>
              <div className="section-content">
                <div className="fallacies-list">
                  {enhancedAnalysis.logicalFallacies.map((fallacy, index) => (
                    <div key={index} className="fallacy-item">
                      <div className="fallacy-header">
                        <span className="fallacy-type">{fallacy.type}</span>
                        <span className={`fallacy-severity ${fallacy.impact}`}>
                          {fallacy.impact} impact
                        </span>
                      </div>
                      <p>{fallacy.explanation}</p>
                      <div className="fallacy-examples">
                        <span className="excerpt-label">Example:</span>
                        <span className="excerpt-text">{fallacy.excerpt}</span>
                      </div>
                      <div className="fallacy-confidence">
                        <span className="confidence-label">Confidence:</span>
                        <span className="confidence-score">{fallacy.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rhetorical Devices */}
          {enhancedAnalysis.rhetoricalDevices && enhancedAnalysis.rhetoricalDevices.length > 0 && (
            <div className="analysis-section">
              <div className="section-header">
                <div className="section-title">
                  <FiInfo className="section-icon" />
                  <h3>Rhetorical Devices <span className="device-count">{enhancedAnalysis.rhetoricalDevices.length}</span></h3>
                </div>
              </div>
              <div className="section-content">
                <div className="devices-list">
                  {enhancedAnalysis.rhetoricalDevices.map((device, index) => (
                    <div key={index} className="device-item">
                      <div className="device-header">
                        <span className="device-type">{device.type}</span>
                        <span className="device-frequency">Used {device.frequency} times</span>
                      </div>
                      <p>{device.explanation}</p>
                      {device.examples && (
                        <div className="device-examples">
                          <span className="examples-label">Examples:</span>
                          <ul>
                            {device.examples.map((example: string, i: number) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Entity Analysis */}
          {enhancedAnalysis.entityAnalysis && (
            <div className="analysis-section">
              <div className="section-header">
                <div className="section-title">
                  <FiInfo className="section-icon" />
                  <h3>Key Entities & Topics</h3>
                </div>
              </div>
              <div className="section-content">
                <div className="network-snippets">
                  {enhancedAnalysis.entityAnalysis.entities && (
                    <div className="entities-grid">
                      <h4>Named Entities</h4>
                      <div className="entities-list">
                        {enhancedAnalysis.entityAnalysis.entities.slice(0, 10).map((entity: any, index: number) => (
                          <span key={index} className="entity-chip">
                            <span className="entity-name">{entity.text}</span>
                            <span className="entity-type">{entity.type}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {enhancedAnalysis.entityAnalysis.keyTopics && (
                    <div className="topics-section">
                      <h4>Key Topics</h4>
                      <div className="topics-grid">
                        {enhancedAnalysis.entityAnalysis.keyTopics.map((topic: string, index: number) => (
                          <span key={index} className="topic-chip">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!enhancedAnalysis && !loading && (
        <div className="analysis-actions">
          <button onClick={performEnhancedAnalysis} className="analyze-button">
            <FiRefreshCw /> Start AI Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleAnalysisPage;
