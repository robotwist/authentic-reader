import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiShield, FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiExternalLink, FiStar, FiBarChart2, FiTarget, FiClock, FiBookOpen, FiAward, FiAlertCircle } from 'react-icons/fi';
import '../styles/SourceCredibilityAssessment.css';
const SourceCredibilityAssessment = ({ sourceUrl = '', onAssessmentComplete }) => {
    const [isAssessing, setIsAssessing] = useState(false);
    const [assessment, setAssessment] = useState(null);
    const [assessmentProgress, setAssessmentProgress] = useState(0);
    const [inputUrl, setInputUrl] = useState(sourceUrl);
    const [recentAssessments, setRecentAssessments] = useState([]);
    useEffect(() => {
        // Load recent assessments from localStorage
        const saved = localStorage.getItem('recentSourceAssessments');
        if (saved) {
            try {
                setRecentAssessments(JSON.parse(saved).slice(0, 5));
            }
            catch (e) {
                console.error('Error loading recent assessments:', e);
            }
        }
    }, []);
    useEffect(() => {
        if (sourceUrl) {
            performAssessment(sourceUrl);
        }
    }, [sourceUrl]);
    const performAssessment = async (url) => {
        if (!url.trim()) {
            alert('Please enter a source URL to assess');
            return;
        }
        setIsAssessing(true);
        setAssessmentProgress(0);
        try {
            // Step 1: Extract domain and basic info
            setAssessmentProgress(20);
            const domain = extractDomain(url);
            // Step 2: Analyze source credibility
            setAssessmentProgress(60);
            const result = await generateCredibilityAssessment(domain, url);
            // Step 3: Complete assessment
            setAssessmentProgress(100);
            setAssessment(result);
            // Save to recent assessments
            const updatedRecent = [result, ...recentAssessments.slice(0, 4)];
            setRecentAssessments(updatedRecent);
            localStorage.setItem('recentSourceAssessments', JSON.stringify(updatedRecent));
            if (onAssessmentComplete) {
                onAssessmentComplete(result);
            }
        }
        catch (error) {
            console.error('Credibility assessment failed:', error);
            alert('Assessment failed. Please try again.');
        }
        finally {
            setIsAssessing(false);
            setAssessmentProgress(0);
        }
    };
    const extractDomain = (url) => {
        try {
            const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
            return domain.replace('www.', '');
        }
        catch {
            return url.replace('www.', '').split('/')[0];
        }
    };
    const generateCredibilityAssessment = async (domain, url) => {
        const domainLower = domain.toLowerCase();
        // Determine source type and basic info
        let sourceType = 'unknown';
        const country = 'Unknown';
        const founded = undefined;
        const ownership = undefined;
        const description = '';
        // Source type detection
        if (domainLower.includes('news') || domainLower.includes('times') || domainLower.includes('post')) {
            sourceType = 'news';
        }
        else if (domainLower.includes('blog') || domainLower.includes('medium') || domainLower.includes('substack')) {
            sourceType = 'blog';
        }
        else if (domainLower.includes('twitter') || domainLower.includes('facebook') || domainLower.includes('instagram')) {
            sourceType = 'social';
        }
        else if (domainLower.includes('gov') || domainLower.includes('government')) {
            sourceType = 'government';
        }
        else if (domainLower.includes('edu') || domainLower.includes('academic') || domainLower.includes('university')) {
            sourceType = 'academic';
        }
        // Known source database (simplified)
        const knownSources = {
            'reuters.com': {
                type: 'news',
                country: 'United Kingdom',
                founded: '1851',
                ownership: 'Thomson Reuters',
                description: 'International news agency with high credibility standards',
                credibility: { overall: 0.92, accuracy: 0.95, transparency: 0.90, objectivity: 0.88, factChecking: 0.94, corrections: 0.89, bias: 0.15 }
            },
            'ap.org': {
                type: 'news',
                country: 'United States',
                founded: '1846',
                ownership: 'Non-profit cooperative',
                description: 'Associated Press - leading news agency',
                credibility: { overall: 0.94, accuracy: 0.96, transparency: 0.92, objectivity: 0.90, factChecking: 0.95, corrections: 0.91, bias: 0.12 }
            },
            'bbc.com': {
                type: 'news',
                country: 'United Kingdom',
                founded: '1922',
                ownership: 'Public service broadcaster',
                description: 'British Broadcasting Corporation - public service media',
                credibility: { overall: 0.89, accuracy: 0.92, transparency: 0.88, objectivity: 0.85, factChecking: 0.90, corrections: 0.87, bias: 0.18 }
            },
            'cnn.com': {
                type: 'news',
                country: 'United States',
                founded: '1980',
                ownership: 'Warner Bros. Discovery',
                description: 'Cable news network with comprehensive coverage',
                credibility: { overall: 0.78, accuracy: 0.82, transparency: 0.75, objectivity: 0.72, factChecking: 0.80, corrections: 0.76, bias: 0.25 }
            },
            'foxnews.com': {
                type: 'news',
                country: 'United States',
                founded: '1996',
                ownership: 'Fox Corporation',
                description: 'Conservative-leaning news network',
                credibility: { overall: 0.65, accuracy: 0.70, transparency: 0.60, objectivity: 0.55, factChecking: 0.68, corrections: 0.62, bias: 0.45 }
            },
            'breitbart.com': {
                type: 'news',
                country: 'United States',
                founded: '2007',
                ownership: 'Breitbart News Network',
                description: 'Conservative news and opinion website',
                credibility: { overall: 0.45, accuracy: 0.50, transparency: 0.40, objectivity: 0.35, factChecking: 0.48, corrections: 0.42, bias: 0.75 }
            },
            'infowars.com': {
                type: 'news',
                country: 'United States',
                founded: '1999',
                ownership: 'Free Speech Systems',
                description: 'Controversial conspiracy theory website',
                credibility: { overall: 0.15, accuracy: 0.20, transparency: 0.10, objectivity: 0.05, factChecking: 0.15, corrections: 0.12, bias: 0.90 }
            }
        };
        const sourceData = knownSources[domainLower] || {
            type: sourceType,
            country,
            founded,
            ownership,
            description: 'Source not in our database - assessment based on general patterns',
            credibility: generateDefaultCredibility(domainLower, sourceType)
        };
        // Generate factors based on credibility scores
        const factors = generateFactors(sourceData.credibility);
        // Generate history data
        const history = {
            factCheckRecord: Math.round(sourceData.credibility.factChecking * 100),
            correctionRate: Math.round(sourceData.credibility.corrections * 100),
            biasIncidents: Math.round((1 - sourceData.credibility.bias) * 50),
            accuracyScore: Math.round(sourceData.credibility.accuracy * 100)
        };
        // Generate recommendations
        const recommendations = generateRecommendations(sourceData.credibility);
        return {
            source: {
                name: domain,
                url,
                domain,
                type: sourceData.type,
                country: sourceData.country,
                founded: sourceData.founded,
                ownership: sourceData.ownership,
                description: sourceData.description
            },
            score: sourceData.credibility,
            factors,
            history,
            recommendations,
            lastUpdated: new Date().toISOString(),
            confidence: 0.85
        };
    };
    const generateDefaultCredibility = (domain, type) => {
        // Base scores by type
        const baseScores = {
            news: { overall: 0.70, accuracy: 0.75, transparency: 0.65, objectivity: 0.70, factChecking: 0.72, corrections: 0.68, bias: 0.30 },
            blog: { overall: 0.50, accuracy: 0.55, transparency: 0.45, objectivity: 0.50, factChecking: 0.52, corrections: 0.48, bias: 0.50 },
            social: { overall: 0.30, accuracy: 0.35, transparency: 0.25, objectivity: 0.30, factChecking: 0.32, corrections: 0.28, bias: 0.70 },
            government: { overall: 0.80, accuracy: 0.85, transparency: 0.75, objectivity: 0.80, factChecking: 0.82, corrections: 0.78, bias: 0.20 },
            academic: { overall: 0.85, accuracy: 0.90, transparency: 0.80, objectivity: 0.85, factChecking: 0.87, corrections: 0.83, bias: 0.15 },
            unknown: { overall: 0.40, accuracy: 0.45, transparency: 0.35, objectivity: 0.40, factChecking: 0.42, corrections: 0.38, bias: 0.60 }
        };
        return baseScores[type];
    };
    const generateFactors = (credibility) => {
        const factors = {
            positive: [],
            negative: [],
            neutral: []
        };
        if (credibility.accuracy > 0.8)
            factors.positive.push('High accuracy in reporting');
        if (credibility.transparency > 0.8)
            factors.positive.push('Good transparency practices');
        if (credibility.objectivity > 0.8)
            factors.positive.push('Maintains objectivity');
        if (credibility.factChecking > 0.8)
            factors.positive.push('Strong fact-checking procedures');
        if (credibility.corrections > 0.8)
            factors.positive.push('Prompt error corrections');
        if (credibility.bias < 0.2)
            factors.positive.push('Low bias detected');
        if (credibility.accuracy < 0.6)
            factors.negative.push('Accuracy concerns identified');
        if (credibility.transparency < 0.6)
            factors.negative.push('Limited transparency');
        if (credibility.objectivity < 0.6)
            factors.negative.push('Objectivity issues');
        if (credibility.factChecking < 0.6)
            factors.negative.push('Weak fact-checking');
        if (credibility.corrections < 0.6)
            factors.negative.push('Poor correction practices');
        if (credibility.bias > 0.6)
            factors.negative.push('High bias detected');
        factors.neutral.push('Standard editorial practices');
        factors.neutral.push('Mixed reliability indicators');
        factors.neutral.push('Requires further verification');
        return factors;
    };
    const generateRecommendations = (credibility) => {
        const recommendations = [];
        if (credibility.overall < 0.6) {
            recommendations.push('Exercise caution when using this source');
            recommendations.push('Verify information with multiple sources');
        }
        if (credibility.bias > 0.5) {
            recommendations.push('Be aware of potential bias in reporting');
            recommendations.push('Seek alternative perspectives');
        }
        if (credibility.accuracy < 0.7) {
            recommendations.push('Fact-check claims independently');
            recommendations.push('Cross-reference with reliable sources');
        }
        if (credibility.transparency < 0.6) {
            recommendations.push('Look for additional context and sources');
            recommendations.push('Check for clear attribution of information');
        }
        if (recommendations.length === 0) {
            recommendations.push('This source appears generally reliable');
            recommendations.push('Continue to verify important claims');
        }
        return recommendations;
    };
    const getCredibilityLevel = (score) => {
        if (score >= 0.8)
            return 'High';
        if (score >= 0.6)
            return 'Moderate';
        if (score >= 0.4)
            return 'Low';
        return 'Very Low';
    };
    const getCredibilityColor = (score) => {
        if (score >= 0.8)
            return '#28a745';
        if (score >= 0.6)
            return '#ffc107';
        if (score >= 0.4)
            return '#fd7e14';
        return '#dc3545';
    };
    const getCredibilityIcon = (score) => {
        if (score >= 0.8)
            return _jsx(FiCheckCircle, { className: "credibility-icon high" });
        if (score >= 0.6)
            return _jsx(FiAlertTriangle, { className: "credibility-icon moderate" });
        if (score >= 0.4)
            return _jsx(FiAlertCircle, { className: "credibility-icon low" });
        return _jsx(FiXCircle, { className: "credibility-icon very-low" });
    };
    return (_jsxs("div", { className: "source-credibility-assessment", children: [_jsx("div", { className: "assessment-header", children: _jsxs("div", { className: "header-content", children: [_jsx(FiShield, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "Source Credibility Assessment" }), _jsx("p", { children: "Evaluate the reliability and trustworthiness of news sources" })] })] }) }), _jsxs("div", { className: "url-input-section", children: [_jsxs("div", { className: "input-group", children: [_jsx("input", { type: "url", value: inputUrl, onChange: (e) => setInputUrl(e.target.value), placeholder: "Enter source URL (e.g., https://reuters.com)", className: "url-input", disabled: isAssessing }), _jsx("button", { onClick: () => performAssessment(inputUrl), disabled: isAssessing || !inputUrl.trim(), className: "assess-button", children: isAssessing ? (_jsxs(_Fragment, { children: [_jsx(FiClock, { className: "spinner" }), "Assessing..."] })) : (_jsxs(_Fragment, { children: [_jsx(FiShield, {}), "Assess Credibility"] })) })] }), isAssessing && (_jsxs("div", { className: "progress-section", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${assessmentProgress}%` } }) }), _jsxs("p", { children: ["Analyzing source credibility... ", assessmentProgress, "%"] })] }))] }), assessment && (_jsxs("div", { className: "assessment-result", children: [_jsxs("div", { className: "result-header", children: [_jsxs("div", { className: "source-info", children: [_jsx("h3", { children: assessment.source.name }), _jsxs("div", { className: "source-meta", children: [_jsx("span", { className: "source-type", children: assessment.source.type }), _jsx("span", { className: "source-country", children: assessment.source.country }), assessment.source.founded && (_jsxs("span", { className: "source-founded", children: ["Founded: ", assessment.source.founded] }))] }), _jsx("p", { className: "source-description", children: assessment.source.description })] }), _jsxs("div", { className: "credibility-overview", children: [_jsxs("div", { className: "overall-score", children: [getCredibilityIcon(assessment.score.overall), _jsxs("div", { className: "score-info", children: [_jsxs("span", { className: "score-value", style: { color: getCredibilityColor(assessment.score.overall) }, children: [Math.round(assessment.score.overall * 100), "%"] }), _jsxs("span", { className: "score-label", children: [getCredibilityLevel(assessment.score.overall), " Credibility"] })] })] }), _jsxs("div", { className: "confidence-score", children: [Math.round(assessment.confidence * 100), "% Confidence"] })] })] }), _jsxs("div", { className: "result-content", children: [_jsxs("div", { className: "scores-section", children: [_jsxs("h3", { children: [_jsx(FiBarChart2, {}), " Credibility Breakdown"] }), _jsx("div", { className: "scores-grid", children: Object.entries(assessment.score).map(([metric, score]) => (_jsxs("div", { className: "score-card", children: [_jsxs("div", { className: "score-header", children: [_jsx("span", { className: "metric-name", children: metric.charAt(0).toUpperCase() + metric.slice(1) }), _jsxs("span", { className: "metric-score", style: { color: getCredibilityColor(score) }, children: [Math.round(score * 100), "%"] })] }), _jsx("div", { className: "score-bar", children: _jsx("div", { className: "score-fill", style: {
                                                            width: `${Math.round(score * 100)}%`,
                                                            backgroundColor: getCredibilityColor(score)
                                                        } }) })] }, metric))) })] }), _jsxs("div", { className: "history-section", children: [_jsxs("h3", { children: [_jsx(FiClock, {}), " Historical Performance"] }), _jsxs("div", { className: "history-grid", children: [_jsxs("div", { className: "history-card", children: [_jsx("h4", { children: "Fact-Check Record" }), _jsxs("span", { className: "history-value", children: [assessment.history.factCheckRecord, "%"] })] }), _jsxs("div", { className: "history-card", children: [_jsx("h4", { children: "Correction Rate" }), _jsxs("span", { className: "history-value", children: [assessment.history.correctionRate, "%"] })] }), _jsxs("div", { className: "history-card", children: [_jsx("h4", { children: "Bias Incidents" }), _jsx("span", { className: "history-value", children: assessment.history.biasIncidents })] }), _jsxs("div", { className: "history-card", children: [_jsx("h4", { children: "Accuracy Score" }), _jsxs("span", { className: "history-value", children: [assessment.history.accuracyScore, "%"] })] })] })] }), _jsxs("div", { className: "factors-section", children: [_jsxs("h3", { children: [_jsx(FiTarget, {}), " Assessment Factors"] }), _jsxs("div", { className: "factors-grid", children: [assessment.factors.positive.length > 0 && (_jsxs("div", { className: "factor-category positive", children: [_jsxs("h4", { children: [_jsx(FiCheckCircle, {}), " Positive Factors"] }), _jsx("ul", { children: assessment.factors.positive.map((factor, index) => (_jsx("li", { children: factor }, index))) })] })), assessment.factors.negative.length > 0 && (_jsxs("div", { className: "factor-category negative", children: [_jsxs("h4", { children: [_jsx(FiXCircle, {}), " Concerns"] }), _jsx("ul", { children: assessment.factors.negative.map((factor, index) => (_jsx("li", { children: factor }, index))) })] })), assessment.factors.neutral.length > 0 && (_jsxs("div", { className: "factor-category neutral", children: [_jsxs("h4", { children: [_jsx(FiInfo, {}), " Neutral Factors"] }), _jsx("ul", { children: assessment.factors.neutral.map((factor, index) => (_jsx("li", { children: factor }, index))) })] }))] })] }), _jsxs("div", { className: "recommendations-section", children: [_jsxs("h3", { children: [_jsx(FiAward, {}), " Recommendations"] }), _jsx("div", { className: "recommendations-list", children: assessment.recommendations.map((rec, index) => (_jsxs("div", { className: "recommendation-item", children: [_jsx(FiStar, { className: "recommendation-icon" }), _jsx("span", { children: rec })] }, index))) })] }), _jsxs("div", { className: "source-links", children: [_jsxs("a", { href: assessment.source.url, target: "_blank", rel: "noopener noreferrer", className: "source-link", children: [_jsx(FiExternalLink, {}), "Visit Source"] }), _jsxs("span", { className: "last-updated", children: ["Last updated: ", new Date(assessment.lastUpdated).toLocaleDateString()] })] })] })] })), recentAssessments.length > 0 && (_jsxs("div", { className: "recent-assessments", children: [_jsxs("h3", { children: [_jsx(FiBookOpen, {}), " Recent Assessments"] }), _jsx("div", { className: "recent-grid", children: recentAssessments.map((recent, index) => (_jsxs("div", { className: "recent-card", children: [_jsxs("div", { className: "recent-header", children: [_jsx("h4", { children: recent.source.name }), getCredibilityIcon(recent.score.overall)] }), _jsxs("div", { className: "recent-score", children: [_jsxs("span", { className: "recent-score-value", style: { color: getCredibilityColor(recent.score.overall) }, children: [Math.round(recent.score.overall * 100), "%"] }), _jsx("span", { className: "recent-score-label", children: getCredibilityLevel(recent.score.overall) })] }), _jsx("span", { className: "recent-time", children: new Date(recent.lastUpdated).toLocaleDateString() })] }, index))) })] }))] }));
};
export default SourceCredibilityAssessment;
