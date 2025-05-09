import React, { useState, useEffect } from 'react';
import { useArticles } from '../hooks/useArticles';
import ArticleCard from '../components/ArticleCard';
import { RSSArticle } from '../types';
import { FiBookmark, FiClock, FiRss, FiPlusCircle } from 'react-icons/fi';
import '../styles/LibraryPage.css';

const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'sources'>('saved');
  const [savedArticles, setSavedArticles] = useState<RSSArticle[]>([]);
  const [readArticles, setReadArticles] = useState<RSSArticle[]>([]);
  
  const { 
    articles, 
    sources, 
    loading, 
    markAsRead, 
    markAsSaved,
    analyzeArticle
  } = useArticles();
  
  useEffect(() => {
    // Filter saved articles
    const saved = articles.filter(article => article.saved);
    setSavedArticles(saved);
    
    // Filter read articles
    const read = articles.filter(article => article.read);
    setReadArticles(read);
  }, [articles]);
  
  const handleAnalyzeArticle = async (article: RSSArticle) => {
    try {
      await analyzeArticle(article);
      // Navigate to article page with ID
      const articleId = article.id || article.guid;
      if (articleId) {
        window.location.href = `/article/${articleId}`;
      }
    } catch (error) {
      console.error('Error analyzing article:', error);
    }
  };

  return (
    <div className="library-page">
      <header className="library-header">
        <h1>My Library</h1>
        <p>Manage your saved content, reading history, and sources</p>
      </header>
      
      <div className="library-tabs">
        <button 
          className={`library-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <FiBookmark /> Saved Articles
        </button>
        <button 
          className={`library-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiClock /> Reading History
        </button>
        <button 
          className={`library-tab ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          <FiRss /> My Sources
        </button>
      </div>
      
      <div className="library-content">
        {activeTab === 'saved' && (
          <div className="saved-articles-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your saved articles...</p>
              </div>
            ) : savedArticles.length > 0 ? (
              <div className="articles-grid">
                {savedArticles.map(article => (
                  <ArticleCard
                    key={article.id || article.guid}
                    article={article}
                    onRead={markAsRead}
                    onSave={markAsSaved}
                    onAnalyze={handleAnalyzeArticle}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiBookmark size={48} />
                </div>
                <h3>No saved articles yet</h3>
                <p>Articles you save will appear here for easy access.</p>
                <button className="primary-button" onClick={() => window.location.href = '/'}>
                  Browse Articles
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="reading-history-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your reading history...</p>
              </div>
            ) : readArticles.length > 0 ? (
              <div className="articles-grid">
                {readArticles.map(article => (
                  <ArticleCard
                    key={article.id || article.guid}
                    article={article}
                    onRead={markAsRead}
                    onSave={markAsSaved}
                    onAnalyze={handleAnalyzeArticle}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiClock size={48} />
                </div>
                <h3>No reading history</h3>
                <p>Articles you've read will appear here.</p>
                <button className="primary-button" onClick={() => window.location.href = '/'}>
                  Browse Articles
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'sources' && (
          <div className="sources-section">
            <div className="sources-header">
              <h2>My News Sources</h2>
              <button className="add-source-button">
                <FiPlusCircle /> Add Source
              </button>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your sources...</p>
              </div>
            ) : sources.length > 0 ? (
              <div className="sources-grid">
                {sources.map(source => (
                  <div key={source.id} className="source-card">
                    <div className="source-icon">
                      {source.favicon ? (
                        <img src={source.favicon} alt={source.name} />
                      ) : (
                        <FiRss />
                      )}
                    </div>
                    <div className="source-details">
                      <h3>{source.name}</h3>
                      <p className="source-category">{source.category || 'News'}</p>
                      <div className="source-meta">
                        <span className={`source-reliability ${source.reliability}`}>
                          {source.reliability || 'Unknown'} Reliability
                        </span>
                        <span className={`source-bias ${source.biasRating?.replace('-', '')}`}>
                          {source.biasRating || 'Unrated'}
                        </span>
                      </div>
                    </div>
                    <div className="source-actions">
                      <button className="source-action-btn" title="Edit source">Edit</button>
                      <button className="source-action-btn danger" title="Remove source">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiRss size={48} />
                </div>
                <h3>No sources added yet</h3>
                <p>Add sources to customize your news feed.</p>
                <button className="primary-button">
                  <FiPlusCircle /> Add Your First Source
                </button>
              </div>
            )}
            
            <div className="sources-info">
              <h3>What are sources?</h3>
              <p>
                Sources determine what content appears in your feed. Add trusted news sites,
                blogs, and other content sources to customize your reading experience.
              </p>
              <h3>Source ratings explained</h3>
              <p>
                Each source has reliability and bias ratings to help you understand potential
                content quality and perspective. These ratings are based on multiple media bias
                and fact-checking organizations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage; 