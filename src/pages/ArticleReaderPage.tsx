import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CommunityArticleReader from '../components/CommunityArticleReader';
import { intellectualSelfDefenseService, DailyArticle } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './ArticleReaderPage.css';

const ArticleReaderPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<DailyArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    if (!articleId) {
      setError('No article ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get the specific article by ID
      const foundArticle = await intellectualSelfDefenseService.getArticleById(articleId);

      if (!foundArticle) {
        setError('Article not found');
        setLoading(false);
        return;
      }

      setArticle(foundArticle);
      logger.info('Article loaded for reading', { articleId, title: foundArticle.title });
    } catch (error) {
      logger.error('Failed to load article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="article-reader-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Loading Article for Analysis...</h2>
          <p>Preparing your intellectual self-defense tools</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-reader-page">
        <div className="error-container">
          <h2>Unable to Load Article</h2>
          <p>{error || 'Article not found'}</p>
          <button className="back-button" onClick={handleBack}>
            ← Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-reader-page">
      <CommunityArticleReader 
        article={article} 
        onBack={handleBack}
      />
    </div>
  );
};

export default ArticleReaderPage;
