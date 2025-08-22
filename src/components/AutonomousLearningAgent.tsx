import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiCpu, 
  FiTrendingUp, 
  FiTarget, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiZap,
  FiClock,
  FiBarChart2,
  FiSettings,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiDownload,
  FiUpload,
  FiEye,
  FiShield,
  FiUsers
} from 'react-icons/fi';
import '../styles/AutonomousLearningAgent.css';

interface LearningModel {
  id: string;
  name: string;
  type: 'bias-detection' | 'fact-checking' | 'sentiment-analysis' | 'credibility-assessment';
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  lastUpdated: Date;
  status: 'active' | 'training' | 'evaluating' | 'updating';
  performance: {
    current: number;
    previous: number;
    improvement: number;
  };
}

interface LearningSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  dataProcessed: number;
  accuracyImprovement: number;
  newPatternsLearned: number;
  status: 'running' | 'completed' | 'failed';
  insights: string[];
}

interface FeedbackData {
  id: string;
  timestamp: Date;
  modelId: string;
  prediction: any;
  actualResult: any;
  userFeedback: 'correct' | 'incorrect' | 'partially_correct';
  confidence: number;
  improvement: number;
}

interface AutonomousLearningAgentProps {
  onModelUpdate?: (model: LearningModel) => void;
  onLearningComplete?: (session: LearningSession) => void;
}

