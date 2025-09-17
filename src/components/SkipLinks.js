import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '../styles/SkipLinks.css';
/**
 * Skip Links Component
 *
 * Provides keyboard navigation shortcuts for accessibility.
 * Allows users to skip directly to main content areas.
 */
const SkipLinks = () => {
    return (_jsxs("nav", { className: "skip-links", "aria-label": "Skip navigation", children: [_jsx("a", { href: "#main-content", className: "skip-link", onClick: (e) => {
                    e.preventDefault();
                    const element = document.getElementById('main-content');
                    if (element) {
                        element.focus();
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, children: "Skip to main content" }), _jsx("a", { href: "#balanced-feed", className: "skip-link", onClick: (e) => {
                    e.preventDefault();
                    const element = document.getElementById('balanced-feed');
                    if (element) {
                        element.focus();
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, children: "Skip to balanced feed" }), _jsx("a", { href: "#navigation", className: "skip-link", onClick: (e) => {
                    e.preventDefault();
                    const element = document.querySelector('nav[role="navigation"]');
                    if (element) {
                        element.focus();
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, children: "Skip to navigation" }), _jsx("a", { href: "#search", className: "skip-link", onClick: (e) => {
                    e.preventDefault();
                    const element = document.querySelector('input[type="search"], .search-input, [role="search"]');
                    if (element) {
                        element.focus();
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, children: "Skip to search" }), _jsx("a", { href: "#footer", className: "skip-link", onClick: (e) => {
                    e.preventDefault();
                    const element = document.querySelector('footer');
                    if (element) {
                        element.focus();
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, children: "Skip to footer" })] }));
};
export default SkipLinks;
