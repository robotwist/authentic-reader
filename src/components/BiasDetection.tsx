import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiCpu, FiClock, FiBarChart2 } from 'react-icons/fi';
import useLlamaAnalysis, { BiasAnalysisResult } from '../hooks/useLlamaAnalysis';
import '../styles/BiasDetection.css';

// Helper functions for rendering
const getBiasLevelText = (score: number): string => {
  if (score < 3) return 'Very Low';
  if (score < 5) return 'Low';
  if (score < 7) return 'Moderate';
  if (score < 9) return 'High';
  return 'Very High';
};

const getBiasLevelColor = (score: number): string => {
  if (score < 3) return '#28a745';  // green
  if (score < 5) return '#5cb85c';  // light green
  if (score < 7) return '#ffc107';  // yellow
  if (score < 9) return '#fd7e14';  // orange
  return '#dc3545';  // red
};

interface BiasDetectionProps {
  defaultText?: string;
}

const BiasDetection: React.FC<BiasDetectionProps> = ({ defaultText = '' }) => {
  const [text, setText] = useState<string>(defaultText);
  const [result, setResult] = useState<BiasAnalysisResult | null>(null);
  const {
    serviceStatus,
    isCheckingStatus,
    analysisInProgress,
    error,
    analyzeBias
  } = useLlamaAnalysis();

  useEffect(() => {
    // If default text is provided, analyze it automatically
    if (defaultText && serviceStatus?.status === 'healthy') {
      handleAnalysis();
    }
  }, [defaultText, serviceStatus]);

  const handleAnalysis = async () => {
    if (!text.trim()) return;
    
    const biasResult = await analyzeBias(text);
    if (biasResult) {
      setResult(biasResult);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
  };

  const renderBiasScore = (type: string, score: number) => {
    const level = getBiasLevelText(score);
    const color = getBiasLevelColor(score);
    
    return (
      <div className="bias-score-item">
        <div className="bias-score-label">{type} Bias</div>
        <div className="bias-score-bar-container">
          <div 
            className="bias-score-bar" 
            style={{ 
              width: `${score * 10}%`,
              backgroundColor: color
            }}
          ></div>
        </div>
        <div className="bias-score-value" style={{ color }}>
          {level} ({score.toFixed(1)}/10)
        </div>
      </div>
    );
  };

  return (
    <div className="bias-detection-container">
      <h2 className="bias-detection-title">
        <FiBarChart2 className="icon" /> Bias Detection
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

      <form onSubmit={(e) => { e.preventDefault(); handleAnalysis(); }} className="bias-detection-form">
        <div className="form-group">
          <label htmlFor="text-input">Text to Analyze</label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste an article, social media post, or other content to analyze for bias..."
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
            {analysisInProgress ? 'Analyzing...' : 'Analyze for Bias'}
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
          <h3>Bias Analysis Results</h3>
          
          <div className="bias-scores-container">
            {renderBiasScore('Political', result.bias_scores.political)}
            {renderBiasScore('Ideological', result.bias_scores.ideological)}
            {renderBiasScore('Partisan', result.bias_scores.partisan)}
          </div>
          
          <div className="bias-assessment">
            <h4>Overall Assessment</h4>
            <p>{result.overall_bias_assessment}</p>
          </div>
          
          {result.detected_bias_phrases.length > 0 && (
            <div className="bias-phrases">
              <h4>Detected Bias Phrases</h4>
              <ul>
                {result.detected_bias_phrases.map((phrase, index) => (
                  <li key={index}>{phrase}</li>
                ))}
              </ul>
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

export default BiasDetection; 