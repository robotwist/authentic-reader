import React from 'react';
import IntellectualSelfDefense from '../components/IntellectualSelfDefense';
import { DailyArticle } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './IntellectualSelfDefensePage.css';

const IntellectualSelfDefensePage: React.FC = () => {
  const handleArticleSelect = (article: DailyArticle) => {
    logger.info('Article selected for deep analysis:', {
      title: article.title,
      source: article.source,
      complexity: article.chomskyAnalysis.intellectualDepth.complexityLevel
    });
  };

  return (
    <div className="daily-deep-dive-page">

      <div className="page-content">
        <IntellectualSelfDefense onArticleSelect={handleArticleSelect} />
      </div>

      <div className="page-footer">
        <div className="footer-content">
          <h3>About Intellectual Self Defense Course</h3>
          <p>
            Inspired by Noam Chomsky's concept of "intellectual self-defense," this course provides 
            daily training in critical thinking and media literacy. We curate 10 high-quality articles 
            each day and subject them to rigorous analysis, examining power structures, linguistic 
            framing, historical context, and critical perspectives to build your analytical skills.
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

export default IntellectualSelfDefensePage;
