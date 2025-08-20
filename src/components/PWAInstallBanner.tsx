import React, { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import '../styles/PWAInstallBanner.css';

interface PWAInstallBannerProps {
  onInstall?: () => void;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstall }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // Check if user has already dismissed the banner
    const hasSeenBanner = localStorage.getItem('pwa-banner-dismissed');
    if (hasSeenBanner) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
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
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
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

  if (!showBanner) return null;

  return (
    <div className="pwa-install-banner">
      <div className="banner-content">
        <div className="banner-text">
          <FiDownload className="banner-icon" />
          <span>Install Authentic Reader for a better experience</span>
        </div>
        <div className="banner-actions">
          <button onClick={handleInstall} className="install-btn">
            Install
          </button>
          <button onClick={handleDismiss} className="dismiss-btn">
            <FiX />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
