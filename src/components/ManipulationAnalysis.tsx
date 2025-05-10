// @ts-ignore
import React, { useState } from 'react';
import '../styles/ManipulationAnalysis.css';
import { ManipulationAnalysis as ManipulationAnalysisType } from '../services/doomscrollAnalysisService';

interface ManipulationAnalysisProps {
  manipulationAnalysis: ManipulationAnalysisType;
}

const ManipulationAnalysis: React.FC<ManipulationAnalysisProps> = ({ manipulationAnalysis }) => {
  const { doomscroll, outrageBait, manipulativeTactics, recommendedAction, educationalSummary } = manipulationAnalysis;
  const [showDetailedExplanation, setShowDetailedExplanation] = useState<boolean>(false);
  
  const getDoomscrollScoreClass = (score: number): string => {
    if (score > 0.7) return 'high-risk';
    if (score > 0.4) return 'medium-risk';
    return 'low-risk';
  };
  
  const getOutrageBaitScoreClass = (score: number): string => {
    if (score > 0.7) return 'high-risk';
    if (score > 0.4) return 'medium-risk';
    return 'low-risk';
  };
  
  const getScoreLabel = (score: number): string => {
    if (score > 0.7) return 'High';
    if (score > 0.4) return 'Medium';
    return 'Low';
  };
  
  const toggleDetailedExplanation = () => {
    setShowDetailedExplanation(!showDetailedExplanation);
  };
  
  return (
    <div className="manipulation-analysis">
      <h2>Content Manipulation Analysis</h2>
      
      <div className="analysis-summary">
        <div className="recommendation-banner">
          <strong>Recommendation:</strong> {recommendedAction}
        </div>
      </div>
      
      <div className="manipulation-overview">
        <h3>Overview</h3>
        <p className="manipulation-description">
          Content manipulation tactics are designed to exploit psychological vulnerabilities to increase engagement and drive specific behaviors. 
          This analysis identifies common manipulation techniques that may be present in this content.
        </p>
        
        <button 
          className="explanation-toggle"
          onClick={toggleDetailedExplanation}
        >
          {showDetailedExplanation ? 'Hide Detailed Explanation' : 'Show Detailed Explanation'}
        </button>
        
        {showDetailedExplanation && (
          <div className="educational-explanation">
            <div dangerouslySetInnerHTML={{ __html: educationalSummary }} />
          </div>
        )}
      </div>
      
      <div className="manipulation-metrics">
        <div className={`metric doomscroll-metric ${getDoomscrollScoreClass(doomscroll.doomscrollScore)}`}>
          <h3>Doomscroll Risk</h3>
          <div className="score-circle">
            <span className="score-value">{Math.round(doomscroll.doomscrollScore * 100)}</span>
          </div>
          <div className="score-label-container">
            <span className={`risk-label ${getDoomscrollScoreClass(doomscroll.doomscrollScore)}`}>
              {getScoreLabel(doomscroll.doomscrollScore)}
            </span>
          </div>
          <p className="explanation">{doomscroll.doomscrollExplanation}</p>
          
          <div className="infobox">
            <div className="infobox-header">What is Doomscrolling?</div>
            <div className="infobox-content">
              Doomscrolling is the tendency to continue consuming negative news or content despite the psychological distress it causes. Content that promotes doomscrolling typically uses fear-inducing language, catastrophic framing, and urgent tone to keep readers engaged.
            </div>
          </div>
        </div>
        
        <div className={`metric outrage-metric ${getOutrageBaitScoreClass(outrageBait.outrageBaitScore)}`}>
          <h3>Outrage Bait Risk</h3>
          <div className="score-circle">
            <span className="score-value">{Math.round(outrageBait.outrageBaitScore * 100)}</span>
          </div>
          <div className="score-label-container">
            <span className={`risk-label ${getOutrageBaitScoreClass(outrageBait.outrageBaitScore)}`}>
              {getScoreLabel(outrageBait.outrageBaitScore)}
            </span>
          </div>
          <p className="explanation">{outrageBait.outrageBaitExplanation}</p>
          
          <div className="infobox">
            <div className="infobox-header">What is Outrage Bait?</div>
            <div className="infobox-content">
              Outrage bait is content crafted specifically to provoke anger and indignation. It typically uses inflammatory language, tribal triggers, and divisive framing to activate strong emotional responses that drive engagement, sharing, and commenting behavior.
            </div>
          </div>
        </div>
      </div>
      
      {manipulativeTactics.length > 0 && (
        <div className="manipulation-tactics">
          <h3>Potential Manipulation Tactics</h3>
          <ul className="tactics-list">
            {manipulativeTactics.map((tactic, index) => (
              <li key={index} className="tactic-item">{tactic}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="topic-indicators">
        <div className="topics-column">
          <h3>Doomscroll Topics</h3>
          {doomscroll.doomscrollTopics.length > 0 ? (
            <ul className="topics-list">
              {doomscroll.doomscrollTopics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          ) : (
            <p>No significant doomscroll topics detected.</p>
          )}
        </div>
        
        <div className="topics-column">
          <h3>Outrage Triggers</h3>
          {outrageBait.outrageBaitTriggers.length > 0 ? (
            <ul className="topics-list">
              {outrageBait.outrageBaitTriggers.map((trigger, index) => (
                <li key={index}>{trigger}</li>
              ))}
            </ul>
          ) : (
            <p>No significant outrage triggers detected.</p>
          )}
        </div>
      </div>
      
      <div className="psychological-impact">
        <h3>Psychological Impact</h3>
        <div className="impact-grid">
          <div className="impact-item">
            <h4>Emotional Effect</h4>
            <p>Manipulative content can trigger anxiety, anger, fear, and helplessness, leading to heightened stress levels.</p>
          </div>
          <div className="impact-item">
            <h4>Cognitive Effect</h4>
            <p>Can impair critical thinking, activate confirmation bias, and override rational assessment of information.</p>
          </div>
          <div className="impact-item">
            <h4>Behavioral Effect</h4>
            <p>May promote impulsive sharing, increased platform engagement, and polarized discussions.</p>
          </div>
          <div className="impact-item">
            <h4>Long-term Effect</h4>
            <p>Regular consumption may lead to persistent anxiety, cynicism, distrust, and decreased well-being.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManipulationAnalysis; 