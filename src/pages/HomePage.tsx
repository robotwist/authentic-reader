import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Fetch article from URL
      const response = await fetch('/api/fetch-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const data = await response.json();
      
      // Navigate to analysis page with article data
      navigate('/analysis', { state: { article: data.article } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Logical Fallacy Analyzer</h1>
          <p className="hero-subtitle">
            Enter an article URL or RSS feed to identify logical fallacies and understand how rhetoric is used to manipulate
          </p>
          
          <form onSubmit={handleSubmit} className="url-input-form">
            <div className="input-group">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter article URL or RSS feed URL"
                required
                className="url-input"
                disabled={loading}
              />
              <button 
                type="submit" 
                className="analyze-button"
                disabled={loading || !url.trim()}
              >
                {loading ? 'Analyzing...' : 'Analyze Article'}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </form>
        </div>
      </div>

      <div className="info-section">
        <div className="container">
          <h2>How It Works</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>1. Enter URL</h3>
              <p>Provide an article URL or RSS feed link</p>
            </div>
            <div className="info-card">
              <h3>2. Article Analysis</h3>
              <p>Our LLM expert in rhetoric and logic analyzes the text</p>
            </div>
            <div className="info-card">
              <h3>3. Fallacy Detection</h3>
              <p>Receive detailed explanations of logical fallacies found</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
