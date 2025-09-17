import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiType } from 'react-icons/fi';
import SentimentAnalysisDashboard from '../components/SentimentAnalysisDashboard';
import '../styles/SentimentAnalysisPage.css';

const SentimentAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);

  const handleAnalysisComplete = (data: any) => {
    console.log('Sentiment analysis completed:', data);
    // You could save the results, show notifications, etc.
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      setIsInputVisible(false);
    }
  };

  return (
    <div className="sentiment-analysis-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Home
        </button>
        
        <div className="header-actions">
          <button 
            onClick={() => setIsInputVisible(!isInputVisible)}
            className="action-button"
          >
            <FiType /> Add Text
          </button>
          <button className="action-button">
            <FiUpload /> Upload File
          </button>
        </div>
      </div>

      {/* Text Input Modal */}
      {isInputVisible && (
        <div className="text-input-modal">
          <div className="modal-content">
            <h3>Enter Text for Sentiment Analysis</h3>
            <form onSubmit={handleTextSubmit}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type the text you want to analyze for sentiment..."
                rows={8}
                className="text-input"
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setIsInputVisible(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="analyze-btn" disabled={!inputText.trim()}>
                  Analyze Sentiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SentimentAnalysisDashboard 
        text={inputText}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  );
};

export default SentimentAnalysisPage;
