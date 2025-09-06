import React, { useState, useEffect } from 'react';
import { FiTarget, FiTrendingUp, FiUsers, FiGlobe, FiBookOpen, FiZap, FiShield } from 'react-icons/fi';
import { intellectualSelfDefenseService, DailyArticle, ChomskyAnalysis } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './IntellectualSelfDefense.css';

interface IntellectualSelfDefenseProps {
  onArticleSelect?: (article: DailyArticle) => void;
}

const IntellectualSelfDefense: React.FC<IntellectualSelfDefenseProps> = ({ onArticleSelect }) => {
  const [articles, setArticles] = useState<DailyArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<DailyArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'structural' | 'linguistic' | 'historical' | 'critical' | 'synthesis'>('overview');

  useEffect(() => {
    loadTodaysArticles();
  }, []);

  const loadTodaysArticles = async () => {
    try {
      setLoading(true);
      logger.info('Loading today\'s intellectual self defense course...');
      
      const todaysArticles = await intellectualSelfDefenseService.getTodaysArticles();
      setArticles(todaysArticles);
      
      logger.info(`Loaded ${todaysArticles.length} articles for deep analysis`);
    } catch (error) {
      logger.error('Failed to load intellectual self defense course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleSelect = (article: DailyArticle) => {
    setSelectedArticle(article);
    if (onArticleSelect) {
      onArticleSelect(article);
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return '#ff4757';
      case 'significant': return '#ffa502';
      case 'notable': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'critical': return <FiZap className="importance-icon" />;
      case 'significant': return <FiTrendingUp className="importance-icon" />;
      case 'notable': return <FiBookOpen className="importance-icon" />;
      default: return <FiBookOpen className="importance-icon" />;
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
          <h3>Preparing Your Intellectual Self Defense Course...</h3>
          <p>Curating 10 high-quality articles for critical thinking training</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-deep-dive">
      <div className="deep-dive-header">
        <div className="header-content">
          <div className="header-icon">
            <FiShield />
          </div>
          <div className="header-text">
            <h1>Intellectual Self Defense Course</h1>
            <p>Your daily training in critical thinking and media literacy</p>
            <div className="header-stats">
              <span className="stat">
                <FiTarget /> {articles.length} Articles
              </span>
              <span className="stat">
                <FiUsers /> Expert Analysis
              </span>
              <span className="stat">
                <FiGlobe /> Critical Thinking
              </span>
            </div>
          </div>
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
                  {getImportanceIcon(article.importance)}
                  <span 
                    className="importance-badge"
                    style={{ backgroundColor: getImportanceColor(article.importance) }}
                  >
                    {article.importance}
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
                    <li key={index}>{insight}</li>
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
              <div className="analysis-tabs">
                <button 
                  className={activeTab === 'overview' ? 'active' : ''}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={activeTab === 'structural' ? 'active' : ''}
                  onClick={() => setActiveTab('structural')}
                >
                  Structural
                </button>
                <button 
                  className={activeTab === 'linguistic' ? 'active' : ''}
                  onClick={() => setActiveTab('linguistic')}
                >
                  Linguistic
                </button>
                <button 
                  className={activeTab === 'historical' ? 'active' : ''}
                  onClick={() => setActiveTab('historical')}
                >
                  Historical
                </button>
                <button 
                  className={activeTab === 'critical' ? 'active' : ''}
                  onClick={() => setActiveTab('critical')}
                >
                  Critical
                </button>
                <button 
                  className={activeTab === 'synthesis' ? 'active' : ''}
                  onClick={() => setActiveTab('synthesis')}
                >
                  Synthesis
                </button>
              </div>
            </div>

            <div className="analysis-content">
              {activeTab === 'overview' && (
                <div className="analysis-section">
                  <h3>Intellectual Assessment</h3>
                  <div className="intellectual-metrics">
                    <div className="metric">
                      <span className="metric-label">Complexity Level</span>
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
                    <div className="metric">
                      <span className="metric-label">Intellectual Rigor</span>
                      <span className="metric-value">{selectedArticle.chomskyAnalysis.intellectualDepth.intellectualRigor}/10</span>
                    </div>
                  </div>
                  
                  <h3>Intellectual Significance</h3>
                  <p className="significance-text">{selectedArticle.chomskyAnalysis.synthesis.intellectualSignificance}</p>
                </div>
              )}

              {activeTab === 'structural' && (
                <div className="analysis-section">
                  <h3>Structural Analysis</h3>
                  
                  <div className="analysis-subsection">
                    <h4>Power Structures</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.structuralAnalysis.powerStructures.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Institutional Bias</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.structuralAnalysis.institutionalBias.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Manufacturing Consent</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.structuralAnalysis.manufacturingConsent.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Propaganda Model</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.structuralAnalysis.propagandaModel.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'linguistic' && (
                <div className="analysis-section">
                  <h3>Linguistic Analysis</h3>
                  
                  <div className="analysis-subsection">
                    <h4>Framing</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.linguisticAnalysis.framing.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Loaded Language</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.linguisticAnalysis.loadedLanguage.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Presuppositions</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.linguisticAnalysis.presuppositions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Ideological Assumptions</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.linguisticAnalysis.ideologicalAssumptions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'historical' && (
                <div className="analysis-section">
                  <h3>Historical Context</h3>
                  
                  <div className="analysis-subsection">
                    <h4>Historical Precedents</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.historicalContext.historicalPrecedents.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Long-term Trends</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.historicalContext.longTermTrends.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Systemic Patterns</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.historicalContext.systemicPatterns.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Contextual Factors</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.historicalContext.contextualFactors.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'critical' && (
                <div className="analysis-section">
                  <h3>Critical Analysis</h3>
                  
                  <div className="analysis-subsection">
                    <h4>What Is Not Said</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.criticalAnalysis.whatIsNotSaid.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Alternative Perspectives</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.criticalAnalysis.alternativePerspectives.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Power Interests</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.criticalAnalysis.powerInterests.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Ideological Function</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.criticalAnalysis.ideologicalFunction.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'synthesis' && (
                <div className="analysis-section">
                  <h3>Synthesis</h3>
                  
                  <div className="analysis-subsection">
                    <h4>Key Insights</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.synthesis.keyInsights.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Broader Implications</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.synthesis.broaderImplications.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Systemic Connections</h4>
                    <ul>
                      {selectedArticle.chomskyAnalysis.synthesis.systemicConnections.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-subsection">
                    <h4>Intellectual Significance</h4>
                    <p>{selectedArticle.chomskyAnalysis.synthesis.intellectualSignificance}</p>
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

export default IntellectualSelfDefense;
