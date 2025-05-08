import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArticleImporter from '../components/ArticleImporter';
import InteractiveArticleView from '../components/InteractiveArticleView';
import { ExtractedContent, ArticlePassage } from '../types';
import { detectDarkPatterns, summarizeDarkPatterns } from '../services/darkPatternService';
import { logger } from '../utils/logger';
import '../styles/AnalysisPage.css';

const AnalysisPage: React.FC = () => {
  const [articleContent, setArticleContent] = useState<ExtractedContent | null>(null);
  const [articlePassages, setArticlePassages] = useState<ArticlePassage[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [darkPatternSummary, setDarkPatternSummary] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'import' | 'analysis'>('import');
  const navigate = useNavigate();

  // Handle the completion of article import
  const handleArticleImported = async (
    content: ExtractedContent,
    passages: ArticlePassage[]
  ) => {
    try {
      logger.info('Article imported successfully', { 
        title: content.metadata?.title || 'Untitled Article' 
      });
      
      // Store the article content and passages
      setArticleContent(content);
      setArticlePassages(passages);
      
      // If HTML content is available, analyze for dark patterns
      if (content.content) {
        const darkPatterns = detectDarkPatterns(content.content);
        content.darkPatterns = darkPatterns;
        const summary = summarizeDarkPatterns(darkPatterns);
        setDarkPatternSummary(summary);
      }
      
      // Switch to the analysis view
      setActiveView('analysis');
    } catch (error) {
      logger.error('Error handling imported article:', error);
    }
  };

  // Handle completion of article analysis
  const handleAnalysisComplete = () => {
    setAnalysisComplete(true);
  };

  // Return to the importer view
  const handleNewArticle = () => {
    setArticleContent(null);
    setArticlePassages([]);
    setAnalysisComplete(false);
    setDarkPatternSummary(null);
    setActiveView('import');
  };

  // Go back to the home page
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h1>Article Analysis</h1>
        <div className="header-actions">
          {activeView === 'analysis' && (
            <button className="action-button new-article" onClick={handleNewArticle}>
              Analyze New Article
            </button>
          )}
          <button className="action-button home" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>
      </div>
      
      <div className="page-content">
        {activeView === 'import' ? (
          <ArticleImporter onArticleImported={handleArticleImported} />
        ) : (
          articleContent && (
            <>
              {darkPatternSummary && darkPatternSummary !== 'No dark patterns detected.' && (
                <div className="dark-pattern-warning">
                  <h3>⚠️ Dark Patterns Detected</h3>
                  <div className="dark-pattern-summary">
                    <pre>{darkPatternSummary}</pre>
                  </div>
                  <p className="dark-pattern-note">
                    These are potentially manipulative design patterns found on the source website.
                    They may be used to influence user behavior or decisions.
                  </p>
                </div>
              )}
              
              <InteractiveArticleView
                content={articleContent}
                passages={articlePassages}
                onAnalysisComplete={handleAnalysisComplete}
              />
              
              {analysisComplete && (
                <div className="analysis-actions">
                  <button className="action-button" onClick={handleNewArticle}>
                    Analyze Another Article
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default AnalysisPage; 