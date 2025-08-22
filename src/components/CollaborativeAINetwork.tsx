import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiUsers, 
  FiMessageSquare, 
  FiTarget, 
  FiTrendingUp,
  FiZap,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiBarChart2,
  FiCpu,
  FiSettings,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiShare2,
  FiGitBranch,
  FiGlobe,
  FiShield,
  FiEye,
  FiArrowRight
} from 'react-icons/fi';
import '../styles/CollaborativeAINetwork.css';

interface NetworkNode {
  id: string;
  name: string;
  type: 'hub' | 'specialist' | 'coordinator' | 'validator';
  position: { x: number; y: number };
  status: 'active' | 'processing' | 'idle' | 'error';
  connections: string[];
  capabilities: string[];
  currentTask?: string;
  performance: {
    efficiency: number;
    reliability: number;
    collaboration: number;
  };
  knowledge: {
    domain: string;
    expertise: number;
    sharedInsights: number;
  };
}

interface NetworkConnection {
  id: string;
  from: string;
  to: string;
  strength: number;
  type: 'data' | 'control' | 'feedback' | 'collaboration';
  status: 'active' | 'busy' | 'idle';
  dataFlow: number;
}

interface CollaborativeTask {
  id: string;
  title: string;
  description: string;
  participants: string[];
  status: 'planning' | 'executing' | 'reviewing' | 'completed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  insights: string[];
  collectiveIntelligence: number;
}

interface CollaborativeAINetworkProps {
  onNetworkUpdate?: (network: NetworkNode[]) => void;
  onTaskComplete?: (task: CollaborativeTask) => void;
}

