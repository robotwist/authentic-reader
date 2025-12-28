import React, { useState, useEffect } from 'react';
import ReaderView from '../components/ReaderView';
import NarrativeThermometer from '../components/NarrativeThermometer';
import { FallacyData } from '../utils/llmParser';
import { API_CONFIG } from '../config/api.config';
import { fallbackBriefing } from '../data/fallbackBriefing';
import './DailyBriefingPage.css';

interface DailyBriefingTopic {
  topic: string;
  icon: string;
  article: {
    title: string;
    url: string;
    source: string;
    publishDate: string;
    author?: string;
    content: string;
  };
  analysis: {
    keySentences?: Array<{
      sentence: string;
      manipulationTechniques?: string[];
      biasIndicators?: string[];
    }>;
    manipulationAnalysis?: {
      logicalFallacies?: Array<{
        type: string;
        location: string;
        explanation: string;
      }>;
    };
    overallAssessment?: {
      reliabilityScore: number;
    };
  } | null;
}

interface DailyBriefing {
  generatedAt: string;
  version: string;
  isOffline?: boolean;
  isArchive?: boolean;
  briefingDate?: string;
  topics: {
    [key: string]: DailyBriefingTopic;
  };
}

interface ArchiveDate {
  date: string;
  formatted: string;
}

const TOPIC_KEYS = ['ukraine', 'gaza', 'epstein', 'diseases', 'trump'] as const;
type TopicKey = typeof TOPIC_KEYS[number];

