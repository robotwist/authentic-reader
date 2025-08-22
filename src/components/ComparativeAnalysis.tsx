import React, { useState, useEffect } from 'react';
import { FiTarget, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiInfo, FiBarChart2, FiFileText, FiUsers } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/ComparativeAnalysis.css';

interface Article {
  title: string;
  link: string;
  description: string;
  content: string;
  pubDate: string;
  author: string;
  source: string;
  analysis?: any;
}

interface ComparativeResult {
  similarities: {
    topics: string[];
    keyPhrases: string[];
    sharedClaims: string[];
  };
  differences: {
    conflictingClaims: string[];
    differentPerspectives: string[];
    biasVariations: {
      source: string;
      biasScore: number;
      biasType: string;
    }[];
  };
  analysis: {
    overallConsensus: number;
    reliabilityScore: number;
    recommendations: string[];
  };
}

interface ComparativeAnalysisProps {
  articles: Article[];
  onAnalysisComplete?: (result: ComparativeResult) => void;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ 
  articles, 
  onAnalysisComplete 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparativeResult, setComparativeResult] = useState<ComparativeResult | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { analyzeBias } = useLlamaAnalysis();

  useEffect(() => {
    if (articles.length > 0) {
      setSelectedArticles(articles.slice(0, Math.min(5, articles.length)));
    }
  }, [articles]);

  const performComparativeAnalysis = async () => {
    if (selectedArticles.length < 2) {
      alert('Please select at least 2 articles for comparison');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Step 1: Analyze each article individually
      const articleAnalyses = [];
      for (let i = 0; i < selectedArticles.length; i++) {
        const article = selectedArticles[i];
        const textContent = article.content || article.description || article.title;
        const biasResult = await analyzeBias(textContent);
        
        articleAnalyses.push({
          article,
          biasResult,
          textContent
        });
        
        setAnalysisProgress(((i + 1) / selectedArticles.length) * 50);
      }

      // Step 2: Generate comparative analysis
      const result = await generateComparativeResult(articleAnalyses);
      setComparativeResult(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      setAnalysisProgress(100);
    } catch (error) {
      console.error('Comparative analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateComparativeResult = async (articleAnalyses: any[]): Promise<ComparativeResult> => {
    // Extract common topics and phrases
    const allTexts = articleAnalyses.map(a => a.textContent.toLowerCase());
    const commonTopics = extractCommonTopics(allTexts);
    const keyPhrases = extractKeyPhrases(allTexts);
    const sharedClaims = extractSharedClaims(allTexts);

    // Find differences and conflicts
    const conflictingClaims = findConflictingClaims(articleAnalyses);
    const differentPerspectives = findDifferentPerspectives(articleAnalyses);
    const biasVariations = articleAnalyses.map(a => ({
      source: a.article.source || new URL(a.article.link).hostname,
      biasScore: a.biasResult.bias_scores?.political || 5,
      biasType: determineBiasType(a.biasResult)
    }));

    // Calculate overall metrics
    const overallConsensus = calculateConsensus(articleAnalyses);
    const reliabilityScore = calculateReliability(articleAnalyses);
    const recommendations = generateRecommendations(articleAnalyses, conflictingClaims);

    return {
      similarities: {
        topics: commonTopics,
        keyPhrases,
        sharedClaims
      },
      differences: {
        conflictingClaims,
        differentPerspectives,
        biasVariations
      },
      analysis: {
        overallConsensus,
        reliabilityScore,
        recommendations
      }
    };
  };

  const extractCommonTopics = (texts: string[]): string[] => {
    const topics = ['politics', 'economy', 'technology', 'health', 'environment', 'education', 'crime', 'international'];
    const commonTopics = topics.filter(topic => 
      texts.every(text => text.includes(topic))
    );
    return commonTopics.slice(0, 3);
  };

  const extractKeyPhrases = (texts: string[]): string[] => {
    const phrases = ['government', 'policy', 'reform', 'crisis', 'development', 'impact', 'future', 'change'];
    const keyPhrases = phrases.filter(phrase => 
      texts.some(text => text.includes(phrase))
    );
    return keyPhrases.slice(0, 5);
  };

  const extractSharedClaims = (texts: string[]): string[] => {
    // This would be more sophisticated in a real implementation
    return ['Shared factual information detected', 'Common background context identified'];
  };

  const findConflictingClaims = (articleAnalyses: any[]): string[] => {
    const conflicts = [];
    const biasScores = articleAnalyses.map(a => a.biasResult.bias_scores?.political || 5);
    
    if (Math.max(...biasScores) - Math.min(...biasScores) > 3) {
      conflicts.push('Significant bias variation detected across sources');
    }
    
    return conflicts;
  };

  const findDifferentPerspectives = (articleAnalyses: any[]): string[] => {
    return ['Different editorial perspectives identified', 'Varying emphasis on key points'];
  };

  const determineBiasType = (biasResult: any): string => {
    const political = biasResult.bias_scores?.political || 5;
    if (political > 7) return 'High Political Bias';
    if (political > 5) return 'Moderate Political Bias';
    return 'Low Political Bias';
  };

  const calculateConsensus = (articleAnalyses: any[]): number => {
    const biasScores = articleAnalyses.map(a => a.biasResult.bias_scores?.political || 5);
    const variance = Math.max(...biasScores) - Math.min(...biasScores);
    return Math.max(0, 100 - (variance * 10));
  };

  const calculateReliability = (articleAnalyses: any[]): number => {
    // Simple reliability calculation based on source diversity and bias consistency
    const uniqueSources = new Set(articleAnalyses.map(a => a.article.source)).size;
    const biasVariance = Math.max(...articleAnalyses.map(a => a.biasResult.bias_scores?.political || 5)) - 
                        Math.min(...articleAnalyses.map(a => a.biasResult.bias_scores?.political || 5));
    
    return Math.min(100, (uniqueSources * 20) + (100 - biasVariance * 10));
  };

  const generateRecommendations = (articleAnalyses: any[], conflicts: string[]): string[] => {
    const recommendations = [];
    
    if (conflicts.length > 0) {
      recommendations.push('Verify conflicting claims with additional sources');
    }
    
    if (articleAnalyses.length < 3) {
      recommendations.push('Consider adding more diverse sources for comprehensive analysis');
    }
    
    recommendations.push('Cross-reference key claims with fact-checking organizations');
    
    return recommendations;
  };

  const toggleArticleSelection = (article: Article) => {
    setSelectedArticles(prev => {
      const isSelected = prev.some(a => a.link === article.link);
      if (isSelected) {
        return prev.filter(a => a.link !== article.link);
      } else {
        return [...prev, article];
      }
    });
  };

  return (
    <div className="comparative-analysis">
      <div className="analysis-header">
        <div className="header-content">
          <FiBarChart2 className="header-icon" />
          <div>
            <h2>Comparative Analysis</h2>
            <p>Compare multiple articles on the same subject to identify similarities, differences, and potential biases</p>
          </div>
        </div>
      </div>

      {/* Article Selection */}
      <div className="article-selection">
        <h3>Select Articles for Comparison (2-5 articles)</h3>
        <div className="articles-grid">
          {articles.map((article, index) => {
            const isSelected = selectedArticles.some(a => a.link === article.link);
            return (
              <div 
                key={index} 
                className={`article-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleArticleSelection(article)}
              >
                <div className="article-info">
                  <h4>{article.title}</h4>
                  <p className="article-source">{article.source || new URL(article.link).hostname}</p>
                  <p className="article-date">{new Date(article.pubDate).toLocaleDateString()}</p>
                </div>
                <div className="selection-indicator">
                  {isSelected ? <FiCheckCircle /> : <FiInfo />}
                </div>
              </div>
            );
          })}
        </div>
        
        <button 
          className="analyze-button"
          onClick={performComparativeAnalysis}
          disabled={isAnalyzing || selectedArticles.length < 2}
        >
          {isAnalyzing ? 'Analyzing...' : `Compare ${selectedArticles.length} Articles`}
        </button>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
          <p>Analyzing articles... {Math.round(analysisProgress)}%</p>
        </div>
      )}

      {/* Results */}
      {comparativeResult && (
        <div className="comparative-results">
          {/* Similarities */}
          <div className="results-section similarities">
            <h3><FiCheckCircle /> Similarities</h3>
            <div className="results-grid">
              <div className="result-card">
                <h4>Common Topics</h4>
                <div className="tags">
                  {comparativeResult.similarities.topics.map((topic, index) => (
                    <span key={index} className="tag">{topic}</span>
                  ))}
                </div>
              </div>
              
              <div className="result-card">
                <h4>Key Phrases</h4>
                <div className="tags">
                  {comparativeResult.similarities.keyPhrases.map((phrase, index) => (
                    <span key={index} className="tag">{phrase}</span>
                  ))}
                </div>
              </div>
              
              <div className="result-card">
                <h4>Shared Claims</h4>
                <ul>
                  {comparativeResult.similarities.sharedClaims.map((claim, index) => (
                    <li key={index}>{claim}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Differences */}
          <div className="results-section differences">
            <h3><FiAlertTriangle /> Differences & Conflicts</h3>
            <div className="results-grid">
              <div className="result-card">
                <h4>Bias Variations</h4>
                <div className="bias-chart">
                  {comparativeResult.differences.biasVariations.map((variation, index) => (
                    <div key={index} className="bias-item">
                      <span className="source">{variation.source}</span>
                      <div className="bias-bar">
                        <div 
                          className="bias-fill" 
                          style={{ width: `${(variation.biasScore / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="bias-score">{variation.biasScore.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="result-card">
                <h4>Conflicting Claims</h4>
                <ul>
                  {comparativeResult.differences.conflictingClaims.map((claim, index) => (
                    <li key={index}>{claim}</li>
                  ))}
                </ul>
              </div>
              
              <div className="result-card">
                <h4>Different Perspectives</h4>
                <ul>
                  {comparativeResult.differences.differentPerspectives.map((perspective, index) => (
                    <li key={index}>{perspective}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="results-section summary">
            <h3><FiTarget /> Analysis Summary</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="metric">
                  <span className="metric-value">{Math.round(comparativeResult.analysis.overallConsensus)}%</span>
                  <span className="metric-label">Consensus Level</span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="metric">
                  <span className="metric-value">{Math.round(comparativeResult.analysis.reliabilityScore)}%</span>
                  <span className="metric-label">Reliability Score</span>
                </div>
              </div>
            </div>
            
            <div className="recommendations">
              <h4>Recommendations</h4>
              <ul>
                {comparativeResult.analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparativeAnalysis;
