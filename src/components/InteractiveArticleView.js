import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBookmark, FiShare2, FiDownload, FiInfo } from 'react-icons/fi';
import '../styles/InteractiveArticleView.css';
const InteractiveArticleView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeHighlights, setActiveHighlights] = useState(['bias', 'rhetoric', 'fallacy']);
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                // This would be replaced with your actual API call
                // For now, we'll simulate loading an article
                setTimeout(() => {
                    // Placeholder article data - in production, this would be fetched from your API
                    const articleData = {
                        title: "Understanding Media Bias in the Digital Age",
                        content: `
              <p>In today's media landscape, <span class="highlight bias" data-type="bias" data-info="Loaded language suggesting media intentionally manipulates">consumers are constantly bombarded</span> with information from countless sources, making it increasingly difficult to distinguish fact from opinion.</p>
              
              <p>Many news organizations <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to authority - citing unnamed experts">according to experts</span>, have shifted from objective reporting to opinion-based content that caters to specific audiences. This shift has led to <span class="highlight bias" data-type="bias" data-info="Emotional language to evoke strong reactions">dangerous echo chambers</span> where readers only consume content that confirms their existing beliefs.</p>
              
              <p>The consequences of this trend <span class="highlight fallacy" data-type="fallacy" data-info="Slippery slope fallacy">will inevitably lead to a complete breakdown of societal cohesion</span> if left unchecked. Research shows that media bias affects how people perceive events and <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to fear">threatens the very foundations of democracy</span>.</p>
              
              <p>Conservative outlets <span class="highlight bias" data-type="bias" data-info="Generalization about a group">always prioritize</span> economic concerns, while liberal publications <span class="highlight bias" data-type="bias" data-info="Generalization about a group">focus exclusively</span> on social justice issues. This divide creates a scenario where <span class="highlight fallacy" data-type="fallacy" data-info="False dichotomy">Americans must choose between economic prosperity and social progress</span>.</p>
              
              <p>To combat media bias, readers should <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to common sense">obviously consume content from multiple sources</span> and develop critical thinking skills. However, this solution <span class="highlight fallacy" data-type="fallacy" data-info="Hasty generalization">cannot work for most Americans who lack the time and education necessary</span> to thoroughly analyze news content.</p>
              
              <p>The rise of fact-checking organizations represents a <span class="highlight bias" data-type="bias" data-info="Subjective claim presented as fact">positive development</span> in countering misinformation, though critics argue these organizations <span class="highlight bias" data-type="bias" data-info="Attribution bias">themselves harbor biases</span>.</p>
              
              <p>What remains clear is that media literacy has become <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to importance">one of the most essential skills</span> for navigating the modern information environment. Without it, citizens <span class="highlight fallacy" data-type="fallacy" data-info="Appeal to consequences">will be unable to make informed decisions about the issues that affect their lives</span>.</p>
            `,
                        source: "Authentic Reader Analysis",
                        author: "Research Team",
                        publishedDate: new Date().toDateString(),
                        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                    };
                    setArticle(articleData);
                    setLoading(false);
                }, 1500);
            }
            catch (err) {
                setError("Failed to load article. Please try again.");
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);
    const goBack = () => {
        navigate(-1);
    };
    const toggleHighlight = (type) => {
        setActiveHighlights(prev => prev.includes(type)
            ? prev.filter(t => t !== type)
            : [...prev, type]);
    };
    if (loading) {
        return (_jsx("div", { className: "interactive-article-container", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loader" }), _jsx("p", { children: "Loading interactive article..." })] }) }));
    }
    if (error || !article) {
        return (_jsx("div", { className: "interactive-article-container", children: _jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Error" }), _jsx("p", { children: error || "Unable to load article" }), _jsxs("button", { onClick: goBack, className: "back-button", children: [_jsx(FiArrowLeft, {}), " Go Back"] })] }) }));
    }
    return (_jsxs("div", { className: "interactive-article-container", children: [_jsxs("div", { className: "article-tools", children: [_jsx("button", { onClick: goBack, className: "tool-button", title: "Go back", children: _jsx(FiArrowLeft, {}) }), _jsxs("div", { className: "highlight-toggles", children: [_jsx("button", { className: `toggle-button ${activeHighlights.includes('bias') ? 'active' : ''} bias`, onClick: () => toggleHighlight('bias'), title: "Toggle bias highlights", children: "Bias" }), _jsx("button", { className: `toggle-button ${activeHighlights.includes('rhetoric') ? 'active' : ''} rhetoric`, onClick: () => toggleHighlight('rhetoric'), title: "Toggle rhetorical techniques", children: "Rhetoric" }), _jsx("button", { className: `toggle-button ${activeHighlights.includes('fallacy') ? 'active' : ''} fallacy`, onClick: () => toggleHighlight('fallacy'), title: "Toggle logical fallacies", children: "Fallacies" })] }), _jsxs("div", { className: "article-actions", children: [_jsx("button", { className: "tool-button", title: "Save article", children: _jsx(FiBookmark, {}) }), _jsx("button", { className: "tool-button", title: "Share article", children: _jsx(FiShare2, {}) }), _jsx("button", { className: "tool-button", title: "Download analysis", children: _jsx(FiDownload, {}) })] })] }), _jsxs("div", { className: "article-content-wrapper", children: [_jsxs("div", { className: `article-content ${activeHighlights.join(' ')}`, children: [article.imageUrl && (_jsx("div", { className: "article-image", children: _jsx("img", { src: article.imageUrl, alt: article.title }) })), _jsxs("div", { className: "article-meta", children: [article.source && _jsx("span", { className: "article-source", children: article.source }), article.publishedDate && _jsx("span", { className: "article-date", children: article.publishedDate })] }), _jsx("h1", { className: "article-title", children: article.title }), article.author && _jsxs("p", { className: "article-author", children: ["By ", article.author] }), _jsx("div", { className: "article-body", dangerouslySetInnerHTML: { __html: article.content } })] }), _jsxs("div", { className: "analysis-info-panel", children: [_jsxs("div", { className: "info-header", children: [_jsx(FiInfo, {}), " ", _jsx("h3", { children: "Analysis Information" })] }), _jsx("p", { children: "This interactive view highlights potentially problematic elements in the text. Hover over highlighted sections to see detailed explanations." }), _jsxs("div", { className: "analysis-legend", children: [_jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-color bias" }), _jsx("span", { className: "legend-label", children: "Bias - Potential instances of media bias" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-color rhetoric" }), _jsx("span", { className: "legend-label", children: "Rhetoric - Persuasive techniques" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-color fallacy" }), _jsx("span", { className: "legend-label", children: "Fallacies - Logical reasoning errors" })] })] }), _jsxs("div", { className: "analysis-stats", children: [_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-value", children: "7" }), _jsx("span", { className: "stat-label", children: "Highlighted Items" })] }), _jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-value", children: "Medium" }), _jsx("span", { className: "stat-label", children: "Overall Bias Level" })] })] })] })] })] }));
};
export default InteractiveArticleView;
