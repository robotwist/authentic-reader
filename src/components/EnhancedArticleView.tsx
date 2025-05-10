import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBookmark, FiShare2, FiDownload } from 'react-icons/fi';
import '../styles/EnhancedArticleView.css';

interface Article {
  id: string;
  title: string;
  content: string;
  source?: {
    name: string;
    url?: string;
    favicon?: string;
  };
  author?: string;
  publishedDate?: string;
  image?: string;
  url?: string;
}

const EnhancedArticleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        
        // Simulate API call to fetch article data
        // In a real app, this would be an actual API call
        setTimeout(() => {
          const mockArticle: Article = {
            id: id || '1',
            title: 'Enhanced Reading Experience with AI-Powered Analysis',
            content: `
              <p>The way we consume news and information online is evolving rapidly. With the rise of misinformation and the increasing sophistication of persuasive techniques, readers need new tools to help them navigate digital content critically.</p>
              
              <p>Enhanced reading experiences leverage artificial intelligence to provide real-time analysis of content, highlighting potential biases, rhetorical techniques, and logical fallacies. This allows readers to engage more critically with the information they consume.</p>
              
              <p>Key features of enhanced reading include:</p>
              
              <ul>
                <li>Bias detection and analysis</li>
                <li>Identification of rhetorical techniques</li>
                <li>Recognition of logical fallacies</li>
                <li>Source credibility assessment</li>
                <li>Context and background information</li>
              </ul>
              
              <p>By making these elements visible, readers can develop better media literacy skills and make more informed judgments about the content they consume.</p>
              
              <p>The future of reading isn't just about accessibility and convenience, but also about empowering readers with the tools to understand and evaluate information in increasingly complex media landscapes.</p>
              
              <p>As these technologies advance, we can expect even more sophisticated analysis capabilities, including detection of emotional manipulation, comparison with factual databases, and personalized critical thinking suggestions based on individual reading patterns.</p>
            `,
            source: {
              name: 'Authentic Reader Blog',
              url: 'https://authentic-reader.example.com',
              favicon: 'https://via.placeholder.com/32'
            },
            author: 'Research Team',
            publishedDate: new Date().toDateString(),
            image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            url: `https://authentic-reader.example.com/articles/${id}`
          };
          
          setArticle(mockArticle);
          setLoading(false);
        }, 1500);
        
      } catch (err) {
        setError("Failed to load article. Please try again.");
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [id]);
  
  const goBack = () => {
    navigate(-1);
  };
  
  const handleSave = () => {
    // Implementation would save the article to the user's saved articles
    alert('Article saved!');
  };
  
  const handleShare = () => {
    // Implementation would open a share dialog
    alert('Share functionality coming soon!');
  };
  
  const handleAnalyze = () => {
    if (article) {
      // Navigate to the interactive view with full analysis
      navigate(`/interactive/${article.id}`);
    }
  };
  
  if (loading) {
    return (
      <div className="enhanced-article-container">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }
  
  if (error || !article) {
    return (
      <div className="enhanced-article-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || "Unable to load article"}</p>
          <button onClick={goBack} className="back-button">
            <FiArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="enhanced-article-container">
      <div className="article-toolbar">
        <button onClick={goBack} className="toolbar-button" title="Go back">
          <FiArrowLeft />
        </button>
        <div className="toolbar-actions">
          <button onClick={handleSave} className="toolbar-button" title="Save article">
            <FiBookmark />
          </button>
          <button onClick={handleShare} className="toolbar-button" title="Share article">
            <FiShare2 />
          </button>
          <button onClick={handleAnalyze} className="analyze-button" title="Analyze article">
            Analyze Content
          </button>
        </div>
      </div>
      
      <article className="article">
        {article.image && (
          <div className="article-image">
            <img src={article.image} alt={article.title} />
          </div>
        )}
        
        <div className="article-meta">
          {article.source && <span className="article-source">{article.source.name}</span>}
          {article.publishedDate && <span className="article-date">{article.publishedDate}</span>}
        </div>
        
        <h1 className="article-title">{article.title}</h1>
        
        {article.author && <div className="article-author">By {article.author}</div>}
        
        <div 
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />
        
        <div className="article-footer">
          <p>
            This article is provided with enhanced reading capabilities. 
            Click "Analyze Content" to see a detailed breakdown of potential biases, 
            rhetorical techniques, and more.
          </p>
          <button onClick={handleAnalyze} className="analyze-button full-width">
            Analyze Content
          </button>
        </div>
      </article>
    </div>
  );
};

export default EnhancedArticleView; 