import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiBarChart2, FiTarget } from 'react-icons/fi';
import DynamicArticleGenerator from '../components/DynamicArticleGenerator';
import '../styles/ArticleGeneratorPage.css';
const ArticleGeneratorPage = () => {
    const navigate = useNavigate();
    const [selectedArticle, setSelectedArticle] = useState(null);
    const handleArticleSelected = (article) => {
        setSelectedArticle(article);
        // You could navigate to analysis page with the selected article
        console.log('Selected article for analysis:', article);
    };
    const handleArticlesGenerated = (articles) => {
        console.log('Generated articles:', articles);
    };
    return (_jsxs("div", { className: "article-generator-page", children: [_jsxs("div", { className: "page-header", children: [_jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Home"] }), _jsxs("div", { className: "header-info", children: [_jsx("h1", { children: "Dynamic Article Generator" }), _jsx("p", { children: "Create realistic, educational content for media literacy training and analysis" })] })] }), _jsx(DynamicArticleGenerator, { onArticlesGenerated: handleArticlesGenerated, onArticleSelected: handleArticleSelected }), _jsxs("div", { className: "quick-actions", children: [_jsx("h3", { children: "Quick Actions" }), _jsxs("div", { className: "actions-grid", children: [_jsxs("button", { onClick: () => navigate('/analysis'), className: "action-card", children: [_jsx(FiBarChart2, {}), _jsx("span", { children: "Go to Analysis" })] }), _jsxs("button", { onClick: () => navigate('/analysis/comparative'), className: "action-card", children: [_jsx(FiTarget, {}), _jsx("span", { children: "Comparative Analysis" })] }), _jsxs("button", { onClick: () => navigate('/sentiment-analysis'), className: "action-card", children: [_jsx(FiBookOpen, {}), _jsx("span", { children: "Sentiment Analysis" })] })] })] })] }));
};
export default ArticleGeneratorPage;
