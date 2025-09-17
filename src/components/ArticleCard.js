import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState } from 'react';
import '../styles/ArticleCard.css';
import { formatDate, truncateText } from '../utils/textUtils';
import { FaBookmark, FaRegBookmark, FaChevronRight, FaEye, FaEyeSlash, FaTextHeight, FaSpinner } from 'react-icons/fa';
import { Badge } from './ui/Badge';
import { getArticleTypeIcon } from '../utils/articleUtils';
import defaultImage from '../assets/default-article.svg';
import { logger } from '../utils/logger';
import EnhancedArticleAnalysis from './EnhancedArticleAnalysis';
const ArticleCard = memo(({ article, onSave, onAnalyze, isSaved = false, isRead = false }) => {
    const [imageError, setImageError] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    // Check if article has a valid image
    const hasValidImage = article.image && !imageError;
    // Get the appropriate image source with fallbacks
    const getImageSource = () => {
        if (imageError || !article.image) {
            return article.source?.favicon ? article.source.favicon : defaultImage;
        }
        return article.image;
    };
    // Get the article URL with fallbacks
    const getArticleUrl = () => {
        return article.url ||
            article.link ||
            article.guid?.toString() ||
            '#';
    };
    const handleCardClick = (e) => {
        // Don't trigger if clicking on buttons or links
        if (e.target instanceof HTMLButtonElement ||
            e.target instanceof HTMLAnchorElement ||
            e.target.closest('button') ||
            e.target.closest('a')) {
            return;
        }
        console.log('Article clicked:', article);
        // Try different possible URL properties
        const articleUrl = article.url ||
            article.link ||
            article.guid?.toString() ||
            '';
        if (articleUrl) {
            console.log('Opening article URL:', articleUrl);
            window.open(articleUrl, '_blank', 'noopener,noreferrer');
        }
        else {
            console.error('No URL found for article:', article);
            alert('Sorry, this article does not have a valid URL to open.');
        }
    };
    const handleReadClick = (e) => {
        e.stopPropagation();
        onRead(article.id);
    };
    const handleSaveClick = (e) => {
        e.stopPropagation();
        onSave(article.id);
    };
    const handleAnalyzeClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnalyzing)
            return; // Prevent multiple clicks
        setIsAnalyzing(true);
        logger.debug('🔍 Analyze button clicked for article:', article.title);
        try {
            // Show the enhanced analysis modal
            setShowAnalysis(true);
            if (onAnalyze) {
                // Pass the whole article object to the handler
                await onAnalyze(article);
            }
        }
        catch (error) {
            logger.error('Error in handleAnalyzeClick:', error);
        }
        finally {
            // Add a small delay before resetting to prevent flickering
            setTimeout(() => {
                setIsAnalyzing(false);
            }, 500);
        }
    };
    return (_jsxs("div", { className: `article-card ${article.read ? 'article-read' : ''} ${!hasValidImage ? 'no-image' : ''}`, onClick: handleCardClick, children: [article.saved && (_jsx("div", { className: "saved-badge", children: _jsx(FaBookmark, { className: "saved-icon" }) })), hasValidImage && (_jsxs("div", { className: "article-image-container", children: [_jsx("img", { src: getImageSource(), alt: article.title || 'Article', className: "article-image", onError: () => setImageError(true) }), article.contentType && (_jsx(Badge, { text: article.contentType, icon: getArticleTypeIcon(article.contentType), className: "content-type-badge" }))] })), _jsxs("div", { className: "article-content", children: [_jsxs("div", { className: "article-meta", children: [article.source?.name && (_jsx("span", { className: "article-source", children: article.source.name })), article.publishedAt && (_jsx("span", { className: "article-date", children: formatDate(article.publishedAt) }))] }), _jsx("h3", { className: "article-title", children: truncateText(article.title || 'Untitled', 80) }), article.summary && (_jsx("p", { className: "article-summary", children: truncateText(article.summary, 120) })), _jsxs("div", { className: "article-actions", children: [_jsx("button", { className: `action-btn ${article.read ? 'active' : ''}`, onClick: handleReadClick, title: article.read ? "Mark as unread" : "Mark as read", "aria-pressed": article.read, children: article.read ? _jsx(FaEye, {}) : _jsx(FaEyeSlash, {}) }), _jsx("button", { className: `action-btn ${article.saved ? 'active' : ''}`, onClick: handleSaveClick, title: article.saved ? "Remove from saved" : "Save for later", "aria-pressed": article.saved, children: article.saved ? _jsx(FaBookmark, {}) : _jsx(FaRegBookmark, {}) }), onAnalyze && (_jsx("button", { className: `action-btn analyze-btn ${isAnalyzing ? 'loading' : ''}`, onClick: handleAnalyzeClick, title: "Analyze article", disabled: isAnalyzing, "aria-busy": isAnalyzing, children: isAnalyzing ? _jsx(FaSpinner, { className: "fa-spin" }) : _jsx(FaTextHeight, {}) })), _jsxs("a", { href: getArticleUrl(), target: "_blank", rel: "noopener noreferrer", className: "read-more-link", onClick: (e) => e.stopPropagation(), children: ["Read ", _jsx(FaChevronRight, {})] })] })] }), _jsx(EnhancedArticleAnalysis, { article: article, isOpen: showAnalysis, onClose: () => setShowAnalysis(false) })] }));
});
ArticleCard.displayName = 'ArticleCard';
export default ArticleCard;
