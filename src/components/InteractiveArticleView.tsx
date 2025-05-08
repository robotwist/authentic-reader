import React, { useState, useEffect, useRef } from 'react';
import { analyzeMultidimensionalBias, analyzeRhetoric, extractEntities, generateAnalysisExplanation } from '../services/huggingFaceService';
import { savePassageAnalyses } from '../services/storageService';
import { logger } from '../utils/logger';
import '../styles/InteractiveArticleView.css';

interface PassageAnalysis {
  id?: string;
  passageId?: string;
  bias?: any;
  rhetoric?: any;
  manipulation?: {
    score: number;
    techniquesDetected?: string[];
  };
  entities?: any[];
  darkPatterns?: any[];
  createdAt?: string;
}

interface ArticlePassage {
  id?: string;
  text: string;
  startIndex: number;
  endIndex: number;
  element?: string;
  analyses: PassageAnalysis | null;
}

interface ExtractedContent {
  id?: string;
  content: string;
  metadata?: {
    title?: string;
    byline?: string;
    siteName?: string;
    date?: string;
    url?: string;
    excerpt?: string;
    imageUrl?: string;
  };
  darkPatterns?: any[];
  timestamp?: number;
}

interface InteractiveArticleViewProps {
  content: ExtractedContent;
  passages: ArticlePassage[];
  onAnalysisComplete?: () => void;
}

