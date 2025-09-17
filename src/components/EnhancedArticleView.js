import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBookmark, FiShare2 } from 'react-icons/fi';
import '../styles/EnhancedArticleView.css';
const EnhancedArticleView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                // Simulate API call to fetch article data
                // In a real app, this would be an actual API call
                setTimeout(() => {
                    const mockArticle = {
                        id: id || '1',
                        title: 'Enhanced Reading Experience with AI-Powered Analysis',
                        content: `
              <p>The way we consume news and information online is evolving rapidly. With the rise of misinformation and the increasing sophistication of persuasive techniques, readers need new tools to help them navigate digital content critically.</p>
              
              <p>Enhanced reading experiences leverage artificial intelligence to provide real-time analysis of content, highlighting potential biases, rhetorical techniques, and logical fallacies. This allows readers to engage more critically with the information they consume.</p>
              
              <p>Key features of enhanced reading include:</p>
              
              <ul>
                <li>Bias detection and analysis</li>
                <li>Identification of rhetorical techniques</li>
                <li>Recognition of logical fallacies</li>
                <li>Source credibility assessment</li>
                <li>Context and background information</li>
              </ul>
              
              <p>By making these elements visible, readers can develop better media literacy skills and make more informed judgments about the content they consume.</p>
              
              <p>The future of reading isn't just about accessibility and convenience, but also about empowering readers with the tools to understand and evaluate information in increasingly complex media landscapes.</p>
              
              <p>As these technologies advance, we can expect even more sophisticated analysis capabilities, including detection of emotional manipulation, comparison with factual databases, and personalized critical thinking suggestions based on individual reading patterns.</p>
            `,
                        source: {
                            name: 'Authentic Reader Blog',
                            url: 'https://authentic-reader.example.com',
                            favicon: 'https://via.placeholder.com/32'
                        },
                        author: 'Research Team',
                        publishedDate: new Date().toDateString(),
                        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                        url: `https://authentic-reader.example.com/articles/${id}`
                    };
                    setArticle(mockArticle);
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
    const handleSave = () => {
        // Implementation would save the article to the user's saved articles
        alert('Article saved!');
    };
    const handleShare = () => {
        // Implementation would open a share dialog
        alert('Share functionality coming soon!');
    };
    const handleAnalyze = () => {
        if (article) {
            // Navigate to the interactive view with full analysis
            navigate(`/interactive/${article.id}`);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "enhanced-article-container", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loader" }), _jsx("p", { children: "Loading article..." })] }) }));
    }
    if (error || !article) {
        return (_jsx("div", { className: "enhanced-article-container", children: _jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Error" }), _jsx("p", { children: error || "Unable to load article" }), _jsxs("button", { onClick: goBack, className: "back-button", children: [_jsx(FiArrowLeft, {}), " Go Back"] })] }) }));
    }
    return (_jsxs("div", { className: "enhanced-article-container", children: [_jsxs("div", { className: "article-toolbar", children: [_jsx("button", { onClick: goBack, className: "toolbar-button", title: "Go back", children: _jsx(FiArrowLeft, {}) }), _jsxs("div", { className: "toolbar-actions", children: [_jsx("button", { onClick: handleSave, className: "toolbar-button", title: "Save article", children: _jsx(FiBookmark, {}) }), _jsx("button", { onClick: handleShare, className: "toolbar-button", title: "Share article", children: _jsx(FiShare2, {}) }), _jsx("button", { onClick: handleAnalyze, className: "analyze-button", title: "Analyze article", children: "Analyze Content" })] })] }), _jsxs("article", { className: "article", children: [article.image && (_jsx("div", { className: "article-image", children: _jsx("img", { src: article.image, alt: article.title }) })), _jsxs("div", { className: "article-meta", children: [article.source && _jsx("span", { className: "article-source", children: article.source.name }), article.publishedDate && _jsx("span", { className: "article-date", children: article.publishedDate })] }), _jsx("h1", { className: "article-title", children: article.title }), article.author && _jsxs("div", { className: "article-author", children: ["By ", article.author] }), _jsx("div", { className: "article-content", dangerouslySetInnerHTML: { __html: article.content } }), _jsxs("div", { className: "article-footer", children: [_jsx("p", { children: "This article is provided with enhanced reading capabilities. Click \"Analyze Content\" to see a detailed breakdown of potential biases, rhetorical techniques, and more." }), _jsx("button", { onClick: handleAnalyze, className: "analyze-button full-width", children: "Analyze Content" })] })] })] }));
};
export default EnhancedArticleView;
