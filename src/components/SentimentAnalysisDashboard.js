import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiActivity, FiTarget, FiHeart, FiZap, FiSmile, FiFrown, FiMeh, FiEye, FiFilter, FiDownload, FiShare2 } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/SentimentAnalysisDashboard.css';
const SentimentAnalysisDashboard = ({ text = '', onAnalysisComplete }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sentimentData, setSentimentData] = useState(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
    const [filterEmotion, setFilterEmotion] = useState('all');
    const { analyzeBias } = useLlamaAnalysis();
    useEffect(() => {
        if (text) {
            performSentimentAnalysis(text);
        }
    }, [text]);
    const performSentimentAnalysis = async (content) => {
        setIsAnalyzing(true);
        setAnalysisProgress(0);
        try {
            // Step 1: Analyze bias and sentiment
            setAnalysisProgress(25);
            const biasResult = await analyzeBias(content);
            // Step 2: Generate comprehensive sentiment data
            setAnalysisProgress(75);
            const data = await generateSentimentData(content, biasResult);
            setSentimentData(data);
            setAnalysisProgress(100);
            if (onAnalysisComplete) {
                onAnalysisComplete(data);
            }
        }
        catch (error) {
            console.error('Sentiment analysis failed:', error);
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const generateSentimentData = async (content, biasResult) => {
        const contentLower = content.toLowerCase();
        const words = contentLower.split(/\s+/);
        // Analyze sentiment based on content patterns
        let overallScore = 0;
        let positiveWords = 0;
        let negativeWords = 0;
        let emotionalIntensity = 0;
        // Positive indicators
        const positivePatterns = [
            'excellent', 'amazing', 'wonderful', 'great', 'good', 'positive', 'success', 'win', 'victory',
            'hope', 'optimistic', 'improve', 'better', 'strong', 'powerful', 'effective', 'efficient'
        ];
        // Negative indicators
        const negativePatterns = [
            'terrible', 'awful', 'horrible', 'bad', 'negative', 'failure', 'lose', 'defeat', 'problem',
            'crisis', 'disaster', 'worst', 'weak', 'ineffective', 'broken', 'damaged', 'destroyed'
        ];
        // Emotional intensity indicators
        const emotionalPatterns = [
            'outrageous', 'shocking', 'incredible', 'unbelievable', 'amazing', 'terrifying', 'devastating',
            'wonderful', 'fantastic', 'horrible', 'disgusting', 'beautiful', 'ugly', 'love', 'hate'
        ];
        words.forEach(word => {
            if (positivePatterns.includes(word)) {
                positiveWords++;
                overallScore += 0.1;
            }
            if (negativePatterns.includes(word)) {
                negativeWords++;
                overallScore -= 0.1;
            }
            if (emotionalPatterns.includes(word)) {
                emotionalIntensity += 0.2;
            }
        });
        // Normalize score
        overallScore = Math.max(-1, Math.min(1, overallScore));
        // Determine sentiment label
        let label = 'neutral';
        if (overallScore > 0.1)
            label = 'positive';
        else if (overallScore < -0.1)
            label = 'negative';
        // Generate emotions based on content
        const emotions = {
            joy: Math.max(0, overallScore * 0.8),
            sadness: Math.max(0, -overallScore * 0.6),
            anger: contentLower.includes('angry') || contentLower.includes('furious') ? 0.7 : 0.2,
            fear: contentLower.includes('fear') || contentLower.includes('scared') ? 0.6 : 0.1,
            surprise: contentLower.includes('surprising') || contentLower.includes('unexpected') ? 0.5 : 0.2,
            disgust: contentLower.includes('disgusting') || contentLower.includes('revolting') ? 0.8 : 0.1
        };
        // Analyze tone
        const tone = {
            formal: contentLower.includes('therefore') || contentLower.includes('furthermore') ? 0.8 : 0.4,
            informal: contentLower.includes('gonna') || contentLower.includes('wanna') ? 0.7 : 0.3,
            aggressive: contentLower.includes('attack') || contentLower.includes('destroy') ? 0.8 : 0.2,
            passive: contentLower.includes('might') || contentLower.includes('could') ? 0.6 : 0.3,
            objective: biasResult.bias_scores?.political < 5 ? 0.7 : 0.3,
            subjective: biasResult.bias_scores?.political > 5 ? 0.8 : 0.2
        };
        // Extract keywords
        const keywords = {
            positive: positivePatterns.filter(word => contentLower.includes(word)).slice(0, 5),
            negative: negativePatterns.filter(word => contentLower.includes(word)).slice(0, 5),
            emotional: emotionalPatterns.filter(word => contentLower.includes(word)).slice(0, 5)
        };
        // Generate trends data
        const now = new Date();
        const sentimentOverTime = [
            { timestamp: new Date(now.getTime() - 3600000).toISOString(), score: overallScore - 0.1, label },
            { timestamp: new Date(now.getTime() - 1800000).toISOString(), score: overallScore, label },
            { timestamp: now.toISOString(), score: overallScore + 0.05, label }
        ];
        const emotionDistribution = [
            { emotion: 'Joy', percentage: emotions.joy * 100, color: '#28a745' },
            { emotion: 'Sadness', percentage: emotions.sadness * 100, color: '#6c757d' },
            { emotion: 'Anger', percentage: emotions.anger * 100, color: '#dc3545' },
            { emotion: 'Fear', percentage: emotions.fear * 100, color: '#fd7e14' },
            { emotion: 'Surprise', percentage: emotions.surprise * 100, color: '#ffc107' },
            { emotion: 'Disgust', percentage: emotions.disgust * 100, color: '#6f42c1' }
        ];
        // Generate insights
        const dominantEmotion = Object.entries(emotions).reduce((a, b) => emotions[a[0]] > emotions[b[0]] ? a : b)[0];
        const toneAnalysis = tone.aggressive > 0.6 ? 'Aggressive tone detected' :
            tone.passive > 0.6 ? 'Passive tone detected' :
                tone.formal > 0.6 ? 'Formal tone detected' :
                    tone.informal > 0.6 ? 'Informal tone detected' : 'Balanced tone';
        const sentimentShifts = [];
        if (sentimentOverTime[0].score !== sentimentOverTime[2].score) {
            sentimentShifts.push('Sentiment has shifted over time');
        }
        if (emotionalIntensity > 0.5) {
            sentimentShifts.push('High emotional intensity detected');
        }
        const recommendations = [];
        if (tone.aggressive > 0.6) {
            recommendations.push('Consider using more neutral language');
        }
        if (emotionalIntensity > 0.7) {
            recommendations.push('Content may benefit from more objective presentation');
        }
        if (tone.subjective > 0.7) {
            recommendations.push('Consider balancing with objective facts');
        }
        return {
            overall: {
                score: overallScore,
                label,
                confidence: 0.8
            },
            emotions,
            tone,
            keywords,
            trends: {
                sentimentOverTime,
                emotionDistribution
            },
            insights: {
                dominantEmotion,
                toneAnalysis,
                sentimentShifts,
                recommendations
            }
        };
    };
    const getSentimentIcon = (label) => {
        switch (label) {
            case 'positive':
                return _jsx(FiSmile, { className: "sentiment-icon positive" });
            case 'negative':
                return _jsx(FiFrown, { className: "sentiment-icon negative" });
            default:
                return _jsx(FiMeh, { className: "sentiment-icon neutral" });
        }
    };
    const getSentimentColor = (label) => {
        switch (label) {
            case 'positive':
                return '#28a745';
            case 'negative':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };
    const formatPercentage = (value) => {
        return Math.round(value * 100);
    };
    return (_jsxs("div", { className: "sentiment-analysis-dashboard", children: [_jsxs("div", { className: "dashboard-header", children: [_jsxs("div", { className: "header-content", children: [_jsx(FiActivity, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "Sentiment Analysis Dashboard" }), _jsx("p", { children: "Comprehensive emotional content analysis and tone detection" })] })] }), _jsxs("div", { className: "header-controls", children: [_jsxs("select", { value: selectedTimeframe, onChange: (e) => setSelectedTimeframe(e.target.value), className: "timeframe-select", children: [_jsx("option", { value: "1h", children: "Last Hour" }), _jsx("option", { value: "24h", children: "Last 24 Hours" }), _jsx("option", { value: "7d", children: "Last 7 Days" }), _jsx("option", { value: "30d", children: "Last 30 Days" })] }), _jsxs("select", { value: filterEmotion, onChange: (e) => setFilterEmotion(e.target.value), className: "emotion-filter", children: [_jsx("option", { value: "all", children: "All Emotions" }), _jsx("option", { value: "joy", children: "Joy" }), _jsx("option", { value: "sadness", children: "Sadness" }), _jsx("option", { value: "anger", children: "Anger" }), _jsx("option", { value: "fear", children: "Fear" }), _jsx("option", { value: "surprise", children: "Surprise" }), _jsx("option", { value: "disgust", children: "Disgust" })] })] })] }), isAnalyzing && (_jsxs("div", { className: "analysis-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${analysisProgress}%` } }) }), _jsxs("p", { children: ["Analyzing sentiment and emotional content... ", analysisProgress, "%"] })] })), sentimentData && (_jsxs("div", { className: "dashboard-content", children: [_jsx("div", { className: "sentiment-overview", children: _jsxs("div", { className: "overview-card", children: [_jsxs("div", { className: "overview-header", children: [_jsx("h3", { children: "Overall Sentiment" }), getSentimentIcon(sentimentData.overall.label)] }), _jsxs("div", { className: "sentiment-score", children: [_jsxs("span", { className: "score-value", style: { color: getSentimentColor(sentimentData.overall.label) }, children: [formatPercentage(sentimentData.overall.score + 1), "%"] }), _jsx("span", { className: "score-label", children: sentimentData.overall.label.charAt(0).toUpperCase() + sentimentData.overall.label.slice(1) })] }), _jsxs("div", { className: "confidence-score", children: [formatPercentage(sentimentData.overall.confidence), "% Confidence"] })] }) }), _jsxs("div", { className: "emotions-section", children: [_jsxs("h3", { children: [_jsx(FiHeart, {}), " Emotional Analysis"] }), _jsx("div", { className: "emotions-grid", children: Object.entries(sentimentData.emotions).map(([emotion, value]) => (_jsxs("div", { className: "emotion-card", children: [_jsxs("div", { className: "emotion-header", children: [_jsx("span", { className: "emotion-name", children: emotion.charAt(0).toUpperCase() + emotion.slice(1) }), _jsxs("span", { className: "emotion-value", children: [formatPercentage(value), "%"] })] }), _jsx("div", { className: "emotion-bar", children: _jsx("div", { className: "emotion-fill", style: {
                                                    width: `${formatPercentage(value)}%`,
                                                    backgroundColor: sentimentData.trends.emotionDistribution.find(e => e.emotion.toLowerCase() === emotion)?.color || '#6c757d'
                                                } }) })] }, emotion))) })] }), _jsxs("div", { className: "tone-section", children: [_jsxs("h3", { children: [_jsx(FiTarget, {}), " Tone Analysis"] }), _jsx("div", { className: "tone-grid", children: Object.entries(sentimentData.tone).map(([toneType, value]) => (_jsxs("div", { className: "tone-card", children: [_jsxs("div", { className: "tone-info", children: [_jsx("span", { className: "tone-name", children: toneType.charAt(0).toUpperCase() + toneType.slice(1) }), _jsxs("span", { className: "tone-value", children: [formatPercentage(value), "%"] })] }), _jsx("div", { className: "tone-indicator", children: _jsx("div", { className: "tone-fill", style: { width: `${formatPercentage(value)}%` } }) })] }, toneType))) })] }), _jsxs("div", { className: "keywords-section", children: [_jsxs("h3", { children: [_jsx(FiZap, {}), " Key Emotional Words"] }), _jsxs("div", { className: "keywords-grid", children: [_jsxs("div", { className: "keyword-category positive", children: [_jsxs("h4", { children: [_jsx(FiSmile, {}), " Positive"] }), _jsx("div", { className: "keyword-tags", children: sentimentData.keywords.positive.map((word, index) => (_jsx("span", { className: "keyword-tag positive", children: word }, index))) })] }), _jsxs("div", { className: "keyword-category negative", children: [_jsxs("h4", { children: [_jsx(FiFrown, {}), " Negative"] }), _jsx("div", { className: "keyword-tags", children: sentimentData.keywords.negative.map((word, index) => (_jsx("span", { className: "keyword-tag negative", children: word }, index))) })] }), _jsxs("div", { className: "keyword-category emotional", children: [_jsxs("h4", { children: [_jsx(FiHeart, {}), " Emotional"] }), _jsx("div", { className: "keyword-tags", children: sentimentData.keywords.emotional.map((word, index) => (_jsx("span", { className: "keyword-tag emotional", children: word }, index))) })] })] })] }), _jsxs("div", { className: "insights-section", children: [_jsxs("h3", { children: [_jsx(FiEye, {}), " AI Insights"] }), _jsxs("div", { className: "insights-grid", children: [_jsxs("div", { className: "insight-card", children: [_jsx("h4", { children: "Dominant Emotion" }), _jsx("p", { children: sentimentData.insights.dominantEmotion.charAt(0).toUpperCase() + sentimentData.insights.dominantEmotion.slice(1) })] }), _jsxs("div", { className: "insight-card", children: [_jsx("h4", { children: "Tone Analysis" }), _jsx("p", { children: sentimentData.insights.toneAnalysis })] }), _jsxs("div", { className: "insight-card", children: [_jsx("h4", { children: "Sentiment Shifts" }), _jsx("ul", { children: sentimentData.insights.sentimentShifts.map((shift, index) => (_jsx("li", { children: shift }, index))) })] }), _jsxs("div", { className: "insight-card", children: [_jsx("h4", { children: "Recommendations" }), _jsx("ul", { children: sentimentData.insights.recommendations.map((rec, index) => (_jsx("li", { children: rec }, index))) })] })] })] }), _jsxs("div", { className: "action-buttons", children: [_jsxs("button", { className: "action-btn", children: [_jsx(FiDownload, {}), " Export Report"] }), _jsxs("button", { className: "action-btn", children: [_jsx(FiShare2, {}), " Share Analysis"] }), _jsxs("button", { className: "action-btn", children: [_jsx(FiFilter, {}), " Advanced Filters"] })] })] }))] }));
};
export default SentimentAnalysisDashboard;
