// @ts-ignore
import React, { useState } from 'react';
import '../styles/AnalysisTest.css';
import { analyzeContent } from '../services/contentAnalysisService';
import ArticleAnalysis from './ArticleAnalysis';
import { ContentAnalysisResult } from '../types';

const AnalysisTest: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [testTitle, setTestTitle] = useState<string>('Test Article');
  const [testSource, setTestSource] = useState<string>('Sample Source');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeContent(content);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setContent(clipboardText);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      alert('Unable to access clipboard. Please paste content manually.');
    }
  };
  
  const handleSampleArticle = () => {
    // Emotionally-rich sample article that will trigger multiple analysis features
    const sampleArticle = `
    # The Impending Climate Catastrophe: Why You Should Be Terrified
    
    In an absolutely shocking turn of events, scientists have discovered that we have ONLY FIVE YEARS LEFT before climate change becomes irreversible. This is outrageous and completely unacceptable!
    
    ## The Horrifying Truth
    
    The data is crystal clear - our planet is on the brink of disaster, and nobody seems to care! Politicians continue to ignore the imminent threat while oil companies rake in record profits. It's disgusting how they prioritize money over our children's future.
    
    The liberal agenda has been pushing for climate action for decades, but conservative interests have consistently blocked progress. This is nothing short of criminal negligence that will lead to the suffering of millions.
    
    ## Why You Should Be Afraid
    
    What if I told you that within your lifetime:
    - Coastal cities will be underwater, creating millions of climate refugees
    - Extreme weather will make large portions of Earth uninhabitable
    - Food shortages will lead to global conflict and societal collapse
    - Your children will live in a dystopian world because of today's inaction
    
    The evidence is absolutely clear - this is an emergency situation requiring immediate action. Anyone who denies this is either ignorant or deliberately spreading misinformation.
    
    ## Act Now or Regret Forever
    
    We must demand action immediately before it's too late. This is your last chance to make a difference before we reach the point of no return.
    
    If you're not terrified, you're not paying attention. Share this article now to wake people up to the horrifying reality we face!
    
    The clock is ticking, and we're running out of time. The future of humanity depends on what we do right now.
    `;

    setContent(sampleArticle);
    setTestTitle('The Impending Climate Catastrophe: Why You Should Be Terrified');
    setTestSource('Climate Awareness Network');
  };
  
  return (
    <div className="analysis-test-container">
      <div className="instruction-panel">
        <h2>Authentic Reader Analysis Test</h2>
        <p>This tool allows you to test the content analysis algorithms on any text. The analysis includes:</p>
        <ul>
          <li>Logical fallacy detection</li>
          <li>Bias analysis</li>
          <li>Doomscroll and outrage bait detection</li>
          <li>Emotional appeals analysis</li>
          <li>Content quality metrics</li>
        </ul>
        <p>You can paste your own text below or use our emotionally-charged sample article that triggers multiple analysis features.</p>
      </div>
      
      <div className="test-panel">
        <div className="form-group">
          <label htmlFor="title">Article Title:</label>
          <input 
            type="text" 
            id="title" 
            value={testTitle} 
            onChange={(e) => setTestTitle(e.target.value)} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="source">Source:</label>
          <input 
            type="text" 
            id="source" 
            value={testSource} 
            onChange={(e) => setTestSource(e.target.value)} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content:</label>
          <textarea 
            id="content" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            rows={15} 
            placeholder="Paste article content here..."
          ></textarea>
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <div className="button-group">
          <button 
            className="sample-button" 
            onClick={handleSampleArticle}
          >
            Load Sample Article
          </button>
          <button 
            className="analyze-button" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
          </button>
        </div>
      </div>
      
      {analysisResult && (
        <div className="result-panel">
          <h2>Analysis Results</h2>
          <div className="result-instructions">
            <p>Click on the tabs below to explore different aspects of the analysis:</p>
            <ul>
              <li><strong>Logical Fallacies:</strong> Reasoning errors in the content</li>
              <li><strong>Bias Analysis:</strong> Political leaning and framing</li>
              <li><strong>Content Metrics:</strong> Statistics and content quality factors</li>
              <li><strong>Manipulation:</strong> Doomscroll and outrage bait detection</li>
              <li><strong>Emotions:</strong> Detailed emotional content and appeals analysis</li>
            </ul>
          </div>
          <ArticleAnalysis
            title={testTitle}
            source={testSource}
            author="Test Author"
            date={new Date().toISOString()}
            analysis={analysisResult}
          />
        </div>
      )}
    </div>
  );
};

export default AnalysisTest; 