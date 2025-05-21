import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiClock, FiTarget } from 'react-icons/fi';
import useLlamaAnalysis, { RhetoricalAnalysisResult } from '../hooks/useLlamaAnalysis';
import '../styles/RhetoricalAnalysis.css';

interface RhetoricalAnalysisProps {
  defaultText?: string;
}

const RhetoricalAnalysis: React.FC<RhetoricalAnalysisProps> = ({ defaultText = '' }) => {
  const [text, setText] = useState<string>(defaultText);
  const [result, setResult] = useState<RhetoricalAnalysisResult | null>(null);
  const {
    serviceStatus,
    isCheckingStatus,
    analysisInProgress,
    error,
    analyzeRhetorical
  } = useLlamaAnalysis();

  useEffect(() => {
    // If default text is provided, analyze it automatically
    if (defaultText && serviceStatus?.status === 'healthy') {
      handleAnalysis();
    }
  }, [defaultText, serviceStatus]);

  const handleAnalysis = async () => {
    if (!text.trim()) return;
    
    const rhetoricalResult = await analyzeRhetorical(text);
    if (rhetoricalResult) {
      setResult(rhetoricalResult);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
  };

  const getTechniqueColor = (category: string): string => {
    const colors: {[key: string]: string} = {
      'Ethos': '#4285F4',    // Blue for credibility
      'Pathos': '#EA4335',   // Red for emotion
      'Logos': '#34A853',    // Green for logic
      'Kairos': '#FBBC05',   // Yellow for timing
      'Fallacy': '#9C27B0',  // Purple for fallacies
      'Literary': '#FF9800', // Orange for literary devices
      'Persuasive': '#795548' // Brown for persuasion techniques
    };
    
    return colors[category] || '#9E9E9E'; // Grey for unknown types
  };

  const getHighlightedText = () => {
    if (!result || !result.techniques || result.techniques.length === 0) {
      return <p>{text}</p>;
    }

    // Sort by start_index to ensure we process in order
    const sortedTechniques = [...result.techniques].sort((a, b) => a.start_index - b.start_index);
    
    let lastIndex = 0;
    const textPieces = [];
    
    for (const technique of sortedTechniques) {
      // Add text before the technique
      if (technique.start_index > lastIndex) {
        textPieces.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, technique.start_index)}
          </span>
        );
      }
      
      // Add the highlighted technique
      textPieces.push(
        <span 
          key={`technique-${technique.start_index}`} 
          className="highlighted-technique"
          style={{ backgroundColor: `${getTechniqueColor(technique.category)}30` }}
          title={`${technique.name}: ${technique.description}`}
        >
          {text.substring(technique.start_index, technique.end_index)}
          <span className="technique-tooltip">
            <strong>{technique.name}</strong> ({technique.category})
            <p>{technique.description}</p>
          </span>
        </span>
      );
      
      lastIndex = technique.end_index;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      textPieces.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return <div className="highlighted-content">{textPieces}</div>;
  };

  return (
    <div className="rhetorical-analysis-container">
      <h2 className="rhetorical-analysis-title">
        <FiTarget className="icon" /> Rhetorical Analysis
      </h2>
      
      {/* Service Status */}
      <div className="service-status">
        <h4>Llama Service Status</h4>
        {isCheckingStatus ? (
          <p>Checking service status...</p>
        ) : serviceStatus?.status === 'healthy' ? (
          <div className="status-healthy">
            <FiCheck className="status-icon" />
            <span>
              Service is online using {serviceStatus.model}
              {serviceStatus.model_info?.parameter_size && ` (${serviceStatus.model_info.parameter_size})`}
            </span>
          </div>
        ) : (
          <div className="status-error">
            <FiAlertCircle className="status-icon" />
            <span>Service is offline: {serviceStatus?.error || 'Unknown error'}</span>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleAnalysis(); }} className="rhetorical-analysis-form">
        <div className="form-group">
          <label htmlFor="text-input">Text to Analyze</label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste an article or text to identify rhetorical techniques and persuasion methods..."
            rows={10}
            disabled={analysisInProgress || serviceStatus?.status !== 'healthy'}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={analysisInProgress || !text.trim() || serviceStatus?.status !== 'healthy'}
          >
            {analysisInProgress ? 'Analyzing Rhetoric...' : 'Analyze Rhetoric'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleReset}
            disabled={analysisInProgress || (!text && !result)}
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <FiAlertCircle className="icon" />
          {error}
        </div>
      )}

      {result && (
        <div className="result-container">
          <h3>Rhetorical Analysis Results</h3>
          
          <div className="highlighted-text-container">
            <h4>Identified Techniques</h4>
            {getHighlightedText()}
          </div>
          
          <div className="rhetorical-summary">
            <h4>Rhetorical Summary</h4>
            <p>{result.summary}</p>
          </div>
          
          <div className="technique-categories">
            <h4>Technique Breakdown</h4>
            <div className="category-stats">
              {result.categories.map((category, index) => (
                <div key={index} className="category-stat">
                  <div className="category-name" style={{ color: getTechniqueColor(category.name) }}>
                    {category.name}
                  </div>
                  <div className="category-bar-container">
                    <div 
                      className="category-bar" 
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: getTechniqueColor(category.name)
                      }} 
                    />
                    <span className="category-percentage">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="technique-list">
            <h4>Detected Techniques</h4>
            <div className="technique-grid">
              {result.techniques.map((technique, index) => (
                <div key={index} className="technique-card">
                  <div 
                    className="technique-category-indicator" 
                    style={{ backgroundColor: getTechniqueColor(technique.category) }}
                  />
                  <div className="technique-details">
                    <div className="technique-name">{technique.name}</div>
                    <div className="technique-category">{technique.category}</div>
                    <div className="technique-quote">"{text.substring(technique.start_index, technique.end_index)}"</div>
                    <div className="technique-description">{technique.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="persuasiveness-score">
            <h4>Overall Persuasiveness</h4>
            <div className="score-container">
              <div className="score-value">{result.persuasiveness_score.toFixed(1)}/10</div>
              <div className="score-bar-container">
                <div 
                  className="score-bar" 
                  style={{ width: `${result.persuasiveness_score * 10}%` }}
                />
              </div>
              <div className="score-label">{getPersuasivenessLabel(result.persuasiveness_score)}</div>
            </div>
          </div>
          
          <div className="result-metadata">
            <div className="metadata-item">
              <FiClock className="icon" />
              Processed in {result.processing_time.toFixed(2)} seconds
            </div>
            <div className="metadata-item">
              <FiCpu className="icon" />
              Model: {result.model_used}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getPersuasivenessLabel = (score: number): string => {
  if (score >= 9) return "Extremely Persuasive";
  if (score >= 7.5) return "Highly Persuasive";
  if (score >= 6) return "Moderately Persuasive";
  if (score >= 4.5) return "Somewhat Persuasive";
  if (score >= 3) return "Slightly Persuasive";
  return "Minimally Persuasive";
};

export default RhetoricalAnalysis; 