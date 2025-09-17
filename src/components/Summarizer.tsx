import React, { useState, useEffect } from 'react';
import llamaService, { SummarizeRequest, LlamaServiceStatus } from '../services/LlamaService';
import { FiFileText, FiCpu, FiClock, FiAlertCircle, FiCheck } from 'react-icons/fi';
import '../styles/Summarizer.css';

const Summarizer: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [summaryType, setSummaryType] = useState<'brief' | 'detailed' | 'bullet' | 'executive'>('detailed');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<LlamaServiceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);

  // Check service status on component mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      setStatusLoading(true);
      try {
        const status = await llamaService.checkStatus();
        setServiceStatus(status);
      } catch (error) {
        console.error('Failed to check service status:', error);
        setServiceStatus({
          status: 'error',
          model: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setStatusLoading(false);
      }
    };

    checkServiceStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter text to summarize');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSummary('');
      setProcessingTime(null);
      setModelUsed(null);

      const request: SummarizeRequest = {
        text,
        type: summaryType,
        max_length: Math.min(Math.floor(text.length * 0.25), 2000), // 25% of original, max 2000 chars
      };

      const response = await llamaService.summarizeText(request);
      
      setSummary(response.text);
      setProcessingTime(response.processing_time);
      setModelUsed(response.model_used);
    } catch (error) {
      console.error('Summarization failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to summarize text');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setSummary('');
    setError(null);
    setProcessingTime(null);
    setModelUsed(null);
  };

  return (
    <div className="summarizer-container">
      <h2 className="summarizer-title">
        <FiFileText className="icon" /> Text Summarizer
      </h2>
      
      {/* Service Status */}
      <div className="service-status">
        <h4>Llama Service Status</h4>
        {statusLoading ? (
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

      <form onSubmit={handleSubmit} className="summarizer-form">
        <div className="form-group">
          <label htmlFor="text-input">Text to Summarize</label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here to generate a summary..."
            rows={10}
            disabled={isLoading || serviceStatus?.status !== 'healthy'}
          />
        </div>

        <div className="form-group">
          <label htmlFor="summary-type">Summary Type</label>
          <select
            id="summary-type"
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value as any)}
            disabled={isLoading || serviceStatus?.status !== 'healthy'}
          >
            <option value="brief">Brief (concise overview)</option>
            <option value="detailed">Detailed (comprehensive summary)</option>
            <option value="bullet">Bullet Points (key points)</option>
            <option value="executive">Executive Summary (business-oriented)</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading || !text.trim() || serviceStatus?.status !== 'healthy'}
          >
            {isLoading ? 'Summarizing...' : 'Summarize Text'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleReset}
            disabled={isLoading || (!text && !summary)}
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

      {summary && (
        <div className="result-container">
          <h3>Summary</h3>
          <div className="summary-result">{summary}</div>
          
          {(processingTime || modelUsed) && (
            <div className="result-metadata">
              {processingTime && (
                <div className="metadata-item">
                  <FiClock className="icon" />
                  Processed in {processingTime.toFixed(2)} seconds
                </div>
              )}
              {modelUsed && (
                <div className="metadata-item">
                  <FiCpu className="icon" />
                  Model: {modelUsed}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Summarizer; 