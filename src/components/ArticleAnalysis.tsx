import * as React from 'react';
import { useState } from 'react';
import '../styles/ArticleAnalysis.css';
import { ContentAnalysisResult } from '../types';
import { 
  LogicalFallacy, 
  BiasType
} from '../services/contentAnalysisService';
import ManipulationAnalysis from './ManipulationAnalysis';
import EmotionAnalysis from './EmotionAnalysis';

interface ArticleAnalysisProps {
  title: string;
  source: string;
  author?: string;
  date?: string;
  analysis: ContentAnalysisResult;
}

// Helper function for getting bias type name
const getBiasTypeName = (biasType: BiasType): string => {
  switch (biasType) {
    case BiasType.LEFT_STRONG:
      return 'Strong Left';
    case BiasType.LEFT_MODERATE:
      return 'Moderate Left';
    case BiasType.CENTER:
      return 'Center';
    case BiasType.RIGHT_MODERATE:
      return 'Moderate Right';
    case BiasType.RIGHT_STRONG:
      return 'Strong Right';
    default:
      return 'Center';
  }
};

const ArticleAnalysis: React.FC<ArticleAnalysisProps> = ({
  title,
  source,
  author,
  date,
  analysis
}) => {
  const [activeTab, setActiveTab] = useState<'fallacies' | 'bias' | 'metrics' | 'manipulation' | 'emotions'>('fallacies');
  
  // Helper functions for styling based on score
  const getQualityClass = (score: number): string => {
    if (score >= 70) return 'high-quality';
    if (score >= 40) return 'medium-quality';
    return 'low-quality';
  };
  
  const getManipulationClass = (score: number): string => {
    if (score >= 70) return 'high-manipulation';
    if (score >= 40) return 'medium-manipulation';
    return 'low-manipulation';
  };
  
  const getBiasClass = (biasType: BiasType): string => {
    switch (biasType) {
      case BiasType.LEFT_STRONG:
        return 'bias-left-strong';
      case BiasType.LEFT_MODERATE:
        return 'bias-left';
      case BiasType.CENTER:
        return 'bias-center';
      case BiasType.RIGHT_MODERATE:
        return 'bias-right';
      case BiasType.RIGHT_STRONG:
        return 'bias-right-strong';
      default:
        return 'bias-center';
    }
  };
  
  // Helper for generating bias position on the spectrum
  const getBiasPosition = (biasType: BiasType): string => {
    switch(biasType) {
      case BiasType.LEFT_STRONG:
        return '10%';
      case BiasType.LEFT_MODERATE:
        return '30%';
      case BiasType.CENTER:
        return '50%';
      case BiasType.RIGHT_MODERATE:
        return '70%';
      case BiasType.RIGHT_STRONG:
        return '90%';
      default:
        return '50%';
    }
  };
  
  // Helper for generating readable score labels
  const getQualityLabel = (score: number): string => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };
  
  const getManipulationLabel = (score: number): string => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };
  
  // Helper to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_unused) {
      return dateString;
    }
  };
  
  return (
    <div className="article-analysis">
      <div className="analysis-header">
        <h2>{title}</h2>
        <div className="source-info">
          {source && <span className="source">{source}</span>}
          {author && <span className="author">By {author}</span>}
          {date && <span className="date">{formatDate(date)}</span>}
        </div>
      </div>
      
      <div className="analysis-scores">
        <div className={`quality-score ${getQualityClass(analysis.qualityScore * 100)}`}>
          <div className="score-label">Content Quality</div>
          <div className="score-value">{getQualityLabel(analysis.qualityScore * 100)}</div>
          <div className="score-numeric">{Math.round(analysis.qualityScore * 100)}/100</div>
        </div>
        
        <div className={`manipulation-score ${getManipulationClass(analysis.manipulationScore * 100)}`}>
          <div className="score-label">Manipulation</div>
          <div className="score-value">{getManipulationLabel(analysis.manipulationScore * 100)}</div>
          <div className="score-numeric">{Math.round(analysis.manipulationScore * 100)}/100</div>
        </div>
        
        <div className={`bias-indicator ${getBiasClass(analysis.biasAnalysis.type)}`}>
          <div className="score-label">Bias</div>
          <div className="score-value">
            {getBiasTypeName(analysis.biasAnalysis.type).replace('_', ' ')}
          </div>
        </div>
      </div>
      
      <div className="analysis-tabs">
        <button 
          className={`tab ${activeTab === 'fallacies' ? 'active' : ''}`}
          onClick={() => setActiveTab('fallacies')}
        >
          Logical Fallacies
        </button>
        <button 
          className={`tab ${activeTab === 'bias' ? 'active' : ''}`}
          onClick={() => setActiveTab('bias')}
        >
          Bias Analysis
        </button>
        <button 
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Content Metrics
        </button>
        <button 
          className={`tab ${activeTab === 'manipulation' ? 'active' : ''}`}
          onClick={() => setActiveTab('manipulation')}
        >
          Manipulation
        </button>
        <button 
          className={`tab ${activeTab === 'emotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          Emotions
        </button>
      </div>
      
      {activeTab === 'fallacies' && (
        <div className="fallacies-tab">
          {analysis.logicalFallacies.length > 0 ? (
            <ul className="fallacies-list">
              {analysis.logicalFallacies.map((fallacy: LogicalFallacy, index: number) => (
                <li key={index} className="fallacy-item">
                  <h4 className="fallacy-type">{fallacy.type.replace(/_/g, ' ')}</h4>
                  <p className="fallacy-explanation">{fallacy.explanation}</p>
                  {fallacy.excerpt && (
                    <blockquote className="fallacy-excerpt">
                      "{fallacy.excerpt}"
                    </blockquote>
                  )}
                  <div className="fallacy-confidence">
                    Confidence: {(fallacy.confidence * 100).toFixed(0)}%
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-fallacies">
              No logical fallacies were detected in this article.
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'bias' && (
        <div className="bias-tab">
          <div className="bias-explanation">
            <h3>Bias Analysis</h3>
            <p>{analysis.biasAnalysis.explanation}</p>
            <p className="bias-confidence">
              Confidence: {(analysis.biasAnalysis.confidence * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="bias-spectrum">
            <div className="spectrum-label left">Left</div>
            <div className="spectrum-bar">
              <div 
                className="bias-marker" 
                style={{ left: getBiasPosition(analysis.biasAnalysis.type) }}
              ></div>
            </div>
            <div className="spectrum-label right">Right</div>
          </div>
          
          <div className="bias-indicators">
            <h4>Detected Bias Indicators</h4>
            <div className="indicators-columns">
              {analysis.biasAnalysis?.leftIndicators?.length > 0 && (
                <div className="left-indicators">
                  <h5>Left-leaning Indicators</h5>
                  <ul>
                    {analysis.biasAnalysis.leftIndicators.map((indicator: string, index: number) => (
                      <li key={index}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.biasAnalysis?.rightIndicators?.length > 0 && (
                <div className="right-indicators">
                  <h5>Right-leaning Indicators</h5>
                  <ul>
                    {analysis.biasAnalysis.rightIndicators.map((indicator: string, index: number) => (
                      <li key={index}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'metrics' && (
        <div className="metrics-tab">
          <div className="metrics-columns">
            <div className="metrics-column">
              <h3>Article Metadata</h3>
              <div className="metric-item">
                <div className="metric-label">Main Point</div>
                <div className="metric-value">{analysis.metadata.mainPoint}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Agenda</div>
                <div className="metric-value">{analysis.metadata.agenda || 'None detected'}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Affiliation</div>
                <div className="metric-value">{analysis.metadata.affiliation || 'Not detected'}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Reading Time</div>
                <div className="metric-value">{analysis.metadata.readingTimeMinutes} mins</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Complexity</div>
                <div className="metric-value">{analysis.metadata.readingLevel}</div>
              </div>
              
              {analysis.metadata.citations && analysis.metadata.citations.length > 0 && (
                <div className="citations-list">
                  <h4>Citations</h4>
                  <ul>
                    {analysis.metadata.citations.map((citation: string, index: number) => (
                      <li key={index}>{citation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="metrics-column">
              <div className="key-entities">
                <h3>Key Entities</h3>
                <div className="entity-tags">
                  {analysis.metadata?.entities?.map((entity: string, index: number) => (
                    <span key={index} className="entity-tag">{entity}</span>
                  ))}
                </div>
              </div>
              
              <div className="sentiment-analysis">
                <h3>Sentiment Analysis</h3>
                {analysis.sentimentAnalysis ? (
                  <>
                    <div className="metric-item">
                      <div className="metric-label">Overall</div>
                      <div className="metric-value">
                        {analysis.sentimentAnalysis.overall > 0 ? 'Positive' : 
                         analysis.sentimentAnalysis.overall < 0 ? 'Negative' : 'Neutral'}
                        {' '}({analysis.sentimentAnalysis.overall.toFixed(2)})
                      </div>
                    </div>
                    <div className="sentiment-aspects">
                      {Object.entries(analysis.sentimentAnalysis.aspects).map(([aspect, score], index) => (
                        <div key={index} className="metric-item">
                          <div className="metric-label">{aspect}</div>
                          <div className="metric-value">
                            {Number(score) > 0 ? 'Positive' : Number(score) < 0 ? 'Negative' : 'Neutral'}
                            {' '}({Number(score).toFixed(2)})
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="metric-value">N/A</div>
                )}
              </div>
              
              <div className="emotional-appeals">
                <h3>Emotional Appeals</h3>
                {analysis.emotionalAppeals ? (
                  <div className="emotion-bars">
                    {Object.entries(analysis.emotionalAppeals).map(([emotion, value], index) => (
                      <div key={index} className="emotion-bar">
                        <div className="emotion-label">{emotion}</div>
                        <div className="emotion-track">
                          <div 
                            className="emotion-fill" 
                            style={{ width: `${Number(value) * 100}%` }}
                          ></div>
                        </div>
                        <div className="emotion-value">{(Number(value) * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="metric-value">N/A</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'manipulation' && (
        <div className="manipulation-tab">
          <ManipulationAnalysis manipulationAnalysis={analysis.manipulationAnalysis} />
        </div>
      )}
      
      {activeTab === 'emotions' && (
        <div className="emotions-tab">
          <EmotionAnalysis 
            emotionAnalysis={analysis.emotionAnalysis} 
            sentiment={analysis.sentiment}
          />
        </div>
      )}
    </div>
  );
};

export default ArticleAnalysis; 