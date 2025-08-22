import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiShield, 
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiBarChart2,
  FiTarget,
  FiActivity
} from 'react-icons/fi';
import '../styles/JournalistRating.css';

interface Journalist {
  name: string;
  source: string;
  articlesCount: number;
  averageBias: number;
  credibilityScore: number;
  biasTrend: 'increasing' | 'decreasing' | 'stable';
  lastArticleDate: string;
  topTopics: string[];
  writingStyle: {
    objectivity: number;
    sensationalism: number;
    factChecking: number;
    sourceDiversity: number;
  };
  recentArticles: Array<{
    title: string;
    date: string;
    biasScore: number;
    credibilityScore: number;
  }>;
}

interface JournalistRatingProps {
  journalistName?: string;
  sourceName?: string;
  onClose?: () => void;
}

const JournalistRating: React.FC<JournalistRatingProps> = ({ 
  journalistName, 
  sourceName, 
  onClose 
}) => {
  const [journalists, setJournalists] = useState<Journalist[]>([]);
  const [selectedJournalist, setSelectedJournalist] = useState<Journalist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'bias' | 'credibility' | 'articles'>('credibility');

  useEffect(() => {
    loadJournalistData();
  }, []);

  const loadJournalistData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading journalist data
      const mockJournalists: Journalist[] = [
        {
          name: "Sarah Johnson",
          source: "Reuters",
          articlesCount: 45,
          averageBias: 2.1,
          credibilityScore: 8.7,
          biasTrend: 'stable',
          lastArticleDate: "2024-01-20",
          topTopics: ["Politics", "Economy", "Technology"],
          writingStyle: {
            objectivity: 8.5,
            sensationalism: 1.2,
            factChecking: 9.1,
            sourceDiversity: 8.8
          },
          recentArticles: [
            { title: "Federal Reserve Announces New Policy", date: "2024-01-20", biasScore: 1.8, credibilityScore: 8.9 },
            { title: "Tech Industry Faces Regulatory Changes", date: "2024-01-18", biasScore: 2.3, credibilityScore: 8.6 },
            { title: "Climate Policy Implementation Begins", date: "2024-01-15", biasScore: 2.1, credibilityScore: 8.7 }
          ]
        },
        {
          name: "Michael Chen",
          source: "BBC News",
          articlesCount: 38,
          averageBias: 2.8,
          credibilityScore: 8.2,
          biasTrend: 'decreasing',
          lastArticleDate: "2024-01-19",
          topTopics: ["International", "Science", "Health"],
          writingStyle: {
            objectivity: 7.8,
            sensationalism: 2.1,
            factChecking: 8.4,
            sourceDiversity: 7.9
          },
          recentArticles: [
            { title: "Global Health Initiative Launched", date: "2024-01-19", biasScore: 2.5, credibilityScore: 8.3 },
            { title: "Scientific Breakthrough in Renewable Energy", date: "2024-01-16", biasScore: 3.1, credibilityScore: 8.1 },
            { title: "International Trade Agreement Reached", date: "2024-01-13", biasScore: 2.9, credibilityScore: 8.2 }
          ]
        },
        {
          name: "Alex Rodriguez",
          source: "Fox News",
          articlesCount: 52,
          averageBias: 7.2,
          credibilityScore: 5.8,
          biasTrend: 'increasing',
          lastArticleDate: "2024-01-20",
          topTopics: ["Politics", "Business", "Culture"],
          writingStyle: {
            objectivity: 4.2,
            sensationalism: 7.8,
            factChecking: 6.1,
            sourceDiversity: 4.5
          },
          recentArticles: [
            { title: "Political Opposition Criticizes New Policy", date: "2024-01-20", biasScore: 7.8, credibilityScore: 5.5 },
            { title: "Business Leaders Express Concerns", date: "2024-01-17", biasScore: 6.9, credibilityScore: 6.2 },
            { title: "Cultural Shift in American Society", date: "2024-01-14", biasScore: 7.5, credibilityScore: 5.7 }
          ]
        },
        {
          name: "Emily Watson",
          source: "MSNBC",
          articlesCount: 41,
          averageBias: 6.8,
          credibilityScore: 6.2,
          biasTrend: 'stable',
          lastArticleDate: "2024-01-20",
          topTopics: ["Politics", "Social Issues", "Environment"],
          writingStyle: {
            objectivity: 4.8,
            sensationalism: 6.2,
            factChecking: 7.1,
            sourceDiversity: 5.8
          },
          recentArticles: [
            { title: "Progressive Policy Gains Support", date: "2024-01-20", biasScore: 7.1, credibilityScore: 6.0 },
            { title: "Social Justice Movement Continues", date: "2024-01-17", biasScore: 6.5, credibilityScore: 6.4 },
            { title: "Environmental Protection Measures", date: "2024-01-14", biasScore: 6.9, credibilityScore: 6.2 }
          ]
        },
        {
          name: "David Kim",
          source: "Associated Press",
          articlesCount: 67,
          averageBias: 1.9,
          credibilityScore: 9.1,
          biasTrend: 'stable',
          lastArticleDate: "2024-01-20",
          topTopics: ["Breaking News", "Politics", "International"],
          writingStyle: {
            objectivity: 9.2,
            sensationalism: 0.8,
            factChecking: 9.4,
            sourceDiversity: 9.0
          },
          recentArticles: [
            { title: "Breaking: Major Policy Announcement", date: "2024-01-20", biasScore: 1.7, credibilityScore: 9.2 },
            { title: "International Summit Concludes", date: "2024-01-18", biasScore: 2.1, credibilityScore: 9.0 },
            { title: "Economic Data Released", date: "2024-01-15", biasScore: 1.9, credibilityScore: 9.1 }
          ]
        }
      ];

      setJournalists(mockJournalists);
      
      // If a specific journalist is requested, find them
      if (journalistName) {
        const found = mockJournalists.find(j => 
          j.name.toLowerCase().includes(journalistName.toLowerCase())
        );
        if (found) setSelectedJournalist(found);
      }
    } catch (error) {
      console.error('Failed to load journalist data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBiasColor = (bias: number) => {
    if (bias <= 3) return 'var(--success-color)';
    if (bias <= 5) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 8) return 'var(--success-color)';
    if (score >= 6) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  const getBiasTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <FiTrendingUp className="trend-up" />;
      case 'decreasing': return <FiTrendingDown className="trend-down" />;
      default: return <FiActivity className="trend-stable" />;
    }
  };

  const filteredJournalists = journalists.filter(journalist =>
    journalist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journalist.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedJournalists = [...filteredJournalists].sort((a, b) => {
    switch (sortBy) {
      case 'bias': return a.averageBias - b.averageBias;
      case 'credibility': return b.credibilityScore - a.credibilityScore;
      case 'articles': return b.articlesCount - a.articlesCount;
      default: return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="journalist-rating-container">
        <div className="loading-spinner">
          <FiActivity className="spinner" />
          <p>Loading journalist ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="journalist-rating-container">
      <div className="journalist-rating-header">
        <h2>
          <FiUser className="header-icon" />
          Journalist Bias & Credibility Ratings
        </h2>
        <p>Track journalist performance and bias patterns over time</p>
      </div>

      <div className="journalist-rating-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search journalists or sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="credibility">Credibility (High to Low)</option>
            <option value="bias">Bias (Low to High)</option>
            <option value="articles">Article Count</option>
          </select>
        </div>
      </div>

      <div className="journalist-grid">
        {sortedJournalists.map((journalist) => (
          <div 
            key={journalist.name}
            className="journalist-card"
            onClick={() => setSelectedJournalist(journalist)}
          >
            <div className="journalist-header">
              <div className="journalist-info">
                <h3>{journalist.name}</h3>
                <span className="source-name">{journalist.source}</span>
              </div>
              <div className="journalist-stats">
                <div className="stat-item">
                  <span className="stat-label">Bias</span>
                  <span 
                    className="stat-value bias-score"
                    style={{ color: getBiasColor(journalist.averageBias) }}
                  >
                    {journalist.averageBias.toFixed(1)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Credibility</span>
                  <span 
                    className="stat-value credibility-score"
                    style={{ color: getCredibilityColor(journalist.credibilityScore) }}
                  >
                    {journalist.credibilityScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="journalist-details">
              <div className="detail-row">
                <FiBarChart2 />
                <span>{journalist.articlesCount} articles</span>
              </div>
              <div className="detail-row">
                <FiClock />
                <span>Last: {new Date(journalist.lastArticleDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                {getBiasTrendIcon(journalist.biasTrend)}
                <span>Bias trend: {journalist.biasTrend}</span>
              </div>
            </div>

            <div className="journalist-topics">
              <strong>Top Topics:</strong>
              <div className="topic-tags">
                {journalist.topTopics.slice(0, 3).map(topic => (
                  <span key={topic} className="topic-tag">{topic}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedJournalist && (
        <div className="journalist-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedJournalist.name}</h3>
              <button onClick={() => setSelectedJournalist(null)} className="close-btn">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Overall Performance</h4>
                <div className="performance-grid">
                  <div className="performance-item">
                    <span className="label">Average Bias</span>
                    <span 
                      className="value"
                      style={{ color: getBiasColor(selectedJournalist.averageBias) }}
                    >
                      {selectedJournalist.averageBias.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="performance-item">
                    <span className="label">Credibility Score</span>
                    <span 
                      className="value"
                      style={{ color: getCredibilityColor(selectedJournalist.credibilityScore) }}
                    >
                      {selectedJournalist.credibilityScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="performance-item">
                    <span className="label">Articles Analyzed</span>
                    <span className="value">{selectedJournalist.articlesCount}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Writing Style Analysis</h4>
                <div className="style-metrics">
                  <div className="metric">
                    <span>Objectivity</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${selectedJournalist.writingStyle.objectivity * 10}%` }}
                      ></div>
                    </div>
                    <span>{selectedJournalist.writingStyle.objectivity.toFixed(1)}/10</span>
                  </div>
                  <div className="metric">
                    <span>Fact Checking</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${selectedJournalist.writingStyle.factChecking * 10}%` }}
                      ></div>
                    </div>
                    <span>{selectedJournalist.writingStyle.factChecking.toFixed(1)}/10</span>
                  </div>
                  <div className="metric">
                    <span>Source Diversity</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${selectedJournalist.writingStyle.sourceDiversity * 10}%` }}
                      ></div>
                    </div>
                    <span>{selectedJournalist.writingStyle.sourceDiversity.toFixed(1)}/10</span>
                  </div>
                  <div className="metric">
                    <span>Sensationalism</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill sensationalism" 
                        style={{ width: `${selectedJournalist.writingStyle.sensationalism * 10}%` }}
                      ></div>
                    </div>
                    <span>{selectedJournalist.writingStyle.sensationalism.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Recent Articles</h4>
                <div className="recent-articles">
                  {selectedJournalist.recentArticles.map((article, index) => (
                    <div key={index} className="article-item">
                      <div className="article-title">{article.title}</div>
                      <div className="article-meta">
                        <span>{new Date(article.date).toLocaleDateString()}</span>
                        <span className="bias-score" style={{ color: getBiasColor(article.biasScore) }}>
                          Bias: {article.biasScore.toFixed(1)}
                        </span>
                        <span className="credibility-score" style={{ color: getCredibilityColor(article.credibilityScore) }}>
                          Credibility: {article.credibilityScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalistRating;
