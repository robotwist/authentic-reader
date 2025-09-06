import React from 'react';
import { DailyDeepDive } from '../components/DailyDeepDive';
import { DailyArticle } from '../services/dailyDeepDiveService';
import { logger } from '../utils/logger';
import './DailyDeepDivePage.css';

const DailyDeepDivePage: React.FC = () => {
  const handleArticleSelect = (article: DailyArticle) => {
    logger.info('Article selected for deep analysis:', {
      title: article.title,
      source: article.source,
      complexity: article.chomskyAnalysis.intellectualDepth.complexityLevel
    });
  };

  return (
    <div className="daily-deep-dive-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Daily Deep Dive</h1>
          <p className="page-subtitle">
            Quality over quantity. 10 carefully curated articles with Noam Chomsky-level analysis.
          </p>
          <div className="page-features">
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>Premium Sources</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🧠</span>
              <span>Deep Analysis</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Intellectual Rigor</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🌍</span>
              <span>Global Perspective</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <DailyDeepDive onArticleSelect={handleArticleSelect} />
      </div>

      <div className="page-footer">
        <div className="footer-content">
          <h3>About Daily Deep Dive</h3>
          <p>
            Inspired by Noam Chomsky's approach to media analysis, our Daily Deep Dive selects 
            10 high-quality articles each day and subjects them to rigorous intellectual analysis. 
            We examine power structures, linguistic framing, historical context, and critical 
            perspectives to provide insights that go far beyond surface-level reporting.
          </p>
          <div className="analysis-framework">
            <h4>Analysis Framework</h4>
            <div className="framework-grid">
              <div className="framework-item">
                <h5>Structural Analysis</h5>
                <p>Examines power structures, institutional bias, and the manufacturing of consent</p>
              </div>
              <div className="framework-item">
                <h5>Linguistic Analysis</h5>
                <p>Analyzes framing, loaded language, presuppositions, and ideological assumptions</p>
              </div>
              <div className="framework-item">
                <h5>Historical Context</h5>
                <p>Provides historical precedents, long-term trends, and systemic patterns</p>
              </div>
              <div className="framework-item">
                <h5>Critical Analysis</h5>
                <p>Identifies what is not said, alternative perspectives, and power interests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyDeepDivePage;
