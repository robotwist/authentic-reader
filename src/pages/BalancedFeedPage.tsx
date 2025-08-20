import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    summary: string;
    credibility: { score: number; level: string; reason: string };
    logicalFallacies?: Array<{ type: string; explanation: string; excerpt?: string; confidence: number }>;
    biasAnalysis?: { direction: 'left' | 'right' | 'center'; confidence: number; explanation: string; indicators: { left: number; right: number } };
    networkAnalysis?: { topEntities: Array<{ name: string; count: number }>; entityCount: number };
    timestamp: string;
  };
  articleId: string;
  source: string;
  sourceCategory: string;
}



const BalancedFeedPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['far-left', 'left', 'center', 'right', 'far-right']);
  const [sortBy, setSortBy] = useState<'date' | 'credibility' | 'source'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Note: Sources are now fetched from the API instead of hardcoded

  const fetchAllArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the new balanced feed endpoint
      const response = await fetch(`http://localhost:3001/api/balanced-feed?categories=${activeFilters.join(',')}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched articles:', data.articles.length);
        console.log('First article analysis:', data.articles[0]?.analysis);
        const sortedArticles = sortArticles(data.articles, sortBy);
        setArticles(sortedArticles);
      } else {
        throw new Error('Failed to fetch balanced feed');
      }
      
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
              onChange={(e) => setSortBy(e.target.value as 'date' | 'credibility' | 'source')}
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
                <span className="article-author">{typeof article.author === 'string' ? article.author : 'Unknown Author'}</span>
                <span className="article-date">{formatDate(article.pubDate)}</span>
              </div>
            </div>

            <div className="article-content">
              <p className="article-description">{typeof article.description === 'string' ? article.description : 'No description available'}</p>
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

                  {article.analysis.biasAnalysis && typeof article.analysis.biasAnalysis.direction === 'string' && (
                    <div className="analysis-item">
                      <FiTag className="analysis-icon" />
                      <span className="analysis-value">
                        Bias: {article.analysis.biasAnalysis.direction} ({Math.round((article.analysis.biasAnalysis.confidence || 0) * 100)}%)
                      </span>
                    </div>
                  )}

                  {article.analysis.logicalFallacies && article.analysis.logicalFallacies.length > 0 && (
                    <div className="analysis-item">
                      <FiTrendingUp className="analysis-icon" />
                      <span className="analysis-value">
                        {article.analysis.logicalFallacies.length} fallac{article.analysis.logicalFallacies.length === 1 ? 'y' : 'ies'} detected
                      </span>
                    </div>
                  )}
                </div>

                {article.analysis.logicalFallacies && article.analysis.logicalFallacies.length > 0 && (
                  <div className="fallacy-snippets">
                    {article.analysis.logicalFallacies.slice(0, 2).map((f, idx) => (
                      <div key={idx} className="fallacy-chip" title={f.explanation}>
                        {f.type.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                )}

                {article.analysis.networkAnalysis && article.analysis.networkAnalysis.topEntities && Array.isArray(article.analysis.networkAnalysis.topEntities) && article.analysis.networkAnalysis.topEntities.length > 0 && (
                  <div className="network-snippets">
                    <span className="network-label">Top entities:</span>
                    {article.analysis.networkAnalysis.topEntities.slice(0, 3).map((e, idx) => (
                      <span key={idx} className="entity-chip">{typeof e.name === 'string' ? e.name : 'Unknown'}</span>
                    ))}
                  </div>
                )}
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
