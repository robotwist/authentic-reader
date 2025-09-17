import React, { useState, useEffect } from 'react';
import { FiSearch, FiArrowRight, FiTarget, FiBarChart2, FiCpu, FiBook, FiUsers, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './FeatureSearch.css';

interface Feature {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: 'analysis' | 'tools' | 'learning' | 'admin';
}

const FeatureSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const navigate = useNavigate();

  const features: Feature[] = [
    {
      id: 'bias-detection',
      name: 'Bias Detection',
      description: 'Analyze articles for political bias and framing',
      path: '/analysis/bias',
      icon: <FiTarget />,
      category: 'analysis'
    },
    {
      id: 'comparative-analysis',
      name: 'Comparative Analysis',
      description: 'Compare multiple articles on the same topic',
      path: '/analysis/comparative',
      icon: <FiBarChart2 />,
      category: 'analysis'
    },
    {
      id: 'sentiment-analysis',
      name: 'Sentiment Analysis',
      description: 'Analyze emotional tone and sentiment',
      path: '/sentiment-analysis',
      icon: <FiBarChart2 />,
      category: 'analysis'
    },
    {
      id: 'fact-checking',
      name: 'Fact Checking',
      description: 'Verify claims and check facts',
      path: '/fact-check',
      icon: <FiShield />,
      category: 'tools'
    },
    {
      id: 'article-generator',
      name: 'Article Generator',
      description: 'Generate educational content for analysis',
      path: '/article-generator',
      icon: <FiBook />,
      category: 'tools'
    },
    {
      id: 'ai-orchestrator',
      name: 'AI Agent Orchestrator',
      description: 'Coordinate multiple AI agents for analysis',
      path: '/ai-orchestrator',
      icon: <FiCpu />,
      category: 'tools'
    },
    {
      id: 'journalist-ratings',
      name: 'Journalist Ratings',
      description: 'Rate and analyze journalist credibility',
      path: '/journalists',
      icon: <FiUsers />,
      category: 'analysis'
    },
    {
      id: 'media-literacy',
      name: 'Media Literacy Guide',
      description: 'Learn about media literacy and critical thinking',
      path: '/media-literacy-guide',
      icon: <FiBook />,
      category: 'learning'
    },
    {
      id: 'political-analysis',
      name: 'Political Analysis',
      description: 'Deep dive into political content analysis',
      path: '/political-analysis',
      icon: <FiTarget />,
      category: 'analysis'
    },
    {
      id: 'balanced-feed',
      name: 'Balanced Feed',
      description: 'Browse articles from multiple perspectives',
      path: '/feed',
      icon: <FiBook />,
      category: 'tools'
    }
  ];

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFeatures([]);
      return;
    }

    const filtered = features.filter(feature =>
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredFeatures(filtered);
  }, [searchQuery]);

  const handleFeatureSelect = (feature: Feature) => {
    navigate(feature.path);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="feature-search">
      <div className="search-container">
        <div className="search-input-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for analysis tools, features..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
        </div>

        {isOpen && (searchQuery.trim() !== '' || filteredFeatures.length > 0) && (
          <div className="search-results">
            {searchQuery.trim() === '' ? (
              <div className="search-placeholder">
                <p>Start typing to search for features...</p>
                <div className="feature-categories">
                  <div className="category">
                    <h4>Analysis Tools</h4>
                    <p>Bias detection, comparative analysis, sentiment analysis</p>
                  </div>
                  <div className="category">
                    <h4>Learning Resources</h4>
                    <p>Media literacy guide, political analysis</p>
                  </div>
                  <div className="category">
                    <h4>Advanced Tools</h4>
                    <p>AI orchestrator, article generator, fact checking</p>
                  </div>
                </div>
              </div>
            ) : filteredFeatures.length > 0 ? (
              <div className="results-list">
                {filteredFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="result-item"
                    onClick={() => handleFeatureSelect(feature)}
                  >
                    <div className="result-icon">{feature.icon}</div>
                    <div className="result-content">
                      <h4>{feature.name}</h4>
                      <p>{feature.description}</p>
                    </div>
                    <FiArrowRight className="result-arrow" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <p>No features found for "{searchQuery}"</p>
                <p className="suggestion">Try searching for "bias", "analysis", or "tools"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureSearch;
