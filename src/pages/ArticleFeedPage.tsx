import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { processArticleDescription } from '../utils/htmlUtils';
import '../styles/ArticleFeedPage.css';

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  content: string;
  analysis: {
    wordCount: number;
    readingTime: number;
    hasExternalLinks: boolean;
    complexity: string;
    keyTopics: string[];
    credibility: {
      score: number;
      level: string;
      reason: string;
    };
    summary: string;
    timestamp: string;
  };
  articleId: string;
}

interface FeedInfo {
  title: string;
  description: string;
  link: string;
  itemCount: number;
  lastUpdated: string;
}

const ArticleFeedPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState('npr');
  const navigate = useNavigate();

  // Default RSS sources
  const defaultSources = [
    { id: 'npr', name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
    { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
    { id: 'reuters', name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews' },
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
  ];

  const fetchArticles = async (sourceId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const source = defaultSources.find(s => s.id === sourceId);
      if (!source) {
        throw new Error('Source not found');
      }

      const response = await fetch(`http://localhost:3000/api/rss?url=${encodeURIComponent(source.url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(currentSource);
  }, [currentSource]);

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

  if (loading) {
    return (
      <div className="article-feed-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-feed-page">
        <div className="error-container">
          <h2>Error Loading Articles</h2>
          <p>{error}</p>
          <button onClick={() => fetchArticles(currentSource)} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-feed-page" role="main" aria-label="Article feed">
      <div className="feed-header">
        <div className="source-selector">
          <label htmlFor="source-select" className="sr-only">Select news source</label>
          <select 
            id="source-select"
            value={currentSource} 
            onChange={(e) => setCurrentSource(e.target.value)}
            className="source-select"
            aria-label="Select news source"
          >
            {defaultSources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="feed-info">
          <h1>Latest Articles</h1>
          <p aria-live="polite">{articles.length} articles loaded</p>
        </div>
      </div>

      <div className="articles-container" role="feed" aria-label="Articles list">
        {articles.map((article, index) => (
          <article key={article.articleId || index} className="article-card" role="article">
            <div className="article-header">
              <h2 className="article-title">
                <Link 
                  to={`/analysis/${article.articleId || index}`}
                  state={{ article }}
                  className="article-link"
                  aria-describedby={`article-${index}-meta`}
                >
                  {article.title}
                </Link>
              </h2>
              <div className="article-meta" id={`article-${index}-meta`}>
                <span className="article-author" aria-label="Author">{article.author}</span>
                <span className="article-date" aria-label="Publication date">{formatDate(article.pubDate)}</span>
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
              <div className="article-analysis" role="region" aria-label="Content analysis">
                <div className="analysis-header">
                  <h3>Content Analysis</h3>
                </div>
                
                <div className="analysis-grid" role="list">
                  <div className="analysis-item" role="listitem">
                    <span className="analysis-label">Reading Time:</span>
                    <span className="analysis-value">{article.analysis.readingTime} min</span>
                  </div>
                  
                  <div className="analysis-item" role="listitem">
                    <span className="analysis-label">Word Count:</span>
                    <span className="analysis-value">{article.analysis.wordCount}</span>
                  </div>
                  
                  <div className="analysis-item" role="listitem">
                    <span className="analysis-label">Credibility:</span>
                    <span 
                      className="analysis-value credibility-badge"
                      style={{ backgroundColor: getCredibilityColor(typeof article.analysis.credibility.level === 'string' 
                        ? article.analysis.credibility.level 
                        : typeof article.analysis.credibility.level === 'object' 
                          ? (article.analysis.credibility.level.level || 
                             article.analysis.credibility.level.type || 
                             'unknown') 
                          : 'unknown') }}
                      aria-label={`Credibility level: ${typeof article.analysis.credibility.level === 'string' 
                        ? article.analysis.credibility.level 
                        : typeof article.analysis.credibility.level === 'object' 
                          ? (article.analysis.credibility.level.level || 
                             article.analysis.credibility.level.type || 
                             'unknown') 
                          : 'unknown'}`}
                    >
                      {typeof article.analysis.credibility.level === 'string' 
                        ? article.analysis.credibility.level 
                        : typeof article.analysis.credibility.level === 'object' 
                          ? (article.analysis.credibility.level.level || 
                             article.analysis.credibility.level.type || 
                             JSON.stringify(article.analysis.credibility.level)) 
                          : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="analysis-item" role="listitem">
                    <span className="analysis-label">Topics:</span>
                    <span className="analysis-value">
                      {article.analysis.keyTopics.join(', ')}
                    </span>
                  </div>
                </div>

                {article.analysis.summary && (
                  <div className="analysis-summary">
                    <h4>Summary</h4>
                    <p>{article.analysis.summary}</p>
                  </div>
                )}

                <div className="analysis-credibility">
                  <p className="credibility-reason">
                    <strong>Why this rating:</strong> {article.analysis.credibility.reason}
                  </p>
                </div>
              </div>
            )}

            <div className="article-actions">
              <Link 
                to={`/analysis/${article.articleId || index}`} 
                state={{ article }}
                className="read-button"
                aria-label={`Read full article: ${article.title}`}
              >
                Read Full Article
              </Link>
            </div>
          </article>
        ))}
      </div>

      {articles.length === 0 && !loading && (
        <div className="no-articles" role="status" aria-live="polite">
          <h2>No articles found</h2>
          <p>Try selecting a different source or check your connection.</p>
        </div>
      )}
    </div>
  );
};

export default ArticleFeedPage;
