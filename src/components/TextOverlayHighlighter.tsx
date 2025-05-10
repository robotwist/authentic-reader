import React, { useState, useEffect } from 'react';
import { ContentAnalysisResult, LogicalFallacy, BiasType } from '../services/contentAnalysisService';
import '../styles/TextOverlayHighlighter.css';

interface HighlightSpan {
  startIndex: number;
  endIndex: number;
  type: 'bias' | 'fallacy' | 'emotion' | 'manipulation';
  category: string;
  score: number;
  details: any;
}

interface TextOverlayHighlighterProps {
  text: string;
  analysis: ContentAnalysisResult;
  selectedHighlightTypes: string[];
}

const TextOverlayHighlighter: React.FC<TextOverlayHighlighterProps> = ({
  text,
  analysis,
  selectedHighlightTypes = ['bias', 'fallacy', 'emotion', 'manipulation'],
}) => {
  const [highlights, setHighlights] = useState<HighlightSpan[]>([]);
  const [hoveredHighlight, setHoveredHighlight] = useState<HighlightSpan | null>(null);
  const [renderedContent, setRenderedContent] = useState<React.ReactNode[]>([]);

  // Process the text and analysis to create highlight spans
  useEffect(() => {
    const newHighlights: HighlightSpan[] = [];
    
    // Extract logical fallacies
    if (selectedHighlightTypes.includes('fallacy') && analysis.logicalFallacies) {
      analysis.logicalFallacies.forEach(fallacy => {
        if (fallacy.startIndex >= 0 && fallacy.endIndex <= text.length) {
          newHighlights.push({
            startIndex: fallacy.startIndex,
            endIndex: fallacy.endIndex,
            type: 'fallacy',
            category: fallacy.type.toString(),
            score: fallacy.confidence,
            details: fallacy
          });
        }
      });
    }
    
    // Add more highlight types here: bias indicators, emotional content, manipulative language
    // For now, let's add some example emotional content detection
    if (selectedHighlightTypes.includes('emotion') && analysis.emotionalAppeals) {
      // This would need actual text matching from your sentiment analysis
      // For demonstration, let's assume we have some simple pattern matching
      Object.entries(analysis.emotionalAppeals).forEach(([emotion, score]) => {
        if (score > 0.6) { // Only highlight strong emotions
          // Here we would need actual spans from NLP analysis
          // For now, we'll use a simple regex to find potential emotional words
          const emotionWords = getEmotionWords(emotion);
          emotionWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
              newHighlights.push({
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                type: 'emotion',
                category: emotion,
                score: score,
                details: { emotion, word }
              });
            }
          });
        }
      });
    }

    // Sort highlights by start index
    newHighlights.sort((a, b) => a.startIndex - b.startIndex);
    setHighlights(newHighlights);
  }, [text, analysis, selectedHighlightTypes]);

  // Render the content with highlights
  useEffect(() => {
    if (text && highlights) {
      const content: React.ReactNode[] = [];
      let lastIndex = 0;

      highlights.forEach((highlight, index) => {
        // Add text before the highlight
        if (highlight.startIndex > lastIndex) {
          content.push(
            <span key={`text-${lastIndex}`} className="regular-text">
              {text.substring(lastIndex, highlight.startIndex)}
            </span>
          );
        }

        // Add the highlighted text
        const highlightClass = getHighlightClass(highlight);
        const intensity = getIntensityClass(highlight.score);
        
        content.push(
          <span
            key={`highlight-${index}`}
            className={`highlighted-text ${highlightClass} ${intensity}`}
            onMouseEnter={() => setHoveredHighlight(highlight)}
            onMouseLeave={() => setHoveredHighlight(null)}
            data-highlight-type={highlight.type}
            data-highlight-category={highlight.category}
          >
            {text.substring(highlight.startIndex, highlight.endIndex)}
          </span>
        );

        lastIndex = highlight.endIndex;
      });

      // Add any remaining text
      if (lastIndex < text.length) {
        content.push(
          <span key={`text-${lastIndex}`} className="regular-text">
            {text.substring(lastIndex)}
          </span>
        );
      }

      setRenderedContent(content);
    }
  }, [text, highlights]);

  // Helper functions
  const getHighlightClass = (highlight: HighlightSpan): string => {
    switch (highlight.type) {
      case 'fallacy':
        return `fallacy-highlight fallacy-${highlight.category.toLowerCase()}`;
      case 'bias':
        return `bias-highlight bias-${highlight.category.toLowerCase()}`;
      case 'emotion':
        return `emotion-highlight emotion-${highlight.category.toLowerCase()}`;
      case 'manipulation':
        return `manipulation-highlight`;
      default:
        return '';
    }
  };

  const getIntensityClass = (score: number): string => {
    if (score >= 0.8) return 'intensity-high';
    if (score >= 0.5) return 'intensity-medium';
    return 'intensity-low';
  };

  const getEmotionWords = (emotion: string): string[] => {
    // Simple mapping of emotions to related words
    const emotionWordMap: Record<string, string[]> = {
      'fear': ['fear', 'afraid', 'terrifying', 'scary', 'frightening', 'terrified', 'panic'],
      'anger': ['anger', 'angry', 'furious', 'outraged', 'rage', 'mad', 'frustrated'],
      'sadness': ['sad', 'depressed', 'gloomy', 'heartbreaking', 'devastating', 'tragic'],
      'joy': ['happy', 'joyful', 'excited', 'thrilled', 'delighted', 'wonderful'],
      'surprise': ['surprised', 'shocking', 'unexpected', 'astonishing', 'remarkable'],
      'disgust': ['disgusting', 'repulsive', 'revolting', 'offensive', 'vile'],
      'anticipation': ['anticipate', 'expect', 'awaiting', 'upcoming', 'looking forward'],
      'trust': ['trust', 'reliable', 'dependable', 'honest', 'credible'],
    };
    return emotionWordMap[emotion.toLowerCase()] || [];
  };

  // Tooltip display for hovered highlight
  const renderTooltip = () => {
    if (!hoveredHighlight) return null;

    let content = '';
    let title = '';

    switch (hoveredHighlight.type) {
      case 'fallacy':
        title = `Logical Fallacy: ${formatTitle(hoveredHighlight.category)}`;
        content = (hoveredHighlight.details.explanation as string) || 
                 'This appears to use a logical fallacy that may undermine the argument.';
        break;
      case 'bias':
        title = `Bias: ${formatTitle(hoveredHighlight.category)}`;
        content = 'This text shows indications of political or ideological bias.';
        break;
      case 'emotion':
        title = `Emotional Appeal: ${formatTitle(hoveredHighlight.category)}`;
        content = `This language appeals to ${hoveredHighlight.category.toLowerCase()} emotions, which may be used to influence your reaction.`;
        break;
      case 'manipulation':
        title = 'Potentially Manipulative Language';
        content = 'This language may be designed to manipulate your perspective.';
        break;
    }

    return (
      <div className="highlight-tooltip">
        <h4>{title}</h4>
        <p>{content}</p>
        <div className="confidence-meter">
          <div className="confidence-label">Confidence:</div>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ width: `${hoveredHighlight.score * 100}%` }}
            ></div>
          </div>
          <div className="confidence-percentage">{Math.round(hoveredHighlight.score * 100)}%</div>
        </div>
      </div>
    );
  };

  const formatTitle = (str: string): string => {
    return str.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="text-overlay-container">
      <div className="article-text-with-highlights">
        {renderedContent}
      </div>
      {hoveredHighlight && renderTooltip()}
    </div>
  );
};

export default TextOverlayHighlighter; 