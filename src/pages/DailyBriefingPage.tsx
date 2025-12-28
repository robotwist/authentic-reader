import React, { useState, useEffect, useCallback } from 'react';
import ReaderView from '../components/ReaderView';
import NarrativeThermometer from '../components/NarrativeThermometer';
import { FallacyData } from '../utils/llmParser';
import { API_CONFIG } from '../config/api.config';
import { fallbackBriefing } from '../data/fallbackBriefing';
import useEnhancedAnalysis from '../hooks/useEnhancedAnalysis';
import { AnalysisResult } from '../services/enhancedCognitiveAnalysisService';
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
  
  // Enhanced LLM Analysis Hook
  const {
    analyzeArticle: runEnhancedAnalysis,
    analysis: enhancedAnalysis,
    fallacyData: enhancedFallacies,
    isLoading: isAnalyzing,
    isLLMAvailable,
    clearAnalysis
  } = useEnhancedAnalysis();

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
    clearAnalysis(); // Clear enhanced analysis when going back
  };

  const handleRetry = () => {
    loadDailyBriefing();
  };
  
  // Handle topic selection and trigger LLM analysis
  const handleTopicSelect = useCallback((topic: TopicKey) => {
    setSelectedTopic(topic);
    
    // Get the topic data and trigger enhanced analysis
    if (briefing?.topics[topic]) {
      const topicData = briefing.topics[topic];
      
      // Strip HTML tags for analysis
      const textContent = topicData.article.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Run enhanced LLM analysis in background
      runEnhancedAnalysis(textContent, {
        title: topicData.article.title,
        source: topicData.article.source,
        author: topicData.article.author
      }).catch(err => {
        console.warn('Enhanced analysis failed, using fallback:', err);
      });
    }
  }, [briefing, runEnhancedAnalysis]);

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
    
    // Use enhanced analysis if available, otherwise fall back to static data
    const fallacies = enhancedFallacies.length > 0 
      ? enhancedFallacies 
      : (topicData ? getFallacies(topicData) : []);
    const staticBias = topicData ? getBias(topicData) : null;
    const staticSummary = topicData ? getSummary(topicData) : null;
    
    // Enhanced analysis values (from LLM)
    const analysisSource = enhancedAnalysis ? 'LLM' : 'Static';
    const displayBias = enhancedAnalysis ? {
      direction: enhancedAnalysis.bias,
      score: enhancedAnalysis.bias === 'center' ? 50 : 
             enhancedAnalysis.bias.includes('center') ? 65 : 80,
      confidence: enhancedAnalysis.biasConfidence / 100,
      explanation: `${enhancedAnalysis.tone} tone detected. ${enhancedAnalysis.summary}`
    } : staticBias;
    const displaySummary = enhancedAnalysis?.summary || staticSummary;
    const reliabilityScore = enhancedAnalysis?.reliabilityScore || 
                             topicData?.analysis?.overallAssessment?.reliabilityScore;

    return (
      <div className="daily-briefing-page reader-mode">
        <div className="reader-nav">
          <button className="back-button" onClick={handleBackClick}>
            ← Back to Topics
          </button>
          {isOffline && <span className="offline-badge">Demo Data</span>}
          {briefing.isArchive && <span className="archive-badge">Archive</span>}
          {isAnalyzing && (
            <span className="analyzing-badge">
              <span className="analyzing-spinner" />
              Analyzing...
            </span>
          )}
          {enhancedAnalysis && !isAnalyzing && (
            <span className="llm-badge" title="Analysis powered by LLM">
              ✨ LLM Analysis
            </span>
          )}
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
                {reliabilityScore !== undefined && (
                  <span className={`reliability-badge ${getReliabilityClass(reliabilityScore)}`}>
                    {reliabilityScore}/100 Reliability
                  </span>
                )}
                {enhancedAnalysis?.tone && (
                  <span className="tone-badge">
                    {enhancedAnalysis.tone}
                  </span>
                )}
              </div>
              
              {/* Enhanced Bias Meter */}
              {enhancedAnalysis && (
                <div className="bias-meter-container">
                  <div className="bias-meter">
                    <span className="bias-label-left">LEFT</span>
                    <div className="bias-track">
                      <div 
                        className={`bias-indicator bias-${enhancedAnalysis.bias.replace('-', '')}`}
                        style={{
                          left: enhancedAnalysis.bias === 'left' ? '10%' :
                                enhancedAnalysis.bias === 'center-left' ? '30%' :
                                enhancedAnalysis.bias === 'center' ? '50%' :
                                enhancedAnalysis.bias === 'center-right' ? '70%' : '90%'
                        }}
                      />
                    </div>
                    <span className="bias-label-right">RIGHT</span>
                  </div>
                  <span className="bias-confidence">
                    {enhancedAnalysis.biasConfidence}% confidence
                  </span>
                </div>
              )}
            </header>
            
            <ReaderView
              articleContent={topicData.article.content}
              fallacyData={fallacies}
            />
            
            {/* Analysis Section: Enhanced with LLM data */}
            <section className="article-analysis-section">
              <h2 className="analysis-section-title">
                Analysis
                {isAnalyzing && <span className="analysis-loading"> (Analyzing with AI...)</span>}
              </h2>
              
              {/* Manipulation Techniques (NEW from LLM) */}
              {enhancedAnalysis?.manipulationTechniques && enhancedAnalysis.manipulationTechniques.length > 0 && (
                <div className="analysis-subsection">
                  <h3 className="subsection-title">Manipulation Techniques</h3>
                  <div className="techniques-list">
                    {enhancedAnalysis.manipulationTechniques.map((technique, i) => (
                      <span key={i} className="technique-tag">{technique}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fallacies - Now with Better Alternatives */}
              {fallacies.length > 0 && (
                <div className="analysis-subsection">
                  <h3 className="subsection-title">Logical Fallacies ({fallacies.length})</h3>
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
                          <p className="fallacy-excerpt">"{fallacy.excerpt}"</p>
                        )}
                        {fallacy.explanation && (
                          <p className="fallacy-explanation">{fallacy.explanation}</p>
                        )}
                        {/* Better Alternative - from enhanced analysis */}
                        {fallacy.motive && fallacy.motive.startsWith('A fair argument') && (
                          <div className="better-alternative">
                            <span className="alternative-label">✓ Better Approach:</span>
                            <p className="alternative-text">{fallacy.motive.replace('A fair argument would instead: ', '')}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {fallacies.length === 0 && !isAnalyzing && (
                <div className="analysis-subsection">
                  <h3 className="subsection-title">Logical Fallacies</h3>
                  <p className="no-fallacies">No significant logical fallacies detected.</p>
                </div>
              )}
              
              {/* Bias Analysis */}
              {displayBias && (
                <div className="analysis-subsection">
                  <h3 className="subsection-title">Bias Analysis</h3>
                  <div className="bias-info">
                    {displayBias.direction && (
                      <div className="bias-item">
                        <span className="bias-label">Direction:</span>
                        <span className={`bias-value bias-${displayBias.direction.replace('-', '')}`}>
                          {displayBias.direction.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {displayBias.confidence !== undefined && (
                      <div className="bias-item">
                        <span className="bias-label">Confidence:</span>
                        <span className="bias-value">{Math.round(displayBias.confidence * 100)}%</span>
                      </div>
                    )}
                    {displayBias.explanation && (
                      <p className="bias-explanation">{displayBias.explanation}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Summary */}
              {displaySummary && (
                <div className="analysis-subsection">
                  <h3 className="subsection-title">AI Summary</h3>
                  <p className="summary-text">{displaySummary}</p>
                </div>
              )}
            </section>
            
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
              onClick={() => handleTopicSelect(key)}
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
