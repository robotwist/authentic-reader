import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import '../styles/SubjectGuide.css';
const SubjectGuide = ({ topics, sources, title }) => {
    const [expandedTopic, setExpandedTopic] = useState(null);
    const [showSourceDetails, setShowSourceDetails] = useState(false);
    const toggleTopicExpansion = (topicId) => {
        if (expandedTopic === topicId) {
            setExpandedTopic(null);
        }
        else {
            setExpandedTopic(topicId);
        }
    };
    const getSourceById = (id) => {
        return sources.find(source => source.id === id);
    };
    const getTopicById = (id) => {
        return topics.find(topic => topic.id === id);
    };
    const getBiasColor = (bias) => {
        switch (bias) {
            case 'left':
                return 'var(--bias-left-color, #6988c4)';
            case 'center':
                return 'var(--bias-center-color, #7aa37a)';
            case 'right':
                return 'var(--bias-right-color, #c47979)';
            default:
                return 'var(--text-light)';
        }
    };
    return (_jsxs("div", { className: "subject-guide", children: [_jsxs("div", { className: "subject-guide-header", children: [_jsx("h2", { children: title }), _jsx("p", { children: "Explore topics, their connections, and information sources" }), _jsx("div", { className: "guide-controls", children: _jsx("button", { className: `source-toggle ${showSourceDetails ? 'active' : ''}`, onClick: () => setShowSourceDetails(!showSourceDetails), children: showSourceDetails ? 'Hide Source Details' : 'Show Source Details' }) })] }), _jsx("div", { className: "topics-container", children: topics.map(topic => (_jsxs("div", { className: `topic-card ${expandedTopic === topic.id ? 'expanded' : ''}`, onClick: () => toggleTopicExpansion(topic.id), children: [_jsxs("div", { className: "topic-header", children: [_jsx("h3", { children: topic.name }), _jsx("span", { className: "expand-icon", children: expandedTopic === topic.id ? '−' : '+' })] }), expandedTopic === topic.id && (_jsxs("div", { className: "topic-details", children: [topic.subtopics.length > 0 && (_jsxs("div", { className: "subtopics", children: [_jsx("h4", { children: "Sub-topics" }), _jsx("ul", { children: topic.subtopics.map((subtopic, index) => (_jsx("li", { children: subtopic }, index))) })] })), topic.relatedTopics.length > 0 && (_jsxs("div", { className: "related-topics", children: [_jsx("h4", { children: "Related Topics" }), _jsx("div", { className: "related-topics-list", children: topic.relatedTopics.map(topicId => {
                                                const relatedTopic = getTopicById(topicId);
                                                return relatedTopic ? (_jsx("span", { className: "related-topic-chip", onClick: (e) => {
                                                        e.stopPropagation();
                                                        toggleTopicExpansion(topicId);
                                                    }, children: relatedTopic.name }, topicId)) : null;
                                            }) })] })), topic.sources.length > 0 && (_jsxs("div", { className: "topic-sources", children: [_jsx("h4", { children: "Sources Covering This Topic" }), _jsx("div", { className: "sources-list", children: topic.sources.map(sourceId => {
                                                const source = getSourceById(sourceId);
                                                return source ? (_jsxs("div", { className: "source-item", children: [_jsx("span", { className: "source-name", style: { borderLeftColor: getBiasColor(source.bias) }, children: source.name }), showSourceDetails && (_jsxs("div", { className: "source-details", children: [_jsxs("div", { className: "source-reliability", children: [_jsx("span", { className: "detail-label", children: "Reliability:" }), _jsx("div", { className: "reliability-bar", children: _jsx("div", { className: "reliability-fill", style: { width: `${source.reliability * 10}%` } }) })] }), _jsxs("div", { className: "source-bias", children: [_jsx("span", { className: "detail-label", children: "Bias:" }), _jsx("span", { className: `bias-indicator bias-${source.bias}`, children: source.bias })] }), source.organizations.length > 0 && (_jsxs("div", { className: "source-orgs", children: [_jsx("span", { className: "detail-label", children: "Connected to:" }), _jsx("div", { className: "org-chips", children: source.organizations.map((org, index) => (_jsx("span", { className: "org-chip", children: org }, index))) })] }))] }))] }, sourceId)) : null;
                                            }) })] }))] }))] }, topic.id))) })] }));
};
export default SubjectGuide;
