import React, { useState, useEffect } from 'react';
import { FiShield, FiBookOpen, FiTarget, FiSearch, FiStar, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { democracyForcesService, DemocracyForce, ExemplaryArticle, TrustBuildingFeature } from '../services/democracyForcesService';
import { logger } from '../utils/logger';
import './ForcesForGood.css';

interface ForcesForGoodProps {
  onArticleSelect?: (article: ExemplaryArticle) => void;
}

const ForcesForGood: React.FC<ForcesForGoodProps> = ({ onArticleSelect }) => {
  const [forces, setForces] = useState<DemocracyForce[]>([]);
  const [exemplaryArticles, setExemplaryArticles] = useState<ExemplaryArticle[]>([]);
  const [trustFeatures, setTrustFeatures] = useState<TrustBuildingFeature[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forces' | 'articles' | 'trust'>('forces');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load democracy forces
      const allForces = democracyForcesService.getDemocracyForces();
      setForces(allForces);
      
      // Load trust-building features
      const features = democracyForcesService.getTrustBuildingFeatures();
      setTrustFeatures(features);
      
      // Load exemplary articles
      const articles = await democracyForcesService.searchExemplaryArticles('democracy');
      setExemplaryArticles(articles);
      
      logger.info('Forces for good data loaded', { 
        forcesCount: allForces.length, 
        articlesCount: articles.length,
        featuresCount: features.length 
      });
    } catch (error) {
      logger.error('Failed to load forces for good data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const articles = await democracyForcesService.searchExemplaryArticles(searchQuery, selectedCategory);
      setExemplaryArticles(articles);
      setActiveTab('articles');
    } catch (error) {
      logger.error('Failed to search exemplary articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredForces = forces.filter(force => {
    const categoryMatch = selectedCategory === 'all' || force.category === selectedCategory;
    const typeMatch = selectedType === 'all' || force.type === selectedType;
    return categoryMatch && typeMatch;
  });

  const getTrustScore = (force: DemocracyForce): number => {
    return Math.round(Object.values(force.trustworthiness).reduce((a, b) => a + b, 0) / 5);
  };

  const getTrustColor = (score: number): string => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 80) return '#f59e0b'; // Yellow
    if (score >= 70) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getTrustIcon = (score: number) => {
    if (score >= 90) return <FiCheckCircle className="trust-icon high" />;
    if (score >= 80) return <FiStar className="trust-icon medium" />;
    return <FiAlertCircle className="trust-icon low" />;
  };

  const handleArticleSelect = (article: ExemplaryArticle) => {
    if (onArticleSelect) {
      onArticleSelect(article);
    }
    logger.info('Exemplary article selected', { articleId: article.id, source: article.source.name });
  };

  if (loading) {
    return (
      <div className="forces-for-good">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Loading Forces for Good...</h2>
          <p>Identifying democracy-promoting organizations and exemplary journalism</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forces-for-good">
      {/* Header */}
      <div className="forces-header">
        <h1>🛡️ Forces for Good</h1>
        <p className="subtitle">Organizations and media that promote democracy, individual freedoms, and exemplary journalism</p>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for exemplary articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="search-button">
            <FiSearch />
          </button>
        </div>

        <div className="filters">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="journalism">Journalism</option>
            <option value="activism">Activism</option>
            <option value="education">Education</option>
            <option value="legal">Legal</option>
            <option value="technology">Technology</option>
            <option value="research">Research</option>
            <option value="community">Community</option>
          </select>

          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="media">Media</option>
            <option value="organization">Organization</option>
            <option value="individual">Individual</option>
            <option value="institution">Institution</option>
            <option value="movement">Movement</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'forces' ? 'active' : ''}`}
          onClick={() => setActiveTab('forces')}
        >
          <FiShield />
          Democracy Forces ({filteredForces.length})
        </button>
        <button 
          className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          <FiBookOpen />
          Exemplary Articles ({exemplaryArticles.length})
        </button>
        <button 
          className={`tab ${activeTab === 'trust' ? 'active' : ''}`}
          onClick={() => setActiveTab('trust')}
        >
          <FiTarget />
          Trust Building ({trustFeatures.length})
        </button>
      </div>

      {/* Content */}
      <div className="content">
        {activeTab === 'forces' && (
          <div className="forces-grid">
            {filteredForces.map(force => {
              const trustScore = getTrustScore(force);
              const trustColor = getTrustColor(trustScore);
              
              return (
                <div key={force.id} className="force-card">
                  <div className="force-header">
                    <h3>{force.name}</h3>
                    <div className="trust-score" style={{ color: trustColor }}>
                      {getTrustIcon(trustScore)}
                      <span>{trustScore}%</span>
                    </div>
                  </div>
                  
                  <div className="force-meta">
                    <span className="force-type">{force.type}</span>
                    <span className="force-category">{force.category}</span>
                    {force.location && <span className="force-location">{force.location}</span>}
                  </div>
                  
                  <p className="force-description">{force.description}</p>
                  
                  <div className="force-mission">
                    <strong>Mission:</strong> {force.mission}
                  </div>
                  
                  <div className="democratic-values">
                    <strong>Democratic Values:</strong>
                    <div className="values-list">
                      {force.democraticValues.map(value => (
                        <span key={value} className="value-tag">{value}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="trustworthiness-breakdown">
                    <h4>Trustworthiness Breakdown:</h4>
                    <div className="trust-metrics">
                      <div className="metric">
                        <span>Transparency</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{ width: `${force.trustworthiness.transparency}%` }}
                          />
                        </div>
                        <span>{force.trustworthiness.transparency}%</span>
                      </div>
                      <div className="metric">
                        <span>Accountability</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{ width: `${force.trustworthiness.accountability}%` }}
                          />
                        </div>
                        <span>{force.trustworthiness.accountability}%</span>
                      </div>
                      <div className="metric">
                        <span>Independence</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{ width: `${force.trustworthiness.independence}%` }}
                          />
                        </div>
                        <span>{force.trustworthiness.independence}%</span>
                      </div>
                      <div className="metric">
                        <span>Accuracy</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{ width: `${force.trustworthiness.accuracy}%` }}
                          />
                        </div>
                        <span>{force.trustworthiness.accuracy}%</span>
                      </div>
                      <div className="metric">
                        <span>Public Service</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{ width: `${force.trustworthiness.publicService}%` }}
                          />
                        </div>
                        <span>{force.trustworthiness.publicService}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="force-examples">
                    <h4>Exemplary Actions:</h4>
                    <ul>
                      {force.examples.democraticActions.slice(0, 3).map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="force-actions">
                    {force.website && (
                      <a 
                        href={force.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="action-button primary"
                      >
                        Visit Website
                      </a>
                    )}
                    <button 
                      className="action-button secondary"
                      onClick={() => {
                        setSearchQuery(force.name);
                        handleSearch();
                      }}
                    >
                      Find Articles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="articles-list">
            {exemplaryArticles.map(article => (
              <div key={article.id} className="article-card">
                <div className="article-header">
                  <h3>{article.title}</h3>
                  <div className="article-source">
                    <span className="source-name">{article.source.name}</span>
                    <span className="source-type">{article.source.type}</span>
                  </div>
                </div>
                
                <p className="article-content">{article.content}</p>
                
                <div className="quality-indicators">
                  <h4>Quality Indicators:</h4>
                  <div className="indicators-grid">
                    {Object.entries(article.qualityIndicators).map(([key, value]) => (
                      <div key={key} className={`indicator ${value ? 'positive' : 'negative'}`}>
                        <FiCheckCircle className={value ? 'positive' : 'negative'} />
                        <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="democratic-values">
                  <h4>Democratic Values:</h4>
                  <div className="values-list">
                    {article.democraticValues.map(value => (
                      <span key={value} className="value-tag">{value}</span>
                    ))}
                  </div>
                </div>
                
                <div className="community-rating">
                  <h4>Community Rating:</h4>
                  <div className="rating-metrics">
                    <div className="rating-metric">
                      <span>Trustworthiness</span>
                      <div className="rating-bar">
                        <div 
                          className="rating-fill" 
                          style={{ width: `${article.communityRating.trustworthiness}%` }}
                        />
                      </div>
                      <span>{article.communityRating.trustworthiness}%</span>
                    </div>
                    <div className="rating-metric">
                      <span>Democratic Value</span>
                      <div className="rating-bar">
                        <div 
                          className="rating-fill" 
                          style={{ width: `${article.communityRating.democraticValue}%` }}
                        />
                      </div>
                      <span>{article.communityRating.democraticValue}%</span>
                    </div>
                    <div className="rating-metric">
                      <span>Public Service</span>
                      <div className="rating-bar">
                        <div 
                          className="rating-fill" 
                          style={{ width: `${article.communityRating.publicService}%` }}
                        />
                      </div>
                      <span>{article.communityRating.publicService}%</span>
                    </div>
                    <div className="rating-metric">
                      <span>Accuracy</span>
                      <div className="rating-bar">
                        <div 
                          className="rating-fill" 
                          style={{ width: `${article.communityRating.accuracy}%` }}
                        />
                      </div>
                      <span>{article.communityRating.accuracy}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="article-actions">
                  <button 
                    className="action-button primary"
                    onClick={() => handleArticleSelect(article)}
                  >
                    Read Full Article
                  </button>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-button secondary"
                  >
                    Visit Source
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'trust' && (
          <div className="trust-features">
            {trustFeatures.map(feature => (
              <div key={feature.id} className="trust-feature-card">
                <div className="feature-header">
                  <h3>{feature.title}</h3>
                  <span className="feature-type">{feature.type}</span>
                </div>
                
                <p className="feature-description">{feature.description}</p>
                
                <div className="feature-examples">
                  <h4>Examples:</h4>
                  <ul>
                    {feature.examples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="verification-methods">
                  <h4>How to Verify:</h4>
                  <ul>
                    {feature.verificationMethods.map((method, index) => (
                      <li key={index}>{method}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForcesForGood;
