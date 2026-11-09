/**
 * DeepAnalysisPanel - Brutalist Design
 * 
 * Industry-leading analysis with Swiss brutalist aesthetic:
 * - No emojis or icons
 * - Black, white, and grey shading only
 * - Monospace fonts for data
 * - Visible borders and grids
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
  speaker?: string;
  explanation: string;
  neutral_rewrite: string;
  severity: 'low' | 'medium' | 'high';
}

interface ClaimVerification {
  claim: string;
  quote?: string;
  why_it_matters?: string;
  verification_status: 'verified' | 'unverified' | 'disputed' | 'false' | 'needs_context';
  confidence?: number;
  notes: string;
  checked?: boolean;
  sources?: Array<{ title: string; url: string }>;
}

interface ContextExplainer {
  background?: string;
  key_facts?: string[];
  key_terms?: Array<{ term: string; definition: string }>;
}

interface MissingContext {
  critical_omissions?: string[];
  alternative_interpretations?: string;
  questions_unanswered?: string[];
}

interface BiasAnalysis {
  political_lean: string;
  confidence: number;
  evidence?: string[];
  framing?: string;
  what_perspectives_missing?: string[];
}

interface EmotionalManipulation {
  score: number;
  techniques_used: Array<{
    technique: string;
    quote: string;
    speaker?: string;
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
  context_explainer?: ContextExplainer;
  missing_context?: MissingContext;
  bias_analysis?: BiasAnalysis;
  metadata?: { model?: string; analyzed_at?: string };
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
  showOnlySummary?: boolean; // If true, only show Executive Summary (for Quick Scan)
}

const DeepAnalysisPanel: React.FC<Props> = ({ analysis, isLoading, showOnlySummary = false }) => {
  // Expand Executive Summary by default - most important section for quick scan
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['executive-summary', 'context', 'claims'])
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
        <p className="analysis-loading-text">[ANALYZING...]</p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getVerificationLabel = (claim: ClaimVerification) => {
    switch (claim.verification_status) {
      case 'verified': return '[SUPPORTED BY SOURCES]';
      case 'disputed': return '[DISPUTED]';
      case 'false': return '[CONTRADICTED BY SOURCES]';
      case 'needs_context': return '[NEEDS CONTEXT]';
      default: return claim.checked ? '[NO SOURCE FOUND]' : '[NOT YET CHECKED]';
    }
  };

  const speakerLabel = (speaker?: string) => {
    if (!speaker) return null;
    return speaker.toLowerCase() === 'outlet' ? 'OUTLET\'S OWN WORDS' : `QUOTED: ${speaker.toUpperCase()}`;
  };

  // If showOnlySummary is true, only render Executive Summary
  if (showOnlySummary) {
    return (
      <div className="deep-analysis-panel quick-scan-summary">
        {analysis.executive_summary && (
          <section className="analysis-section">
            <header className="section-header">
              <h3 className="section-title">[QUICK SCAN]</h3>
            </header>
            <div className="section-content">
              <p className="summary-main">{analysis.executive_summary.one_sentence}</p>
              
              {analysis.executive_summary.key_claims && (
                <div className="summary-block">
                  <h4 className="block-title">[KEY CLAIMS]</h4>
                  <ul className="claims-list">
                    {analysis.executive_summary.key_claims.map((claim, i) => (
                      <li key={i}>{claim}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.executive_summary.why_it_matters && (
                <div className="summary-block">
                  <h4 className="block-title">[SIGNIFICANCE]</h4>
                  <p>{analysis.executive_summary.why_it_matters}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="deep-analysis-panel">
      <header className="panel-header">
        <h2 className="panel-title">[THE CLOSE READ]</h2>
      </header>

      {/* CONTEXT YOU NEED */}
      {analysis.context_explainer && (
        <section className="analysis-section">
          <header
            className="section-header"
            onClick={() => toggleSection('context')}
          >
            <h3 className="section-title">[CONTEXT YOU NEED]</h3>
            <span className="section-toggle">
              {expandedSections.has('context') ? '[-]' : '[+]'}
            </span>
          </header>

          {expandedSections.has('context') && (
            <div className="section-content">
              {analysis.context_explainer.background && (
                <div className="summary-block">
                  <h4 className="block-title">[BACKGROUND]</h4>
                  <p>{analysis.context_explainer.background}</p>
                </div>
              )}

              {analysis.context_explainer.key_facts && analysis.context_explainer.key_facts.length > 0 && (
                <div className="summary-block">
                  <h4 className="block-title">[HOW TO READ THIS STORY]</h4>
                  <ul>
                    {analysis.context_explainer.key_facts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.context_explainer.key_terms && analysis.context_explainer.key_terms.length > 0 && (
                <div className="summary-block">
                  <h4 className="block-title">[KEY TERMS]</h4>
                  <dl className="term-list">
                    {analysis.context_explainer.key_terms.map((item, i) => (
                      <div key={i} className="term-row">
                        <dt>{item.term}</dt>
                        <dd>{item.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <p className="context-note">
                Background draws on the article, our archive, and general reference knowledge. General background is not independently verified.
              </p>
            </div>
          )}
        </section>
      )}

      {/* FACT CHECK */}
      {analysis.claim_verification && analysis.claim_verification.length > 0 && (
        <section className="analysis-section">
          <header 
            className="section-header"
            onClick={() => toggleSection('claims')}
          >
            <h3 className="section-title">[FACT CHECK]</h3>
            <span className="section-count">{analysis.claim_verification.length}</span>
            <span className="section-toggle">
              {expandedSections.has('claims') ? '[-]' : '[+]'}
            </span>
          </header>
          
          {expandedSections.has('claims') && (
            <div className="section-content">
              {analysis.claim_verification.map((claim, i) => (
                <div key={i} className={`claim-item status-${claim.verification_status}`}>
                  <div className="claim-header">
                    <span className="claim-status">{getVerificationLabel(claim)}</span>
                    {typeof claim.confidence === 'number' && (
                      <span className="claim-confidence">{claim.confidence}% CONF</span>
                    )}
                  </div>
                  <p className="claim-text">"{claim.quote || claim.claim}"</p>
                  {claim.notes && <p className="claim-notes">{claim.notes}</p>}
                  {claim.sources && claim.sources.length > 0 && (
                    <ul className="claim-sources">
                      {claim.sources.map((source, j) => (
                        <li key={j}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.title || new URL(source.url).hostname}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              <p className="context-note">
                Each claim is quoted exactly and checked against independent sources. Follow the links to judge for yourself.
              </p>
            </div>
          )}
        </section>
      )}

      {/* BIAS & FRAMING */}
      {analysis.bias_analysis && (
        <section className="analysis-section">
          <header
            className="section-header"
            onClick={() => toggleSection('bias')}
          >
            <h3 className="section-title">[BIAS &amp; FRAMING]</h3>
            <span className="section-score">{analysis.bias_analysis.political_lean.toUpperCase()}</span>
            <span className="section-toggle">
              {expandedSections.has('bias') ? '[-]' : '[+]'}
            </span>
          </header>

          {expandedSections.has('bias') && (
            <div className="section-content">
              {analysis.bias_analysis.framing && (
                <div className="stakeholder-block">
                  <h4 className="block-title">[FRAMING]</h4>
                  <p>{analysis.bias_analysis.framing}</p>
                </div>
              )}

              {analysis.bias_analysis.evidence && analysis.bias_analysis.evidence.length > 0 && (
                <div className="guidance-block">
                  <h4 className="block-title">[EVIDENCE OF LEAN] {analysis.bias_analysis.confidence}% CONFIDENCE</h4>
                  <ul>
                    {analysis.bias_analysis.evidence.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.bias_analysis.what_perspectives_missing && analysis.bias_analysis.what_perspectives_missing.length > 0 && (
                <div className="guidance-block">
                  <h4 className="block-title">[PERSPECTIVES NOT HEARD]</h4>
                  <ul>
                    {analysis.bias_analysis.what_perspectives_missing.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* MANIPULATION TECHNIQUES */}
      {analysis.rhetorical_analysis?.manipulation_techniques?.length > 0 && (
        <section className="analysis-section">
          <header 
            className="section-header"
            onClick={() => toggleSection('manipulation')}
          >
            <h3 className="section-title">[RHETORICAL TECHNIQUES]</h3>
            <span className="section-count">{analysis.rhetorical_analysis.manipulation_techniques.length}</span>
            <span className="section-toggle">
              {expandedSections.has('manipulation') ? '[-]' : '[+]'}
            </span>
          </header>
          
          {expandedSections.has('manipulation') && (
            <div className="section-content">
              {analysis.rhetorical_analysis.manipulation_techniques.map((tech, i) => (
                <div key={i} className="manipulation-item">
                  <div className="manipulation-header">
                    <span className="manipulation-type">{tech.type.toUpperCase()}</span>
                    <span className="manipulation-category">[{tech.category.toUpperCase()}]</span>
                    <span className="manipulation-severity">{tech.severity.toUpperCase()}</span>
                  </div>
                  {speakerLabel(tech.speaker) && <span className="speaker-tag">{speakerLabel(tech.speaker)}</span>}
                  
                  <div className="manipulation-content">
                    <div className="quote-block">
                      <span className="quote-label">[ORIGINAL]</span>
                      <blockquote>"{tech.quote}"</blockquote>
                    </div>
                    
                    <p className="manipulation-explanation">{tech.explanation}</p>
                    
                    <div className="rewrite-block">
                      <span className="rewrite-label">[NEUTRAL ALTERNATIVE]</span>
                      <p>{tech.neutral_rewrite}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* EMOTIONAL MANIPULATION */}
      {analysis.emotional_manipulation && (
        <section className="analysis-section">
          <header 
            className="section-header"
            onClick={() => toggleSection('emotional')}
          >
            <h3 className="section-title">[EMOTIONAL APPEALS]</h3>
            <span className="section-score">{analysis.emotional_manipulation.score}/100</span>
            <span className="section-toggle">
              {expandedSections.has('emotional') ? '[-]' : '[+]'}
            </span>
          </header>
          
          {expandedSections.has('emotional') && (
            <div className="section-content">
              <div className="manipulation-meter">
                <div className="meter-track">
                  <div 
                    className="meter-fill" 
                    style={{ width: `${analysis.emotional_manipulation.score}%` }}
                  />
                </div>
                <div className="meter-labels">
                  <span>LOW</span>
                  <span>HIGH</span>
                </div>
              </div>
              
              <div className="emotional-intent">
                <span className="intent-label">[INTENDED RESPONSE]</span>
                <span className="intent-value">{analysis.emotional_manipulation.intended_emotional_response}</span>
              </div>
              
              {analysis.emotional_manipulation.emotional_words && analysis.emotional_manipulation.emotional_words.length > 0 && (
                <div className="emotional-words">
                  <h4 className="block-title">[LOADED WORDS]</h4>
                  <div className="word-list">
                    {analysis.emotional_manipulation.emotional_words.map((word, i) => (
                      <span key={i} className="word-tag">{word}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {analysis.emotional_manipulation.techniques_used?.length > 0 && (
                <div className="techniques-block">
                  <h4 className="block-title">[TECHNIQUES IDENTIFIED]</h4>
                  {analysis.emotional_manipulation.techniques_used.map((tech, i) => (
                    <div key={i} className="technique-item">
                      <div className="technique-header">
                        <span className="technique-name">{tech.technique.toUpperCase()}</span>
                        <span className="technique-severity">[{tech.severity.toUpperCase()}]</span>
                      </div>
                      {speakerLabel(tech.speaker) && <span className="speaker-tag">{speakerLabel(tech.speaker)}</span>}
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

      {!(analysis.rhetorical_analysis?.manipulation_techniques?.length) && !(analysis.emotional_manipulation?.techniques_used?.length) && (
        <p className="clean-note">[NO MISLEADING TECHNIQUES FOUND] The outlet's own wording did not use the rhetorical or emotional techniques we check for.</p>
      )}

      {/* WHAT'S MISSING */}
      {analysis.missing_context && (analysis.missing_context.critical_omissions?.length || analysis.missing_context.questions_unanswered?.length) ? (
        <section className="analysis-section">
          <header
            className="section-header"
            onClick={() => toggleSection('missing')}
          >
            <h3 className="section-title">[WHAT THE ARTICLE LEAVES OUT]</h3>
            <span className="section-count">{analysis.missing_context.critical_omissions?.length || 0}</span>
            <span className="section-toggle">
              {expandedSections.has('missing') ? '[-]' : '[+]'}
            </span>
          </header>

          {expandedSections.has('missing') && (
            <div className="section-content">
              {analysis.missing_context.critical_omissions && analysis.missing_context.critical_omissions.length > 0 && (
                <div className="guidance-block">
                  <h4 className="block-title">[MISSING CONTEXT]</h4>
                  <ul>
                    {analysis.missing_context.critical_omissions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.missing_context.questions_unanswered && analysis.missing_context.questions_unanswered.length > 0 && (
                <div className="guidance-block">
                  <h4 className="block-title">[UNANSWERED QUESTIONS]</h4>
                  <ul>
                    {analysis.missing_context.questions_unanswered.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.missing_context.alternative_interpretations && (
                <div className="stakeholder-block">
                  <h4 className="block-title">[OTHER WAYS TO READ IT]</h4>
                  <p>{analysis.missing_context.alternative_interpretations}</p>
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      {/* FULL FORENSICS */}
      <section className="analysis-section full-forensics">
        <header className="section-header" onClick={() => toggleSection('full')}>
          <h3 className="section-title">[FULL FORENSICS] SCORES, SOURCING, STAKEHOLDERS</h3>
          <span className="section-toggle">{expandedSections.has('full') ? '[-]' : '[+]'}</span>
        </header>
        {expandedSections.has('full') && (
          <div className="full-forensics-body">
        {/* OVERALL ASSESSMENT */}
        {analysis.overall_assessment && (
          <section className="analysis-section assessment">
            <header className="section-header">
              <h3 className="section-title">[OVERALL ASSESSMENT]</h3>
            </header>
            
            <div className="section-content">
              <div className="assessment-badges">
                <div className="assessment-badge">
                  <span className="badge-label">RELIABILITY</span>
                  <span className="badge-value">{analysis.overall_assessment.reliability.toUpperCase()}</span>
                </div>
                
                <div className="assessment-badge">
                  <span className="badge-label">ACTION</span>
                  <span className="badge-value">{analysis.overall_assessment.recommended_action.toUpperCase()}</span>
                </div>
              </div>
              
              <p className="assessment-summary">{analysis.overall_assessment.summary}</p>
            </div>
          </section>
        )}

        {/* LOGIC SCORE */}
        {analysis.logic_score && (
          <section className="analysis-section">
            <header 
              className="section-header"
              onClick={() => toggleSection('logic-score')}
            >
              <h3 className="section-title">[LOGIC SCORE]</h3>
              <span className="section-toggle">
                {expandedSections.has('logic-score') ? '[-]' : '[+]'}
              </span>
            </header>
            
            {expandedSections.has('logic-score') && (
              <div className="section-content">
                <div className="score-hero">
                  <div className="score-display">
                    <span className="score-value">{analysis.logic_score.overall}</span>
                    <span className="score-max">/100</span>
                  </div>
                  <div className="score-grade">
                    <span className="grade-label">GRADE:</span>
                    <span className="grade-value">{analysis.logic_score.grade}</span>
                  </div>
                </div>
                
                <p className="score-explanation">{analysis.logic_score.explanation}</p>
                
                <div className="score-breakdown">
                  <h4 className="breakdown-title">[BREAKDOWN]</h4>
                  {Object.entries(analysis.logic_score.breakdown).map(([key, value]) => (
                    <div key={key} className="breakdown-row">
                      <span className="breakdown-label">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <div className="breakdown-bar-track">
                        <div 
                          className="breakdown-bar-fill" 
                          style={{ width: `${value}%` }}
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

        {/* SOURCING */}
        {analysis.rhetorical_analysis?.source_transparency && (
          <section className="analysis-section">
            <header
              className="section-header"
              onClick={() => toggleSection('sourcing')}
            >
              <h3 className="section-title">[SOURCING]</h3>
              <span className="section-toggle">
                {expandedSections.has('sourcing') ? '[-]' : '[+]'}
              </span>
            </header>

            {expandedSections.has('sourcing') && (
              <div className="section-content">
                <div className="assessment-badges">
                  <div className="assessment-badge">
                    <span className="badge-label">NAMED SOURCES</span>
                    <span className="badge-value">{analysis.rhetorical_analysis.source_transparency.named_sources}</span>
                  </div>
                  <div className="assessment-badge">
                    <span className="badge-label">ANONYMOUS</span>
                    <span className="badge-value">{analysis.rhetorical_analysis.source_transparency.anonymous_sources}</span>
                  </div>
                  <div className="assessment-badge">
                    <span className="badge-label">DOCUMENTS</span>
                    <span className="badge-value">{analysis.rhetorical_analysis.source_transparency.documents_cited}</span>
                  </div>
                </div>

                {analysis.rhetorical_analysis.source_transparency.concerns && (
                  <div className="stakeholder-block">
                    <h4 className="block-title">[SOURCING CONCERNS]</h4>
                    <p>{analysis.rhetorical_analysis.source_transparency.concerns}</p>
                  </div>
                )}

                {analysis.rhetorical_analysis.headline_accuracy && (
                  <div className="stakeholder-block">
                    <h4 className="block-title">
                      [HEADLINE] {analysis.rhetorical_analysis.headline_accuracy.matches_content ? 'MATCHES THE STORY' : 'DOES NOT MATCH THE STORY'}
                    </h4>
                    {analysis.rhetorical_analysis.headline_accuracy.issues && (
                      <p>{analysis.rhetorical_analysis.headline_accuracy.issues}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* STAKEHOLDER ANALYSIS */}
        {analysis.stakeholder_analysis && (
          <section className="analysis-section">
            <header 
              className="section-header"
              onClick={() => toggleSection('stakeholders')}
            >
              <h3 className="section-title">[STAKEHOLDER ANALYSIS]</h3>
              <span className="section-toggle">
                {expandedSections.has('stakeholders') ? '[-]' : '[+]'}
              </span>
            </header>
            
            {expandedSections.has('stakeholders') && (
              <div className="section-content">
                <div className="stakeholder-grid">
                  <div className="stakeholder-column">
                    <h4 className="column-title">[WHO BENEFITS]</h4>
                    <ul>
                      {analysis.stakeholder_analysis.who_benefits.map((entity, i) => (
                        <li key={i}>{entity}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="stakeholder-column">
                    <h4 className="column-title">[WHO IS HARMED]</h4>
                    <ul>
                      {analysis.stakeholder_analysis.who_is_harmed.map((entity, i) => (
                        <li key={i}>{entity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {analysis.stakeholder_analysis.author_perspective && (
                  <div className="stakeholder-block">
                    <h4 className="block-title">[AUTHOR PERSPECTIVE]</h4>
                    <p>{analysis.stakeholder_analysis.author_perspective}</p>
                  </div>
                )}
                
                {analysis.stakeholder_analysis.potential_conflicts && (
                  <div className="stakeholder-block">
                    <h4 className="block-title">[POTENTIAL CONFLICTS]</h4>
                    <p>{analysis.stakeholder_analysis.potential_conflicts}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* READER GUIDANCE */}
        {analysis.reader_guidance && (
          <section className="analysis-section">
            <header 
              className="section-header"
              onClick={() => toggleSection('guidance')}
            >
              <h3 className="section-title">[READER GUIDANCE]</h3>
              <span className="section-toggle">
                {expandedSections.has('guidance') ? '[-]' : '[+]'}
              </span>
            </header>
            
            {expandedSections.has('guidance') && (
              <div className="section-content">
                {analysis.reader_guidance.critical_questions?.length > 0 && (
                  <div className="guidance-block">
                    <h4 className="block-title">[QUESTIONS TO ASK]</h4>
                    <ul>
                      {analysis.reader_guidance.critical_questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.reader_guidance.what_to_verify?.length > 0 && (
                  <div className="guidance-block">
                    <h4 className="block-title">[WHAT TO VERIFY]</h4>
                    <ul>
                      {analysis.reader_guidance.what_to_verify.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.reader_guidance.media_literacy_lesson && (
                  <div className="guidance-block lesson">
                    <h4 className="block-title">[MEDIA LITERACY LESSON]</h4>
                    <p>{analysis.reader_guidance.media_literacy_lesson}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
          </div>
        )}
      </section>
    </div>
  );
};

export default DeepAnalysisPanel;
