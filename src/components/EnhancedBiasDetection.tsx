import React, { useState, useEffect } from 'react';
import { 
  FiAlertCircle, 
  FiCheck, 
  FiCpu, 
  FiClock, 
  FiBarChart2, 
  FiTarget,
  FiShield,
  FiTrendingUp,
  FiInfo,
  FiActivity
} from 'react-icons/fi';
import useLlamaAnalysis, { BiasAnalysisResult } from '../hooks/useLlamaAnalysis';
import '../styles/EnhancedBiasDetection.css';

interface BiasInsight {
  type: 'warning' | 'info' | 'success' | 'recommendation';
  title: string;
  message: string;
  action?: string;
}

interface EnhancedBiasDetectionProps {
  defaultText?: string;
  showRealTime?: boolean;
}

const EnhancedBiasDetection: React.FC<EnhancedBiasDetectionProps> = ({ 
  defaultText = '', 
  showRealTime = false 
}) => {
  const [text, setText] = useState<string>(defaultText);
  const [result, setResult] = useState<BiasAnalysisResult | null>(null);
  const [insights, setInsights] = useState<BiasInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<BiasAnalysisResult[]>([]);
  
  const {
    serviceStatus,
    isCheckingStatus,
    analysisInProgress,
    error,
    analyzeBias
  } = useLlamaAnalysis();

  useEffect(() => {
    if (defaultText && serviceStatus?.status === 'healthy') {
      handleAnalysis();
    }
  }, [defaultText, serviceStatus]);

  // Real-time analysis for longer text
  useEffect(() => {
    if (showRealTime && text.length > 100 && serviceStatus?.status === 'healthy') {
      const timeoutId = setTimeout(() => {
        handleAnalysis();
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [text, showRealTime, serviceStatus]);

  const handleAnalysis = async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    const biasResult = await analyzeBias(text);
    
    if (biasResult) {
      setResult(biasResult);
      setAnalysisHistory(prev => [biasResult, ...prev.slice(0, 4)]); // Keep last 5
      generateInsights(biasResult);
    }
    
    setIsAnalyzing(false);
  };

  const generateInsights = (biasResult: BiasAnalysisResult) => {
    const newInsights: BiasInsight[] = [];
    
    // Political bias insights
    if (biasResult.political_bias > 7) {
      newInsights.push({
        type: 'warning',
        title: 'High Political Bias Detected',
        message: 'This content shows strong political leanings. Consider seeking additional perspectives.',
        action: 'Find opposing viewpoints'
      });
    } else if (biasResult.political_bias < 3) {
      newInsights.push({
        type: 'success',
        title: 'Balanced Political Content',
        message: 'This content appears politically balanced and objective.',
        action: 'Continue reading'
      });
    }

    // Emotional bias insights
    if (biasResult.emotional_bias > 6) {
      newInsights.push({
        type: 'warning',
        title: 'Emotional Manipulation Detected',
        message: 'This content uses strong emotional language that may cloud judgment.',
        action: 'Read with caution'
      });
    }

    // Cognitive bias insights
    if (biasResult.cognitive_bias > 5) {
      newInsights.push({
        type: 'info',
        title: 'Cognitive Bias Patterns',
        message: 'This content may contain logical fallacies or cognitive biases.',
        action: 'Fact-check claims'
      });
    }

    // Overall assessment
    const averageBias = (biasResult.political_bias + biasResult.emotional_bias + biasResult.cognitive_bias) / 3;
    
    if (averageBias < 4) {
      newInsights.push({
        type: 'success',
        title: 'High-Quality Content',
        message: 'This content appears to be well-balanced and fact-based.',
        action: 'Recommended reading'
      });
    } else if (averageBias > 7) {
      newInsights.push({
        type: 'warning',
        title: 'High Bias Content',
        message: 'This content shows significant bias across multiple dimensions.',
        action: 'Seek alternative sources'
      });
    }

    // AI recommendations
    newInsights.push({
      type: 'recommendation',
      title: 'AI Recommendations',
      message: generateAIRecommendations(biasResult),
      action: 'View detailed analysis'
    });

    setInsights(newInsights);
  };

  const generateAIRecommendations = (biasResult: BiasAnalysisResult): string => {
    const recommendations = [];
    
    if (biasResult.political_bias > 5) {
      recommendations.push('Seek sources from different political perspectives');
    }
    
    if (biasResult.emotional_bias > 5) {
      recommendations.push('Look for more neutral, fact-based reporting');
    }
    
    if (biasResult.cognitive_bias > 4) {
      recommendations.push('Verify claims with fact-checking sources');
    }
    
    if (recommendations.length === 0) {
      return 'This content appears balanced. Continue reading with critical thinking.';
    }
    
    return recommendations.join('. ') + '.';
  };

  const getBiasLevelText = (score: number): string => {
    if (score < 3) return 'Very Low';
    if (score < 5) return 'Low';
    if (score < 7) return 'Moderate';
    if (score < 9) return 'High';
    return 'Very High';
  };

  const getBiasLevelColor = (score: number): string => {
    if (score < 3) return '#28a745';
    if (score < 5) return '#5cb85c';
    if (score < 7) return '#ffc107';
    if (score < 9) return '#fd7e14';
    return '#dc3545';
  };

  const getInsightIcon = (type: BiasInsight['type']) => {
    switch (type) {
      case 'warning': return <FiAlertCircle />;
      case 'info': return <FiInfo />;
      case 'success': return <FiCheck />;
      case 'recommendation': return <FiInfo />;
    }
  };

  const getInsightColor = (type: BiasInsight['type']) => {
    switch (type) {
      case 'warning': return '#dc3545';
      case 'info': return '#007bff';
      case 'success': return '#28a745';
      case 'recommendation': return '#ffc107';
    }
  };

  return (
    <div className="enhanced-bias-detection">
      <div className="detection-header">
        <h2>
          <FiShield className="header-icon" />
          Enhanced Bias Detection
        </h2>
        <p>AI-powered analysis with real-time insights and recommendations</p>
      </div>

      {/* Service Status */}
      <div className="service-status-card">
        <h4>AI Analysis Service</h4>
        {isCheckingStatus ? (
          <div className="status-loading">
            <FiActivity className="spinner" />
            <span>Checking service status...</span>
          </div>
        ) : serviceStatus?.status === 'healthy' ? (
          <div className="status-healthy">
            <FiCheck className="status-icon" />
            <span>
              Service online • {serviceStatus.model}
              {serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`}
            </span>
          </div>
        ) : (
          <div className="status-error">
            <FiAlertCircle className="status-icon" />
            <span>Service unavailable</span>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-header">
          <h3>Content Analysis</h3>
          {showRealTime && (
            <div className="realtime-indicator">
              <FiActivity className="indicator-icon" />
              <span>Real-time analysis enabled</span>
            </div>
          )}
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type content to analyze for bias..."
          className="content-input"
          rows={6}
        />
        
        <div className="input-actions">
          <button
            onClick={handleAnalysis}
            disabled={!text.trim() || analysisInProgress || isAnalyzing}
            className="analyze-button"
          >
            {isAnalyzing ? (
              <>
                <FiActivity className="spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <FiTarget />
                Analyze Bias
              </>
            )}
          </button>
          
          <button
            onClick={() => setText('')}
            disabled={!text}
            className="clear-button"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="results-section">
          <div className="results-header">
            <h3>Analysis Results</h3>
            <div className="confidence-score">
              <span>Confidence: {result.confidence || 'High'}</span>
            </div>
          </div>

          {/* Bias Scores */}
          <div className="bias-scores-grid">
            <div className="bias-score-card">
              <div className="score-header">
                <FiTarget className="score-icon" />
                <span>Political Bias</span>
              </div>
              <div className="score-value" style={{ color: getBiasLevelColor(result.political_bias) }}>
                {result.political_bias.toFixed(1)}/10
              </div>
              <div className="score-level" style={{ color: getBiasLevelColor(result.political_bias) }}>
                {getBiasLevelText(result.political_bias)}
              </div>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${result.political_bias * 10}%`,
                    backgroundColor: getBiasLevelColor(result.political_bias)
                  }}
                ></div>
              </div>
            </div>

            <div className="bias-score-card">
              <div className="score-header">
                <FiBarChart2 className="score-icon" />
                <span>Emotional Bias</span>
              </div>
              <div className="score-value" style={{ color: getBiasLevelColor(result.emotional_bias) }}>
                {result.emotional_bias.toFixed(1)}/10
              </div>
              <div className="score-level" style={{ color: getBiasLevelColor(result.emotional_bias) }}>
                {getBiasLevelText(result.emotional_bias)}
              </div>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${result.emotional_bias * 10}%`,
                    backgroundColor: getBiasLevelColor(result.emotional_bias)
                  }}
                ></div>
              </div>
            </div>

            <div className="bias-score-card">
              <div className="score-header">
                <FiCpu className="score-icon" />
                <span>Cognitive Bias</span>
              </div>
              <div className="score-value" style={{ color: getBiasLevelColor(result.cognitive_bias) }}>
                {result.cognitive_bias.toFixed(1)}/10
              </div>
              <div className="score-level" style={{ color: getBiasLevelColor(result.cognitive_bias) }}>
                {getBiasLevelText(result.cognitive_bias)}
              </div>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${result.cognitive_bias * 10}%`,
                    backgroundColor: getBiasLevelColor(result.cognitive_bias)
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="insights-section">
            <h3>
              <FiInfo className="section-icon" />
              AI Insights & Recommendations
            </h3>
            
            <div className="insights-grid">
              {insights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`insight-card ${insight.type}`}
                  style={{ borderColor: getInsightColor(insight.type) }}
                >
                  <div className="insight-header">
                    {getInsightIcon(insight.type)}
                    <h4>{insight.title}</h4>
                  </div>
                  <p>{insight.message}</p>
                  {insight.action && (
                    <div className="insight-action">
                      <span>{insight.action}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analysis History */}
          {analysisHistory.length > 1 && (
            <div className="history-section">
              <h3>
                <FiTrendingUp className="section-icon" />
                Recent Analysis History
              </h3>
              
              <div className="history-chart">
                {analysisHistory.slice(1).map((hist, index) => (
                  <div key={index} className="history-item">
                    <div className="history-label">#{analysisHistory.length - index - 1}</div>
                    <div className="history-bars">
                      <div 
                        className="history-bar political"
                        style={{ 
                          height: `${hist.political_bias * 10}%`,
                          backgroundColor: getBiasLevelColor(hist.political_bias)
                        }}
                      ></div>
                      <div 
                        className="history-bar emotional"
                        style={{ 
                          height: `${hist.emotional_bias * 10}%`,
                          backgroundColor: getBiasLevelColor(hist.emotional_bias)
                        }}
                      ></div>
                      <div 
                        className="history-bar cognitive"
                        style={{ 
                          height: `${hist.cognitive_bias * 10}%`,
                          backgroundColor: getBiasLevelColor(hist.cognitive_bias)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-card">
          <FiAlertCircle className="error-icon" />
          <h4>Analysis Error</h4>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedBiasDetection;
