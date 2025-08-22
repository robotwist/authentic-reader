import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCpu, FiTarget, FiBarChart2 } from 'react-icons/fi';
import AIAgentOrchestrator from '../components/AIAgentOrchestrator';
import '../styles/AIAgentOrchestratorPage.css';

const AIAgentOrchestratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [sampleContent, setSampleContent] = useState<string>(`Artificial intelligence continues to advance at an unprecedented pace, raising important questions about ethics and responsibility. Recent developments in machine learning have demonstrated both the incredible potential and the significant risks associated with AI systems.

Leading researchers emphasize the need for comprehensive ethical frameworks that can guide AI development. "We're at a critical juncture where the decisions we make today will shape the future of AI for decades to come," says Dr. Sarah Chen, a prominent AI ethicist at Stanford University.

The debate centers around several key issues: algorithmic bias, privacy concerns, and the potential for job displacement. While some argue that AI will create more jobs than it eliminates, others point to historical precedents where technological revolutions led to significant economic disruption.

Companies like Google, Microsoft, and OpenAI have established AI ethics boards, but critics argue that self-regulation is insufficient. "We need government oversight to ensure that AI development serves the public interest," argues Professor Michael Rodriguez of the Center for Technology Policy.

The European Union's AI Act represents one of the most comprehensive attempts to regulate AI development. The legislation categorizes AI systems by risk level and imposes different requirements based on potential harm. However, implementation challenges remain significant.

Experts agree that education and public awareness are crucial. "People need to understand both the capabilities and limitations of AI systems," notes Dr. Emily Watson, director of the AI Literacy Initiative. "This knowledge is essential for informed public discourse and policy-making."

The path forward requires collaboration between technologists, policymakers, ethicists, and the public. Only through such cooperation can we ensure that AI development benefits humanity while minimizing potential harms.`);

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results);
    console.log('Multi-agent analysis complete:', results);
  };

  const handleAgentUpdate = (agent: any) => {
    console.log('Agent updated:', agent);
  };

  return (
    <div className="ai-agent-orchestrator-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Home
        </button>
        
        <div className="header-info">
          <h1>AI Agent Orchestrator</h1>
          <p>Multi-agent system for comprehensive media analysis and bias detection</p>
        </div>
      </div>

      {/* Content Input Section */}
      <div className="content-input-section">
        <h3><FiCpu /> Analysis Content</h3>
        <div className="content-controls">
          <textarea
            value={sampleContent}
            onChange={(e) => setSampleContent(e.target.value)}
            placeholder="Enter content for multi-agent analysis..."
            className="content-textarea"
            rows={8}
          />
          <div className="content-actions">
            <button 
              onClick={() => setSampleContent('')}
              className="clear-button"
            >
              Clear Content
            </button>
            <button 
              onClick={() => setSampleContent(`Climate change represents one of the most pressing challenges of our time. The scientific consensus is clear: human activities are driving unprecedented changes in Earth's climate system.

Recent studies have shown that global temperatures are rising at an alarming rate, with the past decade being the warmest on record. The Intergovernmental Panel on Climate Change (IPCC) has warned that we have a limited window to take decisive action to prevent catastrophic climate impacts.

However, there are those who argue that the economic costs of climate action are too high. Some critics point to the potential job losses in fossil fuel industries, while others question the effectiveness of proposed solutions like renewable energy and carbon pricing.

The debate often becomes polarized, with environmentalists calling for immediate, aggressive action and some business leaders advocating for a more gradual approach. This polarization can make it difficult for policymakers to find common ground and implement effective solutions.

What's clear is that the transition to a low-carbon economy will require significant investment and policy coordination. The challenge lies in designing policies that achieve environmental goals while maintaining economic competitiveness and social equity.

The role of technology in addressing climate change cannot be overstated. Innovations in renewable energy, energy storage, and carbon capture technologies offer hope for reducing emissions while maintaining economic growth.

International cooperation is also crucial. Climate change is a global problem that requires global solutions. The Paris Agreement represents an important step forward, but much more needs to be done to meet its ambitious goals.

As we move forward, it's essential that we base our decisions on sound science and consider the long-term implications of our choices. The stakes are too high to let political ideology or short-term economic interests drive our response to this critical challenge.`)}
              className="sample-button"
            >
              Load Sample Content
            </button>
          </div>
        </div>
      </div>

      {/* AI Agent Orchestrator */}
      <AIAgentOrchestrator 
        content={sampleContent}
        onAnalysisComplete={handleAnalysisComplete}
        onAgentUpdate={handleAgentUpdate}
      />

      {/* Results Display */}
      {analysisResults && (
        <div className="results-section">
          <h3><FiBarChart2 /> Analysis Results</h3>
          <div className="results-content">
            <div className="result-card">
              <h4>Overall Assessment</h4>
              <p>{analysisResults.overallAssessment}</p>
            </div>
            
            <div className="result-card">
              <h4>Agent Contributions</h4>
              <div className="agent-contributions">
                {analysisResults.agentContributions.map((contribution: any, index: number) => (
                  <div key={index} className="contribution-item">
                    <strong>{contribution.agent}</strong>: {contribution.task}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="result-card">
              <h4>Recommendations</h4>
              <ul className="recommendations-list">
                {analysisResults.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="result-card">
              <h4>Confidence Score</h4>
              <div className="confidence-display">
                <span className="confidence-value">
                  {Math.round(analysisResults.confidence * 100)}%
                </span>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${analysisResults.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            onClick={() => navigate('/analysis')}
            className="action-card"
          >
            <FiTarget />
            <span>Single Article Analysis</span>
          </button>
          
          <button 
            onClick={() => navigate('/analysis/comparative')}
            className="action-card"
          >
            <FiBarChart2 />
            <span>Comparative Analysis</span>
          </button>
          
          <button 
            onClick={() => navigate('/sentiment-analysis')}
            className="action-card"
          >
            <FiCpu />
            <span>Sentiment Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentOrchestratorPage;
