import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CommunityArticleReader from '../components/CommunityArticleReader';
import { intellectualSelfDefenseService } from '../services/intellectualSelfDefenseService';
import { logger } from '../utils/logger';
import './ArticleReaderPage.css';
const ArticleReaderPage = () => {
    const { articleId } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadArticle();
    }, [articleId]);
    const loadArticle = async () => {
        console.log('ArticleReaderPage: Loading article with ID:', articleId);
        if (!articleId) {
            console.error('No article ID provided');
            setError('No article ID provided');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const decodedId = decodeURIComponent(articleId);
            console.log('Calling intellectualSelfDefenseService.getArticleById with:', decodedId);
            // Get the specific article by ID
            const foundArticle = await intellectualSelfDefenseService.getArticleById(decodedId);
            console.log('Service returned article:', foundArticle);
            if (!foundArticle) {
                console.error('Article not found for ID:', articleId);
                setError('Article not found');
                setLoading(false);
                return;
            }
            setArticle(foundArticle);
            logger.info('Article loaded for reading', { articleId, title: foundArticle.title });
        }
        catch (error) {
            console.error('Failed to load article:', error);
            logger.error('Failed to load article:', error);
            setError('Failed to load article');
        }
        finally {
            setLoading(false);
        }
    };
    const handleBack = () => {
        navigate('/');
    };
    if (loading) {
        return (_jsx("div", { className: "article-reader-page", children: _jsxs("div", { className: "loading-container", children: [_jsx("div", { className: "loading-spinner" }), _jsx("h2", { children: "Loading Article for Analysis..." }), _jsx("p", { children: "Preparing your intellectual self-defense tools" })] }) }));
    }
    if (error || !article) {
        return (_jsx("div", { className: "article-reader-page", children: _jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Unable to Load Article" }), _jsx("p", { children: error || 'Article not found' }), _jsx("button", { className: "back-button", onClick: handleBack, children: "\u2190 Back to Course" })] }) }));
    }
    return (_jsx("div", { className: "article-reader-page", children: _jsx(CommunityArticleReader, { article: article, onBack: handleBack }) }));
};
export default ArticleReaderPage;
