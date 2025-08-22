import React, { useState, useEffect } from 'react';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiClock, 
  FiEye, 
  FiBookOpen,
  FiTarget,
  FiShield,
  FiUsers,
  FiGlobe,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingDown,
  FiAward,
  FiZap
} from 'react-icons/fi';
import useLlamaAnalysis, { BiasAnalysisResult } from '../hooks/useLlamaAnalysis';
import '../styles/AnalyticsDashboard.css';

interface ReadingSession {
  id: string;
  timestamp: Date;
  duration: number;
  articlesRead: number;
  sourcesVisited: string[];
  biasExposure: {
    political: number;
    emotional: number;
    cognitive: number;
  };
}

interface SourceDiversity {
  source: string;
  category: string;
  articlesRead: number;
  averageBias: number;
  lastRead: Date;
  reliability: number;
}

interface AnalyticsData {
  totalArticlesRead: number;
  totalReadingTime: number;
  averageSessionDuration: number;
  mostReadSources: SourceDiversity[];
  biasTrends: {
    political: number[];
    emotional: number[];
    cognitive: number[];
    dates: string[];
  };
  sourceDiversity: {
    categories: { [key: string]: number };
    totalSources: number;
  };
  readingStreak: number;
  weeklyProgress: {
    articles: number;
    time: number;
    sources: number;
  };
  // Enhanced metrics
  mediaLiteracyScore: number;
  factCheckingFrequency: number;
  comparativeAnalysisCount: number;
  logicalFallaciesDetected: number;
  rhetoricalDevicesIdentified: number;
  credibilityAssessments: {
    high: number;
    medium: number;
    low: number;
  };
  readingInsights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
  realTimeMetrics: {
    currentSessionDuration: number;
    articlesReadToday: number;
    sourcesVisitedToday: number;
    averageBiasToday: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const { serviceStatus } = useLlamaAnalysis();

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData(generateMockAnalyticsData());
      setIsLoading(false);
    }, 1000);

    // Set up real-time data updates
    const interval = setInterval(() => {
      updateRealTimeMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const updateRealTimeMetrics = () => {
    // Simulate real-time data updates
    setRealTimeData({
      currentSessionDuration: Math.floor(Math.random() * 60) + 10,
      articlesReadToday: Math.floor(Math.random() * 5) + 1,
      sourcesVisitedToday: Math.floor(Math.random() * 3) + 1,
      averageBiasToday: (Math.random() * 5) + 2
    });
  };

  const generateMockAnalyticsData = (): AnalyticsData => {
    return {
      totalArticlesRead: 247,
      totalReadingTime: 1840, // minutes
      averageSessionDuration: 23,
      mostReadSources: [
        { source: 'NPR', category: 'center', articlesRead: 45, averageBias: 2.1, lastRead: new Date(), reliability: 0.9 },
        { source: 'BBC News', category: 'center', articlesRead: 38, averageBias: 2.3, lastRead: new Date(), reliability: 0.85 },
        { source: 'Reuters', category: 'center', articlesRead: 32, averageBias: 1.8, lastRead: new Date(), reliability: 0.92 },
        { source: 'Fox News', category: 'right', articlesRead: 28, averageBias: 7.2, lastRead: new Date(), reliability: 0.6 },
        { source: 'MSNBC', category: 'left', articlesRead: 25, averageBias: 6.8, lastRead: new Date(), reliability: 0.65 }
      ],
      biasTrends: {
        political: [3.2, 2.8, 4.1, 3.5, 2.9, 3.8, 3.1],
        emotional: [4.5, 3.9, 5.2, 4.8, 4.1, 4.9, 4.3],
        cognitive: [2.1, 1.8, 2.5, 2.2, 1.9, 2.4, 2.0],
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      sourceDiversity: {
        categories: {
          'center': 65,
          'left': 20,
          'right': 15
        },
        totalSources: 12
      },
      readingStreak: 7,
      weeklyProgress: {
        articles: 34,
        time: 280,
        sources: 8
      },
      // Enhanced metrics
      mediaLiteracyScore: 78,
      factCheckingFrequency: 15,
      comparativeAnalysisCount: 8,
      logicalFallaciesDetected: 23,
      rhetoricalDevicesIdentified: 31,
      credibilityAssessments: {
        high: 156,
        medium: 67,
        low: 24
      },
      readingInsights: {
        strengths: [
          'Good source diversity with 65% center-leaning sources',
          'Consistent reading habits with 7-day streak',
          'Active fact-checking behavior'
        ],
        areasForImprovement: [
          'Consider more right-leaning sources for balance',
          'Increase comparative analysis usage',
          'Focus on detecting logical fallacies'
        ],
        recommendations: [
          'Add 2-3 right-leaning sources to your feed',
          'Use comparative analysis for controversial topics',
          'Practice identifying rhetorical devices'
        ]
      },
      realTimeMetrics: {
        currentSessionDuration: 15,
        articlesReadToday: 3,
        sourcesVisitedToday: 2,
        averageBiasToday: 3.2
      }
    };
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

  const getMediaLiteracyLevel = (score: number): { level: string; color: string; icon: JSX.Element } => {
    if (score >= 80) return { level: 'Expert', color: '#28a745', icon: <FiAward /> };
    if (score >= 60) return { level: 'Advanced', color: '#5cb85c', icon: <FiCheckCircle /> };
    if (score >= 40) return { level: 'Intermediate', color: '#ffc107', icon: <FiTarget /> };
    return { level: 'Beginner', color: '#fd7e14', icon: <FiAlertTriangle /> };
  };

  if (isLoading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-spinner">
          <FiActivity className="spinner-icon" />
          <p>Loading your reading analytics...</p>
        </div>
      </div>
    );
  }

  const literacyLevel = getMediaLiteracyLevel(analyticsData?.mediaLiteracyScore || 0);

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>
          <FiBarChart2 className="header-icon" />
          Enhanced Reading Analytics Dashboard
        </h1>
        <p>Your personalized insights, reading patterns, and media literacy progress</p>
        
        <div className="timeframe-selector">
          <button 
            className={selectedTimeframe === 'week' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('week')}
          >
            Week
          </button>
          <button 
            className={selectedTimeframe === 'month' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('month')}
          >
            Month
          </button>
          <button 
            className={selectedTimeframe === 'year' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('year')}
          >
            Year
          </button>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Real-time Metrics */}
          <div className="realtime-metrics">
            <h2><FiZap /> Live Session</h2>
            <div className="realtime-grid">
              <div className="realtime-card">
                <span className="realtime-value">{analyticsData.realTimeMetrics.currentSessionDuration}m</span>
                <span className="realtime-label">Current Session</span>
              </div>
              <div className="realtime-card">
                <span className="realtime-value">{analyticsData.realTimeMetrics.articlesReadToday}</span>
                <span className="realtime-label">Articles Today</span>
              </div>
              <div className="realtime-card">
                <span className="realtime-value">{analyticsData.realTimeMetrics.sourcesVisitedToday}</span>
                <span className="realtime-label">Sources Today</span>
              </div>
              <div className="realtime-card">
                <span className="realtime-value">{analyticsData.realTimeMetrics.averageBiasToday.toFixed(1)}</span>
                <span className="realtime-label">Avg Bias Today</span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <FiBookOpen />
              </div>
              <div className="metric-content">
                <h3>{analyticsData.totalArticlesRead}</h3>
                <p>Articles Read</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <FiClock />
              </div>
              <div className="metric-content">
                <h3>{Math.round(analyticsData.totalReadingTime / 60)}h</h3>
                <p>Total Reading Time</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <FiTarget />
              </div>
              <div className="metric-content">
                <h3>{analyticsData.readingStreak}</h3>
                <p>Day Streak</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <FiGlobe />
              </div>
              <div className="metric-content">
                <h3>{analyticsData.sourceDiversity.totalSources}</h3>
                <p>Sources Visited</p>
              </div>
            </div>

            <div className="metric-card highlight">
              <div className="metric-icon" style={{ color: literacyLevel.color }}>
                {literacyLevel.icon}
              </div>
              <div className="metric-content">
                <h3>{analyticsData.mediaLiteracyScore}</h3>
                <p>Media Literacy Score</p>
                <span className="literacy-level" style={{ color: literacyLevel.color }}>
                  {literacyLevel.level}
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <FiShield />
              </div>
              <div className="metric-content">
                <h3>{analyticsData.factCheckingFrequency}</h3>
                <p>Fact Checks</p>
              </div>
            </div>
          </div>

          {/* Enhanced Analytics Sections */}
          <div className="dashboard-section">
            <h2>
              <FiActivity className="section-icon" />
              Advanced Analytics
            </h2>
            
            <div className="advanced-analytics-grid">
              <div className="analytics-card">
                <h3>Credibility Assessment</h3>
                <div className="credibility-chart">
                  <div className="credibility-item">
                    <span>High Credibility</span>
                    <div className="credibility-bar">
                      <div 
                        className="credibility-fill high" 
                        style={{ width: `${(analyticsData.credibilityAssessments.high / analyticsData.totalArticlesRead) * 100}%` }}
                      ></div>
                    </div>
                    <span>{analyticsData.credibilityAssessments.high}</span>
                  </div>
                  <div className="credibility-item">
                    <span>Medium Credibility</span>
                    <div className="credibility-bar">
                      <div 
                        className="credibility-fill medium" 
                        style={{ width: `${(analyticsData.credibilityAssessments.medium / analyticsData.totalArticlesRead) * 100}%` }}
                      ></div>
                    </div>
                    <span>{analyticsData.credibilityAssessments.medium}</span>
                  </div>
                  <div className="credibility-item">
                    <span>Low Credibility</span>
                    <div className="credibility-bar">
                      <div 
                        className="credibility-fill low" 
                        style={{ width: `${(analyticsData.credibilityAssessments.low / analyticsData.totalArticlesRead) * 100}%` }}
                      ></div>
                    </div>
                    <span>{analyticsData.credibilityAssessments.low}</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>Analysis Usage</h3>
                <div className="analysis-stats">
                  <div className="analysis-stat">
                    <span className="stat-number">{analyticsData.comparativeAnalysisCount}</span>
                    <span className="stat-label">Comparative Analyses</span>
                  </div>
                  <div className="analysis-stat">
                    <span className="stat-number">{analyticsData.logicalFallaciesDetected}</span>
                    <span className="stat-label">Logical Fallacies Detected</span>
                  </div>
                  <div className="analysis-stat">
                    <span className="stat-number">{analyticsData.rhetoricalDevicesIdentified}</span>
                    <span className="stat-label">Rhetorical Devices Found</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="dashboard-section">
            <h2>
              <FiTarget className="section-icon" />
              AI-Powered Insights
            </h2>
            
            <div className="insights-grid">
              <div className="insight-card strengths">
                <h3><FiCheckCircle /> Your Strengths</h3>
                <ul>
                  {analyticsData.readingInsights.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-card improvements">
                <h3><FiAlertTriangle /> Areas for Improvement</h3>
                <ul>
                  {analyticsData.readingInsights.areasForImprovement.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-card recommendations">
                <h3><FiTrendingUp /> Recommendations</h3>
                <ul>
                  {analyticsData.readingInsights.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bias Analysis Section */}
          <div className="dashboard-section">
            <h2>
              <FiShield className="section-icon" />
              Bias Exposure Analysis
            </h2>
            
            <div className="bias-analysis-grid">
              <div className="bias-trend-chart">
                <h3>Bias Trends Over Time</h3>
                <div className="chart-container">
                  {analyticsData.biasTrends.dates.map((date, index) => (
                    <div key={date} className="chart-bar-group">
                      <div className="chart-label">{date}</div>
                      <div className="chart-bars">
                        <div 
                          className="chart-bar political"
                          style={{ 
                            height: `${analyticsData.biasTrends.political[index] * 10}%`,
                            backgroundColor: getBiasLevelColor(analyticsData.biasTrends.political[index])
                          }}
                        ></div>
                        <div 
                          className="chart-bar emotional"
                          style={{ 
                            height: `${analyticsData.biasTrends.emotional[index] * 10}%`,
                            backgroundColor: getBiasLevelColor(analyticsData.biasTrends.emotional[index])
                          }}
                        ></div>
                        <div 
                          className="chart-bar cognitive"
                          style={{ 
                            height: `${analyticsData.biasTrends.cognitive[index] * 10}%`,
                            backgroundColor: getBiasLevelColor(analyticsData.biasTrends.cognitive[index])
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span className="legend-item political">Political</span>
                  <span className="legend-item emotional">Emotional</span>
                  <span className="legend-item cognitive">Cognitive</span>
                </div>
              </div>

              <div className="bias-summary">
                <h3>Average Bias Exposure</h3>
                <div className="bias-summary-item">
                  <span>Political Bias:</span>
                  <span className="bias-score" style={{ color: getBiasLevelColor(3.2) }}>
                    {getBiasLevelText(3.2)} (3.2/10)
                  </span>
                </div>
                <div className="bias-summary-item">
                  <span>Emotional Bias:</span>
                  <span className="bias-score" style={{ color: getBiasLevelColor(4.5) }}>
                    {getBiasLevelText(4.5)} (4.5/10)
                  </span>
                </div>
                <div className="bias-summary-item">
                  <span>Cognitive Bias:</span>
                  <span className="bias-score" style={{ color: getBiasLevelColor(2.1) }}>
                    {getBiasLevelText(2.1)} (2.1/10)
                  </span>
                </div>
                
                <div className="bias-insight">
                  <h4>AI Insight</h4>
                  <p>
                    Your reading shows a healthy balance with moderate emotional bias exposure. 
                    Consider diversifying sources to reduce cognitive bias patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Source Diversity */}
          <div className="dashboard-section">
            <h2>
              <FiUsers className="section-icon" />
              Source Diversity
            </h2>
            
            <div className="source-diversity-grid">
              <div className="diversity-chart">
                <h3>Reading Distribution</h3>
                <div className="pie-chart">
                  {Object.entries(analyticsData.sourceDiversity.categories).map(([category, percentage]) => (
                    <div 
                      key={category}
                      className="pie-segment"
                      style={{
                        background: `conic-gradient(${getCategoryColor(category)} 0deg ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`
                      }}
                    >
                      <div className="segment-label">
                        {category.charAt(0).toUpperCase() + category.slice(1)}: {percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="top-sources">
                <h3>Most Read Sources</h3>
                <div className="sources-list">
                  {analyticsData.mostReadSources.map((source, index) => (
                    <div key={source.source} className="source-item">
                      <div className="source-rank">#{index + 1}</div>
                      <div className="source-info">
                        <div className="source-name">{source.source}</div>
                        <div className="source-stats">
                          {source.articlesRead} articles • 
                          <span style={{ color: getBiasLevelColor(source.averageBias) }}>
                            {getBiasLevelText(source.averageBias)} bias
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="dashboard-section">
            <h2>
              <FiTrendingUp className="section-icon" />
              This Week's Progress
            </h2>
            
            <div className="progress-grid">
              <div className="progress-card">
                <div className="progress-icon">
                  <FiBookOpen />
                </div>
                <div className="progress-content">
                  <h3>{analyticsData.weeklyProgress.articles}</h3>
                  <p>Articles Read</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(analyticsData.weeklyProgress.articles / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="progress-card">
                <div className="progress-icon">
                  <FiClock />
                </div>
                <div className="progress-content">
                  <h3>{analyticsData.weeklyProgress.time}m</h3>
                  <p>Reading Time</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(analyticsData.weeklyProgress.time / 420) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="progress-card">
                <div className="progress-icon">
                  <FiGlobe />
                </div>
                <div className="progress-content">
                  <h3>{analyticsData.weeklyProgress.sources}</h3>
                  <p>Sources Visited</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(analyticsData.weeklyProgress.sources / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'center': return '#28a745';
    case 'left': return '#007bff';
    case 'right': return '#dc3545';
    default: return '#6c757d';
  }
};

export default AnalyticsDashboard;
