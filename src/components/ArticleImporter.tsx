import React, { useState } from 'react';
import { FiUpload, FiLink, FiClipboard, FiCheck } from 'react-icons/fi';
import '../styles/ArticleImporter.css';

const ArticleImporter: React.FC = () => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setMessage({ text: 'Please enter a valid URL', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: 'Importing article from URL...', type: 'info' });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setMessage({ text: 'Article successfully imported!', type: 'success' });
      // In a real implementation, this would navigate to the article view
    }, 2000);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setMessage({ text: 'Please enter article text', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: 'Processing article text...', type: 'info' });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setMessage({ text: 'Article successfully processed!', type: 'success' });
      // In a real implementation, this would navigate to the article view
    }, 2000);
  };

  const handlePaste = () => {
    navigator.clipboard.readText()
      .then(clipText => {
        setText(clipText);
        setMessage({ text: 'Text pasted from clipboard', type: 'success' });
      })
      .catch(() => {
        setMessage({ text: 'Failed to read from clipboard', type: 'error' });
      });
  };

  return (
    <div className="article-importer-container">
      <h1>Import Article</h1>
      <p className="importer-description">
        Import articles for analysis by entering a URL or pasting the content directly.
      </p>

      <div className="import-methods">
        <div className="import-method">
          <h2><FiLink /> Import from URL</h2>
          <form onSubmit={handleUrlSubmit}>
            <input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Importing...' : 'Import'}
            </button>
          </form>
        </div>

        <div className="import-method">
          <h2><FiClipboard /> Paste Article Text</h2>
          <div className="paste-controls">
            <button 
              type="button" 
              onClick={handlePaste} 
              className="paste-button"
              disabled={isLoading}
            >
              <FiClipboard /> Paste from Clipboard
            </button>
          </div>
          <form onSubmit={handleTextSubmit}>
            <textarea
              placeholder="Paste or type article text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              rows={10}
            />
            <button type="submit" disabled={isLoading || !text.trim()}>
              {isLoading ? 'Processing...' : 'Analyze Text'}
            </button>
          </form>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' && <FiCheck />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="upload-info">
        <h3>About Article Importing</h3>
        <p>
          Our article importer tool extracts the main content from news articles, blog posts, 
          and other web content for analysis. For best results, use the URL import option as 
          it preserves formatting and metadata. Text pasting works well for plain content when 
          a URL isn't available.
        </p>
        <p>
          <strong>Supported Content Types:</strong> News articles, blog posts, opinion pieces, 
          research papers, and most text-based web content.
        </p>
      </div>
    </div>
  );
};

export default ArticleImporter; 