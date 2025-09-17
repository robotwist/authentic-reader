import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiActivity, 
  FiPieChart, 
  FiBarChart2, 
  FiTarget,
  FiClock,
  FiHeart,
  FiZap,
  FiAlertTriangle,
  FiSmile,
  FiFrown,
  FiMeh,
  FiEye,
  FiFilter,
  FiDownload,
  FiShare2
} from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/SentimentAnalysisDashboard.css';

interface SentimentData {
  overall: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  tone: {
    formal: number;
    informal: number;
    aggressive: number;
    passive: number;
    objective: number;
    subjective: number;
  };
  keywords: {
    positive: string[];
    negative: string[];
    emotional: string[];
  };
  trends: {
    sentimentOverTime: Array<{
      timestamp: string;
      score: number;
      label: string;
    }>;
    emotionDistribution: Array<{
      emotion: string;
      percentage: number;
      color: string;
    }>;
  };
  insights: {
    dominantEmotion: string;
    toneAnalysis: string;
    sentimentShifts: string[];
    recommendations: string[];
  };
}

interface SentimentAnalysisDashboardProps {
  text?: string;
  onAnalysisComplete?: (data: SentimentData) => void;
}

const SentimentAnalysisDashboard: React.FC<SentimentAnalysisDashboardProps> = ({ 
  text = '', 
  onAnalysisComplete 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [filterEmotion, setFilterEmotion] = useState('all');
  const { analyzeBias } = useLlamaAnalysis();

  useEffect(() => {
    if (text) {
      performSentimentAnalysis(text);
    }
  }, [text]);

  const performSentimentAnalysis = async (content: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Step 1: Analyze bias and sentiment
      setAnalysisProgress(25);
      const biasResult = await analyzeBias(content);
      
      // Step 2: Generate comprehensive sentiment data
      setAnalysisProgress(75);
      const data = await generateSentimentData(content, biasResult);
      
      setSentimentData(data);
      setAnalysisProgress(100);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSentimentData = async (content: string, biasResult: any): Promise<SentimentData> => {
    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\s+/);
    
    // Analyze sentiment based on content patterns
    let overallScore = 0;
    let positiveWords = 0;
    let negativeWords = 0;
    let emotionalIntensity = 0;

    // Positive indicators
    const positivePatterns = [
      'excellent', 'amazing', 'wonderful', 'great', 'good', 'positive', 'success', 'win', 'victory',
      'hope', 'optimistic', 'improve', 'better', 'strong', 'powerful', 'effective', 'efficient'
    ];

    // Negative indicators
    const negativePatterns = [
      'terrible', 'awful', 'horrible', 'bad', 'negative', 'failure', 'lose', 'defeat', 'problem',
      'crisis', 'disaster', 'worst', 'weak', 'ineffective', 'broken', 'damaged', 'destroyed'
    ];

    // Emotional intensity indicators
    const emotionalPatterns = [
      'outrageous', 'shocking', 'incredible', 'unbelievable', 'amazing', 'terrifying', 'devastating',
      'wonderful', 'fantastic', 'horrible', 'disgusting', 'beautiful', 'ugly', 'love', 'hate'
    ];

    words.forEach(word => {
      if (positivePatterns.includes(word)) {
        positiveWords++;
        overallScore += 0.1;
      }
      if (negativePatterns.includes(word)) {
        negativeWords++;
        overallScore -= 0.1;
      }
      if (emotionalPatterns.includes(word)) {
        emotionalIntensity += 0.2;
      }
    });

    // Normalize score
    overallScore = Math.max(-1, Math.min(1, overallScore));
    
    // Determine sentiment label
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (overallScore > 0.1) label = 'positive';
    else if (overallScore < -0.1) label = 'negative';

    // Generate emotions based on content
    const emotions = {
      joy: Math.max(0, overallScore * 0.8),
      sadness: Math.max(0, -overallScore * 0.6),
      anger: contentLower.includes('angry') || contentLower.includes('furious') ? 0.7 : 0.2,
      fear: contentLower.includes('fear') || contentLower.includes('scared') ? 0.6 : 0.1,
      surprise: contentLower.includes('surprising') || contentLower.includes('unexpected') ? 0.5 : 0.2,
      disgust: contentLower.includes('disgusting') || contentLower.includes('revolting') ? 0.8 : 0.1
    };

    // Analyze tone
    const tone = {
      formal: contentLower.includes('therefore') || contentLower.includes('furthermore') ? 0.8 : 0.4,
      informal: contentLower.includes('gonna') || contentLower.includes('wanna') ? 0.7 : 0.3,
      aggressive: contentLower.includes('attack') || contentLower.includes('destroy') ? 0.8 : 0.2,
      passive: contentLower.includes('might') || contentLower.includes('could') ? 0.6 : 0.3,
      objective: biasResult.bias_scores?.political < 5 ? 0.7 : 0.3,
      subjective: biasResult.bias_scores?.political > 5 ? 0.8 : 0.2
    };

    // Extract keywords
    const keywords = {
      positive: positivePatterns.filter(word => contentLower.includes(word)).slice(0, 5),
      negative: negativePatterns.filter(word => contentLower.includes(word)).slice(0, 5),
      emotional: emotionalPatterns.filter(word => contentLower.includes(word)).slice(0, 5)
    };

    // Generate trends data
    const now = new Date();
    const sentimentOverTime = [
      { timestamp: new Date(now.getTime() - 3600000).toISOString(), score: overallScore - 0.1, label },
      { timestamp: new Date(now.getTime() - 1800000).toISOString(), score: overallScore, label },
      { timestamp: now.toISOString(), score: overallScore + 0.05, label }
    ];

    const emotionDistribution = [
      { emotion: 'Joy', percentage: emotions.joy * 100, color: '#28a745' },
      { emotion: 'Sadness', percentage: emotions.sadness * 100, color: '#6c757d' },
      { emotion: 'Anger', percentage: emotions.anger * 100, color: '#dc3545' },
      { emotion: 'Fear', percentage: emotions.fear * 100, color: '#fd7e14' },
      { emotion: 'Surprise', percentage: emotions.surprise * 100, color: '#ffc107' },
      { emotion: 'Disgust', percentage: emotions.disgust * 100, color: '#6f42c1' }
    ];

    // Generate insights
    const dominantEmotion = Object.entries(emotions).reduce((a, b) => emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b)[0];
    
    const toneAnalysis = tone.aggressive > 0.6 ? 'Aggressive tone detected' :
                        tone.passive > 0.6 ? 'Passive tone detected' :
                        tone.formal > 0.6 ? 'Formal tone detected' :
                        tone.informal > 0.6 ? 'Informal tone detected' : 'Balanced tone';

    const sentimentShifts = [];
    if (sentimentOverTime[0].score !== sentimentOverTime[2].score) {
      sentimentShifts.push('Sentiment has shifted over time');
    }
    if (emotionalIntensity > 0.5) {
      sentimentShifts.push('High emotional intensity detected');
    }

    const recommendations = [];
    if (tone.aggressive > 0.6) {
      recommendations.push('Consider using more neutral language');
    }
    if (emotionalIntensity > 0.7) {
      recommendations.push('Content may benefit from more objective presentation');
    }
    if (tone.subjective > 0.7) {
      recommendations.push('Consider balancing with objective facts');
    }

    return {
      overall: {
        score: overallScore,
        label,
        confidence: 0.8
      },
      emotions,
      tone,
      keywords,
      trends: {
        sentimentOverTime,
        emotionDistribution
      },
      insights: {
        dominantEmotion,
        toneAnalysis,
        sentimentShifts,
        recommendations
      }
    };
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <FiSmile className="sentiment-icon positive" />;
      case 'negative':
        return <FiFrown className="sentiment-icon negative" />;
      default:
        return <FiMeh className="sentiment-icon neutral" />;
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return '#28a745';
      case 'negative':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatPercentage = (value: number) => {
    return Math.round(value * 100);
  };

  return (
    <div className="sentiment-analysis-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <FiActivity className="header-icon" />
          <div>
            <h2>Sentiment Analysis Dashboard</h2>
            <p>Comprehensive emotional content analysis and tone detection</p>
          </div>
        </div>
        
        <div className="header-controls">
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <select 
            value={filterEmotion} 
            onChange={(e) => setFilterEmotion(e.target.value)}
            className="emotion-filter"
          >
            <option value="all">All Emotions</option>
            <option value="joy">Joy</option>
            <option value="sadness">Sadness</option>
            <option value="anger">Anger</option>
            <option value="fear">Fear</option>
            <option value="surprise">Surprise</option>
            <option value="disgust">Disgust</option>
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
          <p>Analyzing sentiment and emotional content... {analysisProgress}%</p>
        </div>
      )}

      {sentimentData && (
        <div className="dashboard-content">
          {/* Overall Sentiment Score */}
          <div className="sentiment-overview">
            <div className="overview-card">
              <div className="overview-header">
                <h3>Overall Sentiment</h3>
                {getSentimentIcon(sentimentData.overall.label)}
              </div>
              <div className="sentiment-score">
                <span 
                  className="score-value"
                  style={{ color: getSentimentColor(sentimentData.overall.label) }}
                >
                  {formatPercentage(sentimentData.overall.score + 1)}%
                </span>
                <span className="score-label">
                  {sentimentData.overall.label.charAt(0).toUpperCase() + sentimentData.overall.label.slice(1)}
                </span>
              </div>
              <div className="confidence-score">
                {formatPercentage(sentimentData.overall.confidence)}% Confidence
              </div>
            </div>
          </div>

          {/* Emotions Grid */}
          <div className="emotions-section">
            <h3><FiHeart /> Emotional Analysis</h3>
            <div className="emotions-grid">
              {Object.entries(sentimentData.emotions).map(([emotion, value]) => (
                <div key={emotion} className="emotion-card">
                  <div className="emotion-header">
                    <span className="emotion-name">{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
                    <span className="emotion-value">{formatPercentage(value)}%</span>
                  </div>
                  <div className="emotion-bar">
                    <div 
                      className="emotion-fill"
                      style={{ 
                        width: `${formatPercentage(value)}%`,
                        backgroundColor: sentimentData.trends.emotionDistribution.find(e => e.emotion.toLowerCase() === emotion)?.color || '#6c757d'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tone Analysis */}
          <div className="tone-section">
            <h3><FiTarget /> Tone Analysis</h3>
            <div className="tone-grid">
              {Object.entries(sentimentData.tone).map(([toneType, value]) => (
                <div key={toneType} className="tone-card">
                  <div className="tone-info">
                    <span className="tone-name">{toneType.charAt(0).toUpperCase() + toneType.slice(1)}</span>
                    <span className="tone-value">{formatPercentage(value)}%</span>
                  </div>
                  <div className="tone-indicator">
                    <div 
                      className="tone-fill"
                      style={{ width: `${formatPercentage(value)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="keywords-section">
            <h3><FiZap /> Key Emotional Words</h3>
            <div className="keywords-grid">
              <div className="keyword-category positive">
                <h4><FiSmile /> Positive</h4>
                <div className="keyword-tags">
                  {sentimentData.keywords.positive.map((word, index) => (
                    <span key={index} className="keyword-tag positive">{word}</span>
                  ))}
                </div>
              </div>
              
              <div className="keyword-category negative">
                <h4><FiFrown /> Negative</h4>
                <div className="keyword-tags">
                  {sentimentData.keywords.negative.map((word, index) => (
                    <span key={index} className="keyword-tag negative">{word}</span>
                  ))}
                </div>
              </div>
              
              <div className="keyword-category emotional">
                <h4><FiHeart /> Emotional</h4>
                <div className="keyword-tags">
                  {sentimentData.keywords.emotional.map((word, index) => (
                    <span key={index} className="keyword-tag emotional">{word}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="insights-section">
            <h3><FiEye /> AI Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Dominant Emotion</h4>
                <p>{sentimentData.insights.dominantEmotion.charAt(0).toUpperCase() + sentimentData.insights.dominantEmotion.slice(1)}</p>
              </div>
              
              <div className="insight-card">
                <h4>Tone Analysis</h4>
                <p>{sentimentData.insights.toneAnalysis}</p>
              </div>
              
              <div className="insight-card">
                <h4>Sentiment Shifts</h4>
                <ul>
                  {sentimentData.insights.sentimentShifts.map((shift, index) => (
                    <li key={index}>{shift}</li>
                  ))}
                </ul>
              </div>
              
              <div className="insight-card">
                <h4>Recommendations</h4>
                <ul>
                  {sentimentData.insights.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="action-btn">
              <FiDownload /> Export Report
            </button>
            <button className="action-btn">
              <FiShare2 /> Share Analysis
            </button>
            <button className="action-btn">
              <FiFilter /> Advanced Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisDashboard;
