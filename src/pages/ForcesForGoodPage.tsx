import React from 'react';
import { useNavigate } from 'react-router-dom';
import ForcesForGood from '../components/ForcesForGood';
import { ExemplaryArticle } from '../services/democracyForcesService';
import { logger } from '../utils/logger';
import './ForcesForGoodPage.css';

const ForcesForGoodPage: React.FC = () => {
  const navigate = useNavigate();

  const handleArticleSelect = (article: ExemplaryArticle) => {
    // Navigate to the article reader with exemplary article data
    // For now, we'll create a special route for exemplary articles
    navigate(`/exemplary-article/${article.id}`);
    logger.info('Exemplary article selected for reading', { 
      articleId: article.id, 
      source: article.source.name 
    });
  };

  return (
    <div className="forces-for-good-page">
      <ForcesForGood onArticleSelect={handleArticleSelect} />
    </div>
  );
};

export default ForcesForGoodPage;
