import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/AnalysisPage.css';

interface LogicalFallacy {
  type: string;
  confidence: number;
  explanation: string;
  location?: string;
  excerpt?: string;
  how?: string;
  why?: string;
  purpose?: string;
}

interface AnalysisResult {
  logicalFallacies: LogicalFallacy[];
  timestamp: string;
}

const AnalysisPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(location.state?.article);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!article) {
      navigate('/');
      return;
    }

    // Analyze the article
    const analyzeArticle = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/analyze-article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: article.url,
            title: article.title,
            content: article.content,
          }),
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setLoading(false);
      }
    };

    analyzeArticle();
  }, [article, navigate]);

  if (loading) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Analyzing Article...</h2>
          <p>Identifying logical fallacies and rhetorical techniques</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <h2>Analysis Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="article-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back
        </button>
        <h1>{article?.title}</h1>
        {article?.source && <p className="article-source">Source: {article.source}</p>}
      </div>

      <div className="analysis-results">
        <h2>Logical Fallacy Analysis</h2>
        
        {analysis?.logicalFallacies && analysis.logicalFallacies.length > 0 ? (
          <div className="fallacies-list">
            {analysis.logicalFallacies.map((fallacy, index) => (
              <div key={index} className="fallacy-card">
                <div className="fallacy-header">
                  <h3 className="fallacy-type">{fallacy.type}</h3>
                  <span className="confidence-badge">
                    {Math.round(fallacy.confidence * 100)}% confidence
                  </span>
                </div>
                
                <div className="fallacy-content">
                  <div className="fallacy-explanation">
                    <strong>Explanation:</strong>
                    <p>{fallacy.explanation}</p>
                  </div>

                  {fallacy.location && (
                    <div className="fallacy-detail">
                      <strong>Location:</strong>
                      <p>{fallacy.location}</p>
                    </div>
                  )}

                  {fallacy.excerpt && (
                    <div className="fallacy-detail">
                      <strong>Excerpt:</strong>
                      <blockquote>{fallacy.excerpt}</blockquote>
                    </div>
                  )}

                  {fallacy.how && (
                    <div className="fallacy-detail">
                      <strong>How it was used:</strong>
                      <p>{fallacy.how}</p>
                    </div>
                  )}

                  {fallacy.why && (
                    <div className="fallacy-detail">
                      <strong>Why it was used:</strong>
                      <p>{fallacy.why}</p>
                    </div>
                  )}

                  {fallacy.purpose && (
                    <div className="fallacy-detail">
                      <strong>Purpose:</strong>
                      <p>{fallacy.purpose}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-fallacies">
            <p>No logical fallacies detected in this article.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
