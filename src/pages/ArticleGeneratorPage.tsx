import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiBarChart2, FiTarget } from 'react-icons/fi';
import DynamicArticleGenerator from '../components/DynamicArticleGenerator';
import '../styles/ArticleGeneratorPage.css';

const ArticleGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const handleArticleSelected = (article: any) => {
    setSelectedArticle(article);
    // You could navigate to analysis page with the selected article
    console.log('Selected article for analysis:', article);
  };

  const handleArticlesGenerated = (articles: any[]) => {
    console.log('Generated articles:', articles);
  };

  return (
    <div className="article-generator-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Home
        </button>
        
        <div className="header-info">
          <h1>Dynamic Article Generator</h1>
          <p>Create realistic, educational content for media literacy training and analysis</p>
        </div>
      </div>

      <DynamicArticleGenerator 
        onArticlesGenerated={handleArticlesGenerated}
        onArticleSelected={handleArticleSelected}
      />

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            onClick={() => navigate('/analysis')}
            className="action-card"
          >
            <FiBarChart2 />
            <span>Go to Analysis</span>
          </button>
          
          <button 
            onClick={() => navigate('/analysis/comparative')}
            className="action-card"
          >
            <FiTarget />
            <span>Comparative Analysis</span>
          </button>
          
          <button 
            onClick={() => navigate('/sentiment-analysis')}
            className="action-card"
          >
            <FiBookOpen />
            <span>Sentiment Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleGeneratorPage;
