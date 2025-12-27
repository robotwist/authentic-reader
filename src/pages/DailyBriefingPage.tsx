import React, { useState, useEffect } from 'react';
import ReaderView from '../components/ReaderView';
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

  const convertAnalysisToFallacies = (analysis: DailyBriefingTopic['analysis']): FallacyData[] => {
    if (!analysis) return [];
    
    const fallacies: FallacyData[] = [];
    
    if (analysis.manipulationAnalysis?.logicalFallacies) {
      analysis.manipulationAnalysis.logicalFallacies.forEach((fallacy, index) => {
        fallacies.push({
          id: `fallacy-${index}`,
          type: fallacy.type,
          excerpt: fallacy.location,
          explanation: fallacy.explanation,
          mechanism: `The author uses ${fallacy.type} by ${fallacy.location}`,
          motive: 'To manipulate reader perception',
          severity: 'medium' as const
        });
      });
    }
    
    if (analysis.keySentences) {
      analysis.keySentences.forEach((sentence, index) => {
        if (sentence.manipulationTechniques && sentence.manipulationTechniques.length > 0) {
          fallacies.push({
            id: `sentence-${index}`,
            type: sentence.manipulationTechniques[0],
            excerpt: sentence.sentence,
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
            <h2>📚 Briefing Archive</h2>
            <button className="close-button" onClick={() => setShowArchive(false)}>
              ×
            </button>
          </div>
          
          {loadingArchive ? (
            <div className="archive-loading">
              <div className="loading-spinner small" />
              <p>Loading archive...</p>
            </div>
          ) : archiveDates.length === 0 ? (
            <div className="archive-empty">
              <p>No archived briefings yet.</p>
              <p className="archive-hint">Past briefings will appear here once they're saved.</p>
            </div>
          ) : (
            <div className="archive-list">
              {archiveDates.map(({ date, formatted }) => (
                <button
                  key={date}
                  className="archive-date-button"
                  onClick={() => handleSelectDate(date)}
                >
                  <span className="archive-date-icon">📅</span>
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
    const fallacies = topicData?.analysis 
      ? convertAnalysisToFallacies(topicData.analysis)
      : [];

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
                <span className="topic-icon">{topicData.icon}</span>
                <span className="topic-label">{topicData.topic}</span>
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
        <h2 className="dashboard-subtitle">
          {briefing.isArchive ? 'Archived Briefing' : "Today's Truth Assessment"}
        </h2>
        
        {briefing.isArchive && (
          <button className="back-to-today" onClick={handleBackToToday}>
            ← Back to Today
          </button>
        )}
        
        {isOffline && (
          <div className="offline-banner">
            <span className="offline-icon">📡</span>
            <span className="offline-text">Showing demo data — backend warming up</span>
            <button className="retry-link" onClick={handleRetry}>
              Try again
            </button>
          </div>
        )}
      </div>
      
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
              <div className="card-icon">{topic.icon}</div>
              <h3 className="card-topic">{topic.topic}</h3>
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
          📚 Browse History
        </button>
      </div>
      
      <p className="dashboard-footer">
        Click any topic to read the full analysis
      </p>
    </div>
  );
};

export default DailyBriefingPage;
