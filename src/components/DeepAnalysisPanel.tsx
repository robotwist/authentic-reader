/**
 * DeepAnalysisPanel - Industry-Leading Analysis Display
 * 
 * Displays comprehensive AI analysis with:
 * - Logic Score with 5-dimension breakdown
 * - Claim verification status
 * - Emotional manipulation scoring
 * - Stakeholder analysis
 * - Reader guidance
 */

import React, { useState } from 'react';
import './DeepAnalysisPanel.css';

interface LogicScore {
  overall: number;
  breakdown: {
    factual_accuracy: number;
    logical_coherence: number;
    source_quality: number;
    emotional_neutrality: number;
    completeness: number;
  };
  grade: string;
  explanation: string;
}

interface ManipulationTechnique {
  type: string;
  category: string;
  quote: string;
  explanation: string;
  neutral_rewrite: string;
  severity: 'low' | 'medium' | 'high';
}

interface ClaimVerification {
  claim: string;
  verification_status: 'verified' | 'unverified' | 'disputed' | 'false' | 'needs_context';
  confidence: number;
  notes: string;
}

interface EmotionalManipulation {
  score: number;
  techniques_used: Array<{
    technique: string;
    quote: string;
    impact: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  emotional_words: string[];
  intended_emotional_response: string;
}

interface StakeholderAnalysis {
  who_benefits: string[];
  who_is_harmed: string[];
  author_perspective: string;
  potential_conflicts: string;
}

interface ReaderGuidance {
  critical_questions: string[];
  what_to_verify: string[];
  recommended_sources: string;
  media_literacy_lesson: string;
}

interface OverallAssessment {
  reliability: 'high' | 'medium' | 'low';
  recommended_action: 'trust' | 'verify' | 'skeptical' | 'disregard';
  summary: string;
}

interface ExecutiveSummary {
  one_sentence: string;
  key_claims: string[];
  what_happened: string;
  why_it_matters: string;
}

interface DeepAnalysis {
  executive_summary?: ExecutiveSummary;
  logic_score?: LogicScore;
  emotional_manipulation?: EmotionalManipulation;
  rhetorical_analysis?: {
    manipulation_techniques: ManipulationTechnique[];
    headline_accuracy?: {
      matches_content: boolean;
      clickbait_score: number;
      issues: string;
    };
    source_transparency?: {
      named_sources: number;
      anonymous_sources: number;
      documents_cited: number;
      concerns: string;
    };
  };
  claim_verification?: ClaimVerification[];
  stakeholder_analysis?: StakeholderAnalysis;
  reader_guidance?: ReaderGuidance;
  overall_assessment?: OverallAssessment;
  bias?: {
    overall: string;
    confidence: number;
    evidence: string[];
    framing: string;
    missing_perspectives: string[];
  };
}

interface Props {
  analysis: DeepAnalysis;
  isLoading?: boolean;
}

const DeepAnalysisPanel: React.FC<Props> = ({ analysis, isLoading }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['logic-score', 'executive-summary'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="deep-analysis-panel loading">
        <div className="analysis-loading-spinner" />
        <p>Running industry-leading analysis...</p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'grade-a';
      case 'B': return 'grade-b';
      case 'C': return 'grade-c';
      case 'D': return 'grade-d';
      case 'F': return 'grade-f';
      default: return '';
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✅';
      case 'disputed': return '⚠️';
      case 'false': return '❌';
      case 'needs_context': return '📝';
      default: return '❓';
    }
  };

  const getSeverityClass = (severity: string) => {
    return `severity-${severity}`;
  };

  const getReliabilityClass = (reliability: string) => {
    return `reliability-${reliability}`;
  };

  const getActionClass = (action: string) => {
    return `action-${action}`;
  };

