import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExtractedContent, getPassageAnalyses } from '../services/storageService';
import InteractiveArticleView from '../components/InteractiveArticleView';
import ArticleAnalysis from '../components/ArticleAnalysis';
import EnhancedArticleView from '../components/EnhancedArticleView';
import { logger } from '../utils/logger';
import '../styles/ArticlePage.css';
const ArticlePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [passages, setPassages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('enhanced');
    useEffect(() => {
        const loadArticle = async () => {
            if (!id) {
                setError('Article ID is missing');
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                // Load the article content
                const articleContent = await getExtractedContent(id);
                if (!articleContent) {
                    setError('Article not found');
                    setIsLoading(false);
                    return;
                }
                // Load the passage analyses
                const analysisData = await getPassageAnalyses(id);
                let articlePassages = [];
                if (analysisData && analysisData.passages) {
                    articlePassages = analysisData.passages;
                }
                else {
                    // If no passages are available, create a single passage from the content
                    articlePassages = [{
                            id: `passage-${id}-0`,
                            text: articleContent.content || '',
                            element: 'div',
                            startIndex: 0,
                            endIndex: (articleContent.content || '').length,
                            analyses: null
                        }];
                }
                setContent(articleContent);
                setPassages(articlePassages);
                setIsLoading(false);
            }
            catch (error) {
                logger.error('Error loading article:', error);
                setError('Failed to load article');
                setIsLoading(false);
            }
        };
        loadArticle();
    }, [id]);
    // Handle going back to the previous page
    const handleBack = () => {
        navigate(-1);
    };
    // Track when analysis completes
    const handleAnalysisComplete = (analysisResults) => {
        logger.info('Analysis complete', { articleId: id });
        // Could do something with the results here if needed
    };
    if (isLoading) {
        return (_jsx("div", { className: "article-page", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { children: "Loading article..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "article-page", children: _jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Error" }), _jsx("p", { children: error }), _jsx("button", { className: "back-button", onClick: handleBack, children: "Go Back" })] }) }));
    }
    return (_jsxs("div", { className: "article-page", children: [_jsxs("div", { className: "article-header", children: [_jsx("button", { className: "back-button", onClick: handleBack, children: "\u2190 Back" }), _jsxs("div", { className: "view-toggle", children: [_jsx("button", { className: `toggle-button ${activeView === 'enhanced' ? 'active' : ''}`, onClick: () => setActiveView('enhanced'), children: "Critical Reader" }), _jsx("button", { className: `toggle-button ${activeView === 'interactive' ? 'active' : ''}`, onClick: () => setActiveView('interactive'), children: "Interactive View" }), _jsx("button", { className: `toggle-button ${activeView === 'summary' ? 'active' : ''}`, onClick: () => setActiveView('summary'), children: "Summary View" })] })] }), _jsx("div", { className: "article-container", children: activeView === 'enhanced' ? (_jsx(EnhancedArticleView, { article: content, onAnalysisComplete: handleAnalysisComplete })) : activeView === 'interactive' ? (_jsx(InteractiveArticleView, { content: content, passages: passages })) : (_jsxs("div", { className: "summary-view", children: [_jsx("h1", { children: content.metadata?.title || 'Untitled Article' }), _jsxs("div", { className: "article-meta", children: [content.metadata?.byline && (_jsxs("div", { className: "article-author", children: ["By ", content.metadata.byline] })), content.metadata?.siteName && (_jsx("div", { className: "article-source", children: content.metadata.siteName })), content.metadata?.date && (_jsx("div", { className: "article-date", children: new Date(content.metadata.date).toLocaleDateString() }))] }), content.analysis && (_jsx(ArticleAnalysis, { title: content.metadata?.title || 'Untitled Article', source: content.metadata?.siteName || 'Unknown Source', author: content.metadata?.byline, date: content.metadata?.date, analysis: content.analysis }))] })) })] }));
};
export default ArticlePage;
