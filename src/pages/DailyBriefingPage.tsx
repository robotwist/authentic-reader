import React, { useState, useEffect } from 'react';
import ReaderView from '../components/ReaderView';
import { FallacyData } from '../utils/llmParser';
import { API_CONFIG } from '../config/api.config';
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
  topics: {
    [key: string]: DailyBriefingTopic;
  };
}

const TOPIC_KEYS = ['ukraine', 'gaza', 'epstein', 'diseases', 'trump'] as const;
type TopicKey = typeof TOPIC_KEYS[number];

const DailyBriefingPage: React.FC = () => {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDailyBriefing();
  }, []);

  const loadDailyBriefing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const backendUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${backendUrl}/api/daily-briefing`);
      if (!response.ok) {
        throw new Error('Failed to load daily briefing');
      }
      
      const data = await response.json();
      setBriefing(data);
    } catch (err) {
      console.error('Error loading daily briefing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load daily briefing');
    } finally {
      setLoading(false);
    }
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

  // Loading state
  if (loading) {
    return (
      <div className="daily-briefing-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Loading Today's Briefing...</h2>
          <p>Preparing your daily truth assessment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !briefing) {
    return (
      <div className="daily-briefing-page">
        <div className="error-container">
          <h2>Unable to Load Briefing</h2>
          <p>{error || 'Daily briefing not available'}</p>
          <button className="retry-button" onClick={loadDailyBriefing}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Reader view (article selected)
  if (selectedTopic) {
    const topicData = briefing.topics[selectedTopic];
    const fallacies = topicData?.analysis 
      ? convertAnalysisToFallacies(topicData.analysis)
      : [];

    return (
      <div className="daily-briefing-page reader-mode">
        <button className="back-button" onClick={handleBackClick}>
          ← Back to Topics
        </button>
        
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
              <a 
                href={topicData.article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="original-link"
              >
                Read Original Source →
              </a>
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
          {new Date(briefing.generatedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
        <h2 className="dashboard-subtitle">Today's Truth Assessment</h2>
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
      
      <p className="dashboard-footer">
        Click any topic to read the full analysis
      </p>
    </div>
  );
};

export default DailyBriefingPage;
