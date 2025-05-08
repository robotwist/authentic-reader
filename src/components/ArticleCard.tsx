import React, { useState } from 'react';
import '../styles/ArticleCard.css';
import { Article } from '../types/Article';
import { formatDate, truncateText } from '../utils/textUtils';
import { FaBookmark, FaRegBookmark, FaChevronRight, FaEye, FaEyeSlash, FaTextHeight } from 'react-icons/fa';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { Badge } from './ui/Badge';
import { getArticleTypeIcon } from '../utils/articleUtils';
import defaultImage from '../assets/default-article.svg';
import { logger } from '../utils/logger';

interface ArticleCardProps {
  article: Article;
  onRead: (articleId: string) => void;
  onSave: (articleId: string) => void;
  onAnalyze?: (article: Article) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  onRead, 
  onSave, 
  onAnalyze 
}) => {
  const [imageError, setImageError] = useState(false);

  // Get the appropriate image source with fallbacks
  const getImageSource = () => {
    if (imageError || !article.image) {
      return article.source?.favicon ? article.source.favicon : defaultImage;
    }
    return article.image;
  };

  // Get the article URL with fallbacks
  const getArticleUrl = () => {
    return article.url || 
           (article as any).link || 
           (article as any).guid?.toString() || 
           '#';
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on buttons or links
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLAnchorElement ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return;
    }
    
    console.log('Article clicked:', article);
    
    // Try different possible URL properties
    const articleUrl = article.url || 
                      (article as any).link || 
                      (article as any).guid?.toString() || 
                      '';
    
    if (articleUrl) {
      console.log('Opening article URL:', articleUrl);
      window.open(articleUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.error('No URL found for article:', article);
      alert('Sorry, this article does not have a valid URL to open.');
    }
  };

  const handleReadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRead(article.id);
  };

  const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSave(article.id);
  };

  const handleAnalyzeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.debug('🔍 Analyze button clicked for article:', article.title);
    logger.debug('🔍 Article guid:', article.guid);
    logger.debug('🔍 Is onAnalyze available?', Boolean(onAnalyze));
    
    try {
      if (onAnalyze) {
        // Pass the whole article object to the handler
        onAnalyze(article);
      }
    } catch (error) {
      logger.error('Error in handleAnalyzeClick:', error);
    }
  };

  return (
    <div 
      className={`article-card ${article.read ? 'article-read' : ''}`} 
      onClick={handleCardClick}
    >
      {article.saved && (
        <div className="saved-badge">
          <FaBookmark className="saved-icon" />
        </div>
      )}
      
      <div className="article-image-container">
        <img 
          src={getImageSource()} 
          alt={article.title || 'Article'} 
          className="article-image"
          onError={() => setImageError(true)}
        />
        {article.contentType && (
          <Badge 
            text={article.contentType} 
            icon={getArticleTypeIcon(article.contentType)} 
            className="content-type-badge"
          />
        )}
      </div>

      <div className="article-content">
        <div className="article-meta">
          {article.source?.name && (
            <span className="article-source">{article.source.name}</span>
          )}
          {article.publishedAt && (
            <span className="article-date">{formatDate(article.publishedAt)}</span>
          )}
        </div>

        <h3 className="article-title">{truncateText(article.title || 'Untitled', 80)}</h3>
        
        {article.summary && (
          <p className="article-summary">{truncateText(article.summary, 120)}</p>
        )}

        <div className="article-actions">
          <button 
            className={`action-btn ${article.read ? 'active' : ''}`}
            onClick={handleReadClick}
            title={article.read ? "Mark as unread" : "Mark as read"}
          >
            {article.read ? <FaEye /> : <FaEyeSlash />}
          </button>
          
          <button 
            className={`action-btn ${article.saved ? 'active' : ''}`}
            onClick={handleSaveClick}
            title={article.saved ? "Remove from saved" : "Save for later"}
          >
            {article.saved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          
          {onAnalyze && (
            <button 
              className="action-btn analyze-btn"
              onClick={handleAnalyzeClick}
              title="Analyze article"
            >
              <FaTextHeight />
            </button>
          )}
          
          <a 
            href={getArticleUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="read-more-link"
            onClick={(e) => e.stopPropagation()}
          >
            Read <FaChevronRight />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard; 