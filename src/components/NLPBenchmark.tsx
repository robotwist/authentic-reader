import React, { useState } from 'react';
import { runBenchmark, formatBenchmarkResults, getNLPServiceHealth, BenchmarkResult } from '../utils/benchmarkUtils';

const SAMPLE_TEXT = `
The recent developments in artificial intelligence have sparked debates about ethics and governance. 
Companies like OpenAI, Google, and Microsoft are investing billions in research and development.
Meanwhile, politicians in Washington D.C. and Brussels are drafting regulations to address concerns 
about privacy, bias, and the potential impact on jobs. The rapid advancement of large language models 
has surprised even experts in the field, with capabilities improving at an unprecedented rate.
`;

const NLPBenchmark: React.FC = () => {
  const [results, setResults] = useState<BenchmarkResult | null>(null);
  const [formattedResults, setFormattedResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [labels, setLabels] = useState<string>('technology, politics, ethics, business');

  const handleRunBenchmark = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check service health first
      const health = await getNLPServiceHealth();
      setServiceStatus(health);
      
      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error('NLP service is not available');
      }
      
      // Run the benchmark
      const labelArray = labels.split(',').map(l => l.trim()).filter(l => l);
      const benchmarkResults = await runBenchmark(text, labelArray);
      
      // Format and display results
      setResults(benchmarkResults);
      setFormattedResults(formatBenchmarkResults(benchmarkResults));
    } catch (err: any) {
      setError(err.message || 'Failed to run benchmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nlp-benchmark">
      <h2>NLP Performance Benchmark</h2>
      <p>
        Compare the performance of Hugging Face models with ONNX Runtime optimized versions.
      </p>
      
      {/* Service status */}
      {serviceStatus && (
        <div className={`service-status status-${serviceStatus.status}`}>
          <h3>NLP Service Status: {serviceStatus.status}</h3>
          {serviceStatus.zero_shot_model && (
            <div>
              <p>Zero-Shot Model: {serviceStatus.zero_shot_model.name}</p>
              <p>Using ONNX: {serviceStatus.zero_shot_model.using_onnx ? 'Yes' : 'No'}</p>
            </div>
          )}
          {serviceStatus.ner_model && (
            <div>
              <p>NER Model: {serviceStatus.ner_model.name}</p>
              <p>Using ONNX: {serviceStatus.ner_model.using_onnx ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="benchmark-form">
        <div className="form-group">
          <label htmlFor="benchmark-text">Text to analyze:</label>
          <textarea 
            id="benchmark-text" 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            rows={6}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="benchmark-labels">Labels (comma-separated):</label>
          <input 
            type="text" 
            id="benchmark-labels" 
            value={labels} 
            onChange={(e) => setLabels(e.target.value)}
          />
        </div>
        
        <button 
          onClick={handleRunBenchmark} 
          disabled={isLoading || !text.trim()}
        >
          {isLoading ? 'Running Benchmark...' : 'Run Benchmark'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {formattedResults && (
        <div className="benchmark-results">
          <div className="markdown-container">
            <pre>{formattedResults}</pre>
          </div>
          
          {results && results.zero_shot.speedup && results.ner.speedup && (
            <div className="summary">
              <h3>Summary</h3>
              <p>
                ONNX Runtime provides a {Math.round((results.zero_shot.speedup + results.ner.speedup) / 2 * 100) / 100}x
                average speedup across all models, demonstrating significant performance improvements
                for production deployments.
              </p>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .nlp-benchmark {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .service-status {
          margin: 20px 0;
          padding: 15px;
          border-radius: 5px;
        }
        
        .status-healthy {
          background-color: #e6ffe6;
          border: 1px solid #99cc99;
        }
        
        .status-degraded {
          background-color: #fff9e6;
          border: 1px solid #ffcc99;
        }
        
        .status-critical, .status-unavailable {
          background-color: #ffe6e6;
          border: 1px solid #cc9999;
        }
        
        .benchmark-form {
          margin: 20px 0;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        textarea, input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #cc0000;
          margin: 15px 0;
        }
        
        .benchmark-results {
          margin-top: 30px;
        }
        
        .markdown-container {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          overflow-x: auto;
        }
        
        pre {
          margin: 0;
          white-space: pre-wrap;
        }
        
        .summary {
          margin-top: 20px;
          padding: 15px;
          background-color: #e6f7ff;
          border: 1px solid #91d5ff;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default NLPBenchmark; 