const InteractiveArticleView: React.FC<InteractiveArticleViewProps> = ({
  content,
  passages,
  onAnalysisComplete
}) => {
  const [analysisInProgress, setAnalysisInProgress] = useState<boolean>(false);
  const [currentPassage, setCurrentPassage] = useState<number>(0);
  const [analysisResults, setAnalysisResults] = useState<Record<string, PassageAnalysis>>({});
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [showVirgil, setShowVirgil] = useState<boolean>(false);
  const [virgilExplanation, setVirgilExplanation] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize the analysis process when component mounts
  useEffect(() => {
    if (passages.length > 0 && Object.keys(analysisResults).length === 0) {
      startAnalysis();
    }
  }, [passages]);

  // Scroll to highlighted passage when selected
  useEffect(() => {
    if (selectedAnalysis && contentRef.current) {
      const passageElement = document.getElementById(`passage-${selectedAnalysis}`);
      if (passageElement) {
        passageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedAnalysis]);

  // Start analyzing all passages
  const startAnalysis = async () => {
    if (analysisInProgress || passages.length === 0) return;
    
    setAnalysisInProgress(true);
    
    try {
      // Analyze passages sequentially to avoid rate limiting
      for (let i = 0; i < passages.length; i++) {
        setCurrentPassage(i);
        await analyzePassage(passages[i], i);
      }
      
      logger.info('All passages analyzed successfully');
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (error) {
      logger.error('Error during passage analysis:', error);
    } finally {
      setAnalysisInProgress(false);
      setCurrentPassage(0);
    }
  };

  // Analyze a single passage
  const analyzePassage = async (passage: ArticlePassage, index: number) => {
    try {
      // Create a unique ID for this passage if not already present
      const passageId = passage.id || `passage-${index}`;
      
      // Skip if already analyzed
      if (analysisResults[passageId]) {
        return;
      }
      
      // Analyze bias, rhetoric, and entities in parallel
      const [biasAnalysis, rhetoricAnalysis, entities] = await Promise.all([
        analyzeMultidimensionalBias(passage.text),
        analyzeRhetoric(passage.text),
        extractEntities(passage.text)
      ]);
      
      // Create the passage analysis
      const analysis: PassageAnalysis = {
        id: `analysis-${passageId}`,
        passageId,
        bias: biasAnalysis,
        rhetoric: rhetoricAnalysis,
        manipulation: {
          score: calculateManipulationScore(biasAnalysis, rhetoricAnalysis),
          techniquesDetected: []
        },
        entities,
        darkPatterns: [],
        createdAt: new Date().toISOString()
      };
      
      // Save to state and database
      setAnalysisResults(prev => ({
        ...prev,
        [passageId]: analysis
      }));
      
      await savePassageAnalyses(content.id || 'article', {
        articleId: content.id || 'article',
        passages: passages.map((p, i) => {
          const pid = p.id || `passage-${i}`;
          return {
            ...p,
            id: pid,
            analyses: pid === passageId ? analysis : p.analyses
          };
        }),
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error(`Error analyzing passage:`, error);
    }
  };

  // Calculate a manipulation score based on bias strength and rhetoric effectiveness
  const calculateManipulationScore = (
    bias: any, 
    rhetoric: { primary: string; effectiveness: number }
  ): number => {
    // Bias strength (stronger bias in any direction increases manipulation score)
    const biasStrength = [
      Math.abs(bias.political?.value || 0),
      Math.abs(bias.economic?.value || 0),
      Math.abs(bias.social?.value || 0),
      Math.abs(bias.identity?.value || 0)
    ].reduce((a, b) => Math.max(a, b), 0);
    
    // Rhetoric effectiveness
    const rhetoricEffectiveness = rhetoric.effectiveness;
    
    // Combine for overall score (0-1)
    return Math.min(0.95, (biasStrength * 0.5) + (rhetoricEffectiveness * 0.5));
  };

  // Generate a Virgil explanation for the selected passage
  const generateVirgil = async (passageId: string) => {
    const analysis = analysisResults[passageId];
    const passage = passages.find(p => p.id === passageId || (p.id === undefined && passageId === `passage-${passages.indexOf(p)}`));
    
    if (!analysis || !passage) return;
    
    setShowVirgil(true);
    setVirgilExplanation('Generating analysis explanation...');
    
    try {
      const explanation = await generateAnalysisExplanation(passage.text, {
        bias: analysis.bias,
        rhetoric: analysis.rhetoric
      });
      
      setVirgilExplanation(explanation);
    } catch (error) {
      logger.error('Error generating Virgil explanation:', error);
      setVirgilExplanation('Sorry, I couldn\'t generate an explanation right now.');
    }
  };

  // Get CSS class based on bias strength
  const getBiasClass = (biasValue: number): string => {
    const absValue = Math.abs(biasValue);
    if (absValue < 0.2) return 'bias-neutral';
    if (absValue < 0.5) return biasValue < 0 ? 'bias-left-moderate' : 'bias-right-moderate';
    return biasValue < 0 ? 'bias-left-strong' : 'bias-right-strong';
  };

  // Get CSS class based on rhetoric type
  const getRhetoricClass = (type: string): string => {
    switch (type) {
      case 'ethos': return 'rhetoric-ethos';
      case 'pathos': return 'rhetoric-pathos';
      case 'logos': return 'rhetoric-logos';
      case 'kairos': return 'rhetoric-kairos';
      default: return '';
    }
  };

  // Get CSS class based on manipulation score
  const getManipulationClass = (score: number): string => {
    if (score < 0.3) return 'manipulation-low';
    if (score < 0.7) return 'manipulation-medium';
    return 'manipulation-high';
  };

  // Create sidebar analysis component
  const AnalysisSidebar = () => {
    if (!selectedAnalysis || !analysisResults[selectedAnalysis]) {
      return (
        <div className="analysis-sidebar empty">
          <h3>Article Analysis</h3>
          <p>Select a passage to view its analysis.</p>
        </div>
      );
    }
    
    const analysis = analysisResults[selectedAnalysis];
    
    return (
      <div className="analysis-sidebar">
        <h3>Passage Analysis</h3>
        
        <div className="analysis-section">
          <h4>Bias Analysis</h4>
          <div className="bias-meter">
            <div className="bias-label left">Left</div>
            <div className="bias-bar">
              <div 
                className="bias-indicator" 
                style={{ 
                  left: `${(analysis.bias.political.value + 1) * 50}%`,
                  backgroundColor: analysis.bias.political.value < -0.2 ? '#3498db' : 
                                  analysis.bias.political.value > 0.2 ? '#e74c3c' : '#27ae60'
                }}
              />
            </div>
            <div className="bias-label right">Right</div>
          </div>
          
          <div className="bias-dimensions">
            <div className="bias-dimension">
              <span>Political:</span>
              <span className={getBiasClass(analysis.bias.political.value)}>
                {analysis.bias.political.value < -0.2 ? 'Left-leaning' : 
                 analysis.bias.political.value > 0.2 ? 'Right-leaning' : 'Centrist'}
              </span>
            </div>
            <div className="bias-dimension">
              <span>Economic:</span>
              <span className={getBiasClass(analysis.bias.economic.value)}>
                {analysis.bias.economic.value < -0.2 ? 'Pro-regulation' : 
                 analysis.bias.economic.value > 0.2 ? 'Free-market' : 'Balanced'}
              </span>
            </div>
            <div className="bias-dimension">
              <span>Social:</span>
              <span className={getBiasClass(analysis.bias.social.value)}>
                {analysis.bias.social.value < -0.2 ? 'Progressive' : 
                 analysis.bias.social.value > 0.2 ? 'Traditional' : 'Moderate'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="analysis-section">
          <h4>Rhetoric Analysis</h4>
          <div className={`rhetoric-type ${getRhetoricClass(analysis.rhetoric.primary)}`}>
            Primary: {analysis.rhetoric.primary === 'ethos' ? 'Appeal to Authority' :
                     analysis.rhetoric.primary === 'pathos' ? 'Appeal to Emotion' :
                     analysis.rhetoric.primary === 'logos' ? 'Appeal to Logic' : 'Appeal to Timeliness'}
          </div>
          
          {analysis.rhetoric.techniques && analysis.rhetoric.techniques.length > 0 && (
            <div className="rhetoric-techniques">
              <h5>Techniques:</h5>
              <ul>
                {analysis.rhetoric.techniques.map((technique: string, i: number) => (
                  <li key={i}>{technique}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="analysis-section">
          <h4>Manipulation Score</h4>
          <div className={`manipulation-score ${getManipulationClass(analysis.manipulation.score)}`}>
            {(analysis.manipulation.score * 100).toFixed(0)}%
          </div>
          <p className="manipulation-explanation">
            {analysis.manipulation.score < 0.3 ? 'Low manipulation potential. This content appears to be mostly factual and balanced.' :
             analysis.manipulation.score < 0.7 ? 'Moderate manipulation potential. The content uses some persuasive techniques.' :
             'High manipulation potential. The content uses strong persuasive techniques and may show significant bias.'}
          </p>
        </div>
        
        <button 
          className="virgil-button" 
          onClick={() => generateVirgil(selectedAnalysis)}
        >
          Ask Virgil to Explain
        </button>
      </div>
    );
  };

  return (
    <div className="interactive-article-container">
      {/* Article metadata */}
      <div className="article-header">
        <h1>{content.metadata?.title || 'Untitled Article'}</h1>
        {content.metadata?.byline && <p className="article-author">By {content.metadata.byline}</p>}
        {content.metadata?.date && (
          <p className="article-date">
            Published: {new Date(content.metadata.date).toLocaleDateString()}
          </p>
        )}
        <div className="article-source">Source: {content.metadata?.siteName || 'Unknown'}</div>
      </div>
      
      {/* Analysis progress indicator */}
      {analysisInProgress && (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div 
              className="progress-indicator" 
              style={{ width: `${(currentPassage / passages.length) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            Analyzing article... {currentPassage + 1} of {passages.length} passages
          </div>
        </div>
      )}
      
      {/* Main content and analysis area */}
      <div className="content-analysis-container">
        {/* Article content with interactive passages */}
        <div className="article-content" ref={contentRef}>
          {passages.map((passage, index) => {
            const passageId = passage.id || `passage-${index}`;
            const analysis = analysisResults[passageId];
            const isSelected = selectedAnalysis === passageId;
            
            return (
              <div
                id={`passage-${passageId}`}
                key={passageId}
                className={`article-passage ${isSelected ? 'selected' : ''} ${analysis ? 'analyzed' : ''}`}
                onClick={() => {
                  if (analysis) {
                    setSelectedAnalysis(passageId);
                    setShowVirgil(false);
                  }
                }}
              >
                <p>{passage.text}</p>
                
                {analysis && (
                  <div className="passage-indicators">
                    <span 
                      className={`bias-indicator ${getBiasClass(analysis.bias.political.value)}`}
                      title={`Political bias: ${analysis.bias.political.value < -0.2 ? 'Left-leaning' : 
                             analysis.bias.political.value > 0.2 ? 'Right-leaning' : 'Centrist'}`}
                    />
                    <span 
                      className={`rhetoric-indicator ${getRhetoricClass(analysis.rhetoric.primary)}`}
                      title={`Primary rhetoric: ${analysis.rhetoric.primary}`}
                    />
                    <span 
                      className={`manipulation-indicator ${getManipulationClass(analysis.manipulation.score)}`}
                      title={`Manipulation score: ${(analysis.manipulation.score * 100).toFixed(0)}%`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Analysis sidebar */}
        <AnalysisSidebar />
      </div>
      
      {/* Virgil explanation modal */}
      {showVirgil && (
        <div className="virgil-overlay" onClick={() => setShowVirgil(false)}>
          <div className="virgil-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Virgil's Analysis</h3>
            <div className="virgil-content">
              {virgilExplanation || 'Loading analysis...'}
            </div>
            <button className="close-button" onClick={() => setShowVirgil(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveArticleView; 