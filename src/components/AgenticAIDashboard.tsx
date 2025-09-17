import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiCpu, 
  FiGlobe, 
  FiUsers, 
  FiTarget, 
  FiTrendingUp,
  FiZap,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiBarChart2,
  FiSettings,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiShare2,
  FiGitBranch,
  FiShield,
  FiEye,
  FiActivity,
  FiAward,
  FiStar,
  FiRefreshCw
} from 'react-icons/fi';
import '../styles/AgenticAIDashboard.css';

interface AgenticSystem {
  id: string;
  name: string;
  type: 'orchestrator' | 'learning' | 'network' | 'analysis';
  status: 'active' | 'idle' | 'processing' | 'error';
  performance: {
    efficiency: number;
    accuracy: number;
    intelligence: number;
  };
  metrics: {
    tasksCompleted: number;
    agentsActive: number;
    learningCycles: number;
    collaborations: number;
  };
  lastUpdate: Date;
}

interface SystemInsight {
  id: string;
  type: 'performance' | 'learning' | 'collaboration' | 'optimization';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const AgenticAIDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [systems, setSystems] = useState<AgenticSystem[]>([
    {
      id: 'ai-orchestrator',
      name: 'AI Agent Orchestrator',
      type: 'orchestrator',
      status: 'active',
      performance: { efficiency: 0.95, accuracy: 0.92, intelligence: 0.88 },
      metrics: { tasksCompleted: 127, agentsActive: 6, learningCycles: 0, collaborations: 45 },
      lastUpdate: new Date()
    },
    {
      id: 'autonomous-learning',
      name: 'Autonomous Learning Agent',
      type: 'learning',
      status: 'processing',
      performance: { efficiency: 0.89, accuracy: 0.94, intelligence: 0.91 },
      metrics: { tasksCompleted: 0, agentsActive: 4, learningCycles: 23, collaborations: 12 },
      lastUpdate: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: 'collaborative-network',
      name: 'Collaborative AI Network',
      type: 'network',
      status: 'active',
      performance: { efficiency: 0.92, accuracy: 0.89, intelligence: 0.95 },
      metrics: { tasksCompleted: 89, agentsActive: 6, learningCycles: 0, collaborations: 156 },
      lastUpdate: new Date(Date.now() - 60000) // 1 minute ago
    },
    {
      id: 'enhanced-analysis',
      name: 'Enhanced Analysis System',
      type: 'analysis',
      status: 'idle',
      performance: { efficiency: 0.87, accuracy: 0.91, intelligence: 0.86 },
      metrics: { tasksCompleted: 234, agentsActive: 3, learningCycles: 0, collaborations: 67 },
      lastUpdate: new Date(Date.now() - 1800000) // 30 minutes ago
    }
  ]);

  const [insights, setInsights] = useState<SystemInsight[]>([
    {
      id: 'insight-1',
      type: 'performance',
      title: 'Orchestrator Efficiency Peak',
      description: 'AI Agent Orchestrator achieved 95% efficiency, highest in 24 hours',
      impact: 'positive',
      timestamp: new Date(Date.now() - 300000),
      priority: 'high'
    },
    {
      id: 'insight-2',
      type: 'learning',
      title: 'Learning Model Improvement',
      description: 'Autonomous Learning Agent improved bias detection accuracy by 3.2%',
      impact: 'positive',
      timestamp: new Date(Date.now() - 600000),
      priority: 'medium'
    },
    {
      id: 'insight-3',
      type: 'collaboration',
      title: 'Network Collaboration Success',
      description: 'Collaborative AI Network completed 15 multi-agent tasks successfully',
      impact: 'positive',
      timestamp: new Date(Date.now() - 900000),
      priority: 'high'
    },
    {
      id: 'insight-4',
      type: 'optimization',
      title: 'System Optimization Opportunity',
      description: 'Enhanced Analysis System showing 13% idle time, ready for optimization',
      impact: 'neutral',
      timestamp: new Date(Date.now() - 1200000),
      priority: 'low'
    }
  ]);

  const [overallMetrics, setOverallMetrics] = useState({
    totalSystems: 4,
    activeSystems: 3,
    totalTasks: 450,
    averageEfficiency: 0.91,
    collectiveIntelligence: 0.90,
    systemHealth: 0.94
  });

