import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiGlobe, FiUsers, FiCpu, FiTarget } from 'react-icons/fi';
import CollaborativeAINetwork from '../components/CollaborativeAINetwork';
import '../styles/CollaborativeAINetworkPage.css';

const CollaborativeAINetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const [networkStats, setNetworkStats] = useState({
    totalCollaborations: 0,
    averageIntelligence: 0,
    activeConnections: 0,
    lastUpdate: new Date()
  });

  const handleNetworkUpdate = (network: any) => {
    console.log('Network updated:', network);
    setNetworkStats(prev => ({
      ...prev,
      activeConnections: network.filter((node: any) => node.status === 'active').length,
      lastUpdate: new Date()
    }));
  };

  const handleTaskComplete = (task: any) => {
    console.log('Collaborative task completed:', task);
    setNetworkStats(prev => ({
      ...prev,
      totalCollaborations: prev.totalCollaborations + 1,
      averageIntelligence: (prev.averageIntelligence + task.collectiveIntelligence) / 2
    }));
  };

  return (
    <div className="collaborative-ai-network-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Home
        </button>
        
        <div className="header-info">
          <h1>Collaborative AI Network</h1>
          <p>Multi-agent system with collective intelligence and inter-agent communication</p>
        </div>
      </div>

      {/* Network Overview */}
      <div className="network-overview">
        <h3><FiGlobe /> Network Overview</h3>
        <div className="overview-grid">
          <div className="overview-card">
            <div className="overview-icon">
              <FiUsers />
            </div>
            <div className="overview-content">
              <h4>Multi-Agent Collaboration</h4>
              <p>Specialized AI agents working together to achieve collective intelligence</p>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-icon">
              <FiCpu />
            </div>
            <div className="overview-content">
              <h4>Collective Intelligence</h4>
              <p>Network-wide intelligence that exceeds individual agent capabilities</p>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-icon">
              <FiTarget />
            </div>
            <div className="overview-content">
              <h4>Real-time Communication</h4>
              <p>Dynamic inter-agent communication and knowledge sharing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="network-statistics">
        <h3><FiGlobe /> Network Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Collaborations</h4>
            <span className="stat-value">{networkStats.totalCollaborations}</span>
          </div>
          
          <div className="stat-card">
            <h4>Average Intelligence</h4>
            <span className="stat-value">{Math.round(networkStats.averageIntelligence * 100)}%</span>
          </div>
          
          <div className="stat-card">
            <h4>Active Connections</h4>
            <span className="stat-value">{networkStats.activeConnections}</span>
          </div>
          
          <div className="stat-card">
            <h4>Last Update</h4>
            <span className="stat-value">
              {networkStats.lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Collaborative AI Network */}
      <CollaborativeAINetwork 
        onNetworkUpdate={handleNetworkUpdate}
        onTaskComplete={handleTaskComplete}
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
            onClick={() => navigate('/autonomous-learning')}
            className="action-card"
          >
            <FiTarget />
            <span>Autonomous Learning</span>
          </button>
          
          <button 
            onClick={() => navigate('/analysis')}
            className="action-card"
          >
            <FiGlobe />
            <span>Article Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeAINetworkPage;
