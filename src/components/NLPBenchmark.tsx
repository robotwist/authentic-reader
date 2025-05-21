import React, { useState } from 'react';
import { runBenchmark, formatBenchmarkResults, getNLPServiceHealth, BenchmarkResult } from '../utils/benchmarkUtils';
import '../styles/NLPBenchmark.css'; // We'll create this file next

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
          className="benchmark-button"
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
    </div>
  );
};

export default NLPBenchmark; 