  return (
    <div className="deep-analysis-panel">
      {/* LOGIC SCORE - Hero Section */}
      {analysis.logic_score && (
        <section className="analysis-section logic-score-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('logic-score')}
          >
            <h2>
              <span className="section-icon">🎯</span>
              Logic Score
              <span className={`grade-badge ${getGradeColor(analysis.logic_score.grade)}`}>
                {analysis.logic_score.grade}
              </span>
            </h2>
            <span className="expand-icon">{expandedSections.has('logic-score') ? '−' : '+'}</span>
          </header>
          
          {expandedSections.has('logic-score') && (
            <div className="section-content">
              <div className="score-hero">
                <div className="score-circle">
                  <span className="score-number">{analysis.logic_score.overall}</span>
                  <span className="score-label">/ 100</span>
                </div>
                <p className="score-explanation">{analysis.logic_score.explanation}</p>
              </div>
              
              <div className="score-breakdown">
                {Object.entries(analysis.logic_score.breakdown).map(([key, value]) => (
                  <div key={key} className="breakdown-item">
                    <span className="breakdown-label">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <div className="breakdown-bar-container">
                      <div 
                        className="breakdown-bar" 
                        style={{ width: `${value}%` }}
                        data-value={value}
                      />
                    </div>
                    <span className="breakdown-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* EXECUTIVE SUMMARY */}
      {analysis.executive_summary && (
        <section className="analysis-section executive-summary-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('executive-summary')}
          >
            <h2>
              <span className="section-icon">📋</span>
              Executive Summary
            </h2>
            <span className="expand-icon">{expandedSections.has('executive-summary') ? '−' : '+'}</span>
          </header>
          
          {expandedSections.has('executive-summary') && (
            <div className="section-content">
              <p className="one-sentence">{analysis.executive_summary.one_sentence}</p>
              
              {analysis.executive_summary.key_claims && (
                <div className="key-claims">
                  <h4>Key Claims</h4>
                  <ul>
                    {analysis.executive_summary.key_claims.map((claim, i) => (
                      <li key={i}>{claim}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.executive_summary.why_it_matters && (
                <div className="why-matters">
                  <h4>Why It Matters</h4>
                  <p>{analysis.executive_summary.why_it_matters}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* CLAIM VERIFICATION */}
      {analysis.claim_verification && analysis.claim_verification.length > 0 && (
        <section className="analysis-section claim-verification-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('claims')}
          >
            <h2>
              <span className="section-icon">🔍</span>
              Claim Verification
              <span className="count-badge">{analysis.claim_verification.length}</span>
            </h2>
            <span className="expand-icon">{expandedSections.has('claims') ? '−' : '+'}</span>
          </header>
          
          {expandedSections.has('claims') && (
            <div className="section-content">
              <div className="claims-list">
                {analysis.claim_verification.map((claim, i) => (
                  <div key={i} className={`claim-item status-${claim.verification_status}`}>
                    <div className="claim-header">
                      <span className="verification-icon">{getVerificationIcon(claim.verification_status)}</span>
                      <span className="verification-status">{claim.verification_status.replace('_', ' ').toUpperCase()}</span>
                      <span className="claim-confidence">{claim.confidence}% confidence</span>
                    </div>
                    <p className="claim-text">"{claim.claim}"</p>
                    {claim.notes && <p className="claim-notes">{claim.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* EMOTIONAL MANIPULATION */}
      {analysis.emotional_manipulation && (
        <section className="analysis-section emotional-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('emotional')}
          >
            <h2>
              <span className="section-icon">🎭</span>
              Emotional Manipulation
              <span className={`score-badge ${analysis.emotional_manipulation.score > 60 ? 'high' : analysis.emotional_manipulation.score > 30 ? 'medium' : 'low'}`}>
                {analysis.emotional_manipulation.score}/100
              </span>
            </h2>
            <span className="expand-icon">{expandedSections.has('emotional') ? '−' : '+'}</span>
          </header>
          
          {expandedSections.has('emotional') && (
            <div className="section-content">
              <div className="emotional-meter">
                <div 
                  className="emotional-fill" 
                  style={{ width: `${analysis.emotional_manipulation.score}%` }}
                />
                <span className="emotional-value">{analysis.emotional_manipulation.score}%</span>
              </div>
              
              <p className="emotional-intent">
                <strong>Intended Response:</strong> {analysis.emotional_manipulation.intended_emotional_response}
              </p>
              
              {analysis.emotional_manipulation.emotional_words && (
                <div className="emotional-words">
                  <h4>Loaded Words Detected</h4>
                  <div className="word-tags">
                    {analysis.emotional_manipulation.emotional_words.map((word, i) => (
                      <span key={i} className="word-tag">{word}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {analysis.emotional_manipulation.techniques_used?.length > 0 && (
                <div className="techniques-used">
                  <h4>Techniques Identified</h4>
                  {analysis.emotional_manipulation.techniques_used.map((tech, i) => (
                    <div key={i} className={`technique-item ${getSeverityClass(tech.severity)}`}>
                      <div className="technique-header">
                        <span className="technique-name">{tech.technique}</span>
                        <span className="technique-severity">{tech.severity}</span>
                      </div>
                      <blockquote className="technique-quote">"{tech.quote}"</blockquote>
                      <p className="technique-impact">{tech.impact}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* MANIPULATION TECHNIQUES */}
      {analysis.rhetorical_analysis?.manipulation_techniques?.length > 0 && (
        <section className="analysis-section manipulation-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('manipulation')}
          >
            <h2>
              <span className="section-icon">⚠️</span>
              Rhetorical Manipulation
              <span className="count-badge">{analysis.rhetorical_analysis.manipulation_techniques.length}</span>
            </h2>
            <span className="expand-icon">{expandedSections.has('manipulation') ? '−' : '+'}</span>
          </header>
          
          {expandedSections.has('manipulation') && (
            <div className="section-content">
              {analysis.rhetorical_analysis.manipulation_techniques.map((tech, i) => (
                <div key={i} className={`manipulation-item ${getSeverityClass(tech.severity)}`}>
                  <div className="manipulation-header">
                    <span className="manipulation-type">{tech.type}</span>
                    <span className="manipulation-category">{tech.category}</span>
                    <span className={`severity-badge ${tech.severity}`}>{tech.severity}</span>
                  </div>
                  
                  <div className="manipulation-content">
                    <div className="quote-block">
                      <span className="quote-label">Original:</span>
                      <blockquote>"{tech.quote}"</blockquote>
                    </div>
                    
                    <p className="manipulation-explanation">{tech.explanation}</p>
                    
                    <div className="rewrite-block">
                      <span className="rewrite-label">✓ Neutral Alternative:</span>
                      <p className="neutral-rewrite">{tech.neutral_rewrite}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* STAKEHOLDER ANALYSIS */}
      {analysis.stakeholder_analysis && (
        <section className="analysis-section stakeholder-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('stakeholders')}
          >
            <h2>
              <span className="section-icon">👥</span>
              Stakeholder Analysis
            </h2>
            <span className="expand-icon">{expandedSections.has('stakeholders') ? '−' : '+'}</span>
          </header>
          
          {expandedSections.has('stakeholders') && (
            <div className="section-content">
              <div className="stakeholder-grid">
                <div className="stakeholder-column benefits">
                  <h4>Who Benefits</h4>
                  <ul>
                    {analysis.stakeholder_analysis.who_benefits.map((entity, i) => (
                      <li key={i}>{entity}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="stakeholder-column harmed">
                  <h4>Who Is Harmed</h4>
                  <ul>
                    {analysis.stakeholder_analysis.who_is_harmed.map((entity, i) => (
                      <li key={i}>{entity}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {analysis.stakeholder_analysis.author_perspective && (
                <div className="author-perspective">
                  <h4>Author's Perspective</h4>
                  <p>{analysis.stakeholder_analysis.author_perspective}</p>
                </div>
              )}
              
              {analysis.stakeholder_analysis.potential_conflicts && (
                <div className="conflicts">
                  <h4>Potential Conflicts</h4>
                  <p>{analysis.stakeholder_analysis.potential_conflicts}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* READER GUIDANCE */}
      {analysis.reader_guidance && (
        <section className="analysis-section guidance-section">
          <header 
            className="section-header clickable"
            onClick={() => toggleSection('guidance')}
          >
            <h2>
              <span className="section-icon">📚</span>
              Reader Guidance
            </h2>
            <span className="expand-icon">{expandedSections.has('guidance') ? '−' : '+'}</span>
          </header>
          
          {expandedSections.has('guidance') && (
            <div className="section-content">
              {analysis.reader_guidance.critical_questions?.length > 0 && (
                <div className="critical-questions">
                  <h4>Questions to Ask</h4>
                  <ul>
                    {analysis.reader_guidance.critical_questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.reader_guidance.what_to_verify?.length > 0 && (
                <div className="verify-list">
                  <h4>What to Verify</h4>
                  <ul>
                    {analysis.reader_guidance.what_to_verify.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.reader_guidance.media_literacy_lesson && (
                <div className="literacy-lesson">
                  <h4>🎓 Media Literacy Lesson</h4>
                  <p>{analysis.reader_guidance.media_literacy_lesson}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* OVERALL ASSESSMENT */}
      {analysis.overall_assessment && (
        <section className="analysis-section assessment-section">
          <header className="section-header">
            <h2>
              <span className="section-icon">📊</span>
              Overall Assessment
            </h2>
          </header>
          
          <div className="section-content">
            <div className="assessment-badges">
              <div className={`assessment-badge ${getReliabilityClass(analysis.overall_assessment.reliability)}`}>
                <span className="badge-label">Reliability</span>
                <span className="badge-value">{analysis.overall_assessment.reliability.toUpperCase()}</span>
              </div>
              
              <div className={`assessment-badge ${getActionClass(analysis.overall_assessment.recommended_action)}`}>
                <span className="badge-label">Recommended Action</span>
                <span className="badge-value">{analysis.overall_assessment.recommended_action.toUpperCase()}</span>
              </div>
            </div>
            
            <p className="assessment-summary">{analysis.overall_assessment.summary}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default DeepAnalysisPanel;
