import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to Authentic Reader</h1>
        <p className="tagline">Content that respects your intelligence</p>
        
        <div className="hero-actions">
          <Link to="/" className="action-button primary">Browse Feed</Link>
          <Link to="/analysis" className="action-button secondary">Analyze Content</Link>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Intelligent Content Analysis</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Bias Detection</h3>
            <p>Identify political and ideological bias in articles from across the web.</p>
          </div>
          
          <div className="feature-card">
            <h3>Rhetoric Analysis</h3>
            <p>Discover the persuasion techniques used in content to influence your thinking.</p>
          </div>
          
          <div className="feature-card">
            <h3>Dark Pattern Detection</h3>
            <p>Unmask manipulative design patterns used to influence your behavior online.</p>
          </div>
          
          <div className="feature-card">
            <h3>Virgil AI Guide</h3>
            <p>Get intelligent explanations that help you understand content analysis results.</p>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <h2>Ready to see beyond the content?</h2>
        <Link to="/analysis" className="action-button primary">Try Content Analysis</Link>
      </div>
    </div>
  );
};

export default HomePage; 