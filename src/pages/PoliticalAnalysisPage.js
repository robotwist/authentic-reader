import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import PoliticalOrientationChart from '../components/PoliticalOrientationChart';
import { FiTarget, FiTrendingUp, FiShield, FiUsers, FiGlobe, FiInfo } from 'react-icons/fi';
import '../styles/PoliticalAnalysisPage.css';
const PoliticalAnalysisPage = () => {
    const [sources, setSources] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Generate sample political profiles for demonstration
        const sampleSources = [
            {
                id: 'npr',
                name: 'NPR News',
                description: 'Center-left public radio news with fact-based reporting',
                reliability: 'high',
                biasRating: 'left',
                politicalProfile: {
                    economicAxis: { position: -15, confidence: 0.85, factors: [] },
                    socialAxis: { position: 25, confidence: 0.80, factors: [] },
                    foreignPolicyAxis: { position: 10, confidence: 0.75, factors: [] },
                    environmentalAxis: { position: 30, confidence: 0.80, factors: [] },
                    overallBias: { direction: 'left', intensity: 0.3, confidence: 0.85 }
                }
            },
            {
                id: 'foxnews',
                name: 'Fox News',
                description: 'Conservative cable news network with right-leaning editorial stance',
                reliability: 'medium',
                biasRating: 'right',
                politicalProfile: {
                    economicAxis: { position: 45, confidence: 0.90, factors: [] },
                    socialAxis: { position: -35, confidence: 0.85, factors: [] },
                    foreignPolicyAxis: { position: 40, confidence: 0.80, factors: [] },
                    environmentalAxis: { position: -25, confidence: 0.75, factors: [] },
                    overallBias: { direction: 'right', intensity: 0.7, confidence: 0.85 }
                }
            },
            {
                id: 'reuters',
                name: 'Reuters',
                description: 'International news agency with neutral, fact-based reporting',
                reliability: 'high',
                biasRating: 'center',
                politicalProfile: {
                    economicAxis: { position: 5, confidence: 0.90, factors: [] },
                    socialAxis: { position: 10, confidence: 0.85, factors: [] },
                    foreignPolicyAxis: { position: 15, confidence: 0.80, factors: [] },
                    environmentalAxis: { position: 5, confidence: 0.75, factors: [] },
                    overallBias: { direction: 'center', intensity: 0.1, confidence: 0.90 }
                }
            },
            {
                id: 'msnbc',
                name: 'MSNBC',
                description: 'Liberal cable news network with progressive editorial stance',
                reliability: 'medium',
                biasRating: 'left',
                politicalProfile: {
                    economicAxis: { position: -25, confidence: 0.85, factors: [] },
                    socialAxis: { position: 35, confidence: 0.80, factors: [] },
                    foreignPolicyAxis: { position: 20, confidence: 0.75, factors: [] },
                    environmentalAxis: { position: 40, confidence: 0.80, factors: [] },
                    overallBias: { direction: 'left', intensity: 0.6, confidence: 0.80 }
                }
            },
            {
                id: 'wsj',
                name: 'Wall Street Journal',
                description: 'Conservative business newspaper with pro-business editorial stance',
                reliability: 'high',
                biasRating: 'right',
                politicalProfile: {
                    economicAxis: { position: 35, confidence: 0.90, factors: [] },
                    socialAxis: { position: -20, confidence: 0.75, factors: [] },
                    foreignPolicyAxis: { position: 25, confidence: 0.80, factors: [] },
                    environmentalAxis: { position: -15, confidence: 0.70, factors: [] },
                    overallBias: { direction: 'right', intensity: 0.5, confidence: 0.85 }
                }
            },
            {
                id: 'jacobin',
                name: 'Jacobin',
                description: 'Socialist magazine with far-left political perspective',
                reliability: 'medium',
                biasRating: 'far-left',
                politicalProfile: {
                    economicAxis: { position: -70, confidence: 0.95, factors: [] },
                    socialAxis: { position: 45, confidence: 0.85, factors: [] },
                    foreignPolicyAxis: { position: -30, confidence: 0.80, factors: [] },
                    environmentalAxis: { position: 60, confidence: 0.85, factors: [] },
                    overallBias: { direction: 'far-left', intensity: 0.9, confidence: 0.90 }
                }
            },
            {
                id: 'breitbart',
                name: 'Breitbart',
                description: 'Far-right news and opinion website with nationalist perspective',
                reliability: 'low',
                biasRating: 'far-right',
                politicalProfile: {
                    economicAxis: { position: 60, confidence: 0.90, factors: [] },
                    socialAxis: { position: -60, confidence: 0.90, factors: [] },
                    foreignPolicyAxis: { position: 50, confidence: 0.85, factors: [] },
                    environmentalAxis: { position: -50, confidence: 0.80, factors: [] },
                    overallBias: { direction: 'far-right', intensity: 0.9, confidence: 0.85 }
                }
            },
            {
                id: 'bbc',
                name: 'BBC News',
                description: 'British public service broadcaster with center-left editorial stance',
                reliability: 'high',
                biasRating: 'center-left',
                politicalProfile: {
                    economicAxis: { position: -10, confidence: 0.85, factors: [] },
                    socialAxis: { position: 20, confidence: 0.80, factors: [] },
                    foreignPolicyAxis: { position: 15, confidence: 0.75, factors: [] },
                    environmentalAxis: { position: 25, confidence: 0.80, factors: [] },
                    overallBias: { direction: 'center-left', intensity: 0.2, confidence: 0.85 }
                }
            }
        ];
        setSources(sampleSources);
        setLoading(false);
    }, []);
    if (loading) {
        return (_jsx("div", { className: "political-analysis-page", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { children: "Loading political analysis..." })] }) }));
    }
    return (_jsxs("div", { className: "political-analysis-page", children: [_jsxs("div", { className: "page-header", children: [_jsx("h1", { children: "Political Orientation Analysis" }), _jsx("p", { className: "subtitle", children: "Multi-dimensional analysis of news sources across political axes" })] }), _jsx("div", { className: "analysis-intro", children: _jsxs("div", { className: "intro-content", children: [_jsx("h2", { children: "Understanding Political Bias" }), _jsx("p", { children: "Our political orientation analysis uses a multi-dimensional approach to understand where news sources fall across different political axes. This helps users make informed decisions about the content they consume." }), _jsxs("div", { className: "axis-explanation", children: [_jsx("h3", { children: "Our Analysis Axes:" }), _jsxs("div", { className: "axis-grid", children: [_jsxs("div", { className: "axis-item", children: [_jsx(FiTarget, { className: "axis-icon" }), _jsxs("div", { className: "axis-content", children: [_jsx("h4", { children: "Economic Axis" }), _jsx("p", { children: "Left (Progressive) to Right (Conservative) economic policies" })] })] }), _jsxs("div", { className: "axis-item", children: [_jsx(FiUsers, { className: "axis-icon" }), _jsxs("div", { className: "axis-content", children: [_jsx("h4", { children: "Social Axis" }), _jsx("p", { children: "Libertarian (Personal freedoms) to Authoritarian (Government control)" })] })] }), _jsxs("div", { className: "axis-item", children: [_jsx(FiGlobe, { className: "axis-icon" }), _jsxs("div", { className: "axis-content", children: [_jsx("h4", { children: "Foreign Policy Axis" }), _jsx("p", { children: "Isolationist (Domestic focus) to Interventionist (Global engagement)" })] })] }), _jsxs("div", { className: "axis-item", children: [_jsx(FiTrendingUp, { className: "axis-icon" }), _jsxs("div", { className: "axis-content", children: [_jsx("h4", { children: "Environmental Axis" }), _jsx("p", { children: "Anti-Regulation (Business-friendly) to Pro-Regulation (Environmental protection)" })] })] })] })] })] }) }), _jsx(PoliticalOrientationChart, { sources: sources, selectedSource: selectedSource, onSourceSelect: setSelectedSource }), _jsxs("div", { className: "analysis-methodology", children: [_jsx("h2", { children: "Our Methodology" }), _jsxs("div", { className: "methodology-grid", children: [_jsxs("div", { className: "methodology-card", children: [_jsxs("h3", { children: [_jsx(FiTarget, {}), " Content Analysis"] }), _jsx("p", { children: "We analyze the language, topics, and framing used in articles to determine political leanings. This includes keyword analysis, topic selection patterns, and editorial decisions." })] }), _jsxs("div", { className: "methodology-card", children: [_jsxs("h3", { children: [_jsx(FiShield, {}), " Source Verification"] }), _jsx("p", { children: "We cross-reference our analysis with established media bias ratings and fact-checking organizations to ensure accuracy and transparency." })] }), _jsxs("div", { className: "methodology-card", children: [_jsxs("h3", { children: [_jsx(FiTrendingUp, {}), " Confidence Scoring"] }), _jsx("p", { children: "Each position comes with a confidence score based on the consistency and clarity of political indicators in the source's content." })] }), _jsxs("div", { className: "methodology-card", children: [_jsxs("h3", { children: [_jsx(FiInfo, {}), " Transparency"] }), _jsx("p", { children: "We provide detailed explanations of our methodology and allow users to understand how each rating was determined." })] })] })] }), _jsxs("div", { className: "usage-guidelines", children: [_jsx("h2", { children: "How to Use This Analysis" }), _jsxs("div", { className: "guidelines-content", children: [_jsxs("div", { className: "guideline-item", children: [_jsx("h3", { children: "1. Seek Multiple Perspectives" }), _jsx("p", { children: "Don't rely on a single source. Use this chart to identify sources from different political orientations and compare their coverage of the same events." })] }), _jsxs("div", { className: "guideline-item", children: [_jsx("h3", { children: "2. Consider Confidence Levels" }), _jsx("p", { children: "Higher confidence scores indicate more consistent political positioning. Lower confidence may indicate mixed or evolving editorial stances." })] }), _jsxs("div", { className: "guideline-item", children: [_jsx("h3", { children: "3. Understand Context" }), _jsx("p", { children: "Political bias doesn't necessarily mean inaccurate reporting. Many sources with clear political leanings still provide factual information, but may frame it differently." })] }), _jsxs("div", { className: "guideline-item", children: [_jsx("h3", { children: "4. Fact-Check Claims" }), _jsx("p", { children: "Regardless of a source's political orientation, always verify important claims using multiple sources and fact-checking organizations." })] })] })] })] }));
};
export default PoliticalAnalysisPage;
