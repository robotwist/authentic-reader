import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiClock, FiShield, FiTag, FiTrendingUp, FiFilter, FiRefreshCw } from 'react-icons/fi';
import '../styles/BalancedFeedPage.css';

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
    biasIndicators?: any;
    timestamp: string;
  };
  articleId: string;
  source: string;
  sourceCategory: string;
}

interface Source {
  id: string;
  name: string;
  url: string;
  category: 'far-left' | 'left' | 'center' | 'right' | 'far-right';
  description: string;
  biasRating: string;
  reliability: string;
}

const BalancedFeedPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['far-left', 'left', 'center', 'right', 'far-right']);
  const [sortBy, setSortBy] = useState<'date' | 'credibility' | 'source'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Comprehensive balanced source list across political spectrum
  const balancedSources: Source[] = [
    // Far Left
    {
      id: 'jacobin',
      name: 'Jacobin',
      url: 'https://jacobin.com/feed.xml',
      category: 'far-left',
      description: 'Socialist perspective on politics and economics',
      biasRating: 'far-left',
      reliability: 'medium'
    },
    {
      id: 'commondreams',
      name: 'Common Dreams',
      url: 'https://www.commondreams.org/feed',
      category: 'far-left',
      description: 'Progressive news and views',
      biasRating: 'far-left',
      reliability: 'medium'
    },
    
    // Left
    {
      id: 'npr',
      name: 'NPR News',
      url: 'https://feeds.npr.org/1001/rss.xml',
      category: 'left',
      description: 'Center-left public radio news',
      biasRating: 'left',
      reliability: 'high'
    },
    {
      id: 'msnbc',
      name: 'MSNBC',
      url: 'https://www.msnbc.com/feeds/latest.xml',
      category: 'left',
      description: 'Liberal cable news network',
      biasRating: 'left',
      reliability: 'medium'
    },
    {
      id: 'huffpost',
      name: 'HuffPost',
      url: 'https://www.huffpost.com/section/front-page/feed',
      category: 'left',
      description: 'Liberal digital media outlet',
      biasRating: 'left',
      reliability: 'medium'
    },
    
    // Center
    {
      id: 'reuters',
      name: 'Reuters',
      url: 'https://feeds.reuters.com/reuters/topNews',
      category: 'center',
      description: 'International news agency',
      biasRating: 'center',
      reliability: 'high'
    },
    {
      id: 'bbc',
      name: 'BBC News',
      url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      category: 'center',
      description: 'British public service broadcaster',
      biasRating: 'center',
      reliability: 'high'
    },
    {
      id: 'ap',
      name: 'Associated Press',
      url: 'https://feeds.ap.org/ap/topnews',
      category: 'center',
      description: 'Non-profit news cooperative',
      biasRating: 'center',
      reliability: 'high'
    },
    {
      id: 'pbs',
      name: 'PBS NewsHour',
      url: 'https://www.pbs.org/newshour/feed/podcast/newshour-full-show',
      category: 'center',
      description: 'Public broadcasting news',
      biasRating: 'center',
      reliability: 'high'
    },
    
    // Right
    {
      id: 'wsj',
      name: 'Wall Street Journal',
      url: 'https://feeds.wsj.com/public/rss/2_0.xml',
      category: 'right',
      description: 'Conservative business newspaper',
      biasRating: 'right',
      reliability: 'high'
    },
    {
      id: 'nationalreview',
      name: 'National Review',
      url: 'https://www.nationalreview.com/feed/',
      category: 'right',
      description: 'Conservative magazine',
      biasRating: 'right',
      reliability: 'medium'
    },
    {
      id: 'foxnews',
      name: 'Fox News',
      url: 'https://feeds.foxnews.com/foxnews/latest',
      category: 'right',
      description: 'Conservative cable news network',
      biasRating: 'right',
      reliability: 'medium'
    },
    
    // Far Right
    {
      id: 'breitbart',
      name: 'Breitbart',
      url: 'https://www.breitbart.com/feed/',
      category: 'far-right',
      description: 'Far-right news and opinion',
      biasRating: 'far-right',
      reliability: 'low'
    },
    {
      id: 'infowars',
      name: 'InfoWars',
      url: 'https://www.infowars.com/feed/',
      category: 'far-right',
      description: 'Far-right conspiracy theory outlet',
      biasRating: 'far-right',
      reliability: 'low'
    }
  ];

  const fetchAllArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allArticles: Article[] = [];
      
      // Fetch from all active sources
      for (const source of balancedSources.filter(s => activeFilters.includes(s.category))) {
        try {
          const response = await fetch(`http://localhost:3000/api/rss?url=${encodeURIComponent(source.url)}`);
          if (response.ok) {
            const data = await response.json();
            const sourceArticles = (data.items || []).map((item: any) => ({
              ...item,
              source: source.name,
              sourceCategory: source.category,
              biasRating: source.biasRating,
              reliability: source.reliability
            }));
            allArticles.push(...sourceArticles);
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${source.name}:`, err);
        }
      }
      
      // Sort articles based on user preference
      const sortedArticles = sortArticles(allArticles, sortBy);
      setArticles(sortedArticles);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const sortArticles = (articles: Article[], sortType: string) => {
    switch (sortType) {
      case 'credibility':
        return [...articles].sort((a, b) => b.analysis.credibility.score - a.analysis.credibility.score);
      case 'source':
        return [...articles].sort((a, b) => a.source.localeCompare(b.source));
      case 'date':
      default:
        return [...articles].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    }
  };

  useEffect(() => {
    fetchAllArticles();
  }, [activeFilters, sortBy]);

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

  const getBiasColor = (category: string) => {
    switch (category) {
      case 'far-left': return '#dc2626';
      case 'left': return '#ef4444';
      case 'center': return '#3b82f6';
      case 'right': return '#8b5cf6';
      case 'far-right': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  const toggleFilter = (category: string) => {
    setActiveFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryStats = () => {
    const stats = {
      'far-left': 0,
      'left': 0,
      'center': 0,
      'right': 0,
      'far-right': 0
    };
    
    articles.forEach(article => {
      stats[article.sourceCategory as keyof typeof stats]++;
    });
    
    return stats;
  };

  if (loading) {
    return (
      <div className="balanced-feed-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading balanced news feed...</p>
          <p className="loading-subtitle">Gathering perspectives from across the political spectrum</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="balanced-feed-page">
        <div className="error-container">
          <h2>Error Loading Balanced Feed</h2>
          <p>{error}</p>
          <button onClick={fetchAllArticles} className="retry-button">
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const categoryStats = getCategoryStats();

  return (
    <div className="balanced-feed-page">
      <div className="feed-header">
        <div className="header-content">
          <h1>Balanced News Feed</h1>
          <p className="subtitle">Multiple perspectives for informed understanding</p>
          
          <div className="feed-controls">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle"
            >
              <FiFilter /> Filters
            </button>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="credibility">Sort by Credibility</option>
              <option value="source">Sort by Source</option>
            </select>
            
            <button onClick={fetchAllArticles} className="refresh-button">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="filter-panel">
            <h3>Source Categories</h3>
            <div className="filter-options">
              {Object.entries(categoryStats).map(([category, count]) => (
                <label key={category} className="filter-option">
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(category)}
                    onChange={() => toggleFilter(category)}
                  />
                  <span className="filter-label">
                    <span 
                      className="bias-indicator" 
                      style={{ backgroundColor: getBiasColor(category) }}
                    ></span>
                    {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <span className="article-count">({count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="source-stats">
        <div className="stats-grid">
          {Object.entries(categoryStats).map(([category, count]) => (
            <div key={category} className="stat-card">
              <div 
                className="stat-color" 
                style={{ backgroundColor: getBiasColor(category) }}
              ></div>
              <div className="stat-content">
                <span className="stat-count">{count}</span>
                <span className="stat-label">{category.replace('-', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="articles-container">
        {articles.map((article, index) => (
          <article key={article.articleId || index} className="article-card">
            <div className="article-header">
              <div className="source-info">
                <span 
                  className="source-badge"
                  style={{ backgroundColor: getBiasColor(article.sourceCategory) }}
                >
                  {article.source}
                </span>
                <span className="bias-category">{article.sourceCategory.replace('-', ' ')}</span>
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
                <span className="article-author">{article.author}</span>
                <span className="article-date">{formatDate(article.pubDate)}</span>
              </div>
            </div>

            <div className="article-content">
              <p className="article-description">{article.description}</p>
            </div>

            {article.analysis && (
              <div className="article-analysis">
                <div className="analysis-grid">
                  <div className="analysis-item">
                    <FiClock className="analysis-icon" />
                    <span className="analysis-value">{article.analysis.readingTime} min</span>
                  </div>
                  
                  <div className="analysis-item">
                    <FiShield className="analysis-icon" />
                    <span 
                      className="analysis-value credibility-badge"
                      style={{ backgroundColor: getCredibilityColor(article.analysis.credibility.level) }}
                    >
                      {article.analysis.credibility.level}
                    </span>
                  </div>
                  
                  <div className="analysis-item">
                    <FiTag className="analysis-icon" />
                    <span className="analysis-value">
                      {article.analysis.keyTopics[0]}
                    </span>
                  </div>
                  
                  <div className="analysis-item">
                    <FiTrendingUp className="analysis-icon" />
                    <span className="analysis-value">{article.analysis.complexity}</span>
                  </div>
                </div>
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
          <p>Try adjusting your filters or refreshing the feed.</p>
        </div>
      )}
    </div>
  );
};

export default BalancedFeedPage;
