import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiClock, FiShield } from 'react-icons/fi';
import useLlamaAnalysis, { DarkPatternAnalysisResult } from '../hooks/useLlamaAnalysis';
import '../styles/DarkPatternDetection.css';

interface DarkPatternDetectionProps {
  defaultText?: string;
  defaultUrl?: string;
}

const DarkPatternDetection: React.FC<DarkPatternDetectionProps> = ({ 
  defaultText = '', 
  defaultUrl = '' 
}) => {
  const [text, setText] = useState<string>(defaultText);
  const [url, setUrl] = useState<string>(defaultUrl);
  const [analysisMode, setAnalysisMode] = useState<'text' | 'url'>(defaultUrl ? 'url' : 'text');
  const [result, setResult] = useState<DarkPatternAnalysisResult | null>(null);
  const {
    serviceStatus,
    isCheckingStatus,
    analysisInProgress,
    error,
    analyzeDarkPatterns
  } = useLlamaAnalysis();

  useEffect(() => {
    // Automatically analyze when component loads with default values
    if ((defaultText || defaultUrl) && serviceStatus?.status === 'healthy') {
      handleAnalysis();
    }
  }, [defaultText, defaultUrl, serviceStatus]);

  const handleAnalysis = async () => {
    if (analysisMode === 'text' && !text.trim()) return;
    if (analysisMode === 'url' && !url.trim()) return;
    
    const content = analysisMode === 'text' ? text : url;
    const darkPatternResult = await analyzeDarkPatterns(content, analysisMode);
    
    if (darkPatternResult) {
      setResult(darkPatternResult);
    }
  };

  const handleReset = () => {
    setText('');
    setUrl('');
    setResult(null);
  };

  const getSeverityColor = (severity: number): string => {
    if (severity >= 8) return '#EA4335'; // High - Red
    if (severity >= 5) return '#FBBC05'; // Medium - Yellow
    return '#34A853'; // Low - Green
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity >= 8) return 'High';
    if (severity >= 5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="dark-pattern-container">
      <h2 className="dark-pattern-title">
        <FiShield className="icon" /> Dark Pattern Detection
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

      <div className="analysis-mode-toggle">
        <button 
          className={`mode-button ${analysisMode === 'text' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('text')}
        >
          Analyze Text
        </button>
        <button 
          className={`mode-button ${analysisMode === 'url' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('url')}
        >
          Analyze URL
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleAnalysis(); }} className="dark-pattern-form">
        {analysisMode === 'text' ? (
          <div className="form-group">
            <label htmlFor="text-input">Text to Analyze</label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste an article, terms of service, or text to check for dark patterns and manipulative design..."
              rows={10}
              disabled={analysisInProgress || serviceStatus?.status !== 'healthy'}
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="url-input">URL to Analyze</label>
            <input
              type="url"
              id="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a website URL to analyze for dark patterns..."
              disabled={analysisInProgress || serviceStatus?.status !== 'healthy'}
            />
            <small className="input-helper">
              Note: The service will extract and analyze text content from the URL.
            </small>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={
              analysisInProgress || 
              serviceStatus?.status !== 'healthy' || 
              (analysisMode === 'text' && !text.trim()) ||
              (analysisMode === 'url' && !url.trim())
            }
          >
            {analysisInProgress ? 'Analyzing...' : 'Detect Dark Patterns'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleReset}
            disabled={analysisInProgress || ((!text && !url) && !result)}
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
          <h3>Dark Pattern Analysis Results</h3>
          
          <div className="dark-pattern-summary">
            <h4>Summary</h4>
            <p>{result.summary}</p>
            
            <div className="overall-score">
              <div className="score-label">Dark Pattern Severity</div>
              <div className="score-value" style={{ color: getSeverityColor(result.overall_severity) }}>
                {result.overall_severity.toFixed(1)}/10
              </div>
              <div className="score-bar-container">
                <div 
                  className="score-bar" 
                  style={{ 
                    width: `${result.overall_severity * 10}%`,
                    backgroundColor: getSeverityColor(result.overall_severity)
                  }}
                />
              </div>
              <div className="severity-label" style={{ color: getSeverityColor(result.overall_severity) }}>
                {getSeverityLabel(result.overall_severity)} Severity
              </div>
            </div>
          </div>
          
          <div className="dark-patterns-detected">
            <h4>Detected Dark Patterns</h4>
            {result.patterns.length === 0 ? (
              <div className="no-patterns-found">
                <FiCheck className="check-icon" />
                <p>No dark patterns detected. The content appears to respect user autonomy.</p>
              </div>
            ) : (
              <div className="pattern-list">
                {result.patterns.map((pattern, index) => (
                  <div key={index} className="pattern-card">
                    <div className="pattern-header">
                      <h5 className="pattern-name">{pattern.name}</h5>
                      <div 
                        className="pattern-severity"
                        style={{ backgroundColor: getSeverityColor(pattern.severity) }}
                      >
                        {getSeverityLabel(pattern.severity)} Severity
                      </div>
                    </div>
                    
                    <div className="pattern-description">
                      <p>{pattern.description}</p>
                    </div>
                    
                    {pattern.example && (
                      <div className="pattern-example">
                        <div className="example-label">Example in Text:</div>
                        <div className="example-content">"{pattern.example}"</div>
                      </div>
                    )}
                    
                    <div className="pattern-impact">
                      <div className="impact-label">Potential Impact:</div>
                      <p>{pattern.impact}</p>
                    </div>
                    
                    <div className="pattern-recommendation">
                      <div className="recommendation-label">Recommendation:</div>
                      <p>{pattern.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {result.categories.length > 0 && (
            <div className="pattern-categories">
              <h4>Dark Pattern Categories</h4>
              <div className="category-grid">
                {result.categories.map((category, index) => (
                  <div key={index} className="category-card">
                    <div className="category-name">{category.name}</div>
                    <div className="category-count">{category.count} patterns</div>
                    <div className="category-description">{category.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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

export default DarkPatternDetection; 