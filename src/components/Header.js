import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiChevronDown, FiUser, FiBook, FiSettings } from 'react-icons/fi';
import FeatureSearch from './FeatureSearch';
import '../styles/Header.css';
import AuthModal from './AuthModal';
// Use public asset path directly to avoid Vite warning about importing from public
const AUTHENTIC_LOGO_URL = '/authentic-internet-logo.png';
const Header = ({}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState('login');
    const [isAnalysisDropdownOpen, setIsAnalysisDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoggedIn, logout } = useAuth();
    const analysisDropdownRef = useRef(null);
    const userDropdownRef = useRef(null);
    const [deferredInstallEvent, setDeferredInstallEvent] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);
    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (analysisDropdownRef.current && !analysisDropdownRef.current.contains(event.target)) {
                setIsAnalysisDropdownOpen(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    // Close dropdowns when navigating
    useEffect(() => {
        setIsAnalysisDropdownOpen(false);
        setIsUserDropdownOpen(false);
        setIsMenuOpen(false);
    }, [location.pathname]);
    // PWA install prompt handling
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredInstallEvent(e);
        };
        const installedHandler = () => {
            setDeferredInstallEvent(null);
        };
        // Detect standalone display mode
        const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
        setIsStandalone(standalone);
        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', installedHandler);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);
    const handleInstallClick = async () => {
        if (!deferredInstallEvent)
            return;
        try {
            await deferredInstallEvent.prompt();
            // Optionally inspect userChoice here
            setDeferredInstallEvent(null);
        }
        catch (_err) {
            // Dismissed or error; keep the button available
        }
    };
    const handleLogin = () => {
        setAuthModalView('login');
        setIsAuthModalOpen(true);
    };
    const handleRegister = () => {
        setAuthModalView('register');
        setIsAuthModalOpen(true);
    };
    const handleLogout = () => {
        logout();
        // Close menu after logout
        setIsMenuOpen(false);
        // Redirect to home page
        navigate('/');
    };
    // Helper to check if link is active
    const isActive = (path) => location.pathname === path;
    // Helper to check if a path starts with the given prefix
    const isActivePrefix = (prefix) => location.pathname.startsWith(prefix);
    return (_jsxs("header", { className: "app-header", children: [_jsxs("div", { className: "header-container", children: [_jsx("div", { className: "header-left", children: _jsxs("div", { className: "logo-container", children: [_jsx("img", { src: AUTHENTIC_LOGO_URL, alt: "Authentic Internet Logo", className: "logo-image" }), _jsx("h1", { className: "app-title", children: "Intellectual Self Defense" })] }) }), _jsxs("button", { className: "menu-toggle", onClick: () => setIsMenuOpen(!isMenuOpen), "aria-label": "Toggle menu", "aria-expanded": isMenuOpen, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }), _jsx("nav", { className: `nav-menu ${isMenuOpen ? 'open' : ''}`, role: "navigation", "aria-label": "Main navigation", children: _jsxs("ul", { role: "menubar", children: [_jsx("li", { role: "none", children: _jsx(Link, { to: "/", className: isActive('/') ? 'active' : '', "aria-current": isActive('/') ? 'page' : undefined, role: "menuitem", tabIndex: 0, children: "Intellectual Self Defense" }) }), _jsx("li", { role: "none", children: _jsx(Link, { to: "/forces-for-good", className: isActive('/forces-for-good') ? 'active' : '', "aria-current": isActive('/forces-for-good') ? 'page' : undefined, role: "menuitem", tabIndex: 0, children: "Forces for Good" }) }), _jsx("li", { role: "none", children: _jsxs(Link, { to: "/settings", className: isActive('/settings') ? 'active' : '', "aria-current": isActive('/settings') ? 'page' : undefined, role: "menuitem", tabIndex: 0, children: [_jsx(FiSettings, {}), "Settings"] }) }), _jsx("li", { role: "none", className: "feature-search-nav", children: _jsx(FeatureSearch, {}) }), _jsx("li", { role: "none", children: _jsx(Link, { to: "/about", className: isActive('/about') ? 'active' : '', "aria-current": isActive('/about') ? 'page' : undefined, role: "menuitem", tabIndex: 0, children: "About" }) }), !isStandalone && deferredInstallEvent && (_jsx("li", { role: "none", children: _jsx("button", { onClick: handleInstallClick, className: "auth-button", role: "menuitem", tabIndex: 0, children: "Install App" }) })), isLoggedIn ? (_jsxs("li", { role: "none", ref: userDropdownRef, children: [_jsxs("button", { className: "dropdown-toggle user-dropdown", onClick: () => setIsUserDropdownOpen(!isUserDropdownOpen), "aria-expanded": isUserDropdownOpen, role: "menuitem", tabIndex: 0, children: [_jsx(FiUser, {}), user?.username || 'User', _jsx(FiChevronDown, {})] }), isUserDropdownOpen && (_jsxs("ul", { className: "dropdown-menu", role: "menu", children: [_jsx("li", { role: "none", children: _jsxs(Link, { to: "/library", role: "menuitem", tabIndex: 0, children: [_jsx(FiBook, {}), "Library"] }) }), _jsx("li", { role: "none", children: _jsx("button", { onClick: handleLogout, role: "menuitem", tabIndex: 0, children: "Logout" }) })] }))] })) : (_jsx("li", { role: "none", children: _jsx("button", { onClick: handleLogin, className: "auth-button", role: "menuitem", tabIndex: 0, children: "Login" }) }))] }) })] }), _jsx(AuthModal, { isOpen: isAuthModalOpen, onClose: () => setIsAuthModalOpen(false), initialView: authModalView })] }));
};
export default Header;
