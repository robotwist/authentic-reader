import React, { useState, useEffect, useRef } from 'react';
import { FiShield, FiUsers, FiMessageCircle, FiEye, FiTarget, FiAlertTriangle, FiBookOpen, FiZap } from 'react-icons/fi';
import { intellectualSelfDefenseService, ChomskyAnalysis } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './CommunityArticleReader.css';

interface CommunityArticleReaderProps {
  article: {
    id: string;
    title: string;
    content: string;
    source: string;
    url: string;
    publishedAt: string;
    category: string;
    importance: string;
  };
  onBack?: () => void;
}

interface AnalysisHighlight {
  id: string;
  type: 'bias' | 'manipulation' | 'regime-narrative' | 'power-structure' | 'loaded-language' | 'omission';
  startIndex: number;
  endIndex: number;
  text: string;
  analysis: string;
  chomskyTechnique: string;
  communityInsights?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CommunityDiscussion {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  highlightId: string;
  comment: string;
  analysisType: 'bias-detection' | 'narrative-analysis' | 'power-structure' | 'democracy-threat';
  upvotes: number;
  downvotes: number;
}

const CommunityArticleReader: React.FC<CommunityArticleReaderProps> = ({ article, onBack }) => {
  const [analysis, setAnalysis] = useState<ChomskyAnalysis | null>(null);
  const [highlights, setHighlights] = useState<AnalysisHighlight[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<AnalysisHighlight | null>(null);
  const [communityDiscussions, setCommunityDiscussions] = useState<CommunityDiscussion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [regimeNarrative, setRegimeNarrative] = useState<string>('');
  const [democracyThreats, setDemocracyThreats] = useState<string[]>([]);
  const [showCommunityPanel, setShowCommunityPanel] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'bias-detection' | 'narrative-analysis' | 'power-structure' | 'democracy-threat'>('bias-detection');
  
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    analyzeArticle();
  }, [article]);

  const analyzeArticle = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Get Chomsky analysis
      const chomskyAnalysis = await intellectualSelfDefenseService.generateChomskyAnalysis(article);
      setAnalysis(chomskyAnalysis);

      // Generate highlights based on analysis
      const generatedHighlights = generateAnalysisHighlights(article.content, chomskyAnalysis);
      setHighlights(generatedHighlights);

      // Extract regime narrative
      const narrative = extractRegimeNarrative(chomskyAnalysis);
      setRegimeNarrative(narrative);

