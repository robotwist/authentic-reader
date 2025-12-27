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
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>('ukraine');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDailyBriefing();
  }, []);

  const loadDailyBriefing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load from backend API endpoint that serves daily_briefing.json
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
    
    // Convert logical fallacies
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
    
    // Convert key sentences with manipulation techniques
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

  if (loading) {
    return (
      <div className="daily-briefing-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Loading Daily Briefing...</h2>
          <p>Fetching today's truth assessment</p>
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="daily-briefing-page">
        <div className="error-container">
          <h2>Unable to Load Daily Briefing</h2>
          <p>{error || 'Daily briefing not available'}</p>
          <button className="retry-button" onClick={loadDailyBriefing}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedTopicData = briefing.topics[selectedTopic];
  const fallacies = selectedTopicData?.analysis 
    ? convertAnalysisToFallacies(selectedTopicData.analysis)
    : [];

  return (
    <div className="daily-briefing-page">
      <header className="briefing-header">
        <div className="briefing-title">
          <h1>Daily Truth Assessment</h1>
          <p className="briefing-date">
            Generated: {new Date(briefing.generatedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        
        <nav className="topic-selector">
          {TOPIC_KEYS.map((key) => {
            const topic = briefing.topics[key];
            if (!topic) return null;
            
            return (
              <button
                key={key}
                className={`topic-button ${selectedTopic === key ? 'active' : ''}`}
                onClick={() => setSelectedTopic(key)}
                aria-label={`Select topic: ${topic.topic}`}
                title={topic.topic}
              >
                <span className="topic-icon">{topic.icon}</span>
                <span className="topic-name">{topic.topic}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {selectedTopicData ? (
        <div className="briefing-content">
          <article className="briefing-article">
            <header className="article-header">
              <h2 className="article-title">{selectedTopicData.article.title}</h2>
              <div className="article-meta">
                <span className="article-source">{selectedTopicData.article.source}</span>
                {selectedTopicData.article.publishDate && (
                  <span className="article-date">
                    {new Date(selectedTopicData.article.publishDate).toLocaleDateString()}
                  </span>
                )}
                {selectedTopicData.article.author && (
                  <span className="article-author">{selectedTopicData.article.author}</span>
                )}
              </div>
              {selectedTopicData.analysis?.overallAssessment && (
                <div className="reliability-score">
                  <span className="score-label">Reliability Score:</span>
                  <span className={`score-value ${selectedTopicData.analysis.overallAssessment.reliabilityScore >= 70 ? 'high' : selectedTopicData.analysis.overallAssessment.reliabilityScore >= 50 ? 'medium' : 'low'}`}>
                    {selectedTopicData.analysis.overallAssessment.reliabilityScore}/100
                  </span>
                </div>
              )}
            </header>
            
            <ReaderView
              articleContent={selectedTopicData.article.content}
              fallacyData={fallacies}
            />
            
            <footer className="article-footer">
              <a 
                href={selectedTopicData.article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="original-article-link"
              >
                Read Original Article →
              </a>
            </footer>
          </article>
        </div>
      ) : (
        <div className="no-article">
          <p>No article available for this topic.</p>
        </div>
      )}
    </div>
  );
};

export default DailyBriefingPage;