const CollaborativeAINetwork: React.FC<CollaborativeAINetworkProps> = ({ 
  onNetworkUpdate, 
  onTaskComplete 
}) => {
  const [nodes, setNodes] = useState<NetworkNode[]>([
    {
      id: 'central-hub',
      name: 'Central Intelligence Hub',
      type: 'hub',
      position: { x: 50, y: 50 },
      status: 'active',
      connections: ['bias-specialist', 'fact-checker', 'sentiment-analyzer', 'coordinator-1'],
      capabilities: ['Task Distribution', 'Result Synthesis', 'Network Coordination'],
      performance: { efficiency: 0.95, reliability: 0.92, collaboration: 0.88 },
      knowledge: { domain: 'General AI', expertise: 0.90, sharedInsights: 15 }
    },
    {
      id: 'bias-specialist',
      name: 'Bias Detection Specialist',
      type: 'specialist',
      position: { x: 20, y: 30 },
      status: 'active',
      connections: ['central-hub', 'coordinator-1'],
      capabilities: ['Political Bias', 'Framing Analysis', 'Source Bias'],
      currentTask: 'Analyzing political content bias',
      performance: { efficiency: 0.89, reliability: 0.87, collaboration: 0.85 },
      knowledge: { domain: 'Media Bias', expertise: 0.94, sharedInsights: 8 }
    },
    {
      id: 'fact-checker',
      name: 'Fact-Checking Specialist',
      type: 'specialist',
      position: { x: 80, y: 30 },
      status: 'processing',
      connections: ['central-hub', 'coordinator-1'],
      capabilities: ['Claim Verification', 'Source Validation', 'Evidence Analysis'],
      currentTask: 'Verifying scientific claims',
      performance: { efficiency: 0.92, reliability: 0.94, collaboration: 0.89 },
      knowledge: { domain: 'Fact-Checking', expertise: 0.91, sharedInsights: 12 }
    },
    {
      id: 'sentiment-analyzer',
      name: 'Sentiment Analysis Specialist',
      type: 'specialist',
      position: { x: 20, y: 70 },
      status: 'active',
      connections: ['central-hub', 'coordinator-1'],
      capabilities: ['Emotional Analysis', 'Tone Detection', 'Polarity Analysis'],
      performance: { efficiency: 0.94, reliability: 0.89, collaboration: 0.87 },
      knowledge: { domain: 'Sentiment Analysis', expertise: 0.93, sharedInsights: 6 }
    },
    {
      id: 'coordinator-1',
      name: 'Task Coordinator',
      type: 'coordinator',
      position: { x: 50, y: 80 },
      status: 'active',
      connections: ['central-hub', 'bias-specialist', 'fact-checker', 'sentiment-analyzer', 'validator-1'],
      capabilities: ['Task Management', 'Resource Allocation', 'Progress Tracking'],
      performance: { efficiency: 0.88, reliability: 0.90, collaboration: 0.92 },
      knowledge: { domain: 'Coordination', expertise: 0.87, sharedInsights: 10 }
    },
    {
      id: 'validator-1',
      name: 'Quality Validator',
      type: 'validator',
      position: { x: 80, y: 70 },
      status: 'idle',
      connections: ['coordinator-1'],
      capabilities: ['Quality Assurance', 'Cross-Validation', 'Error Detection'],
      performance: { efficiency: 0.91, reliability: 0.93, collaboration: 0.86 },
      knowledge: { domain: 'Validation', expertise: 0.89, sharedInsights: 4 }
    }
  ]);

  const [connections, setConnections] = useState<NetworkConnection[]>([
    {
      id: 'hub-bias',
      from: 'central-hub',
      to: 'bias-specialist',
      strength: 0.9,
      type: 'data',
      status: 'active',
      dataFlow: 85
    },
    {
      id: 'hub-fact',
      from: 'central-hub',
      to: 'fact-checker',
      strength: 0.8,
      type: 'data',
      status: 'busy',
      dataFlow: 92
    },
    {
      id: 'hub-sentiment',
      from: 'central-hub',
      to: 'sentiment-analyzer',
      strength: 0.85,
      type: 'data',
      status: 'active',
      dataFlow: 78
    },
    {
      id: 'coord-bias',
      from: 'coordinator-1',
      to: 'bias-specialist',
      strength: 0.75,
      type: 'control',
      status: 'active',
      dataFlow: 65
    },
    {
      id: 'coord-fact',
      from: 'coordinator-1',
      to: 'fact-checker',
      strength: 0.8,
      type: 'control',
      status: 'busy',
      dataFlow: 88
    },
    {
      id: 'coord-sentiment',
      from: 'coordinator-1',
      to: 'sentiment-analyzer',
      strength: 0.7,
      type: 'control',
      status: 'active',
      dataFlow: 72
    },
    {
      id: 'coord-validator',
      from: 'coordinator-1',
      to: 'validator-1',
      strength: 0.6,
      type: 'feedback',
      status: 'idle',
      dataFlow: 0
    }
  ]);

  const [tasks, setTasks] = useState<CollaborativeTask[]>([]);
  const [isNetworkActive, setIsNetworkActive] = useState(false);
  const [networkMetrics, setNetworkMetrics] = useState({
    totalNodes: 0,
    activeConnections: 0,
    averageEfficiency: 0,
    collectiveIntelligence: 0,
    totalInsights: 0
  });

  useEffect(() => {
    updateNetworkMetrics();
    if (isNetworkActive) {
      startCollaborativeTasks();
    }
  }, [nodes, connections, isNetworkActive]);

  const updateNetworkMetrics = () => {
    const totalNodes = nodes.length;
    const activeConnections = connections.filter(c => c.status === 'active' || c.status === 'busy').length;
    const averageEfficiency = nodes.reduce((sum, node) => sum + node.performance.efficiency, 0) / totalNodes;
    const totalInsights = nodes.reduce((sum, node) => sum + node.knowledge.sharedInsights, 0);
    const collectiveIntelligence = (averageEfficiency + (activeConnections / connections.length)) / 2;

    setNetworkMetrics({
      totalNodes,
      activeConnections,
      averageEfficiency,
      collectiveIntelligence,
      totalInsights
    });
  };

  const startCollaborativeTasks = useCallback(async () => {
    const collaborativeTask: CollaborativeTask = {
      id: `task-${Date.now()}`,
      title: 'Comprehensive Media Analysis',
      description: 'Multi-agent collaboration to analyze complex media content',
      participants: ['bias-specialist', 'fact-checker', 'sentiment-analyzer', 'validator-1'],
      status: 'planning',
      progress: 0,
      startTime: new Date(),
      insights: [],
      collectiveIntelligence: 0
    };

    setTasks(prev => [collaborativeTask, ...prev]);

    // Simulate collaborative task execution
    await executeCollaborativeTask(collaborativeTask);
  }, []);

  const executeCollaborativeTask = async (task: CollaborativeTask) => {
    const phases = [
      { name: 'Planning', duration: 2000, progress: 25 },
      { name: 'Data Collection', duration: 3000, progress: 50 },
      { name: 'Analysis', duration: 4000, progress: 75 },
      { name: 'Synthesis', duration: 2000, progress: 100 }
    ];

    for (const phase of phases) {
      // Update task status
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, status: 'executing', progress: phase.progress }
          : t
      ));

      // Simulate node collaboration
      await simulateNodeCollaboration(task, phase.name);

      // Wait for phase completion
      await new Promise(resolve => setTimeout(resolve, phase.duration));
    }

    // Complete task
    const completedTask = {
      ...task,
      status: 'completed' as const,
      endTime: new Date(),
      collectiveIntelligence: Math.random() * 0.3 + 0.7
    };

    setTasks(prev => prev.map(t => t.id === task.id ? completedTask : t));

    if (onTaskComplete) {
      onTaskComplete(completedTask);
    }
  };

  const simulateNodeCollaboration = async (task: CollaborativeTask, phase: string) => {
    const insights = [
      'Detected new bias pattern in political content',
      'Identified factual inconsistencies in claims',
      'Recognized emotional manipulation techniques',
      'Cross-validated analysis results across specialists',
      'Generated comprehensive media literacy insights'
    ];

    // Add random insights
    const newInsights = insights.slice(0, Math.floor(Math.random() * 3) + 1);
    
    setTasks(prev => prev.map(t => 
      t.id === task.id 
        ? { ...t, insights: [...t.insights, ...newInsights] }
        : t
    ));

    // Update node statuses
    setNodes(prev => prev.map(node => {
      if (task.participants.includes(node.id)) {
        return {
          ...node,
          status: Math.random() > 0.3 ? 'processing' : 'active',
          knowledge: {
            ...node.knowledge,
            sharedInsights: node.knowledge.sharedInsights + Math.floor(Math.random() * 2) + 1
          }
        };
      }
      return node;
    }));
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'processing': return '#ffc107';
      case 'idle': return '#6c757d';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'hub': return <FiGlobe />;
      case 'specialist': return <FiTarget />;
      case 'coordinator': return <FiUsers />;
      case 'validator': return <FiShield />;
      default: return <FiCpu />;
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'data': return '#007bff';
      case 'control': return '#28a745';
      case 'feedback': return '#ffc107';
      case 'collaboration': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  return (
    <div className="collaborative-ai-network">
      <div className="network-header">
        <div className="header-content">
          <FiGlobe className="header-icon" />
          <div>
            <h2>Collaborative AI Network</h2>
            <p>Multi-agent system with collective intelligence and inter-agent communication</p>
          </div>
        </div>
        
        <div className="network-controls">
          <button 
            onClick={() => setIsNetworkActive(!isNetworkActive)}
            className={`network-button ${isNetworkActive ? 'active' : ''}`}
          >
            {isNetworkActive ? (
              <>
                <FiPause />
                Pause Network
              </>
            ) : (
              <>
                <FiPlay />
                Activate Network
              </>
            )}
          </button>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="network-visualization">
        <div className="network-canvas">
          {/* Render connections */}
          <svg className="connections-layer" width="100%" height="400">
            {connections.map((connection) => {
              const fromNode = nodes.find(n => n.id === connection.from);
              const toNode = nodes.find(n => n.id === connection.to);
              
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.position.x;
              const y1 = fromNode.position.y;
              const x2 = toNode.position.x;
              const y2 = toNode.position.y;

              return (
                <g key={connection.id}>
                  <line
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke={getConnectionTypeColor(connection.type)}
                    strokeWidth={connection.strength * 3}
                    opacity={connection.status === 'idle' ? 0.3 : 0.8}
                    className="connection-line"
                  />
                  <circle
                    cx={`${(x1 + x2) / 2}%`}
                    cy={`${(y1 + y2) / 2}%`}
                    r="3"
                    fill={getConnectionTypeColor(connection.type)}
                    opacity={connection.dataFlow / 100}
                  />
                </g>
              );
            })}
          </svg>

          {/* Render nodes */}
          <div className="nodes-layer">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`network-node ${node.type} ${node.status}`}
                style={{
                  left: `${node.position.x}%`,
                  top: `${node.position.y}%`
                }}
              >
                <div className="node-icon">
                  {getNodeTypeIcon(node.type)}
                </div>
                <div className="node-content">
                  <h4>{node.name}</h4>
                  <div className="node-status">
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: getNodeStatusColor(node.status) }}
                    ></span>
                    <span className="status-text">{node.status}</span>
                  </div>
                  {node.currentTask && (
                    <p className="node-task">{node.currentTask}</p>
                  )}
                  <div className="node-metrics">
                    <div className="metric">
                      <span>Efficiency:</span>
                      <span>{Math.round(node.performance.efficiency * 100)}%</span>
                    </div>
                    <div className="metric">
                      <span>Insights:</span>
                      <span>{node.knowledge.sharedInsights}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Network Metrics */}
      <div className="network-metrics">
        <h3><FiBarChart2 /> Network Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Total Nodes</h4>
            <span className="metric-value">{networkMetrics.totalNodes}</span>
          </div>
          <div className="metric-card">
            <h4>Active Connections</h4>
            <span className="metric-value">{networkMetrics.activeConnections}</span>
          </div>
          <div className="metric-card">
            <h4>Average Efficiency</h4>
            <span className="metric-value">{Math.round(networkMetrics.averageEfficiency * 100)}%</span>
          </div>
          <div className="metric-card">
            <h4>Collective Intelligence</h4>
            <span className="metric-value">{Math.round(networkMetrics.collectiveIntelligence * 100)}%</span>
          </div>
          <div className="metric-card">
            <h4>Total Insights</h4>
            <span className="metric-value">{networkMetrics.totalInsights}</span>
          </div>
        </div>
      </div>

      {/* Collaborative Tasks */}
      <div className="collaborative-tasks">
        <h3><FiUsers /> Collaborative Tasks</h3>
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className={`task-item ${task.status}`}>
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`task-status ${task.status}`}>{task.status}</span>
              </div>
              
              <p className="task-description">{task.description}</p>
              
              <div className="task-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{task.progress}%</span>
              </div>
              
              <div className="task-participants">
                <strong>Participants:</strong>
                <div className="participants-list">
                  {task.participants.map(participantId => {
                    const participant = nodes.find(n => n.id === participantId);
                    return (
                      <span key={participantId} className="participant">
                        {participant?.name || participantId}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              {task.insights.length > 0 && (
                <div className="task-insights">
                  <strong>Collaborative Insights:</strong>
                  <ul>
                    {task.insights.slice(-3).map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {task.status === 'completed' && (
                <div className="task-intelligence">
                  <strong>Collective Intelligence Score:</strong>
                  <span className="intelligence-score">
                    {Math.round(task.collectiveIntelligence * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connection Details */}
      <div className="connection-details">
        <h3><FiGitBranch /> Connection Details</h3>
        <div className="connections-grid">
          {connections.map((connection) => (
            <div key={connection.id} className={`connection-card ${connection.status}`}>
              <div className="connection-header">
                <span className="connection-type">{connection.type}</span>
                <span className={`connection-status ${connection.status}`}>
                  {connection.status}
                </span>
              </div>
              
              <div className="connection-info">
                <div className="connection-nodes">
                  <span>{connection.from}</span>
                  <FiArrowRight />
                  <span>{connection.to}</span>
                </div>
                
                <div className="connection-metrics">
                  <div className="metric">
                    <span>Strength:</span>
                    <span>{Math.round(connection.strength * 100)}%</span>
                  </div>
                  <div className="metric">
                    <span>Data Flow:</span>
                    <span>{connection.dataFlow}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeAINetwork;