      // Identify democracy threats
      const threats = identifyDemocracyThreats(chomskyAnalysis);
      setDemocracyThreats(threats);

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      logger.info('Article analysis completed', { articleId: article.id, highlightsCount: generatedHighlights.length });
    } catch (error) {
      logger.error('Failed to analyze article:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAnalysisHighlights = (content: string, analysis: ChomskyAnalysis): AnalysisHighlight[] => {
    const highlights: AnalysisHighlight[] = [];
    let highlightId = 0;

    // Analyze loaded language
    analysis.linguisticAnalysis.loadedLanguage.forEach((language, index) => {
      const sentences = content.split(/[.!?]+/);
      sentences.forEach((sentence, sentenceIndex) => {
        if (sentence.toLowerCase().includes(language.toLowerCase().split(' ')[0])) {
          const startIndex = content.indexOf(sentence);
          const endIndex = startIndex + sentence.length;
          
          highlights.push({
            id: `loaded-${highlightId++}`,
            type: 'loaded-language',
            startIndex,
            endIndex,
            text: sentence.trim(),
            analysis: language,
            chomskyTechnique: 'Linguistic Analysis - Loaded Language Detection',
            severity: 'medium'
          });
        }
      });
    });

    // Analyze power structures
    analysis.structuralAnalysis.powerStructures.forEach((structure, index) => {
      const keywords = ['authority', 'expert', 'official', 'government', 'institution', 'establishment'];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          const startIndex = match.index;
          const endIndex = startIndex + match[0].length;
          
          highlights.push({
            id: `power-${highlightId++}`,
            type: 'power-structure',
            startIndex,
            endIndex,
            text: match[0],
            analysis: structure,
            chomskyTechnique: 'Structural Analysis - Power Structure Identification',
            severity: 'high'
          });
        }
      });
    });

    // Analyze bias indicators
    analysis.linguisticAnalysis.ideologicalAssumptions.forEach((assumption, index) => {
      const biasWords = ['progressive', 'conservative', 'liberal', 'traditional', 'mainstream', 'alternative'];
      biasWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          const startIndex = match.index;
          const endIndex = startIndex + match[0].length;
          
          highlights.push({
            id: `bias-${highlightId++}`,
            type: 'bias',
            startIndex,
            endIndex,
            text: match[0],
            analysis: assumption,
            chomskyTechnique: 'Ideological Analysis - Bias Detection',
            severity: 'medium'
          });
        }
      });
    });

    return highlights.sort((a, b) => a.startIndex - b.startIndex);
  };

  const extractRegimeNarrative = (analysis: ChomskyAnalysis): string => {
    const narratives = [];
    
    // Extract from structural analysis
    analysis.structuralAnalysis.manufacturingConsent.forEach(consent => {
      if (consent.includes('consent') || consent.includes('manufacturing')) {
        narratives.push(consent);
      }
    });

    // Extract from critical analysis
    analysis.criticalAnalysis.ideologicalFunction.forEach(function_ => {
      if (function_.includes('ideological') || function_.includes('function')) {
        narratives.push(function_);
      }
    });

    return narratives.join(' ') || 'Analysis suggests potential narrative manipulation through selective framing and institutional bias.';
  };

  const identifyDemocracyThreats = (analysis: ChomskyAnalysis): string[] => {
    const threats = [];
    
    // Check for power concentration
    if (analysis.structuralAnalysis.powerStructures.length > 3) {
      threats.push('High concentration of institutional power references suggests potential democratic erosion');
    }

    // Check for consent manufacturing
    if (analysis.structuralAnalysis.manufacturingConsent.length > 2) {
      threats.push('Evidence of consent manufacturing techniques that may undermine democratic participation');
    }

    // Check for alternative perspective suppression
    if (analysis.criticalAnalysis.alternativePerspectives.length < 2) {
      threats.push('Limited alternative perspectives may indicate suppression of democratic discourse');
    }

    return threats;
  };

  const handleHighlightClick = (highlight: AnalysisHighlight) => {
    setSelectedHighlight(highlight);
    setShowCommunityPanel(true);
  };

  const addCommunityComment = () => {
    if (!newComment.trim() || !selectedHighlight) return;

    const newDiscussion: CommunityDiscussion = {
      id: `comment-${Date.now()}`,
      userId: 'current-user', // In real app, get from auth
      userName: 'Community Member', // In real app, get from user profile
      timestamp: new Date().toISOString(),
      highlightId: selectedHighlight.id,
      comment: newComment,
      analysisType: commentType,
      upvotes: 0,
      downvotes: 0
    };

    setCommunityDiscussions(prev => [...prev, newDiscussion]);
    setNewComment('');
    
    logger.info('Community comment added', { highlightId: selectedHighlight.id, type: commentType });
  };

  const renderHighlightedContent = () => {
    if (!highlights.length) return article.content;

    let result = '';
    let lastIndex = 0;

    highlights.forEach(highlight => {
      // Add text before highlight
      result += article.content.slice(lastIndex, highlight.startIndex);
      
      // Add highlighted text
      const highlightClass = `highlight-${highlight.type} highlight-${highlight.severity}`;
      result += `<span class="${highlightClass}" data-highlight-id="${highlight.id}">${highlight.text}</span>`;
      
      lastIndex = highlight.endIndex;
    });

    // Add remaining text
    result += article.content.slice(lastIndex);

    return result;
  };

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'bias': return <FiTarget className="highlight-icon" />;
      case 'manipulation': return <FiAlertTriangle className="highlight-icon" />;
      case 'regime-narrative': return <FiShield className="highlight-icon" />;
      case 'power-structure': return <FiZap className="highlight-icon" />;
      case 'loaded-language': return <FiBookOpen className="highlight-icon" />;
      case 'omission': return <FiEye className="highlight-icon" />;
      default: return <FiTarget className="highlight-icon" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  return (
    <div className="community-article-reader">
      {/* Header */}
      <div className="reader-header">
        <div className="header-controls">
          {onBack && (
            <button className="back-button" onClick={onBack}>
              ← Back to Course
            </button>
          )}
          <button 
            className={`community-toggle ${showCommunityPanel ? 'active' : ''}`}
            onClick={() => setShowCommunityPanel(!showCommunityPanel)}
          >
            <FiUsers />
            Community Analysis
          </button>
        </div>
        
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          <span className="source">{article.source}</span>
          <span className="published">{new Date(article.publishedAt).toLocaleDateString()}</span>
          <span className="category">{article.category}</span>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p>Applying Chomsky Analysis Techniques... {analysisProgress}%</p>
        </div>
      )}

      {/* Main Content */}
      <div className="reader-content">
        {/* Article Text */}
        <div className="article-content">
          <div 
            ref={articleRef}
            className="article-text"
            dangerouslySetInnerHTML={{ __html: renderHighlightedContent() }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains('highlight-bias') || 
                  target.classList.contains('highlight-manipulation') ||
                  target.classList.contains('highlight-regime-narrative') ||
                  target.classList.contains('highlight-power-structure') ||
                  target.classList.contains('highlight-loaded-language') ||
                  target.classList.contains('highlight-omission')) {
                const highlightId = target.getAttribute('data-highlight-id');
                const highlight = highlights.find(h => h.id === highlightId);
                if (highlight) {
                  handleHighlightClick(highlight);
                }
              }
            }}
          />
        </div>

        {/* Community Panel */}
        {showCommunityPanel && (
          <div className="community-panel">
            <div className="panel-header">
              <h3>Community Analysis</h3>
              <button 
                className="close-panel"
                onClick={() => setShowCommunityPanel(false)}
              >
                ×
              </button>
            </div>

            {selectedHighlight && (
              <div className="highlight-analysis">
                <div className="highlight-info">
                  {getHighlightIcon(selectedHighlight.type)}
                  <div className="highlight-details">
                    <h4>{selectedHighlight.chomskyTechnique}</h4>
                    <p className="highlight-text">"{selectedHighlight.text}"</p>
                    <p className="highlight-analysis-text">{selectedHighlight.analysis}</p>
                    <div 
                      className="severity-indicator"
                      style={{ backgroundColor: getSeverityColor(selectedHighlight.severity) }}
                    >
                      {selectedHighlight.severity.toUpperCase()} SEVERITY
                    </div>
                  </div>
                </div>

                <div className="community-discussions">
                  <h4>Community Insights</h4>
                  {communityDiscussions
                    .filter(d => d.highlightId === selectedHighlight.id)
                    .map(discussion => (
                      <div key={discussion.id} className="discussion-item">
                        <div className="discussion-header">
                          <span className="user-name">{discussion.userName}</span>
                          <span className="discussion-type">{discussion.analysisType}</span>
                          <span className="discussion-time">
                            {new Date(discussion.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="discussion-comment">{discussion.comment}</p>
                        <div className="discussion-votes">
                          <button className="vote-button upvote">↑ {discussion.upvotes}</button>
                          <button className="vote-button downvote">↓ {discussion.downvotes}</button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="add-comment">
                  <h4>Add Your Analysis</h4>
                  <select 
                    value={commentType}
                    onChange={(e) => setCommentType(e.target.value as any)}
                    className="comment-type-select"
                  >
                    <option value="bias-detection">Bias Detection</option>
                    <option value="narrative-analysis">Narrative Analysis</option>
                    <option value="power-structure">Power Structure</option>
                    <option value="democracy-threat">Democracy Threat</option>
                  </select>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your analysis of this highlighted text..."
                    className="comment-textarea"
                  />
                  <button 
                    onClick={addCommunityComment}
                    disabled={!newComment.trim()}
                    className="add-comment-button"
                  >
                    <FiMessageCircle />
                    Add Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="analysis-summary">
          <h3>Intellectual Self-Defense Analysis</h3>
          
          <div className="summary-section">
            <h4>Regime Narrative Detected</h4>
            <p className="regime-narrative">{regimeNarrative}</p>
          </div>

          {democracyThreats.length > 0 && (
            <div className="summary-section">
              <h4>Democracy Threats Identified</h4>
              <ul className="democracy-threats">
                {democracyThreats.map((threat, index) => (
                  <li key={index}>{threat}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="summary-section">
            <h4>Analysis Highlights</h4>
            <div className="highlight-stats">
              <div className="stat">
                <span className="stat-number">{highlights.filter(h => h.type === 'bias').length}</span>
                <span className="stat-label">Bias Indicators</span>
              </div>
              <div className="stat">
                <span className="stat-number">{highlights.filter(h => h.type === 'power-structure').length}</span>
                <span className="stat-label">Power Structures</span>
              </div>
              <div className="stat">
                <span className="stat-number">{highlights.filter(h => h.type === 'loaded-language').length}</span>
                <span className="stat-label">Loaded Language</span>
              </div>
              <div className="stat">
                <span className="stat-number">{highlights.filter(h => h.severity === 'critical').length}</span>
                <span className="stat-label">Critical Issues</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityArticleReader;
