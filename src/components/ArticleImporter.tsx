import React, { useState } from 'react';
import { logger } from '../utils/logger';
import ArticleParser from './ArticleParser';
import { ExtractedContent, ArticlePassage } from '../types';
import '../styles/ArticleImporter.css';

interface ArticleImporterProps {
  onArticleImported: (content: ExtractedContent, passages: ArticlePassage[]) => void;
}

/**
 * Component for importing articles via URL or direct text input
 */
const ArticleImporter: React.FC<ArticleImporterProps> = ({ onArticleImported }) => {
  const [importMethod, setImportMethod] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isParserActive, setIsParserActive] = useState<boolean>(false);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (importMethod === 'url' && !url) {
      setError('Please enter a URL');
      return;
    }
    
    if (importMethod === 'text' && !textContent) {
      setError('Please enter article text');
      return;
    }
    
    setIsImporting(true);
    
    if (importMethod === 'url') {
      // URL import: activate the parser component
      setIsParserActive(true);
    } else {
      // Text import: create HTML and activate parser
      const html = createHtmlFromText();
      setIsParserActive(true);
    }
  };
  
  // Create HTML document from entered text
  const createHtmlFromText = (): string => {
    // Create a basic HTML structure with the text content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title || 'Imported Article'}</title>
        <meta name="author" content="${author || 'Unknown'}">
      </head>
      <body>
        <article>
          <h1>${title || 'Imported Article'}</h1>
          ${author ? `<p class="author">By ${author}</p>` : ''}
          <div class="article-content">
            ${textContent.split('\n\n').map(para => `<p>${para}</p>`).join('')}
          </div>
        </article>
      </body>
      </html>
    `;
    
    return html;
  };
  
  // Handle parser results
  const handleParsed = (content: ExtractedContent, passages: ArticlePassage[]) => {
    setIsImporting(false);
    setIsParserActive(false);
    
    // Override extracted content with manual entries if available
    if (importMethod === 'text') {
      if (title || author) {
        // Ensure metadata object exists
        if (!content.metadata) {
          content.metadata = {};
        }
        
        // Set title and author in metadata
        if (title) content.metadata.title = title;
        if (author) content.metadata.byline = author;
      }
    }
    
    // Forward the results to the parent component
    onArticleImported(content, passages);
    
    // Reset the form
    setUrl('');
    setTextContent('');
    setTitle('');
    setAuthor('');
  };
  
  // Handle parser errors
  const handleParserError = (errorMessage: string) => {
    setIsImporting(false);
    setIsParserActive(false);
    setError(errorMessage);
    logger.error('Article import error:', errorMessage);
  };

  return (
    <div className="article-importer">
      <h2>Import Article</h2>
      
      {/* Import method tabs */}
      <div className="import-tabs">
        <button 
          className={`tab-button ${importMethod === 'url' ? 'active' : ''}`}
          onClick={() => setImportMethod('url')}
        >
          Import by URL
        </button>
        <button 
          className={`tab-button ${importMethod === 'text' ? 'active' : ''}`}
          onClick={() => setImportMethod('text')}
        >
          Paste Text
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Import form */}
      <form onSubmit={handleSubmit}>
        {importMethod === 'url' ? (
          <div className="form-group">
            <label htmlFor="article-url">Article URL:</label>
            <input
              id="article-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              disabled={isImporting}
            />
            <p className="help-text">
              Enter the URL of the article you want to analyze. 
              The article will be fetched and processed.
            </p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="article-title">Article Title (optional):</label>
              <input
                id="article-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article Title"
                disabled={isImporting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="article-author">Author (optional):</label>
              <input
                id="article-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author Name"
                disabled={isImporting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="article-text">Article Text:</label>
              <textarea
                id="article-text"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste the full article text here..."
                rows={10}
                disabled={isImporting}
              />
              <p className="help-text">
                Paste the article text. Empty lines will be treated as paragraph breaks.
              </p>
            </div>
          </>
        )}
        
        <button 
          type="submit" 
          className="import-button"
          disabled={isImporting}
        >
          {isImporting ? 'Importing...' : 'Import Article'}
        </button>
      </form>
      
      {/* Parser component (hidden) */}
      {isParserActive && (
        <div style={{ display: 'none' }}>
          <ArticleParser
            url={importMethod === 'url' ? url : 'https://imported-article.local/'}
            htmlContent={importMethod === 'text' ? createHtmlFromText() : undefined}
            onParsed={handleParsed}
            onError={handleParserError}
          />
        </div>
      )}
      
      {/* Loading indicator */}
      {isImporting && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Importing and analyzing article...</p>
        </div>
      )}
    </div>
  );
};

export default ArticleImporter; 