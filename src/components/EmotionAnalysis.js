import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '../styles/EmotionAnalysis.css';
const EmotionAnalysis = ({ emotionAnalysis, sentiment }) => {
    if (!emotionAnalysis || !emotionAnalysis.success) {
        return (_jsx("div", { className: "emotion-analysis empty", children: emotionAnalysis?.error ?
                `Error analyzing emotions: ${emotionAnalysis.error}` :
                'Emotion analysis not available' }));
    }
    // Helper function to get CSS class for appeal score
    const getAppealLevelClass = (value) => {
        if (value >= 75)
            return 'very-high';
        if (value >= 50)
            return 'high';
        if (value >= 25)
            return 'moderate';
        if (value >= 10)
            return 'low';
        return 'very-low';
    };
    // Helper function to format emotion name
    const formatEmotionName = (name) => {
        return name.charAt(0).toUpperCase() + name.slice(1);
    };
    // Helper function to get sentiment tone color
    const getSentimentColor = (label) => {
        switch (label.toLowerCase()) {
            case 'positive': return '#4CAF50';
            case 'negative': return '#F44336';
            case 'neutral': return '#9E9E9E';
            default: return '#9E9E9E';
        }
    };
    // Get emotion color based on type
    const getEmotionColor = (type) => {
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
    return (_jsxs("div", { className: "emotion-analysis", children: [_jsx("h3", { children: "Emotional Analysis" }), _jsxs("div", { className: "emotion-summary", children: [_jsxs("div", { className: "emotional-appeal", children: [_jsx("h4", { children: "Emotional Appeal" }), _jsx("div", { className: `appeal-value ${getAppealLevelClass(emotionAnalysis.emotionalAppeal)}`, children: emotionAnalysis.emotionalAppeal >= 75 ? 'Very High' :
                                    emotionAnalysis.emotionalAppeal >= 50 ? 'High' :
                                        emotionAnalysis.emotionalAppeal >= 25 ? 'Moderate' :
                                            emotionAnalysis.emotionalAppeal >= 10 ? 'Low' : 'Very Low' }), _jsxs("div", { className: "numeric-value", children: ["(", emotionAnalysis.emotionalAppeal, "%)"] })] }), emotionAnalysis.dominantEmotion && (_jsxs("div", { className: "dominant-emotion", children: [_jsx("h4", { children: "Dominant Emotion" }), _jsx("div", { className: "dominant-value", style: { color: getEmotionColor(emotionAnalysis.dominantEmotion.type) }, children: formatEmotionName(emotionAnalysis.dominantEmotion.type) }), _jsxs("div", { className: "numeric-value", children: ["(", (emotionAnalysis.dominantEmotion.score * 100).toFixed(0), "%)"] })] })), sentiment && (_jsxs("div", { className: "sentiment-summary", children: [_jsx("h4", { children: "Sentiment" }), _jsx("div", { className: "sentiment-value-summary", style: { color: getSentimentColor(sentiment.label) }, children: sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1) }), _jsxs("div", { className: "numeric-value", children: ["(", Math.abs(sentiment.score * 100).toFixed(0), "%)"] })] }))] }), emotionAnalysis.emotions.length > 0 && (_jsxs("div", { className: "emotions-container", children: [_jsx("h4", { children: "Emotions Detected" }), _jsx("div", { className: "emotions-grid", children: emotionAnalysis.emotions.map((emotion, index) => (_jsxs("div", { className: "emotion-item", children: [_jsx("div", { className: "emotion-name", children: formatEmotionName(emotion.type) }), _jsx("div", { className: "emotion-bar", style: {
                                        width: `${emotion.score * 100}%`,
                                        backgroundColor: getEmotionColor(emotion.type)
                                    } }), _jsxs("div", { className: "emotion-value", children: [emotion.label, " (", (emotion.score * 100).toFixed(0), "%)"] })] }, index))) })] })), _jsxs("div", { className: "emotion-explanation", children: [_jsx("h4", { children: "What This Means" }), _jsx("p", { children: "This analysis identifies the emotional content of the article using AI-powered emotion detection. Content with high emotional appeal may be designed to trigger emotional reactions rather than promote rational thinking." }), _jsxs("p", { children: [_jsx("strong", { children: "Tip:" }), " Be mindful of content that heavily uses emotions like fear, anger, or outrage, as these can be used to manipulate readers and bypass critical thinking."] })] })] }));
};
export default EmotionAnalysis;
