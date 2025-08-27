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
    // Enhanced logical fallacy detection with more comprehensive analysis
    const fallacies = [];
    const lowerText = text.toLowerCase();
    
    // Check for common logical fallacies with more sophisticated detection
    if (lowerText.includes('experts say') || lowerText.includes('authorities agree') || lowerText.includes('scientists confirm')) {
      fallacies.push({
        type: 'Appeal to Authority',
        explanation: 'The text relies on authority figures rather than presenting concrete evidence or logical arguments. This can be problematic when the authority is not relevant to the specific claim being made.',
        excerpt: text.substring(Math.max(0, lowerText.indexOf('experts say') - 50), Math.min(text.length, lowerText.indexOf('experts say') + 100)) + '...',
        confidence: 85,
        impact: 'medium'
      });
    }
    
    if (lowerText.includes('either') && lowerText.includes('or') && (lowerText.includes('choice') || lowerText.includes('option'))) {
      fallacies.push({
        type: 'False Dichotomy',
        explanation: 'The text presents a situation as having only two possible outcomes or choices, when in reality there are more nuanced options available. This oversimplifies complex issues.',
        excerpt: text.substring(Math.max(0, lowerText.indexOf('either') - 50), Math.min(text.length, lowerText.indexOf('either') + 150)) + '...',
        confidence: 80,
        impact: 'high'
      });
    }
    
    if (lowerText.includes('everyone knows') || lowerText.includes('obviously') || lowerText.includes('clearly')) {
      fallacies.push({
        type: 'Appeal to Common Belief',
        explanation: 'The text assumes something is true because many people believe it, without providing evidence. This is a form of argumentum ad populum.',
        excerpt: text.substring(Math.max(0, lowerText.indexOf('everyone knows') - 50), Math.min(text.length, lowerText.indexOf('everyone knows') + 100)) + '...',
        confidence: 75,
        impact: 'medium'
      });
    }
    
    if (lowerText.includes('slippery slope') || (lowerText.includes('if we') && lowerText.includes('then') && lowerText.includes('next'))) {
      fallacies.push({
        type: 'Slippery Slope',
        explanation: 'The text suggests that a relatively small first step will inevitably lead to a chain of related events culminating in some significant impact, without demonstrating the causal connections.',
        excerpt: text.substring(Math.max(0, lowerText.indexOf('if we') - 50), Math.min(text.length, lowerText.indexOf('if we') + 200)) + '...',
        confidence: 70,
        impact: 'high'
      });
    }
    
    if (lowerText.includes('correlation') && lowerText.includes('causation')) {
      fallacies.push({
        type: 'Correlation vs Causation',
        explanation: 'The text may be confusing correlation with causation, suggesting that because two things happen together, one causes the other.',
        excerpt: text.substring(Math.max(0, lowerText.indexOf('correlation') - 50), Math.min(text.length, lowerText.indexOf('correlation') + 100)) + '...',
        confidence: 65,
        impact: 'medium'
      });
    }
    
    return fallacies;
  };

  const generateRhetoricalAnalysis = (text: string): any[] => {
    // Enhanced rhetorical device detection with more comprehensive analysis
    const devices = [];
    const lowerText = text.toLowerCase();
    
    // Check for metaphors and analogies
    if (lowerText.includes('like') || lowerText.includes('as') || lowerText.includes('similar to')) {
      devices.push({
        type: 'Simile',
        explanation: 'The text uses explicit comparisons using "like," "as," or "similar to" to make abstract concepts more concrete and relatable.',
        examples: [text.substring(Math.max(0, lowerText.indexOf('like') - 30), Math.min(text.length, lowerText.indexOf('like') + 50))],
        frequency: (lowerText.match(/like|as|similar to/g) || []).length
      });
    }
    
    // Check for hyperbole and exaggeration
    if (lowerText.includes('never') || lowerText.includes('always') || lowerText.includes('everyone') || lowerText.includes('nobody') || lowerText.includes('worst') || lowerText.includes('best')) {
      devices.push({
        type: 'Hyperbole',
        explanation: 'The text uses deliberate exaggeration for emphasis or dramatic effect, often using absolute terms that may not be literally true.',
        examples: [text.substring(Math.max(0, lowerText.indexOf('never') - 30), Math.min(text.length, lowerText.indexOf('never') + 50))],
        frequency: (lowerText.match(/never|always|everyone|nobody|worst|best/g) || []).length
      });
    }
    
    // Check for loaded language and emotional appeals
    if (lowerText.includes('shocking') || lowerText.includes('outrageous') || lowerText.includes('amazing') || lowerText.includes('incredible') || lowerText.includes('terrible')) {
      devices.push({
        type: 'Loaded Language',
        explanation: 'The text uses emotionally charged words designed to evoke strong emotional responses from readers, potentially influencing their perception of the topic.',
        examples: [text.substring(Math.max(0, lowerText.indexOf('shocking') - 30), Math.min(text.length, lowerText.indexOf('shocking') + 50))],
        frequency: (lowerText.match(/shocking|outrageous|amazing|incredible|terrible/g) || []).length
      });
    }
    
    // Check for inclusive language
    if (lowerText.includes('we') || lowerText.includes('us') || lowerText.includes('our') || lowerText.includes('together')) {
      devices.push({
        type: 'Inclusive Language',
        explanation: 'The text uses "we," "us," and "our" to create a sense of shared identity and community, potentially building rapport with readers.',
        examples: [text.substring(Math.max(0, lowerText.indexOf('we ') - 30), Math.min(text.length, lowerText.indexOf('we ') + 50))],
        frequency: (lowerText.match(/we |us |our |together/g) || []).length
      });
    }
    
    // Check for rhetorical questions
    if (lowerText.includes('?') && (lowerText.includes('how') || lowerText.includes('why') || lowerText.includes('what'))) {
      devices.push({
        type: 'Rhetorical Questions',
        explanation: 'The text poses questions that are not meant to be answered literally, but rather to make a point or encourage readers to think about an issue.',
        examples: [text.substring(Math.max(0, lowerText.indexOf('?') - 50), Math.min(text.length, lowerText.indexOf('?') + 10))],
        frequency: (lowerText.match(/\?/g) || []).length
      });
    }
    
    // Check for repetition and emphasis
    const repeatedWords = lowerText.match(/\b(\w+)\b/g)?.reduce((acc: any, word: string) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    
    if (repeatedWords) {
      const mostRepeated = Object.entries(repeatedWords)
        .filter(([word, count]: [string, any]) => count > 3 && word.length > 3)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 3);
      
      if (mostRepeated.length > 0) {
        devices.push({
          type: 'Repetition',
          explanation: 'The text uses deliberate repetition of key words or phrases to emphasize important points and make them more memorable.',
          examples: mostRepeated.map(([word]) => `"${word}" (repeated ${repeatedWords[word]} times)`),
          frequency: mostRepeated.reduce((sum, [, count]) => sum + count, 0)
        });
      }
    }
    
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
