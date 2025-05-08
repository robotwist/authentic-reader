import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExtractedContent, getPassageAnalyses } from '../services/storageService';
import InteractiveArticleView from '../components/InteractiveArticleView';
import ArticleAnalysis from '../components/ArticleAnalysis';
import { logger } from '../utils/logger';
import '../styles/ArticlePage.css';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [passages, setPassages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'interactive' | 'summary'>('interactive');

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) {
        setError('Article ID is missing');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Load the article content
        const articleContent = await getExtractedContent(id);
        if (!articleContent) {
          setError('Article not found');
          setIsLoading(false);
          return;
        }
        
        // Load the passage analyses
        const analysisData = await getPassageAnalyses(id);
        let articlePassages = [];
        
        if (analysisData && analysisData.passages) {
          articlePassages = analysisData.passages;
        } else {
          // If no passages are available, create a single passage from the content
          articlePassages = [{
            id: `passage-${id}-0`,
            text: articleContent.content || '',
            element: 'div',
            startIndex: 0,
            endIndex: (articleContent.content || '').length,
            analyses: null
          }];
        }
        
        setContent(articleContent);
        setPassages(articlePassages);
        setIsLoading(false);
      } catch (error) {
        logger.error('Error loading article:', error);
        setError('Failed to load article');
        setIsLoading(false);
      }
    };
    
    loadArticle();
  }, [id]);

  // Handle going back to the previous page
  const handleBack = () => {
    navigate(-1);
  };

  // Toggle between interactive and summary views
  const toggleView = () => {
    setActiveView(prev => prev === 'interactive' ? 'summary' : 'interactive');
  };

  if (isLoading) {
    return (
      <div className="article-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="back-button" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-page">
      <div className="article-header">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
        
        <div className="view-toggle">
          <button 
            className={`toggle-button ${activeView === 'interactive' ? 'active' : ''}`}
            onClick={() => setActiveView('interactive')}
          >
            Interactive View
          </button>
          <button 
            className={`toggle-button ${activeView === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveView('summary')}
          >
            Summary View
          </button>
        </div>
      </div>
      
      <div className="article-container">
        {activeView === 'interactive' ? (
          <InteractiveArticleView
            content={content}
            passages={passages}
          />
        ) : (
          <div className="summary-view">
            <h1>{content.metadata?.title || 'Untitled Article'}</h1>
            <div className="article-meta">
              {content.metadata?.byline && (
                <div className="article-author">By {content.metadata.byline}</div>
              )}
              {content.metadata?.siteName && (
                <div className="article-source">{content.metadata.siteName}</div>
              )}
              {content.metadata?.date && (
                <div className="article-date">
                  {new Date(content.metadata.date).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {content.analysis && (
              <ArticleAnalysis 
                title={content.metadata?.title || 'Untitled Article'}
                source={content.metadata?.siteName || 'Unknown Source'}
                author={content.metadata?.byline}
                date={content.metadata?.date}
                analysis={content.analysis}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlePage; 