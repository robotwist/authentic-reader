import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiShield, FiTag, FiTrendingUp, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { articleService, Article } from '../services/articleService';
import AnalysisTooltip from '../components/AnalysisTooltip';
import { processArticleDescription } from '../utils/htmlUtils';
import '../styles/BalancedFeedPage.css';

const BalancedFeedPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedArticles = await articleService.getArticles();
      setArticles(fetchedArticles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="balanced-feed-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading curated articles...</p>
          <p className="loading-subtitle">Preparing your personalized reading experience</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="balanced-feed-page">
        <div className="error-container">
          <h2>Error Loading Articles</h2>
          <p>{error}</p>
          <button onClick={fetchArticles} className="retry-button">
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="balanced-feed-page">
      <div className="feed-header">
        <div className="header-content">
          <h1>Curated News Feed</h1>
          <p className="subtitle">High-quality articles with comprehensive AI analysis</p>
          
          <div className="feed-controls">
            <button onClick={fetchArticles} className="refresh-button">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="articles-container">
        {articles.map((article, index) => (
          <article key={article.articleId || index} className="article-card">
            <div className="article-header">
              <div className="source-info">
                <span className="source-badge">
                  {article.source}
                </span>
                <span className="bias-category">Balanced</span>
              </div>
              
              <h2 className="article-title">
                <Link 
                  to={`/analysis/${article.articleId || index}`}
                  state={{ article }}
                  className="article-link"
                >
                  {article.title}
                </Link>
              </h2>
              
              <div className="article-meta">
                <span className="article-author">{typeof article.author === 'string' ? article.author : 'Unknown Author'}</span>
                <span className="article-date">{formatDate(article.pubDate)}</span>
              </div>
            </div>

            <div className="article-content">
              <p className="article-description">
                {(() => {
                  const processed = processArticleDescription(article.description || '', 200);
                  return processed.truncated;
                })()}
              </p>
            </div>

            {article.analysis && (
              <div className="article-analysis">
                <div className="analysis-grid">
                  <AnalysisTooltip
                    title="Reading Time"
                    explanation="Estimated time to read this article based on word count and complexity."
                    icon={<FiClock />}
                    className="metric-tooltip"
                  >
                    <div className="analysis-item">
                      <FiClock className="analysis-icon" />
                      <span className="analysis-value">{article.analysis.readingTime} min</span>
                    </div>
                  </AnalysisTooltip>

                  <AnalysisTooltip
                    title="Credibility Score"
                    explanation={`This article has a ${article.analysis.credibility.level} credibility rating (${Math.round(article.analysis.credibility.score * 100)}%) based on source reputation, fact-checking, citation quality, author expertise, and transparency. ${article.analysis.credibility.reason}`}
                    icon={<FiShield />}
                    className="credibility-tooltip"
                  >
                    <div className="analysis-item">
                      <FiShield className="analysis-icon" />
                      <span
                        className="analysis-value credibility-badge"
                        style={{ backgroundColor: getCredibilityColor(article.analysis.credibility.level) }}
                      >
                        {article.analysis.credibility.level} ({Math.round(article.analysis.credibility.score * 100)}%)
                      </span>
                    </div>
                  </AnalysisTooltip>

                  {article.analysis.biasAnalysis && article.analysis.biasAnalysis.direction && (
                    <AnalysisTooltip
                      title="Enhanced Bias Analysis"
                      explanation={`This article shows ${article.analysis.biasAnalysis.direction} bias with ${Math.round(article.analysis.biasAnalysis.confidence * 100)}% confidence. Overall bias score: ${Math.round(article.analysis.biasAnalysis.enhancedAnalysis.overallBias * 100)}%. ${article.analysis.biasAnalysis.enhancedAnalysis.biasExplanation}`}
                      icon={<FiTag />}
                      className="bias-tooltip"
                    >
                      <div className="analysis-item">
                        <FiTag className="analysis-icon" />
                        <span className="analysis-value">
                          Bias: {article.analysis.biasAnalysis.direction} ({Math.round(article.analysis.biasAnalysis.confidence * 100)}%)
                        </span>
                      </div>
                    </AnalysisTooltip>
                  )}

                  {article.analysis.networkAnalysis && article.analysis.networkAnalysis.sentimentAnalysis && (
                    <AnalysisTooltip
                      title="Sentiment Analysis"
                      explanation={`Overall sentiment: ${article.analysis.networkAnalysis.sentimentAnalysis.overall} (${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.score * 100)}%). Positive: ${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.breakdown.positive * 100)}%, Negative: ${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.breakdown.negative * 100)}%, Neutral: ${Math.round(article.analysis.networkAnalysis.sentimentAnalysis.breakdown.neutral * 100)}%`}
                      icon={<FiTrendingUp />}
                      className="sentiment-tooltip"
                    >
                      <div className="analysis-item">
                        <FiTrendingUp className="analysis-icon" />
                        <span 
                          className="analysis-value sentiment-badge"
                          style={{ backgroundColor: getSentimentColor(article.analysis.networkAnalysis.sentimentAnalysis.overall) }}
                        >
                          {article.analysis.networkAnalysis.sentimentAnalysis.overall}
                        </span>
                      </div>
                    </AnalysisTooltip>
                  )}
                </div>

                {/* Enhanced Credibility Factors */}
                {article.analysis.credibility.factors && (
                  <div className="credibility-factors">
                    <h4 className="factors-title">
                      <FiShield className="icon" />
                      Credibility Factors
                    </h4>
                    <div className="factors-grid">
                      <div className="factor-item">
                        <span className="factor-label">Source Reputation</span>
                        <div className="factor-bar">
                          <div 
                            className="factor-fill" 
                            style={{ 
                              width: `${article.analysis.credibility.factors.sourceReputation * 100}%`,
                              backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                            }}
                          ></div>
                        </div>
                        <span className="factor-score">{Math.round(article.analysis.credibility.factors.sourceReputation * 100)}%</span>
                      </div>
                      <div className="factor-item">
                        <span className="factor-label">Fact Checking</span>
                        <div className="factor-bar">
                          <div 
                            className="factor-fill" 
                            style={{ 
                              width: `${article.analysis.credibility.factors.factChecking * 100}%`,
                              backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                            }}
                          ></div>
                        </div>
                        <span className="factor-score">{Math.round(article.analysis.credibility.factors.factChecking * 100)}%</span>
                      </div>
                      <div className="factor-item">
                        <span className="factor-label">Citation Quality</span>
                        <div className="factor-bar">
                          <div 
                            className="factor-fill" 
                            style={{ 
                              width: `${article.analysis.credibility.factors.citationQuality * 100}%`,
                              backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                            }}
                          ></div>
                        </div>
                        <span className="factor-score">{Math.round(article.analysis.credibility.factors.citationQuality * 100)}%</span>
                      </div>
                      <div className="factor-item">
                        <span className="factor-label">Author Expertise</span>
                        <div className="factor-bar">
                          <div 
                            className="factor-fill" 
                            style={{ 
                              width: `${article.analysis.credibility.factors.authorExpertise * 100}%`,
                              backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                            }}
                          ></div>
                        </div>
                        <span className="factor-score">{Math.round(article.analysis.credibility.factors.authorExpertise * 100)}%</span>
                      </div>
                      <div className="factor-item">
                        <span className="factor-label">Transparency</span>
                        <div className="factor-bar">
                          <div 
                            className="factor-fill" 
                            style={{ 
                              width: `${article.analysis.credibility.factors.transparency * 100}%`,
                              backgroundColor: getCredibilityColor(article.analysis.credibility.level)
                            }}
                          ></div>
                        </div>
                        <span className="factor-score">{Math.round(article.analysis.credibility.factors.transparency * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logical Fallacies */}
                {article.analysis.logicalFallacies && article.analysis.logicalFallacies.length > 0 && (
                  <div className="fallacies-section">
                    <h4 className="fallacies-title">
                      <FiAlertTriangle className="icon" />
                      Logical Fallacies Detected ({article.analysis.logicalFallacies.length})
                    </h4>
                    <div className="fallacies-grid">
                      {article.analysis.logicalFallacies.map((fallacy, idx) => (
                        <div key={idx} className="fallacy-card">
                          <div className="fallacy-header">
                            <span 
                              className="fallacy-type"
                              style={{ backgroundColor: getImpactColor(fallacy.impact) }}
                            >
                              {fallacy.type}
                            </span>
                            <span 
                              className="fallacy-impact"
                              style={{ backgroundColor: getImpactColor(fallacy.impact) }}
                            >
                              {fallacy.impact} impact
                            </span>
                          </div>
                          <p className="fallacy-explanation">{fallacy.explanation}</p>
                          {fallacy.excerpt && (
                            <div className="fallacy-excerpt">
                              <span className="excerpt-label">Example:</span>
                              <span className="excerpt-text">"{fallacy.excerpt}"</span>
                            </div>
                          )}
                          <div className="fallacy-confidence">
                            <span className="confidence-label">Confidence:</span>
                            <span className="confidence-score">{Math.round(fallacy.confidence * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Bias Analysis */}
                {article.analysis.biasAnalysis && article.analysis.biasAnalysis.enhancedAnalysis && (
                  <div className="bias-breakdown">
                    <h4 className="bias-title">
                      <FiTag className="icon" />
                      Bias Analysis Breakdown
                    </h4>
                    <div className="bias-grid">
                      <div className="bias-item">
                        <span className="bias-label">Language Bias</span>
                        <div className="bias-bar">
                          <div 
                            className="bias-fill" 
                            style={{ width: `${article.analysis.biasAnalysis.enhancedAnalysis.languageBias * 100}%` }}
                          ></div>
                        </div>
                        <span className="bias-score">{Math.round(article.analysis.biasAnalysis.enhancedAnalysis.languageBias * 100)}%</span>
                      </div>
                      <div className="bias-item">
                        <span className="bias-label">Framing Bias</span>
                        <div className="bias-bar">
                          <div 
                            className="bias-fill" 
                            style={{ width: `${article.analysis.biasAnalysis.enhancedAnalysis.framingBias * 100}%` }}
                          ></div>
                        </div>
                        <span className="bias-score">{Math.round(article.analysis.biasAnalysis.enhancedAnalysis.framingBias * 100)}%</span>
                      </div>
                      <div className="bias-item">
                        <span className="bias-label">Source Bias</span>
                        <div className="bias-bar">
                          <div 
                            className="bias-fill" 
                            style={{ width: `${article.analysis.biasAnalysis.enhancedAnalysis.sourceBias * 100}%` }}
                          ></div>
                        </div>
                        <span className="bias-score">{Math.round(article.analysis.biasAnalysis.enhancedAnalysis.sourceBias * 100)}%</span>
                      </div>
                      <div className="bias-item">
                        <span className="bias-label">Selection Bias</span>
                        <div className="bias-bar">
                          <div 
                            className="bias-fill" 
                            style={{ width: `${article.analysis.biasAnalysis.enhancedAnalysis.selectionBias * 100}%` }}
                          ></div>
                        </div>
                        <span className="bias-score">{Math.round(article.analysis.biasAnalysis.enhancedAnalysis.selectionBias * 100)}%</span>
                      </div>
                    </div>
                    <div className="bias-explanation">
                      <FiInfo className="icon" />
                      <span>{article.analysis.biasAnalysis.enhancedAnalysis.biasExplanation}</span>
                    </div>
                  </div>
                )}

                {/* Network Analysis */}
                {article.analysis.networkAnalysis && article.analysis.networkAnalysis.topEntities && Array.isArray(article.analysis.networkAnalysis.topEntities) && article.analysis.networkAnalysis.topEntities.length > 0 && (
                  <div className="network-snippets">
                    <h4 className="network-title">
                      <FiTrendingUp className="icon" />
                      Key Topics & Entities
                    </h4>
                    <div className="entities-grid">
                      {article.analysis.networkAnalysis.topEntities.slice(0, 4).map((e, idx) => (
                        <span key={idx} className="entity-chip">
                          <span className="entity-name">{typeof e.name === 'string' ? e.name : 'Unknown'}</span>
                          <span className="entity-type">{e.type}</span>
                          <span className="entity-count">({e.count})</span>
                        </span>
                      ))}
                    </div>
                    {article.analysis.networkAnalysis.keyTopics && (
                      <div className="topics-section">
                        <span className="topics-label">Key Topics:</span>
                        <div className="topics-grid">
                          {article.analysis.networkAnalysis.keyTopics.slice(0, 3).map((topic, idx) => (
                            <span key={idx} className="topic-chip">{topic}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="article-actions">
              <Link 
                to={`/analysis/${article.articleId || index}`} 
                state={{ article }}
                className="analyze-button"
              >
                Analyze Article
              </Link>
              
              <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="read-original-button"
              >
                Read Original
              </a>
            </div>
          </article>
        ))}
      </div>

      {articles.length === 0 && !loading && (
        <div className="no-articles">
          <h2>No articles found</h2>
          <p>Try refreshing the feed.</p>
        </div>
      )}
    </div>
  );
};

export default BalancedFeedPage;
