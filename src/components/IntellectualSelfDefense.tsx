import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed React Icons import - using text-based indicators instead
import { intellectualSelfDefenseService, DailyArticle } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './IntellectualSelfDefense.css';

interface IntellectualSelfDefenseProps {
  onArticleSelect?: (article: DailyArticle) => void;
}

const IntellectualSelfDefense: React.FC<IntellectualSelfDefenseProps> = ({ onArticleSelect }) => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<DailyArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<DailyArticle | null>(null);

  useEffect(() => {
    loadTodaysArticles();
  }, []);

  const loadTodaysArticles = async () => {
    try {
      setLoading(true);
      logger.info('Loading today\'s intellectual self defense course...');
      console.log('Loading today\'s intellectual self defense course...');
      
      const todaysArticles = await intellectualSelfDefenseService.getTodaysArticles();
      
      console.log('Articles received from service:', {
        count: todaysArticles?.length || 0,
        articles: todaysArticles?.map(a => ({ id: a.id, title: a.title })) || []
      });
      
      logger.info('Articles received from service:', {
        count: todaysArticles?.length || 0,
        articles: todaysArticles?.map(a => ({ id: a.id, title: a.title })) || []
      });
      
      if (todaysArticles && todaysArticles.length > 0) {
        setArticles(todaysArticles);
        console.log(`Successfully loaded ${todaysArticles.length} articles for deep analysis`);
        logger.info(`Successfully loaded ${todaysArticles.length} articles for deep analysis`);
      } else {
        console.warn('No articles loaded - this may indicate a service issue');
        logger.warn('No articles loaded - this may indicate a service issue');
        // Set empty array to prevent errors
        setArticles([]);
      }
    } catch (error) {
      console.error('Failed to load intellectual self defense course:', error);
      logger.error('Failed to load intellectual self defense course:', error);
      // Set empty array to prevent errors
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleSelect = (article: DailyArticle) => {
    console.log('Article selected:', article);
    console.log('Article ID:', article.id);
    const encodedId = encodeURIComponent(article.id);
    console.log('Navigating to:', `/article/${encodedId}`);
    
    setSelectedArticle(article);
    if (onArticleSelect) {
      onArticleSelect(article);
    }
    // Navigate to the article reader page
    navigate(`/article/${encodedId}`);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return '#ff4757';
      case 'significant': return '#ffa502';
      case 'notable': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const getImportanceText = (importance: string) => {
    switch (importance) {
      case 'critical': return 'CRITICAL';
      case 'significant': return 'SIGNIFICANT';
      case 'notable': return 'NOTABLE';
      default: return 'STANDARD';
    }
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'profound': return '#8e44ad';
      case 'deep': return '#3498db';
      case 'intermediate': return '#f39c12';
      case 'surface': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div className="daily-deep-dive">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Preparing Your Intellectual Self Defense Course</h3>
          <p>Curating high-quality articles for critical thinking training</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="daily-deep-dive">
        <div className="error-container">
          <div className="error-text">
            WARNING
          </div>
          <h2>Course Temporarily Unavailable</h2>
          <p>We are having trouble loading today's articles. This could be due to:</p>
          <ul>
            <li>Network connectivity issues</li>
            <li>Backend service maintenance</li>
            <li>Analysis service temporarily unavailable</li>
          </ul>
          <button 
            className="retry-button" 
            onClick={loadTodaysArticles}
          >
            Try Again
          </button>
          <p className="fallback-info">
            In the meantime, you can explore our <a href="/forces-for-good">Forces for Good</a> section 
            or use the search feature to find other content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-deep-dive">
      <div className="deep-dive-header">
        <h1>Intellectual Self Defense Course</h1>
        <p className="subtitle">Your daily training in critical thinking and media literacy</p>
        <div className="header-stats">
          <span className="stat">
            {articles.length} Articles
          </span>
          <span className="stat">
            Expert Analysis
          </span>
          <span className="stat">
            Critical Thinking
          </span>
        </div>
      </div>

      <div className="deep-dive-content">
        <div className="articles-grid">
          {articles.map((article) => (
            <div 
              key={article.id} 
              className={`article-card ${selectedArticle?.id === article.id ? 'selected' : ''}`}
              onClick={() => handleArticleSelect(article)}
            >
              <div className="article-header">
                <div className="article-meta">
                  <span className="source">{article.source}</span>
                  <span className="category">{article.category}</span>
                </div>
                <div className="article-importance">
                  <span 
                    className="importance-badge"
                    style={{ backgroundColor: getImportanceColor(article.importance) }}
                  >
                    {getImportanceText(article.importance)}
                  </span>
                </div>
              </div>

              <h3 className="article-title">{article.title}</h3>
              
              <div className="analysis-preview">
                <div className="complexity-indicator">
                  <span 
                    className="complexity-badge"
                    style={{ backgroundColor: getComplexityColor(article.chomskyAnalysis.intellectualDepth.complexityLevel) }}
                  >
                    {article.chomskyAnalysis.intellectualDepth.complexityLevel}
                  </span>
                </div>
                
                <div className="depth-scores">
                  <div className="score-item">
                    <span className="score-label">Analytical Depth</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${article.chomskyAnalysis.intellectualDepth.analyticalDepth * 10}%` }}
                      ></div>
                    </div>
                    <span className="score-value">{article.chomskyAnalysis.intellectualDepth.analyticalDepth}/10</span>
                  </div>
                  
                  <div className="score-item">
                    <span className="score-label">Critical Thinking</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${article.chomskyAnalysis.intellectualDepth.criticalThinking * 10}%` }}
                      ></div>
                    </div>
                    <span className="score-value">{article.chomskyAnalysis.intellectualDepth.criticalThinking}/10</span>
                  </div>
                  
                  <div className="score-item">
                    <span className="score-label">Intellectual Rigor</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${article.chomskyAnalysis.intellectualDepth.intellectualRigor * 10}%` }}
                      ></div>
                    </div>
                    <span className="score-value">{article.chomskyAnalysis.intellectualDepth.intellectualRigor}/10</span>
                  </div>
                </div>
              </div>

              <div className="key-insights">
                <h4>Key Insights</h4>
                <ul>
                  {article.chomskyAnalysis.synthesis.keyInsights.slice(0, 2).map((insight, index) => (
                    <li key={`${article.id}-insight-${index}`}>{insight}</li>
                  ))}
                </ul>
              </div>

              <div className="selection-reason">
                <p><strong>Selection Reason:</strong> {article.selectionReason}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedArticle && (
          <div className="analysis-detail">
            <div className="analysis-header">
              <h2>{selectedArticle.title}</h2>
              <div className="analysis-summary">
                <div className="intellectual-metrics">
                  <div className="metric">
                    <span className="metric-label">Complexity</span>
                    <span 
                      className="metric-value"
                      style={{ color: getComplexityColor(selectedArticle.chomskyAnalysis.intellectualDepth.complexityLevel) }}
                    >
                      {selectedArticle.chomskyAnalysis.intellectualDepth.complexityLevel}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Analytical Depth</span>
                    <span className="metric-value">{selectedArticle.chomskyAnalysis.intellectualDepth.analyticalDepth}/10</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Critical Thinking</span>
                    <span className="metric-value">{selectedArticle.chomskyAnalysis.intellectualDepth.criticalThinking}/10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="analysis-content">
              <div className="analysis-section">
                <h3>Key Insights</h3>
                <ul className="insights-list">
                  {selectedArticle.chomskyAnalysis.synthesis.keyInsights.map((insight, index) => (
                    <li key={`${selectedArticle.id}-insight-${index}`}>{insight}</li>
                  ))}
                </ul>
              </div>

              <div className="analysis-section">
                <h3>Critical Analysis</h3>
                <div className="critical-points">
                  <div className="critical-subsection">
                    <h4>What's Not Being Said</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.criticalAnalysis.whatIsNotSaid.slice(0, 2).map((item, index) => (
                        <li key={`${selectedArticle.id}-not-said-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="critical-subsection">
                    <h4>Power Structures</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.structuralAnalysis.powerStructures.slice(0, 2).map((item, index) => (
                        <li key={`${selectedArticle.id}-power-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="analysis-section">
                <h3>Intellectual Significance</h3>
                <p className="significance-text">{selectedArticle.chomskyAnalysis.synthesis.intellectualSignificance}</p>
              </div>

              <div className="read-full-article">
                <button 
                  className="read-article-button"
                  onClick={() => handleArticleSelect(selectedArticle)}
                >
                  Read Full Article with Interactive Analysis →
                </button>
                <p className="read-description">
                  Click to read the complete article with interactive Chomsky-level analysis, 
                  highlighting, and community discussion features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntellectualSelfDefense;
