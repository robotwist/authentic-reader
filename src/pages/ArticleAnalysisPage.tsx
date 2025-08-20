import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiClock, FiFileText, FiShield, FiTag, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import '../styles/ArticleAnalysisPage.css';

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  content: string;
  analysis: {
    wordCount: number;
    readingTime: number;
    hasExternalLinks: boolean;
    complexity: string;
    keyTopics: string[];
    credibility: {
      score: number;
      level: string;
      reason: string;
    };
    summary: string;
    timestamp: string;
  };
  articleId: string;
}

const ArticleAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['credibility', 'summary']);

  useEffect(() => {
    if (id) {
      fetchArticleAnalysis(id);
    }
  }, [id]);

  const fetchArticleAnalysis = async (articleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, we'll fetch from the analyses list
      const response = await fetch(`http://localhost:3000/api/analyses-list`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();
      const foundArticle = data.analyses?.find((a: any) => a.articleId === articleId);
      
      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        setError('Article analysis not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCredibilityColor = (level: string) => {
    switch (level) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCredibilityIcon = (level: string) => {
    switch (level) {
      case 'high': return <FiCheckCircle className="credibility-icon high" />;
      case 'medium': return <FiInfo className="credibility-icon medium" />;
      case 'low': return <FiAlertTriangle className="credibility-icon low" />;
      default: return <FiInfo className="credibility-icon" />;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getComplexityDescription = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'Simple language, easy to understand';
      case 'medium': return 'Moderate complexity, some technical terms';
      case 'hard': return 'Complex language, requires background knowledge';
      default: return 'Standard reading level';
    }
  };

  if (loading) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading article analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <h2>Analysis Not Found</h2>
          <p>{error || 'The requested article analysis could not be found.'}</p>
          <button onClick={() => navigate('/')} className="back-button">
            <FiArrowLeft /> Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Articles
        </button>
        <h1>Article Analysis</h1>
        <p className="analysis-subtitle">Understanding the truth behind the content</p>
      </div>

      <div className="article-overview">
        <div className="article-main-info">
          <h2 className="article-title">{article.title}</h2>
          <div className="article-meta">
            <span className="article-author">
              <strong>Author:</strong> {article.author}
            </span>
            <span className="article-date">
              <strong>Published:</strong> {formatDate(article.pubDate)}
            </span>
            <span className="article-source">
              <strong>Source:</strong> {new URL(article.link).hostname}
            </span>
          </div>
          <p className="article-description">{article.description}</p>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <FiClock className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{article.analysis.readingTime} min</span>
              <span className="stat-label">Reading Time</span>
            </div>
          </div>
          
          <div className="stat-card">
            <FiFileText className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{article.analysis.wordCount}</span>
              <span className="stat-label">Word Count</span>
            </div>
          </div>
          
          <div className="stat-card">
            <FiShield className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{Math.round(article.analysis.credibility.score * 100)}%</span>
              <span className="stat-label">Credibility Score</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analysis-sections">
        {/* Credibility Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('credibility')}
          >
            <div className="section-title">
              {getCredibilityIcon(article.analysis.credibility.level)}
              <h3>Credibility Assessment</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('credibility') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('credibility') && (
            <div className="section-content">
              <div className="credibility-score">
                <div className="score-circle" style={{ 
                  background: `conic-gradient(${getCredibilityColor(article.analysis.credibility.level)} ${article.analysis.credibility.score * 360}deg, var(--border-color) 0deg)` 
                }}>
                  <span className="score-text">{Math.round(article.analysis.credibility.score * 100)}%</span>
                </div>
                <div className="score-details">
                  <h4>Credibility Level: {article.analysis.credibility.level.toUpperCase()}</h4>
                  <p className="credibility-reason">{article.analysis.credibility.reason}</p>
                </div>
              </div>
              
              <div className="credibility-factors">
                <h4>Factors Considered:</h4>
                <ul>
                  <li>Source reputation and history</li>
                  <li>Author expertise and credentials</li>
                  <li>Fact-checking and verification</li>
                  <li>Bias assessment and transparency</li>
                  <li>Citation quality and references</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Content Summary */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('summary')}
          >
            <div className="section-title">
              <FiFileText />
              <h3>Content Summary</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('summary') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('summary') && (
            <div className="section-content">
              <div className="summary-content">
                <p>{article.analysis.summary || 'No summary available for this article.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Topic Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('topics')}
          >
            <div className="section-title">
              <FiTag />
              <h3>Topic Analysis</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('topics') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('topics') && (
            <div className="section-content">
              <div className="topics-grid">
                {article.analysis.keyTopics.map((topic, index) => (
                  <span key={index} className="topic-tag">{topic}</span>
                ))}
              </div>
              <p className="topics-description">
                These topics were identified through natural language processing analysis of the article content.
              </p>
            </div>
          )}
        </div>

        {/* Content Complexity */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('complexity')}
          >
            <div className="section-title">
              <FiTrendingUp />
              <h3>Content Complexity</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('complexity') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('complexity') && (
            <div className="section-content">
              <div className="complexity-info">
                <div className="complexity-level">
                  <span className="complexity-badge">{article.analysis.complexity}</span>
                  <p>{getComplexityDescription(article.analysis.complexity)}</p>
                </div>
                
                <div className="complexity-details">
                  <h4>Reading Level Indicators:</h4>
                  <ul>
                    <li><strong>Vocabulary:</strong> {article.analysis.complexity === 'easy' ? 'Simple, everyday words' : 
                       article.analysis.complexity === 'medium' ? 'Some technical terms' : 'Complex terminology'}</li>
                    <li><strong>Sentence Structure:</strong> {article.analysis.complexity === 'easy' ? 'Short, clear sentences' : 
                       article.analysis.complexity === 'medium' ? 'Mixed sentence lengths' : 'Complex sentence structures'}</li>
                    <li><strong>Background Knowledge:</strong> {article.analysis.complexity === 'easy' ? 'Minimal required' : 
                       article.analysis.complexity === 'medium' ? 'Some familiarity helpful' : 'Significant background needed'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* External Links Analysis */}
        <div className="analysis-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('links')}
          >
            <div className="section-title">
              <FiExternalLink />
              <h3>External References</h3>
            </div>
            <span className="section-toggle">
              {expandedSections.includes('links') ? '−' : '+'}
            </span>
          </div>
          
          {expandedSections.includes('links') && (
            <div className="section-content">
              <div className="links-analysis">
                <p>
                  {article.analysis.hasExternalLinks 
                    ? 'This article contains external links and references, which can indicate thorough research and fact-checking.'
                    : 'This article does not contain external links or references.'
                  }
                </p>
                <div className="links-importance">
                  <h4>Why External Links Matter:</h4>
                  <ul>
                    <li>Provide sources for claims and statistics</li>
                    <li>Allow readers to verify information independently</li>
                    <li>Demonstrate thorough research and fact-checking</li>
                    <li>Increase transparency and credibility</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="analysis-actions">
        <a 
          href={article.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="read-original-button"
        >
          <FiExternalLink /> Read Original Article
        </a>
        
        <button onClick={() => navigate('/')} className="back-to-feed-button">
          <FiArrowLeft /> Back to Article Feed
        </button>
      </div>
    </div>
  );
};

export default ArticleAnalysisPage;