  useEffect(() => {
    // Update metrics every 30 seconds
    const interval = setInterval(() => {
      updateSystemMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const updateSystemMetrics = () => {
    const activeSystems = systems.filter(s => s.status === 'active' || s.status === 'processing').length;
    const totalTasks = systems.reduce((sum, s) => sum + s.metrics.tasksCompleted, 0);
    const averageEfficiency = systems.reduce((sum, s) => sum + s.performance.efficiency, 0) / systems.length;
    const collectiveIntelligence = systems.reduce((sum, s) => sum + s.performance.intelligence, 0) / systems.length;
    const systemHealth = (activeSystems / systems.length) * averageEfficiency;

    setOverallMetrics({
      totalSystems: systems.length,
      activeSystems,
      totalTasks,
      averageEfficiency,
      collectiveIntelligence,
      systemHealth
    });
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'processing': return '#ffc107';
      case 'idle': return '#6c757d';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSystemTypeIcon = (type: string) => {
    switch (type) {
      case 'orchestrator': return <FiCpu />;
      case 'learning': return <FiCpu />;
      case 'network': return <FiGlobe />;
      case 'analysis': return <FiTarget />;
      default: return <FiActivity />;
    }
  };

  const getInsightPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getInsightImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <FiTrendingUp />;
      case 'negative': return <FiAlertTriangle />;
      case 'neutral': return <FiActivity />;
      default: return <FiActivity />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="agentic-ai-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <FiCpu className="header-icon" />
          <div>
            <h1>Agentic AI Dashboard</h1>
            <p>Comprehensive overview of all AI systems and their performance</p>
          </div>
        </div>
        
        <div className="dashboard-controls">
          <button className="control-button">
            <FiRefreshCw />
            Refresh
          </button>
          <button className="control-button">
            <FiSettings />
            Settings
          </button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="overall-metrics">
        <h3><FiBarChart2 /> System Overview</h3>
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon">
              <FiCpu />
            </div>
            <div className="metric-content">
              <h4>Active Systems</h4>
              <span className="metric-value">{overallMetrics.activeSystems}/{overallMetrics.totalSystems}</span>
              <p className="metric-description">Systems currently operational</p>
            </div>
          </div>
          
          <div className="metric-card success">
            <div className="metric-icon">
              <FiTarget />
            </div>
            <div className="metric-content">
              <h4>Total Tasks</h4>
              <span className="metric-value">{overallMetrics.totalTasks}</span>
              <p className="metric-description">Tasks completed today</p>
            </div>
          </div>
          
          <div className="metric-card warning">
            <div className="metric-icon">
              <FiTrendingUp />
            </div>
            <div className="metric-content">
              <h4>Average Efficiency</h4>
              <span className="metric-value">{Math.round(overallMetrics.averageEfficiency * 100)}%</span>
              <p className="metric-description">System performance average</p>
            </div>
          </div>
          
          <div className="metric-card info">
            <div className="metric-icon">
              <FiCpu />
            </div>
            <div className="metric-content">
              <h4>Collective Intelligence</h4>
              <span className="metric-value">{Math.round(overallMetrics.collectiveIntelligence * 100)}%</span>
              <p className="metric-description">Network intelligence score</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FiShield />
            </div>
            <div className="metric-content">
              <h4>System Health</h4>
              <span className="metric-value">{Math.round(overallMetrics.systemHealth * 100)}%</span>
              <p className="metric-description">Overall system health</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Systems */}
      <div className="ai-systems">
        <h3><FiGlobe /> AI Systems</h3>
        <div className="systems-grid">
          {systems.map((system) => (
            <div key={system.id} className={`system-card ${system.status}`}>
              <div className="system-header">
                <div className="system-icon">
                  {getSystemTypeIcon(system.type)}
                </div>
                <div className="system-status">
                  <span 
                    className="status-dot"
                    style={{ backgroundColor: getSystemStatusColor(system.status) }}
                  ></span>
                  <span className="status-text">{system.status}</span>
                </div>
              </div>
              
              <div className="system-content">
                <h4>{system.name}</h4>
                <p className="system-type">{system.type}</p>
                
                <div className="system-performance">
                  <div className="performance-metric">
                    <span>Efficiency:</span>
                    <span className="metric-value">{Math.round(system.performance.efficiency * 100)}%</span>
                  </div>
                  <div className="performance-metric">
                    <span>Accuracy:</span>
                    <span className="metric-value">{Math.round(system.performance.accuracy * 100)}%</span>
                  </div>
                  <div className="performance-metric">
                    <span>Intelligence:</span>
                    <span className="metric-value">{Math.round(system.performance.intelligence * 100)}%</span>
                  </div>
                </div>
                
                <div className="system-metrics">
                  <div className="metric">
                    <span>Tasks:</span>
                    <span>{system.metrics.tasksCompleted}</span>
                  </div>
                  <div className="metric">
                    <span>Agents:</span>
                    <span>{system.metrics.agentsActive}</span>
                  </div>
                  <div className="metric">
                    <span>Learning:</span>
                    <span>{system.metrics.learningCycles}</span>
                  </div>
                  <div className="metric">
                    <span>Collaborations:</span>
                    <span>{system.metrics.collaborations}</span>
                  </div>
                </div>
                
                <div className="system-footer">
                  <span className="last-update">Updated {formatTimeAgo(system.lastUpdate)}</span>
                  <button 
                    className="system-action"
                    onClick={() => navigate(`/${system.id.replace('-', '-')}`)}
                  >
                    <FiEye />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Insights */}
      <div className="system-insights">
        <h3><FiStar /> AI Insights</h3>
        <div className="insights-list">
          {insights.map((insight) => (
            <div key={insight.id} className={`insight-card ${insight.impact}`}>
              <div className="insight-header">
                <div className="insight-icon">
                  {getInsightImpactIcon(insight.impact)}
                </div>
                <div className="insight-priority">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getInsightPriorityColor(insight.priority) }}
                  >
                    {insight.priority}
                  </span>
                </div>
              </div>
              
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
                <span className="insight-time">{formatTimeAgo(insight.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3><FiZap /> Quick Actions</h3>
        <div className="actions-grid">
          <button 
            onClick={() => navigate('/ai-orchestrator')}
            className="action-card"
          >
            <FiCpu />
            <span>AI Orchestrator</span>
          </button>
          
          <button 
            onClick={() => navigate('/autonomous-learning')}
            className="action-card"
          >
            <FiCpu />
            <span>Autonomous Learning</span>
          </button>
          
          <button 
            onClick={() => navigate('/collaborative-network')}
            className="action-card"
          >
            <FiGlobe />
            <span>Collaborative Network</span>
          </button>
          
          <button 
            onClick={() => navigate('/analysis')}
            className="action-card"
          >
            <FiTarget />
            <span>Enhanced Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgenticAIDashboard;
