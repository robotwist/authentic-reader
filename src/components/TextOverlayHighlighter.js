import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import '../styles/TextOverlayHighlighter.css';
const TextOverlayHighlighter = ({ text, analysis, selectedHighlightTypes = ['bias', 'fallacy', 'emotion', 'manipulation'], }) => {
    const [highlights, setHighlights] = useState([]);
    const [hoveredHighlight, setHoveredHighlight] = useState(null);
    const [renderedContent, setRenderedContent] = useState([]);
    // Process the text and analysis to create highlight spans
    useEffect(() => {
        const newHighlights = [];
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
            const content = [];
            let lastIndex = 0;
            highlights.forEach((highlight, index) => {
                // Add text before the highlight
                if (highlight.startIndex > lastIndex) {
                    content.push(_jsx("span", { className: "regular-text", children: text.substring(lastIndex, highlight.startIndex) }, `text-${lastIndex}`));
                }
                // Add the highlighted text
                const highlightClass = getHighlightClass(highlight);
                const intensity = getIntensityClass(highlight.score);
                content.push(_jsx("span", { className: `highlighted-text ${highlightClass} ${intensity}`, onMouseEnter: () => setHoveredHighlight(highlight), onMouseLeave: () => setHoveredHighlight(null), "data-highlight-type": highlight.type, "data-highlight-category": highlight.category, children: text.substring(highlight.startIndex, highlight.endIndex) }, `highlight-${index}`));
                lastIndex = highlight.endIndex;
            });
            // Add any remaining text
            if (lastIndex < text.length) {
                content.push(_jsx("span", { className: "regular-text", children: text.substring(lastIndex) }, `text-${lastIndex}`));
            }
            setRenderedContent(content);
        }
    }, [text, highlights]);
    // Helper functions
    const getHighlightClass = (highlight) => {
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
    const getIntensityClass = (score) => {
        if (score >= 0.8)
            return 'intensity-high';
        if (score >= 0.5)
            return 'intensity-medium';
        return 'intensity-low';
    };
    const getEmotionWords = (emotion) => {
        // Simple mapping of emotions to related words
        const emotionWordMap = {
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
        if (!hoveredHighlight)
            return null;
        let content = '';
        let title = '';
        switch (hoveredHighlight.type) {
            case 'fallacy':
                title = `Logical Fallacy: ${formatTitle(hoveredHighlight.category)}`;
                content = hoveredHighlight.details.explanation ||
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
        return (_jsxs("div", { className: "highlight-tooltip", children: [_jsx("h4", { children: title }), _jsx("p", { children: content }), _jsxs("div", { className: "confidence-meter", children: [_jsx("div", { className: "confidence-label", children: "Confidence:" }), _jsx("div", { className: "confidence-bar", children: _jsx("div", { className: "confidence-fill", style: { width: `${hoveredHighlight.score * 100}%` } }) }), _jsxs("div", { className: "confidence-percentage", children: [Math.round(hoveredHighlight.score * 100), "%"] })] })] }));
    };
    const formatTitle = (str) => {
        return str.replace(/_/g, ' ').toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    return (_jsxs("div", { className: "text-overlay-container", children: [_jsx("div", { className: "article-text-with-highlights", children: renderedContent }), hoveredHighlight && renderTooltip()] }));
};
export default TextOverlayHighlighter;
