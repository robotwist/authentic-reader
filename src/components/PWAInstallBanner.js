import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import '../styles/PWAInstallBanner.css';
const PWAInstallBanner = ({ onInstall }) => {
    const [showBanner, setShowBanner] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    useEffect(() => {
        // Check if user has already dismissed the banner
        const hasSeenBanner = localStorage.getItem('pwa-banner-dismissed');
        if (hasSeenBanner)
            return;
        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowBanner(false);
        }
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);
    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            setDeferredPrompt(null);
            setShowBanner(false);
            onInstall?.();
        }
    };
    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-banner-dismissed', 'true');
    };
    if (!showBanner)
        return null;
    return (_jsx("div", { className: "pwa-install-banner", children: _jsxs("div", { className: "banner-content", children: [_jsxs("div", { className: "banner-text", children: [_jsx(FiDownload, { className: "banner-icon" }), _jsx("span", { children: "Install Authentic Reader for a better experience" })] }), _jsxs("div", { className: "banner-actions", children: [_jsx("button", { onClick: handleInstall, className: "install-btn", children: "Install" }), _jsx("button", { onClick: handleDismiss, className: "dismiss-btn", children: _jsx(FiX, {}) })] })] }) }));
};
export default PWAInstallBanner;
