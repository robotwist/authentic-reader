import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useArticles } from '../hooks/useArticles';
import ArticleCard from '../components/ArticleCard';
import { FiBookmark, FiClock, FiRss, FiPlusCircle } from 'react-icons/fi';
import '../styles/LibraryPage.css';
const LibraryPage = () => {
    const [activeTab, setActiveTab] = useState('saved');
    const [savedArticles, setSavedArticles] = useState([]);
    const [readArticles, setReadArticles] = useState([]);
    const { articles, sources, loading, markAsRead, markAsSaved, analyzeArticle } = useArticles();
    useEffect(() => {
        // Filter saved articles
        const saved = articles.filter(article => article.saved);
        setSavedArticles(saved);
        // Filter read articles
        const read = articles.filter(article => article.read);
        setReadArticles(read);
    }, [articles]);
    const handleAnalyzeArticle = async (article) => {
        try {
            await analyzeArticle(article);
            // Navigate to article page with ID
            const articleId = article.id || article.guid;
            if (articleId) {
                window.location.href = `/article/${articleId}`;
            }
        }
        catch (error) {
            console.error('Error analyzing article:', error);
        }
    };
    return (_jsxs("div", { className: "library-page", children: [_jsxs("header", { className: "library-header", children: [_jsx("h1", { children: "My Library" }), _jsx("p", { children: "Manage your saved content, reading history, and sources" })] }), _jsxs("div", { className: "library-tabs", children: [_jsxs("button", { className: `library-tab ${activeTab === 'saved' ? 'active' : ''}`, onClick: () => setActiveTab('saved'), children: [_jsx(FiBookmark, {}), " Saved Articles"] }), _jsxs("button", { className: `library-tab ${activeTab === 'history' ? 'active' : ''}`, onClick: () => setActiveTab('history'), children: [_jsx(FiClock, {}), " Reading History"] }), _jsxs("button", { className: `library-tab ${activeTab === 'sources' ? 'active' : ''}`, onClick: () => setActiveTab('sources'), children: [_jsx(FiRss, {}), " My Sources"] })] }), _jsxs("div", { className: "library-content", children: [activeTab === 'saved' && (_jsx("div", { className: "saved-articles-section", children: loading ? (_jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading your saved articles..." })] })) : savedArticles.length > 0 ? (_jsx("div", { className: "articles-grid", children: savedArticles.map(article => (_jsx(ArticleCard, { article: article, onRead: markAsRead, onSave: markAsSaved, onAnalyze: handleAnalyzeArticle }, article.id || article.guid))) })) : (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: _jsx(FiBookmark, { size: 48 }) }), _jsx("h3", { children: "No saved articles yet" }), _jsx("p", { children: "Articles you save will appear here for easy access." }), _jsx("button", { className: "primary-button", onClick: () => window.location.href = '/', children: "Browse Articles" })] })) })), activeTab === 'history' && (_jsx("div", { className: "reading-history-section", children: loading ? (_jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading your reading history..." })] })) : readArticles.length > 0 ? (_jsx("div", { className: "articles-grid", children: readArticles.map(article => (_jsx(ArticleCard, { article: article, onRead: markAsRead, onSave: markAsSaved, onAnalyze: handleAnalyzeArticle }, article.id || article.guid))) })) : (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: _jsx(FiClock, { size: 48 }) }), _jsx("h3", { children: "No reading history" }), _jsx("p", { children: "Articles you've read will appear here." }), _jsx("button", { className: "primary-button", onClick: () => window.location.href = '/', children: "Browse Articles" })] })) })), activeTab === 'sources' && (_jsxs("div", { className: "sources-section", children: [_jsxs("div", { className: "sources-header", children: [_jsx("h2", { children: "My News Sources" }), _jsxs("button", { className: "add-source-button", children: [_jsx(FiPlusCircle, {}), " Add Source"] })] }), loading ? (_jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading your sources..." })] })) : sources.length > 0 ? (_jsx("div", { className: "sources-grid", children: sources.map(source => (_jsxs("div", { className: "source-card", children: [_jsx("div", { className: "source-icon", children: source.favicon ? (_jsx("img", { src: source.favicon, alt: source.name })) : (_jsx(FiRss, {})) }), _jsxs("div", { className: "source-details", children: [_jsx("h3", { children: source.name }), _jsx("p", { className: "source-category", children: source.category || 'News' }), _jsxs("div", { className: "source-meta", children: [_jsxs("span", { className: `source-reliability ${source.reliability}`, children: [source.reliability || 'Unknown', " Reliability"] }), _jsx("span", { className: `source-bias ${source.biasRating?.replace('-', '')}`, children: source.biasRating || 'Unrated' })] })] }), _jsxs("div", { className: "source-actions", children: [_jsx("button", { className: "source-action-btn", title: "Edit source", children: "Edit" }), _jsx("button", { className: "source-action-btn danger", title: "Remove source", children: "Remove" })] })] }, source.id))) })) : (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: _jsx(FiRss, { size: 48 }) }), _jsx("h3", { children: "No sources added yet" }), _jsx("p", { children: "Add sources to customize your news feed." }), _jsxs("button", { className: "primary-button", children: [_jsx(FiPlusCircle, {}), " Add Your First Source"] })] })), _jsxs("div", { className: "sources-info", children: [_jsx("h3", { children: "What are sources?" }), _jsx("p", { children: "Sources determine what content appears in your feed. Add trusted news sites, blogs, and other content sources to customize your reading experience." }), _jsx("h3", { children: "Source ratings explained" }), _jsx("p", { children: "Each source has reliability and bias ratings to help you understand potential content quality and perspective. These ratings are based on multiple media bias and fact-checking organizations." })] })] }))] })] }));
};
export default LibraryPage;
