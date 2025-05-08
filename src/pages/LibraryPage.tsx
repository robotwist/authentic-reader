import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllArticleAnalyses, getExtractedContent } from '../services/storageService';
import { logger } from '../utils/logger';
import '../styles/LibraryPage.css';

interface SavedAnalysis {
  id: string;
  title: string;
  source: string;
  date: string;
  excerpt: string;
  analysisType: 'bias' | 'rhetoric' | 'dark-patterns' | 'full';
}

const LibraryPage: React.FC = () => {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bias' | 'rhetoric' | 'dark-patterns'>('all');

  useEffect(() => {
    const loadSavedContent = async () => {
      try {
        setIsLoading(true);
        // Get all analyses from storage
        const analyses = await getAllArticleAnalyses();
        
        if (!analyses || analyses.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Create a list of saved analyses with metadata
        const savedItems: SavedAnalysis[] = [];
        
        for (const analysis of analyses) {
          try {
            // Get the content metadata for this analysis
            const content = await getExtractedContent(analysis.articleId);
            
            if (content) {
              savedItems.push({
                id: analysis.articleId,
                title: content.metadata?.title || 'Untitled Article',
                source: content.metadata?.siteName || 'Unknown Source',
                date: new Date(content.timestamp).toLocaleDateString(),
                excerpt: content.metadata?.excerpt || '',
                analysisType: 'full' // Default to full analysis
              });
            }
          } catch (error) {
            logger.error(`Error loading content for analysis ${analysis.articleId}:`, error);
          }
        }
        
        setSavedAnalyses(savedItems);
      } catch (error) {
        logger.error('Error loading saved analyses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedContent();
  }, []);

  // Filter the saved analyses
  const filteredAnalyses = filter === 'all' 
    ? savedAnalyses 
    : savedAnalyses.filter(analysis => analysis.analysisType === filter);

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Your Analysis Library</h1>
        <p className="subtitle">A collection of your saved articles and analyses</p>
      </div>
      
      <div className="library-filters">
        <button 
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Analyses
        </button>
        <button 
          className={`filter-button ${filter === 'bias' ? 'active' : ''}`}
          onClick={() => setFilter('bias')}
        >
          Bias Analysis
        </button>
        <button 
          className={`filter-button ${filter === 'rhetoric' ? 'active' : ''}`}
          onClick={() => setFilter('rhetoric')}
        >
          Rhetoric Analysis
        </button>
        <button 
          className={`filter-button ${filter === 'dark-patterns' ? 'active' : ''}`}
          onClick={() => setFilter('dark-patterns')}
        >
          Dark Patterns
        </button>
      </div>
      
      <div className="library-content">
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading your saved analyses...</p>
          </div>
        ) : filteredAnalyses.length > 0 ? (
          <div className="analysis-grid">
            {filteredAnalyses.map(analysis => (
              <div key={analysis.id} className="analysis-card">
                <h3 className="analysis-title">{analysis.title}</h3>
                <div className="analysis-meta">
                  <span className="source">{analysis.source}</span>
                  <span className="date">Analyzed: {analysis.date}</span>
                </div>
                {analysis.excerpt && (
                  <p className="analysis-excerpt">{analysis.excerpt}</p>
                )}
                <div className="analysis-actions">
                  <Link to={`/analysis/${analysis.id}`} className="view-button">
                    View Analysis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-library">
            <h2>No saved analyses yet</h2>
            <p>
              When you analyze articles, they'll be saved here for future reference.
            </p>
            <Link to="/analysis" className="analyze-button">
              Analyze an Article
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage; 