const DailyBriefingPage: React.FC = () => {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveDates, setArchiveDates] = useState<ArchiveDate[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  useEffect(() => {
    loadDailyBriefing();
  }, []);

  const loadDailyBriefing = async (date?: string) => {
    setLoading(true);
    
    try {
      const backendUrl = API_CONFIG.BASE_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const endpoint = date 
        ? `${backendUrl}/api/daily-briefing/archive/${date}`
        : `${backendUrl}/api/daily-briefing`;
      
      const response = await fetch(endpoint, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('API returned error status');
      }
      
      const data = await response.json();
      setBriefing(data);
      setIsOffline(false);
      setCurrentDate(data.briefingDate || null);
    } catch (err) {
      console.warn('API unavailable, using fallback data:', err);
      setBriefing(fallbackBriefing as DailyBriefing);
      setIsOffline(true);
      setCurrentDate(null);
    } finally {
      setLoading(false);
    }
  };

  const loadArchiveDates = async () => {
    setLoadingArchive(true);
    try {
      const backendUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${backendUrl}/api/daily-briefing/archive`);
      
      if (response.ok) {
        const data = await response.json();
        setArchiveDates(data.dates || []);
      }
    } catch (err) {
      console.error('Failed to load archive dates:', err);
      setArchiveDates([]);
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleOpenArchive = () => {
    setShowArchive(true);
    loadArchiveDates();
  };

  const handleSelectDate = (date: string) => {
    setShowArchive(false);
    setSelectedTopic(null);
    loadDailyBriefing(date);
  };

  const handleBackToToday = () => {
    setCurrentDate(null);
    loadDailyBriefing();
  };

  /**
   * Data Normalizer: Extract fallacies from article data
   * Checks multiple paths to handle both old and new data structures
   */
  const getFallacies = (article: DailyBriefingTopic): FallacyData[] => {
    if (!article) return [];
    
    const fallacies: FallacyData[] = [];
    const analysis = article.analysis;
    
    if (!analysis) return [];
    
    // Path 1: New nested format (analysis.manipulationAnalysis.logicalFallacies)
    if (analysis.manipulationAnalysis?.logicalFallacies) {
      const logicalFallacies = analysis.manipulationAnalysis.logicalFallacies;
      if (Array.isArray(logicalFallacies)) {
        logicalFallacies.forEach((fallacy, index) => {
          fallacies.push({
            id: `fallacy-${index}`,
            type: fallacy.type || 'Unknown',
            excerpt: fallacy.location || fallacy.excerpt || '',
            explanation: fallacy.explanation || '',
            mechanism: `The author uses ${fallacy.type || 'a fallacy'} by ${fallacy.location || 'manipulation'}`,
            motive: 'To manipulate reader perception',
            severity: 'medium' as const
          });
        });
      }
    }
    
    // Path 2: Direct fallacies array (if flattened)
    if (Array.isArray((analysis as any).logicalFallacies)) {
      (analysis as any).logicalFallacies.forEach((fallacy: any, index: number) => {
        fallacies.push({
          id: `fallacy-direct-${index}`,
          type: fallacy.type || fallacy.name || 'Unknown',
          excerpt: fallacy.location || fallacy.excerpt || fallacy.quote || '',
          explanation: fallacy.explanation || fallacy.description || '',
          mechanism: `The author uses ${fallacy.type || fallacy.name || 'a fallacy'}`,
          motive: 'To manipulate reader perception',
          severity: 'medium' as const
        });
      });
    }
    
    // Path 3: Key sentences with manipulation techniques
    if (analysis.keySentences && Array.isArray(analysis.keySentences)) {
      analysis.keySentences.forEach((sentence, index) => {
        if (sentence.manipulationTechniques && sentence.manipulationTechniques.length > 0) {
          fallacies.push({
            id: `sentence-${index}`,
            type: sentence.manipulationTechniques[0],
            excerpt: sentence.sentence || '',
            explanation: `This sentence uses ${sentence.manipulationTechniques.join(', ')}`,
            mechanism: 'Manipulative language detected',
            motive: 'To influence reader perception',
            severity: 'low' as const
          });
        }
      });
    }
    
    return fallacies;
  };

  /**
   * Data Normalizer: Extract bias information from article data
   * Checks multiple paths to handle both old and new data structures
   */
  const getBias = (article: DailyBriefingTopic): {
    direction?: string;
    score?: number;
    confidence?: number;
    explanation?: string;
  } | null => {
    if (!article || !article.analysis) return null;
    
    const analysis = article.analysis;
    
    // Path 1: New nested format (analysis.biasAnalysis)
    if ((analysis as any).biasAnalysis) {
      const biasAnalysis = (analysis as any).biasAnalysis;
      return {
        direction: biasAnalysis.direction || biasAnalysis.political?.direction,
        score: biasAnalysis.score || biasAnalysis.scores?.overall || biasAnalysis.scores?.political?.leftRight,
        confidence: biasAnalysis.confidence || biasAnalysis.scores?.political?.confidence,
        explanation: biasAnalysis.explanation || biasAnalysis.summary?.explanation
      };
    }
    
    // Path 2: Direct bias object (if flattened)
    if ((analysis as any).bias) {
      const bias = (analysis as any).bias;
      return {
        direction: bias.direction,
        score: bias.score,
        confidence: bias.confidence,
        explanation: bias.explanation
      };
    }
    
    // Path 3: Overall assessment (may contain bias info)
    if (analysis.overallAssessment) {
      return {
        score: analysis.overallAssessment.reliabilityScore,
        explanation: 'Reliability assessment available'
      };
    }
    
    return null;
  };

  /**
   * Data Normalizer: Extract summary from article data
   * Checks multiple paths to handle both old and new data structures
   */
  const getSummary = (article: DailyBriefingTopic): string | null => {
    if (!article) return null;
    
    // Path 1: Direct summary on article
    if ((article.article as any).summary) {
      return (article.article as any).summary;
    }
    
    // Path 2: Analysis summary
    if (article.analysis) {
      const analysis = article.analysis;
      
      // Check nested summary
      if ((analysis as any).summary) {
        return (analysis as any).summary;
      }
      
      // Check summaryText
      if ((analysis as any).summaryText) {
        return (analysis as any).summaryText;
      }
      
      // Check overallAssessment summary
      if (analysis.overallAssessment && (analysis.overallAssessment as any).summary) {
        return (analysis.overallAssessment as any).summary;
      }
    }
    
    return null;
  };

  /**
   * Convert analysis to fallacies format (uses getFallacies helper)
   */
  const convertAnalysisToFallacies = (analysis: DailyBriefingTopic['analysis']): FallacyData[] => {
    // Use the robust getFallacies helper
    const topicData = { analysis } as DailyBriefingTopic;
    return getFallacies(topicData);
  };

  const getReliabilityClass = (score: number): string => {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const handleBackClick = () => {
    setSelectedTopic(null);
  };

  const handleRetry = () => {
    loadDailyBriefing();
  };

  // Loading state
  if (loading) {
    return (
      <div className="daily-briefing-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Loading Briefing...</h2>
          <p>Preparing your truth assessment</p>
        </div>
      </div>
    );
  }

  // Archive modal
  if (showArchive) {
    return (
      <div className="daily-briefing-page archive-mode">
        <div className="archive-modal">
          <div className="archive-header">
            <h2>BRIEFING ARCHIVE</h2>
            <button className="close-button" onClick={() => setShowArchive(false)}>
              (CLOSE)
            </button>
          </div>
          
          {loadingArchive ? (
            <div className="archive-loading">
              <div className="loading-spinner small" />
              <p>Loading archive...</p>
            </div>
          ) : archiveDates.length === 0 ? (
            <div className="archive-empty">
              <p>NO ARCHIVED BRIEFINGS.</p>
              <p className="archive-hint">Past briefings will appear here once saved.</p>
            </div>
          ) : (
            <div className="archive-list">
              {archiveDates.map(({ date, formatted }) => (
                <button
                  key={date}
                  className="archive-date-button"
                  onClick={() => handleSelectDate(date)}
                >
                  <span className="archive-date-icon">[DATE]</span>
                  <span className="archive-date-text">{formatted}</span>
                  <span className="archive-date-arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ensure we have data
  if (!briefing) {
    setBriefing(fallbackBriefing as DailyBriefing);
    setIsOffline(true);
    return null;
  }

  // Reader view (article selected)
  if (selectedTopic) {
    const topicData = briefing.topics[selectedTopic];
    // Use robust data normalizers
    const fallacies = topicData ? getFallacies(topicData) : [];
    const bias = topicData ? getBias(topicData) : null;
    const summary = topicData ? getSummary(topicData) : null;

    return (
      <div className="daily-briefing-page reader-mode">
        <div className="reader-nav">
          <button className="back-button" onClick={handleBackClick}>
            ← Back to Topics
          </button>
          {isOffline && <span className="offline-badge">Demo Data</span>}
          {briefing.isArchive && <span className="archive-badge">Archive</span>}
        </div>
        
        {topicData ? (
          <article className="briefing-article">
            <header className="article-header">
              <div className="topic-badge">
                <span className="topic-label">[{topicData.topic.toUpperCase()}]</span>
              </div>
              <h1 className="article-title">{topicData.article.title}</h1>
              <div className="article-meta">
                <span className="article-source">{topicData.article.source}</span>
                {topicData.article.publishDate && (
                  <span className="article-date">
                    {new Date(topicData.article.publishDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
                {topicData.analysis?.overallAssessment && (
                  <span className={`reliability-badge ${getReliabilityClass(topicData.analysis.overallAssessment.reliabilityScore)}`}>
                    {topicData.analysis.overallAssessment.reliabilityScore}/100 Reliability
                  </span>
                )}
              </div>
            </header>
            
            <ReaderView
              articleContent={topicData.article.content}
              fallacyData={fallacies}
            />
            
            {/* Analysis Section: Fallacies, Bias, Summary */}
            {(fallacies.length > 0 || bias || summary) && (
              <section className="article-analysis-section">
                <h2 className="analysis-section-title">Analysis</h2>
                
                {/* Fallacies */}
                {fallacies.length > 0 && (
                  <div className="analysis-subsection">
                    <h3 className="subsection-title">Logical Fallacies</h3>
                    <div className="fallacies-list">
                      {fallacies.map((fallacy) => (
                        <div key={fallacy.id} className="fallacy-item">
                          <div className="fallacy-header">
                            <span className="fallacy-type">{fallacy.type}</span>
                            <span className={`severity-badge severity-${fallacy.severity}`}>
                              {fallacy.severity}
                            </span>
                          </div>
                          {fallacy.excerpt && (
                            <p className="fallacy-excerpt">{fallacy.excerpt}</p>
                          )}
                          {fallacy.explanation && (
                            <p className="fallacy-explanation">{fallacy.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Bias Analysis */}
                {bias && (
                  <div className="analysis-subsection">
                    <h3 className="subsection-title">Bias Analysis</h3>
                    <div className="bias-info">
                      {bias.direction && (
                        <div className="bias-item">
                          <span className="bias-label">Direction:</span>
                          <span className="bias-value">{bias.direction}</span>
                        </div>
                      )}
                      {bias.score !== undefined && (
                        <div className="bias-item">
                          <span className="bias-label">Score:</span>
                          <span className="bias-value">{bias.score}/100</span>
                        </div>
                      )}
                      {bias.confidence !== undefined && (
                        <div className="bias-item">
                          <span className="bias-label">Confidence:</span>
                          <span className="bias-value">{Math.round(bias.confidence * 100)}%</span>
                        </div>
                      )}
                      {bias.explanation && (
                        <p className="bias-explanation">{bias.explanation}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Summary */}
                {summary && (
                  <div className="analysis-subsection">
                    <h3 className="subsection-title">Summary</h3>
                    <p className="summary-text">{summary}</p>
                  </div>
                )}
              </section>
            )}
            
            <footer className="article-footer">
              {!isOffline && topicData.article.url && (
                <a 
                  href={topicData.article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="original-link"
                >
                  Read Original Source →
                </a>
              )}
            </footer>
          </article>
        ) : (
          <div className="no-article">
            <p>Article not available for this topic.</p>
          </div>
        )}
      </div>
    );
  }

  // Dashboard view (5-card grid)
  return (
    <div className="daily-briefing-page dashboard-mode">
      <div className="dashboard-header">
        <p className="briefing-date">
          {briefing.briefingDate 
            ? new Date(briefing.briefingDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })
            : new Date(briefing.generatedAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })
          }
        </p>
        <h1 className="dashboard-subtitle">
          {briefing.isArchive ? 'THE ARCHIVE' : 'THE DAILY LOGIC'}
        </h1>
        
        {briefing.isArchive && (
          <button className="back-to-today" onClick={handleBackToToday}>
            ← Back to Today
          </button>
        )}
        
        {isOffline && (
          <div className="offline-banner">
            <span className="offline-icon">[OFFLINE]</span>
            <span className="offline-text">DEMO DATA — BACKEND WARMING UP</span>
            <button className="retry-link" onClick={handleRetry}>
              (RETRY)
            </button>
          </div>
        )}
      </div>
      
      {/* Narrative Thermometer - 7-Day Trend */}
      <NarrativeThermometer />
      
      <div className="topic-grid">
        {TOPIC_KEYS.map((key) => {
          const topic = briefing.topics[key];
          if (!topic) return null;
          
          const reliabilityScore = topic.analysis?.overallAssessment?.reliabilityScore;
          
          return (
            <button
              key={key}
              className="topic-card"
              onClick={() => setSelectedTopic(key)}
              aria-label={`Read about ${topic.topic}`}
            >
              <h3 className="card-topic">[{topic.topic.toUpperCase()}]</h3>
              <p className="card-headline">{topic.article.title}</p>
              <div className="card-meta">
                <span className="card-source">{topic.article.source}</span>
                {reliabilityScore !== undefined && (
                  <span className={`card-reliability ${getReliabilityClass(reliabilityScore)}`}>
                    {reliabilityScore}/100
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="dashboard-actions">
        <button className="archive-button" onClick={handleOpenArchive}>
          [ARCHIVE] BROWSE HISTORY
        </button>
      </div>
      
      <footer className="publisher-footer">
        <div className="publisher-content">
          <span className="publisher-text">PUBLISHED BY</span>
          <span className="publisher-brand">AUTHENTIC INTERNET</span>
          <img 
            src="/authentic-internet-logo.png" 
            alt="Authentic Internet" 
            className="publisher-logo"
          />
        </div>
      </footer>
    </div>
  );
};

export default DailyBriefingPage;
