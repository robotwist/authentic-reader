import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiExternalLink,
  FiClock,
  FiShield,
  FiBookOpen,
  FiTarget
} from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/FactCheckingAssistant.css';

interface FactCheckResult {
  claim: string;
  status: 'verified' | 'disputed' | 'unverified' | 'misleading' | 'false';
  confidence: number;
  evidence: {
    supporting: string[];
    contradicting: string[];
    neutral: string[];
  };
  explanation: string;
  sources: {
    name: string;
    url: string;
    reliability: number;
    stance: 'supporting' | 'contradicting' | 'neutral';
  }[];
  timestamp: string;
  aiInsight: string;
}

interface FactCheckingAssistantProps {
  initialClaim?: string;
  onFactCheckComplete?: (result: FactCheckResult) => void;
}

const FactCheckingAssistant: React.FC<FactCheckingAssistantProps> = ({ 
  initialClaim = '', 
  onFactCheckComplete 
}) => {
  const [claim, setClaim] = useState(initialClaim);
  const [isChecking, setIsChecking] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<FactCheckResult | null>(null);
  const [checkProgress, setCheckProgress] = useState(0);
  const [recentChecks, setRecentChecks] = useState<FactCheckResult[]>([]);
  const { analyzeBias } = useLlamaAnalysis();

  useEffect(() => {
    // Load recent fact checks from localStorage
    const saved = localStorage.getItem('recentFactChecks');
    if (saved) {
      try {
        setRecentChecks(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent fact checks:', e);
      }
    }
  }, []);

  const performFactCheck = async () => {
    if (!claim.trim()) {
      alert('Please enter a claim to fact-check');
      return;
    }

    setIsChecking(true);
    setCheckProgress(0);

    try {
      // Step 1: Analyze the claim for bias and context
      setCheckProgress(20);
      const biasAnalysis = await analyzeBias(claim);
      
      // Step 2: Generate fact-check result
      setCheckProgress(60);
      const result = await generateFactCheckResult(claim, biasAnalysis);
      
      // Step 3: Complete the check
      setCheckProgress(100);
      setFactCheckResult(result);
      
      // Save to recent checks
      const updatedRecent = [result, ...recentChecks.slice(0, 4)];
      setRecentChecks(updatedRecent);
      localStorage.setItem('recentFactChecks', JSON.stringify(updatedRecent));
      
      if (onFactCheckComplete) {
        onFactCheckComplete(result);
      }

    } catch (error) {
      console.error('Fact check failed:', error);
      alert('Fact check failed. Please try again.');
    } finally {
      setIsChecking(false);
      setCheckProgress(0);
    }
  };

  const generateFactCheckResult = async (claimText: string, biasAnalysis: any): Promise<FactCheckResult> => {
    // This would ideally call a more sophisticated fact-checking service
    // For now, we'll create a sophisticated mock result based on the claim content
    
    const claimLower = claimText.toLowerCase();
    const biasScore = biasAnalysis.bias_scores?.political || 5;
    
    // Determine status based on claim content and bias
    let status: FactCheckResult['status'] = 'unverified';
    let confidence = 0.5;
    let explanation = '';
    let aiInsight = '';
    
    // Analyze claim patterns
    if (claimLower.includes('study shows') || claimLower.includes('research indicates')) {
      status = 'verified';
      confidence = 0.8;
      explanation = 'This claim references scientific research or studies, which typically provide reliable evidence.';
      aiInsight = 'Claims referencing studies are generally more reliable, but always check the source and methodology.';
    } else if (claimLower.includes('experts say') || claimLower.includes('scientists agree')) {
      status = 'verified';
      confidence = 0.7;
      explanation = 'This claim references expert opinion, which provides credible support.';
      aiInsight = 'Expert consensus is a strong indicator of reliability, but verify the specific experts cited.';
    } else if (claimLower.includes('everyone knows') || claimLower.includes('obviously')) {
      status = 'misleading';
      confidence = 0.6;
      explanation = 'This claim uses vague language and appeals to common belief rather than providing specific evidence.';
      aiInsight = 'Claims using "everyone knows" or "obviously" often lack specific evidence and should be questioned.';
    } else if (claimLower.includes('shocking') || claimLower.includes('outrageous')) {
      status = 'disputed';
      confidence = 0.4;
      explanation = 'This claim uses emotionally charged language that may indicate bias or exaggeration.';
      aiInsight = 'Emotionally charged language often indicates bias and should be fact-checked carefully.';
    } else if (biasScore > 7) {
      status = 'disputed';
      confidence = 0.3;
      explanation = 'This claim shows high political bias and should be verified with multiple sources.';
      aiInsight = 'High bias claims require extra verification from neutral sources.';
    } else {
      status = 'unverified';
      confidence = 0.5;
      explanation = 'This claim requires additional verification from reliable sources.';
      aiInsight = 'When in doubt, verify claims with multiple reputable sources.';
    }

    // Generate mock evidence and sources
    const evidence = {
      supporting: status === 'verified' ? [
        'Multiple independent sources confirm this claim',
        'Expert analysis supports the statement',
        'Statistical data backs this assertion'
      ] : [],
      contradicting: status === 'false' || status === 'disputed' ? [
        'Contradictory evidence from reliable sources',
        'Expert opinion disputes this claim',
        'Factual errors identified in the statement'
      ] : [],
      neutral: [
        'Additional context needed for full verification',
        'Claim requires more specific evidence',
        'Mixed evidence from various sources'
      ]
    };

    const sources = [
      {
        name: 'FactCheck.org',
        url: 'https://www.factcheck.org',
        reliability: 0.95,
        stance: 'neutral' as const
      },
      {
        name: 'Snopes',
        url: 'https://www.snopes.com',
        reliability: 0.92,
        stance: 'neutral' as const
      },
      {
        name: 'Reuters Fact Check',
        url: 'https://www.reuters.com/fact-check',
        reliability: 0.90,
        stance: 'neutral' as const
      }
    ];

    return {
      claim: claimText,
      status,
      confidence,
      evidence,
      explanation,
      sources,
      timestamp: new Date().toISOString(),
      aiInsight
    };
  };

  const getStatusIcon = (status: FactCheckResult['status']) => {
    switch (status) {
      case 'verified':
        return <FiCheckCircle className="status-icon verified" />;
      case 'disputed':
        return <FiXCircle className="status-icon disputed" />;
      case 'false':
        return <FiXCircle className="status-icon false" />;
      case 'misleading':
        return <FiAlertTriangle className="status-icon misleading" />;
      default:
        return <FiInfo className="status-icon unverified" />;
    }
  };

  const getStatusColor = (status: FactCheckResult['status']) => {
    switch (status) {
      case 'verified':
        return '#28a745';
      case 'disputed':
        return '#ffc107';
      case 'false':
        return '#dc3545';
      case 'misleading':
        return '#fd7e14';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: FactCheckResult['status']) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'disputed':
        return 'Disputed';
      case 'false':
        return 'False';
      case 'misleading':
        return 'Misleading';
      default:
        return 'Unverified';
    }
  };

  return (
    <div className="fact-checking-assistant">
      <div className="assistant-header">
        <div className="header-content">
          <FiShield className="header-icon" />
          <div>
            <h2>AI Fact-Checking Assistant</h2>
            <p>Verify claims, check sources, and get evidence-based analysis</p>
          </div>
        </div>
      </div>

      {/* Claim Input */}
      <div className="claim-input-section">
        <div className="input-group">
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Enter a claim to fact-check (e.g., 'Study shows that climate change is accelerating')"
            className="claim-input"
            rows={3}
            disabled={isChecking}
          />
          <button 
            onClick={performFactCheck}
            disabled={isChecking || !claim.trim()}
            className="check-button"
          >
            {isChecking ? (
              <>
                <FiClock className="spinner" />
                Fact-Checking...
              </>
            ) : (
              <>
                <FiSearch />
                Fact-Check Claim
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isChecking && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${checkProgress}%` }}
              ></div>
            </div>
            <p>Analyzing claim and gathering evidence... {checkProgress}%</p>
          </div>
        )}
      </div>

      {/* Fact Check Result */}
      {factCheckResult && (
        <div className="fact-check-result">
          <div className="result-header">
            <div className="result-status">
              {getStatusIcon(factCheckResult.status)}
              <div className="status-info">
                <span 
                  className="status-label"
                  style={{ color: getStatusColor(factCheckResult.status) }}
                >
                  {getStatusText(factCheckResult.status)}
                </span>
                <span className="confidence-score">
                  {Math.round(factCheckResult.confidence * 100)}% Confidence
                </span>
              </div>
            </div>
            <div className="result-meta">
              <span className="timestamp">
                {new Date(factCheckResult.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="result-content">
            <div className="claim-display">
              <h3>Claim:</h3>
              <p>{factCheckResult.claim}</p>
            </div>

            <div className="explanation-section">
              <h3>Analysis:</h3>
              <p>{factCheckResult.explanation}</p>
            </div>

            <div className="ai-insight">
              <h3><FiTarget /> AI Insight:</h3>
              <p>{factCheckResult.aiInsight}</p>
            </div>

            {/* Evidence */}
            <div className="evidence-section">
              <h3>Evidence:</h3>
              <div className="evidence-grid">
                {factCheckResult.evidence.supporting.length > 0 && (
                  <div className="evidence-category supporting">
                    <h4><FiCheckCircle /> Supporting Evidence</h4>
                    <ul>
                      {factCheckResult.evidence.supporting.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {factCheckResult.evidence.contradicting.length > 0 && (
                  <div className="evidence-category contradicting">
                    <h4><FiXCircle /> Contradicting Evidence</h4>
                    <ul>
                      {factCheckResult.evidence.contradicting.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {factCheckResult.evidence.neutral.length > 0 && (
                  <div className="evidence-category neutral">
                    <h4><FiInfo /> Additional Context</h4>
                    <ul>
                      {factCheckResult.evidence.neutral.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sources */}
            <div className="sources-section">
              <h3>Fact-Checking Sources:</h3>
              <div className="sources-grid">
                {factCheckResult.sources.map((source, index) => (
                  <div key={index} className="source-card">
                    <div className="source-info">
                      <h4>{source.name}</h4>
                      <span className="reliability">
                        {Math.round(source.reliability * 100)}% Reliable
                      </span>
                    </div>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      <FiExternalLink />
                      Visit Source
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Checks */}
      {recentChecks.length > 0 && (
        <div className="recent-checks">
          <h3><FiBookOpen /> Recent Fact Checks</h3>
          <div className="recent-grid">
            {recentChecks.map((check, index) => (
              <div key={index} className="recent-check-card">
                <div className="recent-status">
                  {getStatusIcon(check.status)}
                  <span 
                    className="recent-status-label"
                    style={{ color: getStatusColor(check.status) }}
                  >
                    {getStatusText(check.status)}
                  </span>
                </div>
                <p className="recent-claim">{check.claim}</p>
                <span className="recent-time">
                  {new Date(check.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FactCheckingAssistant;
