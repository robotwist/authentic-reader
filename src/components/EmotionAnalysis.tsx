import * as React from 'react';
import { EmotionAnalysisResult, EmotionData } from '../services/emotionAnalysisService';
import '../styles/EmotionAnalysis.css';

interface EmotionAnalysisProps {
  emotionAnalysis: EmotionAnalysisResult | undefined;
  sentiment: {score: number, label: string} | undefined;
}

const EmotionAnalysis: React.FC<EmotionAnalysisProps> = ({ 
  emotionAnalysis, 
  sentiment 
}: EmotionAnalysisProps) => {
  if (!emotionAnalysis || !emotionAnalysis.success) {
    return (
      <div className="emotion-analysis empty">
        {emotionAnalysis?.error ? 
          `Error analyzing emotions: ${emotionAnalysis.error}` : 
          'Emotion analysis not available'}
      </div>
    );
  }

  // Helper function to get CSS class for appeal score
  const getAppealLevelClass = (value: number): string => {
    if (value >= 75) return 'very-high';
    if (value >= 50) return 'high';
    if (value >= 25) return 'moderate';
    if (value >= 10) return 'low';
    return 'very-low';
  };

  // Helper function to format emotion name
  const formatEmotionName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Helper function to get sentiment tone color
  const getSentimentColor = (label: string): string => {
    switch (label.toLowerCase()) {
      case 'positive': return '#4CAF50';
      case 'negative': return '#F44336';
      case 'neutral': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  // Get emotion color based on type
  const getEmotionColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'joy': return '#4CAF50';
      case 'sadness': return '#5C6BC0';
      case 'anger': return '#F44336';
      case 'fear': return '#FF9800';
      case 'surprise': return '#9C27B0';
      case 'disgust': return '#795548';
      case 'neutral': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="emotion-analysis">
      <h3>Emotional Analysis</h3>
      
      <div className="emotion-summary">
        <div className="emotional-appeal">
          <h4>Emotional Appeal</h4>
          <div className={`appeal-value ${getAppealLevelClass(emotionAnalysis.emotionalAppeal)}`}>
            {emotionAnalysis.emotionalAppeal >= 75 ? 'Very High' :
             emotionAnalysis.emotionalAppeal >= 50 ? 'High' :
             emotionAnalysis.emotionalAppeal >= 25 ? 'Moderate' :
             emotionAnalysis.emotionalAppeal >= 10 ? 'Low' : 'Very Low'}
          </div>
          <div className="numeric-value">({emotionAnalysis.emotionalAppeal}%)</div>
        </div>
        
        {emotionAnalysis.dominantEmotion && (
          <div className="dominant-emotion">
            <h4>Dominant Emotion</h4>
            <div 
              className="dominant-value" 
              style={{ color: getEmotionColor(emotionAnalysis.dominantEmotion.type) }}
            >
              {formatEmotionName(emotionAnalysis.dominantEmotion.type)}
            </div>
            <div className="numeric-value">({(emotionAnalysis.dominantEmotion.score * 100).toFixed(0)}%)</div>
          </div>
        )}
        
        {sentiment && (
          <div className="sentiment-summary">
            <h4>Sentiment</h4>
            <div 
              className="sentiment-value-summary" 
              style={{ color: getSentimentColor(sentiment.label) }}
            >
              {sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
            </div>
            <div className="numeric-value">({Math.abs(sentiment.score * 100).toFixed(0)}%)</div>
          </div>
        )}
      </div>
      
      {emotionAnalysis.emotions.length > 0 && (
        <div className="emotions-container">
          <h4>Emotions Detected</h4>
          <div className="emotions-grid">
            {emotionAnalysis.emotions.map((emotion: EmotionData, index: number) => (
              <div key={index} className="emotion-item">
                <div className="emotion-name">{formatEmotionName(emotion.type)}</div>
                <div 
                  className="emotion-bar" 
                  style={{ 
                    width: `${emotion.score * 100}%`,
                    backgroundColor: getEmotionColor(emotion.type)
                  }}
                ></div>
                <div className="emotion-value">{emotion.label} ({(emotion.score * 100).toFixed(0)}%)</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="emotion-explanation">
        <h4>What This Means</h4>
        <p>
          This analysis identifies the emotional content of the article using AI-powered emotion detection. 
          Content with high emotional appeal may be designed to trigger emotional reactions rather than promote 
          rational thinking.
        </p>
        <p>
          <strong>Tip:</strong> Be mindful of content that heavily uses emotions like fear, anger, or outrage, 
          as these can be used to manipulate readers and bypass critical thinking.
        </p>
      </div>
    </div>
  );
};

export default EmotionAnalysis; 