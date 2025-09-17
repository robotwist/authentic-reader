import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiSearch, FiArrowRight, FiTarget, FiBarChart2, FiCpu, FiBook, FiUsers, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './FeatureSearch.css';
const FeatureSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredFeatures, setFilteredFeatures] = useState([]);
    const navigate = useNavigate();
    const features = [
        {
            id: 'bias-detection',
            name: 'Bias Detection',
            description: 'Analyze articles for political bias and framing',
            path: '/analysis/bias',
            icon: _jsx(FiTarget, {}),
            category: 'analysis'
        },
        {
            id: 'comparative-analysis',
            name: 'Comparative Analysis',
            description: 'Compare multiple articles on the same topic',
            path: '/analysis/comparative',
            icon: _jsx(FiBarChart2, {}),
            category: 'analysis'
        },
        {
            id: 'sentiment-analysis',
            name: 'Sentiment Analysis',
            description: 'Analyze emotional tone and sentiment',
            path: '/sentiment-analysis',
            icon: _jsx(FiBarChart2, {}),
            category: 'analysis'
        },
        {
            id: 'fact-checking',
            name: 'Fact Checking',
            description: 'Verify claims and check facts',
            path: '/fact-check',
            icon: _jsx(FiShield, {}),
            category: 'tools'
        },
        {
            id: 'article-generator',
            name: 'Article Generator',
            description: 'Generate educational content for analysis',
            path: '/article-generator',
            icon: _jsx(FiBook, {}),
            category: 'tools'
        },
        {
            id: 'ai-orchestrator',
            name: 'AI Agent Orchestrator',
            description: 'Coordinate multiple AI agents for analysis',
            path: '/ai-orchestrator',
            icon: _jsx(FiCpu, {}),
            category: 'tools'
        },
        {
            id: 'journalist-ratings',
            name: 'Journalist Ratings',
            description: 'Rate and analyze journalist credibility',
            path: '/journalists',
            icon: _jsx(FiUsers, {}),
            category: 'analysis'
        },
        {
            id: 'media-literacy',
            name: 'Media Literacy Guide',
            description: 'Learn about media literacy and critical thinking',
            path: '/media-literacy-guide',
            icon: _jsx(FiBook, {}),
            category: 'learning'
        },
        {
            id: 'political-analysis',
            name: 'Political Analysis',
            description: 'Deep dive into political content analysis',
            path: '/political-analysis',
            icon: _jsx(FiTarget, {}),
            category: 'analysis'
        },
        {
            id: 'balanced-feed',
            name: 'Balanced Feed',
            description: 'Browse articles from multiple perspectives',
            path: '/feed',
            icon: _jsx(FiBook, {}),
            category: 'tools'
        }
    ];
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredFeatures([]);
            return;
        }
        const filtered = features.filter(feature => feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.category.toLowerCase().includes(searchQuery.toLowerCase()));
        setFilteredFeatures(filtered);
    }, [searchQuery]);
    const handleFeatureSelect = (feature) => {
        navigate(feature.path);
        setSearchQuery('');
        setIsOpen(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchQuery('');
        }
    };
    return (_jsx("div", { className: "feature-search", children: _jsxs("div", { className: "search-container", children: [_jsxs("div", { className: "search-input-container", children: [_jsx(FiSearch, { className: "search-icon" }), _jsx("input", { type: "text", placeholder: "Search for analysis tools, features...", value: searchQuery, onChange: (e) => {
                                setSearchQuery(e.target.value);
                                setIsOpen(true);
                            }, onFocus: () => setIsOpen(true), onKeyDown: handleKeyDown, className: "search-input" })] }), isOpen && (searchQuery.trim() !== '' || filteredFeatures.length > 0) && (_jsx("div", { className: "search-results", children: searchQuery.trim() === '' ? (_jsxs("div", { className: "search-placeholder", children: [_jsx("p", { children: "Start typing to search for features..." }), _jsxs("div", { className: "feature-categories", children: [_jsxs("div", { className: "category", children: [_jsx("h4", { children: "Analysis Tools" }), _jsx("p", { children: "Bias detection, comparative analysis, sentiment analysis" })] }), _jsxs("div", { className: "category", children: [_jsx("h4", { children: "Learning Resources" }), _jsx("p", { children: "Media literacy guide, political analysis" })] }), _jsxs("div", { className: "category", children: [_jsx("h4", { children: "Advanced Tools" }), _jsx("p", { children: "AI orchestrator, article generator, fact checking" })] })] })] })) : filteredFeatures.length > 0 ? (_jsx("div", { className: "results-list", children: filteredFeatures.map((feature) => (_jsxs("div", { className: "result-item", onClick: () => handleFeatureSelect(feature), children: [_jsx("div", { className: "result-icon", children: feature.icon }), _jsxs("div", { className: "result-content", children: [_jsx("h4", { children: feature.name }), _jsx("p", { children: feature.description })] }), _jsx(FiArrowRight, { className: "result-arrow" })] }, feature.id))) })) : (_jsxs("div", { className: "no-results", children: [_jsxs("p", { children: ["No features found for \"", searchQuery, "\""] }), _jsx("p", { className: "suggestion", children: "Try searching for \"bias\", \"analysis\", or \"tools\"" })] })) }))] }) }));
};
export default FeatureSearch;
