import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiBarChart2, FiTrendingUp, FiClock, FiBookOpen, FiTarget, FiShield, FiUsers, FiGlobe, FiActivity, FiAlertTriangle, FiCheckCircle, FiAward, FiZap } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/AnalyticsDashboard.css';
const AnalyticsDashboard = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('week');
    const [isLoading, setIsLoading] = useState(true);
    const [realTimeData, setRealTimeData] = useState(null);
    const { serviceStatus } = useLlamaAnalysis();
    useEffect(() => {
        // Simulate loading analytics data
        setTimeout(() => {
            setAnalyticsData(generateMockAnalyticsData());
            setIsLoading(false);
        }, 1000);
        // Set up real-time data updates
        const interval = setInterval(() => {
            updateRealTimeMetrics();
        }, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, [selectedTimeframe]);
    const updateRealTimeMetrics = () => {
        // Simulate real-time data updates
        setRealTimeData({
            currentSessionDuration: Math.floor(Math.random() * 60) + 10,
            articlesReadToday: Math.floor(Math.random() * 5) + 1,
            sourcesVisitedToday: Math.floor(Math.random() * 3) + 1,
            averageBiasToday: (Math.random() * 5) + 2
        });
    };
    const generateMockAnalyticsData = () => {
        return {
            totalArticlesRead: 247,
            totalReadingTime: 1840, // minutes
            averageSessionDuration: 23,
            mostReadSources: [
                { source: 'NPR', category: 'center', articlesRead: 45, averageBias: 2.1, lastRead: new Date(), reliability: 0.9 },
                { source: 'BBC News', category: 'center', articlesRead: 38, averageBias: 2.3, lastRead: new Date(), reliability: 0.85 },
                { source: 'Reuters', category: 'center', articlesRead: 32, averageBias: 1.8, lastRead: new Date(), reliability: 0.92 },
                { source: 'Fox News', category: 'right', articlesRead: 28, averageBias: 7.2, lastRead: new Date(), reliability: 0.6 },
                { source: 'MSNBC', category: 'left', articlesRead: 25, averageBias: 6.8, lastRead: new Date(), reliability: 0.65 }
            ],
            biasTrends: {
                political: [3.2, 2.8, 4.1, 3.5, 2.9, 3.8, 3.1],
                emotional: [4.5, 3.9, 5.2, 4.8, 4.1, 4.9, 4.3],
                cognitive: [2.1, 1.8, 2.5, 2.2, 1.9, 2.4, 2.0],
                dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            sourceDiversity: {
                categories: {
                    'center': 65,
                    'left': 20,
                    'right': 15
                },
                totalSources: 12
            },
            readingStreak: 7,
            weeklyProgress: {
                articles: 34,
                time: 280,
                sources: 8
            },
            // Enhanced metrics
            mediaLiteracyScore: 78,
            factCheckingFrequency: 15,
            comparativeAnalysisCount: 8,
            logicalFallaciesDetected: 23,
            rhetoricalDevicesIdentified: 31,
            credibilityAssessments: {
                high: 156,
                medium: 67,
                low: 24
            },
            readingInsights: {
                strengths: [
                    'Good source diversity with 65% center-leaning sources',
                    'Consistent reading habits with 7-day streak',
                    'Active fact-checking behavior'
                ],
                areasForImprovement: [
                    'Consider more right-leaning sources for balance',
                    'Increase comparative analysis usage',
                    'Focus on detecting logical fallacies'
                ],
                recommendations: [
                    'Add 2-3 right-leaning sources to your feed',
                    'Use comparative analysis for controversial topics',
                    'Practice identifying rhetorical devices'
                ]
            },
            realTimeMetrics: {
                currentSessionDuration: 15,
                articlesReadToday: 3,
                sourcesVisitedToday: 2,
                averageBiasToday: 3.2
            }
        };
    };
    const getBiasLevelText = (score) => {
        if (score < 3)
            return 'Very Low';
        if (score < 5)
            return 'Low';
        if (score < 7)
            return 'Moderate';
        if (score < 9)
            return 'High';
        return 'Very High';
    };
    const getBiasLevelColor = (score) => {
        if (score < 3)
            return '#28a745';
        if (score < 5)
            return '#5cb85c';
        if (score < 7)
            return '#ffc107';
        if (score < 9)
            return '#fd7e14';
        return '#dc3545';
    };
    const getMediaLiteracyLevel = (score) => {
        if (score >= 80)
            return { level: 'Expert', color: '#28a745', icon: _jsx(FiAward, {}) };
        if (score >= 60)
            return { level: 'Advanced', color: '#5cb85c', icon: _jsx(FiCheckCircle, {}) };
        if (score >= 40)
            return { level: 'Intermediate', color: '#ffc107', icon: _jsx(FiTarget, {}) };
        return { level: 'Beginner', color: '#fd7e14', icon: _jsx(FiAlertTriangle, {}) };
    };
    if (isLoading) {
        return (_jsx("div", { className: "analytics-dashboard", children: _jsxs("div", { className: "loading-spinner", children: [_jsx(FiActivity, { className: "spinner-icon" }), _jsx("p", { children: "Loading your reading analytics..." })] }) }));
    }
    const literacyLevel = getMediaLiteracyLevel(analyticsData?.mediaLiteracyScore || 0);
    return (_jsxs("div", { className: "analytics-dashboard", children: [_jsxs("div", { className: "dashboard-header", children: [_jsxs("h1", { children: [_jsx(FiBarChart2, { className: "header-icon" }), "Enhanced Reading Analytics Dashboard"] }), _jsx("p", { children: "Your personalized insights, reading patterns, and media literacy progress" }), _jsxs("div", { className: "timeframe-selector", children: [_jsx("button", { className: selectedTimeframe === 'week' ? 'active' : '', onClick: () => setSelectedTimeframe('week'), children: "Week" }), _jsx("button", { className: selectedTimeframe === 'month' ? 'active' : '', onClick: () => setSelectedTimeframe('month'), children: "Month" }), _jsx("button", { className: selectedTimeframe === 'year' ? 'active' : '', onClick: () => setSelectedTimeframe('year'), children: "Year" })] })] }), analyticsData && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "realtime-metrics", children: [_jsxs("h2", { children: [_jsx(FiZap, {}), " Live Session"] }), _jsxs("div", { className: "realtime-grid", children: [_jsxs("div", { className: "realtime-card", children: [_jsxs("span", { className: "realtime-value", children: [analyticsData.realTimeMetrics.currentSessionDuration, "m"] }), _jsx("span", { className: "realtime-label", children: "Current Session" })] }), _jsxs("div", { className: "realtime-card", children: [_jsx("span", { className: "realtime-value", children: analyticsData.realTimeMetrics.articlesReadToday }), _jsx("span", { className: "realtime-label", children: "Articles Today" })] }), _jsxs("div", { className: "realtime-card", children: [_jsx("span", { className: "realtime-value", children: analyticsData.realTimeMetrics.sourcesVisitedToday }), _jsx("span", { className: "realtime-label", children: "Sources Today" })] }), _jsxs("div", { className: "realtime-card", children: [_jsx("span", { className: "realtime-value", children: analyticsData.realTimeMetrics.averageBiasToday.toFixed(1) }), _jsx("span", { className: "realtime-label", children: "Avg Bias Today" })] })] })] }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiBookOpen, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h3", { children: analyticsData.totalArticlesRead }), _jsx("p", { children: "Articles Read" })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiClock, {}) }), _jsxs("div", { className: "metric-content", children: [_jsxs("h3", { children: [Math.round(analyticsData.totalReadingTime / 60), "h"] }), _jsx("p", { children: "Total Reading Time" })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiTarget, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h3", { children: analyticsData.readingStreak }), _jsx("p", { children: "Day Streak" })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiGlobe, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h3", { children: analyticsData.sourceDiversity.totalSources }), _jsx("p", { children: "Sources Visited" })] })] }), _jsxs("div", { className: "metric-card highlight", children: [_jsx("div", { className: "metric-icon", style: { color: literacyLevel.color }, children: literacyLevel.icon }), _jsxs("div", { className: "metric-content", children: [_jsx("h3", { children: analyticsData.mediaLiteracyScore }), _jsx("p", { children: "Media Literacy Score" }), _jsx("span", { className: "literacy-level", style: { color: literacyLevel.color }, children: literacyLevel.level })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: _jsx(FiShield, {}) }), _jsxs("div", { className: "metric-content", children: [_jsx("h3", { children: analyticsData.factCheckingFrequency }), _jsx("p", { children: "Fact Checks" })] })] })] }), _jsxs("div", { className: "dashboard-section", children: [_jsxs("h2", { children: [_jsx(FiActivity, { className: "section-icon" }), "Advanced Analytics"] }), _jsxs("div", { className: "advanced-analytics-grid", children: [_jsxs("div", { className: "analytics-card", children: [_jsx("h3", { children: "Credibility Assessment" }), _jsxs("div", { className: "credibility-chart", children: [_jsxs("div", { className: "credibility-item", children: [_jsx("span", { children: "High Credibility" }), _jsx("div", { className: "credibility-bar", children: _jsx("div", { className: "credibility-fill high", style: { width: `${(analyticsData.credibilityAssessments.high / analyticsData.totalArticlesRead) * 100}%` } }) }), _jsx("span", { children: analyticsData.credibilityAssessments.high })] }), _jsxs("div", { className: "credibility-item", children: [_jsx("span", { children: "Medium Credibility" }), _jsx("div", { className: "credibility-bar", children: _jsx("div", { className: "credibility-fill medium", style: { width: `${(analyticsData.credibilityAssessments.medium / analyticsData.totalArticlesRead) * 100}%` } }) }), _jsx("span", { children: analyticsData.credibilityAssessments.medium })] }), _jsxs("div", { className: "credibility-item", children: [_jsx("span", { children: "Low Credibility" }), _jsx("div", { className: "credibility-bar", children: _jsx("div", { className: "credibility-fill low", style: { width: `${(analyticsData.credibilityAssessments.low / analyticsData.totalArticlesRead) * 100}%` } }) }), _jsx("span", { children: analyticsData.credibilityAssessments.low })] })] })] }), _jsxs("div", { className: "analytics-card", children: [_jsx("h3", { children: "Analysis Usage" }), _jsxs("div", { className: "analysis-stats", children: [_jsxs("div", { className: "analysis-stat", children: [_jsx("span", { className: "stat-number", children: analyticsData.comparativeAnalysisCount }), _jsx("span", { className: "stat-label", children: "Comparative Analyses" })] }), _jsxs("div", { className: "analysis-stat", children: [_jsx("span", { className: "stat-number", children: analyticsData.logicalFallaciesDetected }), _jsx("span", { className: "stat-label", children: "Logical Fallacies Detected" })] }), _jsxs("div", { className: "analysis-stat", children: [_jsx("span", { className: "stat-number", children: analyticsData.rhetoricalDevicesIdentified }), _jsx("span", { className: "stat-label", children: "Rhetorical Devices Found" })] })] })] })] })] }), _jsxs("div", { className: "dashboard-section", children: [_jsxs("h2", { children: [_jsx(FiTarget, { className: "section-icon" }), "AI-Powered Insights"] }), _jsxs("div", { className: "insights-grid", children: [_jsxs("div", { className: "insight-card strengths", children: [_jsxs("h3", { children: [_jsx(FiCheckCircle, {}), " Your Strengths"] }), _jsx("ul", { children: analyticsData.readingInsights.strengths.map((strength, index) => (_jsx("li", { children: strength }, index))) })] }), _jsxs("div", { className: "insight-card improvements", children: [_jsxs("h3", { children: [_jsx(FiAlertTriangle, {}), " Areas for Improvement"] }), _jsx("ul", { children: analyticsData.readingInsights.areasForImprovement.map((area, index) => (_jsx("li", { children: area }, index))) })] }), _jsxs("div", { className: "insight-card recommendations", children: [_jsxs("h3", { children: [_jsx(FiTrendingUp, {}), " Recommendations"] }), _jsx("ul", { children: analyticsData.readingInsights.recommendations.map((rec, index) => (_jsx("li", { children: rec }, index))) })] })] })] }), _jsxs("div", { className: "dashboard-section", children: [_jsxs("h2", { children: [_jsx(FiShield, { className: "section-icon" }), "Bias Exposure Analysis"] }), _jsxs("div", { className: "bias-analysis-grid", children: [_jsxs("div", { className: "bias-trend-chart", children: [_jsx("h3", { children: "Bias Trends Over Time" }), _jsx("div", { className: "chart-container", children: analyticsData.biasTrends.dates.map((date, index) => (_jsxs("div", { className: "chart-bar-group", children: [_jsx("div", { className: "chart-label", children: date }), _jsxs("div", { className: "chart-bars", children: [_jsx("div", { className: "chart-bar political", style: {
                                                                        height: `${analyticsData.biasTrends.political[index] * 10}%`,
                                                                        backgroundColor: getBiasLevelColor(analyticsData.biasTrends.political[index])
                                                                    } }), _jsx("div", { className: "chart-bar emotional", style: {
                                                                        height: `${analyticsData.biasTrends.emotional[index] * 10}%`,
                                                                        backgroundColor: getBiasLevelColor(analyticsData.biasTrends.emotional[index])
                                                                    } }), _jsx("div", { className: "chart-bar cognitive", style: {
                                                                        height: `${analyticsData.biasTrends.cognitive[index] * 10}%`,
                                                                        backgroundColor: getBiasLevelColor(analyticsData.biasTrends.cognitive[index])
                                                                    } })] })] }, date))) }), _jsxs("div", { className: "chart-legend", children: [_jsx("span", { className: "legend-item political", children: "Political" }), _jsx("span", { className: "legend-item emotional", children: "Emotional" }), _jsx("span", { className: "legend-item cognitive", children: "Cognitive" })] })] }), _jsxs("div", { className: "bias-summary", children: [_jsx("h3", { children: "Average Bias Exposure" }), _jsxs("div", { className: "bias-summary-item", children: [_jsx("span", { children: "Political Bias:" }), _jsxs("span", { className: "bias-score", style: { color: getBiasLevelColor(3.2) }, children: [getBiasLevelText(3.2), " (3.2/10)"] })] }), _jsxs("div", { className: "bias-summary-item", children: [_jsx("span", { children: "Emotional Bias:" }), _jsxs("span", { className: "bias-score", style: { color: getBiasLevelColor(4.5) }, children: [getBiasLevelText(4.5), " (4.5/10)"] })] }), _jsxs("div", { className: "bias-summary-item", children: [_jsx("span", { children: "Cognitive Bias:" }), _jsxs("span", { className: "bias-score", style: { color: getBiasLevelColor(2.1) }, children: [getBiasLevelText(2.1), " (2.1/10)"] })] }), _jsxs("div", { className: "bias-insight", children: [_jsx("h4", { children: "AI Insight" }), _jsx("p", { children: "Your reading shows a healthy balance with moderate emotional bias exposure. Consider diversifying sources to reduce cognitive bias patterns." })] })] })] })] }), _jsxs("div", { className: "dashboard-section", children: [_jsxs("h2", { children: [_jsx(FiUsers, { className: "section-icon" }), "Source Diversity"] }), _jsxs("div", { className: "source-diversity-grid", children: [_jsxs("div", { className: "diversity-chart", children: [_jsx("h3", { children: "Reading Distribution" }), _jsx("div", { className: "pie-chart", children: Object.entries(analyticsData.sourceDiversity.categories).map(([category, percentage]) => (_jsx("div", { className: "pie-segment", style: {
                                                        background: `conic-gradient(${getCategoryColor(category)} 0deg ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`
                                                    }, children: _jsxs("div", { className: "segment-label", children: [category.charAt(0).toUpperCase() + category.slice(1), ": ", percentage, "%"] }) }, category))) })] }), _jsxs("div", { className: "top-sources", children: [_jsx("h3", { children: "Most Read Sources" }), _jsx("div", { className: "sources-list", children: analyticsData.mostReadSources.map((source, index) => (_jsxs("div", { className: "source-item", children: [_jsxs("div", { className: "source-rank", children: ["#", index + 1] }), _jsxs("div", { className: "source-info", children: [_jsx("div", { className: "source-name", children: source.source }), _jsxs("div", { className: "source-stats", children: [source.articlesRead, " articles \u2022", _jsxs("span", { style: { color: getBiasLevelColor(source.averageBias) }, children: [getBiasLevelText(source.averageBias), " bias"] })] })] })] }, source.source))) })] })] })] }), _jsxs("div", { className: "dashboard-section", children: [_jsxs("h2", { children: [_jsx(FiTrendingUp, { className: "section-icon" }), "This Week's Progress"] }), _jsxs("div", { className: "progress-grid", children: [_jsxs("div", { className: "progress-card", children: [_jsx("div", { className: "progress-icon", children: _jsx(FiBookOpen, {}) }), _jsxs("div", { className: "progress-content", children: [_jsx("h3", { children: analyticsData.weeklyProgress.articles }), _jsx("p", { children: "Articles Read" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${(analyticsData.weeklyProgress.articles / 50) * 100}%` } }) })] })] }), _jsxs("div", { className: "progress-card", children: [_jsx("div", { className: "progress-icon", children: _jsx(FiClock, {}) }), _jsxs("div", { className: "progress-content", children: [_jsxs("h3", { children: [analyticsData.weeklyProgress.time, "m"] }), _jsx("p", { children: "Reading Time" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${(analyticsData.weeklyProgress.time / 420) * 100}%` } }) })] })] }), _jsxs("div", { className: "progress-card", children: [_jsx("div", { className: "progress-icon", children: _jsx(FiGlobe, {}) }), _jsxs("div", { className: "progress-content", children: [_jsx("h3", { children: analyticsData.weeklyProgress.sources }), _jsx("p", { children: "Sources Visited" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${(analyticsData.weeklyProgress.sources / 15) * 100}%` } }) })] })] })] })] })] }))] }));
};
const getCategoryColor = (category) => {
    switch (category) {
        case 'center': return '#28a745';
        case 'left': return '#007bff';
        case 'right': return '#dc3545';
        default: return '#6c757d';
    }
};
export default AnalyticsDashboard;