const AutonomousLearningAgent: React.FC<AutonomousLearningAgentProps> = ({ 
  onModelUpdate, 
  onLearningComplete 
}) => {
  const [models, setModels] = useState<LearningModel[]>([
    {
      id: 'bias-detection-v1.2',
      name: 'Bias Detection Model',
      type: 'bias-detection',
      version: '1.2.3',
      accuracy: 0.89,
      precision: 0.87,
      recall: 0.91,
      f1Score: 0.89,
      trainingDataSize: 15420,
      lastUpdated: new Date(Date.now() - 86400000), // 1 day ago
      status: 'active',
      performance: { current: 0.89, previous: 0.85, improvement: 0.04 }
    },
    {
      id: 'fact-checking-v1.1',
      name: 'Fact-Checking Model',
      type: 'fact-checking',
      version: '1.1.7',
      accuracy: 0.92,
      precision: 0.94,
      recall: 0.90,
      f1Score: 0.92,
      trainingDataSize: 8920,
      lastUpdated: new Date(Date.now() - 172800000), // 2 days ago
      status: 'active',
      performance: { current: 0.92, previous: 0.89, improvement: 0.03 }
    },
    {
      id: 'sentiment-analysis-v1.3',
      name: 'Sentiment Analysis Model',
      type: 'sentiment-analysis',
      version: '1.3.1',
      accuracy: 0.94,
      precision: 0.93,
      recall: 0.95,
      f1Score: 0.94,
      trainingDataSize: 23450,
      lastUpdated: new Date(Date.now() - 43200000), // 12 hours ago
      status: 'training',
      performance: { current: 0.94, previous: 0.91, improvement: 0.03 }
    },
    {
      id: 'credibility-assessment-v1.0',
      name: 'Credibility Assessment Model',
      type: 'credibility-assessment',
      version: '1.0.5',
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.89,
      f1Score: 0.87,
      trainingDataSize: 6780,
      lastUpdated: new Date(Date.now() - 259200000), // 3 days ago
      status: 'evaluating',
      performance: { current: 0.87, previous: 0.84, improvement: 0.03 }
    }
  ]);

  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [learningProgress, setLearningProgress] = useState(0);
  const [systemMetrics, setSystemMetrics] = useState({
    totalLearningTime: 0,
    averageAccuracy: 0,
    totalImprovements: 0,
    activeModels: 0
  });

  useEffect(() => {
    // Initialize system metrics
    updateSystemMetrics();
    
    // Start autonomous learning cycle
    startAutonomousLearning();
  }, []);

  const updateSystemMetrics = () => {
    const activeModels = models.filter(m => m.status === 'active').length;
    const averageAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;
    const totalImprovements = models.reduce((sum, m) => sum + m.performance.improvement, 0);
    const totalLearningTime = learningSessions.reduce((sum, s) => sum + s.duration, 0);

    setSystemMetrics({
      totalLearningTime,
      averageAccuracy,
      totalImprovements,
      activeModels
    });
  };

  const startAutonomousLearning = useCallback(async () => {
    setIsLearning(true);
    
    // Create new learning session
    const session: LearningSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      duration: 0,
      dataProcessed: 0,
      accuracyImprovement: 0,
      newPatternsLearned: 0,
      status: 'running',
      insights: []
    };

    setCurrentSession(session);
    setLearningSessions(prev => [session, ...prev]);

    // Simulate learning process
    await simulateLearningProcess(session);

    setIsLearning(false);
    setCurrentSession(null);
  }, []);

  const simulateLearningProcess = async (session: LearningSession) => {
    const steps = [
      { name: 'Data Collection', duration: 2000, progress: 20 },
      { name: 'Pattern Analysis', duration: 3000, progress: 40 },
      { name: 'Model Training', duration: 4000, progress: 60 },
      { name: 'Validation', duration: 2000, progress: 80 },
      { name: 'Model Update', duration: 1000, progress: 100 }
    ];

    for (const step of steps) {
      setLearningProgress(step.progress);
      
      // Update session insights
      const insight = generateInsight(step.name);
      session.insights.push(insight);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      // Update models during training
      if (step.name === 'Model Training') {
        await updateModels();
      }
    }

    // Complete session
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    session.status = 'completed';
    session.dataProcessed = Math.floor(Math.random() * 1000) + 500;
    session.accuracyImprovement = Math.random() * 0.05;
    session.newPatternsLearned = Math.floor(Math.random() * 10) + 5;

    setLearningSessions(prev => prev.map(s => s.id === session.id ? session : s));
    
    if (onLearningComplete) {
      onLearningComplete(session);
    }

    updateSystemMetrics();
  };

  const generateInsight = (step: string): string => {
    const insights = {
      'Data Collection': [
        'Discovered new bias patterns in political content',
        'Identified emerging fact-checking challenges',
        'Found correlation between source credibility and accuracy'
      ],
      'Pattern Analysis': [
        'Detected seasonal variations in content bias',
        'Recognized new rhetorical techniques',
        'Identified evolving misinformation patterns'
      ],
      'Model Training': [
        'Improved bias detection accuracy by 3.2%',
        'Enhanced fact-checking precision for scientific claims',
        'Optimized sentiment analysis for nuanced content'
      ],
      'Validation': [
        'Model performance validated across diverse datasets',
        'Cross-validation shows consistent improvement',
        'Edge case handling significantly improved'
      ],
      'Model Update': [
        'Successfully deployed updated models',
        'Performance monitoring activated',
        'Ready for next learning cycle'
      ]
    };

    const stepInsights = insights[step as keyof typeof insights] || ['Learning process completed'];
    return stepInsights[Math.floor(Math.random() * stepInsights.length)];
  };

  const updateModels = async () => {
    const updatedModels = models.map(model => {
      if (model.status === 'training') {
        // Simulate model improvement
        const improvement = Math.random() * 0.03;
        const newAccuracy = Math.min(0.99, model.accuracy + improvement);
        
        return {
          ...model,
          accuracy: newAccuracy,
          precision: Math.min(0.99, model.precision + improvement * 0.8),
          recall: Math.min(0.99, model.recall + improvement * 0.9),
          f1Score: Math.min(0.99, model.f1Score + improvement),
          trainingDataSize: model.trainingDataSize + Math.floor(Math.random() * 100) + 50,
          lastUpdated: new Date(),
          status: 'active' as const,
          performance: {
            current: newAccuracy,
            previous: model.accuracy,
            improvement
          }
        };
      }
      return model;
    });

    setModels(updatedModels);
    
    // Notify about model updates
    updatedModels.forEach(model => {
      if (model.status === 'active' && onModelUpdate) {
        onModelUpdate(model);
      }
    });
  };

  const addFeedback = (modelId: string, prediction: any, actualResult: any, userFeedback: 'correct' | 'incorrect' | 'partially_correct') => {
    const feedback: FeedbackData = {
      id: `feedback-${Date.now()}`,
      timestamp: new Date(),
      modelId,
      prediction,
      actualResult,
      userFeedback,
      confidence: Math.random() * 0.3 + 0.7,
      improvement: Math.random() * 0.02
    };

    setFeedbackData(prev => [feedback, ...prev]);
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'training': return '#ffc107';
      case 'evaluating': return '#17a2b8';
      case 'updating': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 0.9) return '#28a745';
    if (value >= 0.8) return '#ffc107';
    if (value >= 0.7) return '#fd7e14';
    return '#dc3545';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="autonomous-learning-agent">
      <div className="learning-header">
        <div className="header-content">
          <FiCpu className="header-icon" />
          <div>
            <h2>Autonomous Learning Agent</h2>
            <p>Self-improving AI models for enhanced media analysis</p>
          </div>
        </div>
        
        <div className="learning-controls">
          <button 
            onClick={startAutonomousLearning}
            disabled={isLearning}
            className="learn-button"
          >
            {isLearning ? (
              <>
                <FiPause className="spinner" />
                Learning...
              </>
            ) : (
              <>
                <FiPlay />
                Start Learning
              </>
            )}
          </button>
        </div>
      </div>

      {/* Learning Progress */}
      {isLearning && currentSession && (
        <div className="learning-progress">
          <div className="progress-header">
            <h3>Learning Session in Progress</h3>
            <span className="session-id">Session: {currentSession.id}</span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${learningProgress}%` }}
            ></div>
          </div>
          
          <div className="progress-details">
            <span>Progress: {learningProgress}%</span>
            <span>Duration: {formatDuration(Date.now() - currentSession.startTime.getTime())}</span>
          </div>
          
          {currentSession.insights.length > 0 && (
            <div className="current-insights">
              <strong>Latest Insight:</strong> {currentSession.insights[currentSession.insights.length - 1]}
            </div>
          )}
        </div>
      )}

      {/* Learning Models */}
      <div className="models-section">
        <h3><FiTarget /> Learning Models</h3>
        <div className="models-grid">
          {models.map((model) => (
            <div key={model.id} className="model-card">
              <div className="model-header">
                <div className="model-icon">
                  {model.type === 'bias-detection' && <FiEye />}
                  {model.type === 'fact-checking' && <FiShield />}
                  {model.type === 'sentiment-analysis' && <FiTrendingUp />}
                  {model.type === 'credibility-assessment' && <FiUsers />}
                </div>
                <div className="model-status">
                  <span 
                    className="status-dot"
                    style={{ backgroundColor: getModelStatusColor(model.status) }}
                  ></span>
                  <span className="status-text">{model.status}</span>
                </div>
              </div>
              
              <div className="model-content">
                <h4>{model.name}</h4>
                <p className="model-version">v{model.version}</p>
                
                <div className="model-metrics">
                  <div className="metric-row">
                    <span>Accuracy:</span>
                    <span 
                      className="metric-value"
                      style={{ color: getPerformanceColor(model.accuracy) }}
                    >
                      {Math.round(model.accuracy * 100)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span>Precision:</span>
                    <span 
                      className="metric-value"
                      style={{ color: getPerformanceColor(model.precision) }}
                    >
                      {Math.round(model.precision * 100)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span>Recall:</span>
                    <span 
                      className="metric-value"
                      style={{ color: getPerformanceColor(model.recall) }}
                    >
                      {Math.round(model.recall * 100)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span>F1 Score:</span>
                    <span 
                      className="metric-value"
                      style={{ color: getPerformanceColor(model.f1Score) }}
                    >
                      {Math.round(model.f1Score * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="model-performance">
                  <div className="performance-indicator">
                    <span>Improvement:</span>
                    <span className={`improvement ${model.performance.improvement > 0 ? 'positive' : 'negative'}`}>
                      {model.performance.improvement > 0 ? '+' : ''}{Math.round(model.performance.improvement * 100)}%
                    </span>
                  </div>
                  <div className="training-data">
                    <span>Training Data:</span>
                    <span>{model.trainingDataSize.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="model-actions">
                  <button className="action-btn">
                    <FiEye /> View Details
                  </button>
                  <button className="action-btn">
                    <FiDownload /> Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Sessions */}
      <div className="sessions-section">
        <h3><FiClock /> Learning Sessions</h3>
        <div className="sessions-list">
          {learningSessions.slice(0, 5).map((session) => (
            <div key={session.id} className={`session-item ${session.status}`}>
              <div className="session-header">
                <span className="session-id">{session.id}</span>
                <span className={`session-status ${session.status}`}>{session.status}</span>
              </div>
              
              <div className="session-details">
                <div className="session-metric">
                  <strong>Duration:</strong> {formatDuration(session.duration)}
                </div>
                <div className="session-metric">
                  <strong>Data Processed:</strong> {session.dataProcessed.toLocaleString()}
                </div>
                <div className="session-metric">
                  <strong>Accuracy Improvement:</strong> 
                  <span className={`improvement ${session.accuracyImprovement > 0 ? 'positive' : 'negative'}`}>
                    {session.accuracyImprovement > 0 ? '+' : ''}{Math.round(session.accuracyImprovement * 100)}%
                  </span>
                </div>
                <div className="session-metric">
                  <strong>New Patterns:</strong> {session.newPatternsLearned}
                </div>
              </div>
              
              {session.insights.length > 0 && (
                <div className="session-insights">
                  <strong>Key Insights:</strong>
                  <ul>
                    {session.insights.slice(-3).map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Metrics */}
      <div className="metrics-section">
        <h3><FiBarChart2 /> System Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Total Learning Time</h4>
            <span className="metric-value">{formatDuration(systemMetrics.totalLearningTime)}</span>
          </div>
          <div className="metric-card">
            <h4>Average Accuracy</h4>
            <span className="metric-value">{Math.round(systemMetrics.averageAccuracy * 100)}%</span>
          </div>
          <div className="metric-card">
            <h4>Total Improvements</h4>
            <span className="metric-value">{Math.round(systemMetrics.totalImprovements * 100)}%</span>
          </div>
          <div className="metric-card">
            <h4>Active Models</h4>
            <span className="metric-value">{systemMetrics.activeModels}</span>
          </div>
        </div>
      </div>

      {/* Feedback System */}
      <div className="feedback-section">
        <h3><FiSettings /> Feedback System</h3>
        <div className="feedback-stats">
          <div className="feedback-stat">
            <span className="stat-label">Total Feedback</span>
            <span className="stat-value">{feedbackData.length}</span>
          </div>
          <div className="feedback-stat">
            <span className="stat-label">Correct Predictions</span>
            <span className="stat-value">
              {feedbackData.filter(f => f.userFeedback === 'correct').length}
            </span>
          </div>
          <div className="feedback-stat">
            <span className="stat-label">Average Confidence</span>
            <span className="stat-value">
              {feedbackData.length > 0 
                ? Math.round(feedbackData.reduce((sum, f) => sum + f.confidence, 0) / feedbackData.length * 100)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutonomousLearningAgent;
