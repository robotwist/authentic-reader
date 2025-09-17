import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCpu, FiTarget, FiBarChart2, FiZap } from 'react-icons/fi';
import AutonomousLearningAgent from '../components/AutonomousLearningAgent';
import '../styles/AutonomousLearningPage.css';

const AutonomousLearningPage: React.FC = () => {
  const navigate = useNavigate();
  const [learningStats, setLearningStats] = useState({
    totalSessions: 0,
    averageImprovement: 0,
    modelsTrained: 0,
    lastUpdate: new Date()
  });

  const handleModelUpdate = (model: any) => {
    console.log('Model updated:', model);
    setLearningStats(prev => ({
      ...prev,
      modelsTrained: prev.modelsTrained + 1,
      lastUpdate: new Date()
    }));
  };

  const handleLearningComplete = (session: any) => {
    console.log('Learning session completed:', session);
    setLearningStats(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      averageImprovement: (prev.averageImprovement + session.accuracyImprovement) / 2
    }));
  };

  return (
    <div className="autonomous-learning-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Home
        </button>
        
        <div className="header-info">
          <h1>Autonomous Learning Agent</h1>
          <p>Self-improving AI models that continuously enhance their analysis capabilities</p>
        </div>
      </div>

      {/* Learning Overview */}
      <div className="learning-overview">
        <h3><FiCpu /> Learning Overview</h3>
        <div className="overview-grid">
          <div className="overview-card">
            <div className="overview-icon">
              <FiZap />
            </div>
            <div className="overview-content">
              <h4>Active Learning</h4>
              <p>Models continuously learn from new data and user feedback</p>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-icon">
              <FiTarget />
            </div>
            <div className="overview-content">
              <h4>Performance Optimization</h4>
              <p>Automatic tuning of model parameters for better accuracy</p>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-icon">
              <FiBarChart2 />
            </div>
            <div className="overview-content">
              <h4>Adaptive Training</h4>
              <p>Learning strategies that adapt to changing content patterns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Statistics */}
      <div className="learning-stats">
        <h3><FiBarChart2 /> Learning Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Sessions</h4>
            <span className="stat-value">{learningStats.totalSessions}</span>
          </div>
          
          <div className="stat-card">
            <h4>Average Improvement</h4>
            <span className="stat-value">{Math.round(learningStats.averageImprovement * 100)}%</span>
          </div>
          
          <div className="stat-card">
            <h4>Models Trained</h4>
            <span className="stat-value">{learningStats.modelsTrained}</span>
          </div>
          
          <div className="stat-card">
            <h4>Last Update</h4>
            <span className="stat-value">
              {learningStats.lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Autonomous Learning Agent */}
      <AutonomousLearningAgent 
        onModelUpdate={handleModelUpdate}
        onLearningComplete={handleLearningComplete}
      />

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            onClick={() => navigate('/ai-orchestrator')}
            className="action-card"
          >
            <FiCpu />
            <span>AI Agent Orchestrator</span>
          </button>
          
          <button 
            onClick={() => navigate('/analysis')}
            className="action-card"
          >
            <FiTarget />
            <span>Article Analysis</span>
          </button>
          
          <button 
            onClick={() => navigate('/sentiment-analysis')}
            className="action-card"
          >
            <FiBarChart2 />
            <span>Sentiment Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutonomousLearningPage;
