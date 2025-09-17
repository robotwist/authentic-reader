import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-ignore
import { useState } from 'react';
import '../styles/ManipulationAnalysis.css';
const ManipulationAnalysis = ({ manipulationAnalysis }) => {
    const { doomscroll, outrageBait, manipulativeTactics, recommendedAction, educationalSummary } = manipulationAnalysis;
    const [showDetailedExplanation, setShowDetailedExplanation] = useState(false);
    const getDoomscrollScoreClass = (score) => {
        if (score > 0.7)
            return 'high-risk';
        if (score > 0.4)
            return 'medium-risk';
        return 'low-risk';
    };
    const getOutrageBaitScoreClass = (score) => {
        if (score > 0.7)
            return 'high-risk';
        if (score > 0.4)
            return 'medium-risk';
        return 'low-risk';
    };
    const getScoreLabel = (score) => {
        if (score > 0.7)
            return 'High';
        if (score > 0.4)
            return 'Medium';
        return 'Low';
    };
    const toggleDetailedExplanation = () => {
        setShowDetailedExplanation(!showDetailedExplanation);
    };
    return (_jsxs("div", { className: "manipulation-analysis", children: [_jsx("h2", { children: "Content Manipulation Analysis" }), _jsx("div", { className: "analysis-summary", children: _jsxs("div", { className: "recommendation-banner", children: [_jsx("strong", { children: "Recommendation:" }), " ", recommendedAction] }) }), _jsxs("div", { className: "manipulation-overview", children: [_jsx("h3", { children: "Overview" }), _jsx("p", { className: "manipulation-description", children: "Content manipulation tactics are designed to exploit psychological vulnerabilities to increase engagement and drive specific behaviors. This analysis identifies common manipulation techniques that may be present in this content." }), _jsx("button", { className: "explanation-toggle", onClick: toggleDetailedExplanation, children: showDetailedExplanation ? 'Hide Detailed Explanation' : 'Show Detailed Explanation' }), showDetailedExplanation && (_jsx("div", { className: "educational-explanation", children: _jsx("div", { dangerouslySetInnerHTML: { __html: educationalSummary } }) }))] }), _jsxs("div", { className: "manipulation-metrics", children: [_jsxs("div", { className: `metric doomscroll-metric ${getDoomscrollScoreClass(doomscroll.doomscrollScore)}`, children: [_jsx("h3", { children: "Doomscroll Risk" }), _jsx("div", { className: "score-circle", children: _jsx("span", { className: "score-value", children: Math.round(doomscroll.doomscrollScore * 100) }) }), _jsx("div", { className: "score-label-container", children: _jsx("span", { className: `risk-label ${getDoomscrollScoreClass(doomscroll.doomscrollScore)}`, children: getScoreLabel(doomscroll.doomscrollScore) }) }), _jsx("p", { className: "explanation", children: doomscroll.doomscrollExplanation }), _jsxs("div", { className: "infobox", children: [_jsx("div", { className: "infobox-header", children: "What is Doomscrolling?" }), _jsx("div", { className: "infobox-content", children: "Doomscrolling is the tendency to continue consuming negative news or content despite the psychological distress it causes. Content that promotes doomscrolling typically uses fear-inducing language, catastrophic framing, and urgent tone to keep readers engaged." })] })] }), _jsxs("div", { className: `metric outrage-metric ${getOutrageBaitScoreClass(outrageBait.outrageBaitScore)}`, children: [_jsx("h3", { children: "Outrage Bait Risk" }), _jsx("div", { className: "score-circle", children: _jsx("span", { className: "score-value", children: Math.round(outrageBait.outrageBaitScore * 100) }) }), _jsx("div", { className: "score-label-container", children: _jsx("span", { className: `risk-label ${getOutrageBaitScoreClass(outrageBait.outrageBaitScore)}`, children: getScoreLabel(outrageBait.outrageBaitScore) }) }), _jsx("p", { className: "explanation", children: outrageBait.outrageBaitExplanation }), _jsxs("div", { className: "infobox", children: [_jsx("div", { className: "infobox-header", children: "What is Outrage Bait?" }), _jsx("div", { className: "infobox-content", children: "Outrage bait is content crafted specifically to provoke anger and indignation. It typically uses inflammatory language, tribal triggers, and divisive framing to activate strong emotional responses that drive engagement, sharing, and commenting behavior." })] })] })] }), manipulativeTactics.length > 0 && (_jsxs("div", { className: "manipulation-tactics", children: [_jsx("h3", { children: "Potential Manipulation Tactics" }), _jsx("ul", { className: "tactics-list", children: manipulativeTactics.map((tactic, index) => (_jsx("li", { className: "tactic-item", children: tactic }, index))) })] })), _jsxs("div", { className: "topic-indicators", children: [_jsxs("div", { className: "topics-column", children: [_jsx("h3", { children: "Doomscroll Topics" }), doomscroll.doomscrollTopics.length > 0 ? (_jsx("ul", { className: "topics-list", children: doomscroll.doomscrollTopics.map((topic, index) => (_jsx("li", { children: topic }, index))) })) : (_jsx("p", { children: "No significant doomscroll topics detected." }))] }), _jsxs("div", { className: "topics-column", children: [_jsx("h3", { children: "Outrage Triggers" }), outrageBait.outrageBaitTriggers.length > 0 ? (_jsx("ul", { className: "topics-list", children: outrageBait.outrageBaitTriggers.map((trigger, index) => (_jsx("li", { children: trigger }, index))) })) : (_jsx("p", { children: "No significant outrage triggers detected." }))] })] }), _jsxs("div", { className: "psychological-impact", children: [_jsx("h3", { children: "Psychological Impact" }), _jsxs("div", { className: "impact-grid", children: [_jsxs("div", { className: "impact-item", children: [_jsx("h4", { children: "Emotional Effect" }), _jsx("p", { children: "Manipulative content can trigger anxiety, anger, fear, and helplessness, leading to heightened stress levels." })] }), _jsxs("div", { className: "impact-item", children: [_jsx("h4", { children: "Cognitive Effect" }), _jsx("p", { children: "Can impair critical thinking, activate confirmation bias, and override rational assessment of information." })] }), _jsxs("div", { className: "impact-item", children: [_jsx("h4", { children: "Behavioral Effect" }), _jsx("p", { children: "May promote impulsive sharing, increased platform engagement, and polarized discussions." })] }), _jsxs("div", { className: "impact-item", children: [_jsx("h4", { children: "Long-term Effect" }), _jsx("p", { children: "Regular consumption may lead to persistent anxiety, cynicism, distrust, and decreased well-being." })] })] })] })] }));
};
export default ManipulationAnalysis;
