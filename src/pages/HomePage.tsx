import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiShield, FiTrendingUp, FiZap, FiArrowRight } from 'react-icons/fi';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Authentic Reader
          </h1>
          <p className="hero-subtitle">
            Intelligent news analysis for informed understanding
          </p>
          <div className="hero-actions">
            <Link to="/" className="cta-button primary">
              <FiBookOpen /> Start Reading
            </Link>
            <Link to="/about" className="cta-button secondary">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Credibility Analysis</h3>
              <p>Get instant credibility scores and source reputation analysis for every article.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiTrendingUp />
              </div>
              <h3>Bias Detection</h3>
              <p>Identify political and ideological bias with confidence scoring and explanations.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiZap />
              </div>
              <h3>Fast Loading</h3>
              <p>Optimized for speed with curated high-quality content and minimal analysis delays.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <div className="container">
          <h2 className="section-title">Demo Articles</h2>
          <p className="section-subtitle">
            Explore our curated selection of high-quality articles with instant analysis
          </p>
          
          <div className="demo-articles">
            <div className="demo-article">
              <h3>AI Breakthrough: New Model Achieves Human-Level Reasoning</h3>
              <p>Stanford researchers develop AI model with human-level reasoning capabilities in complex problem-solving tasks.</p>
              <div className="article-meta">
                <span className="credibility high">High Credibility</span>
                <span className="bias balanced">Balanced</span>
                <span className="reading-time">1 min read</span>
              </div>
            </div>
            
            <div className="demo-article">
              <h3>Climate Study Reveals Accelerating Global Temperature Trends</h3>
              <p>Comprehensive analysis shows concerning trends in climate change with significant policy implications.</p>
              <div className="article-meta">
                <span className="credibility high">High Credibility</span>
                <span className="bias balanced">Balanced</span>
                <span className="reading-time">1 min read</span>
              </div>
            </div>
            
            <div className="demo-article">
              <h3>Economic Recovery Shows Strong Growth in Technology Sector</h3>
              <p>Latest indicators reveal robust growth driving overall economic recovery and job creation.</p>
              <div className="article-meta">
                <span className="credibility high">High Credibility</span>
                <span className="bias balanced">Balanced</span>
                <span className="reading-time">1 min read</span>
              </div>
            </div>
          </div>
          
          <div className="demo-actions">
            <Link to="/" className="demo-button">
              View All Articles <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Start Reading?</h2>
          <p>Experience intelligent news analysis that respects your intelligence</p>
          <Link to="/" className="cta-button primary large">
            <FiBookOpen /> Explore Articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 