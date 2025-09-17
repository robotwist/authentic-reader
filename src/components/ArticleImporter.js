import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FiLink, FiClipboard, FiCheck } from 'react-icons/fi';
import '../styles/ArticleImporter.css';
const ArticleImporter = () => {
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const handleUrlSubmit = (e) => {
        e.preventDefault();
        if (!url.trim()) {
            setMessage({ text: 'Please enter a valid URL', type: 'error' });
            return;
        }
        setIsLoading(true);
        setMessage({ text: 'Importing article from URL...', type: 'info' });
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setMessage({ text: 'Article successfully imported!', type: 'success' });
            // In a real implementation, this would navigate to the article view
        }, 2000);
    };
    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) {
            setMessage({ text: 'Please enter article text', type: 'error' });
            return;
        }
        setIsLoading(true);
        setMessage({ text: 'Processing article text...', type: 'info' });
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setMessage({ text: 'Article successfully processed!', type: 'success' });
            // In a real implementation, this would navigate to the article view
        }, 2000);
    };
    const handlePaste = () => {
        navigator.clipboard.readText()
            .then(clipText => {
            setText(clipText);
            setMessage({ text: 'Text pasted from clipboard', type: 'success' });
        })
            .catch(() => {
            setMessage({ text: 'Failed to read from clipboard', type: 'error' });
        });
    };
    return (_jsxs("div", { className: "article-importer-container", children: [_jsx("h1", { children: "Import Article" }), _jsx("p", { className: "importer-description", children: "Import articles for analysis by entering a URL or pasting the content directly." }), _jsxs("div", { className: "import-methods", children: [_jsxs("div", { className: "import-method", children: [_jsxs("h2", { children: [_jsx(FiLink, {}), " Import from URL"] }), _jsxs("form", { onSubmit: handleUrlSubmit, children: [_jsx("input", { type: "url", placeholder: "https://example.com/article", value: url, onChange: (e) => setUrl(e.target.value), disabled: isLoading }), _jsx("button", { type: "submit", disabled: isLoading, children: isLoading ? 'Importing...' : 'Import' })] })] }), _jsxs("div", { className: "import-method", children: [_jsxs("h2", { children: [_jsx(FiClipboard, {}), " Paste Article Text"] }), _jsx("div", { className: "paste-controls", children: _jsxs("button", { type: "button", onClick: handlePaste, className: "paste-button", disabled: isLoading, children: [_jsx(FiClipboard, {}), " Paste from Clipboard"] }) }), _jsxs("form", { onSubmit: handleTextSubmit, children: [_jsx("textarea", { placeholder: "Paste or type article text here...", value: text, onChange: (e) => setText(e.target.value), disabled: isLoading, rows: 10 }), _jsx("button", { type: "submit", disabled: isLoading || !text.trim(), children: isLoading ? 'Processing...' : 'Analyze Text' })] })] })] }), message && (_jsxs("div", { className: `message ${message.type}`, children: [message.type === 'success' && _jsx(FiCheck, {}), _jsx("span", { children: message.text })] })), _jsxs("div", { className: "upload-info", children: [_jsx("h3", { children: "About Article Importing" }), _jsx("p", { children: "Our article importer tool extracts the main content from news articles, blog posts, and other web content for analysis. For best results, use the URL import option as it preserves formatting and metadata. Text pasting works well for plain content when a URL isn't available." }), _jsxs("p", { children: [_jsx("strong", { children: "Supported Content Types:" }), " News articles, blog posts, opinion pieces, research papers, and most text-based web content."] })] })] }));
};
export default ArticleImporter;
