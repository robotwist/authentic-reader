import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiChevronDown, FiUser, FiBook, FiSearch, FiSettings, FiTarget, FiCpu } from 'react-icons/fi';
import '../styles/Header.css';
import AuthModal from './AuthModal';
// Use public asset path directly to avoid Vite warning about importing from public
const AUTHENTIC_LOGO_URL = '/authentic-internet-logo.png';

// Minimal type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface HeaderProps {}

const Header = ({}: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const [isAnalysisDropdownOpen, setIsAnalysisDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const analysisDropdownRef = useRef<HTMLLIElement>(null);
  const userDropdownRef = useRef<HTMLLIElement>(null);
  const [deferredInstallEvent, setDeferredInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (analysisDropdownRef.current && !analysisDropdownRef.current.contains(event.target as Node)) {
        setIsAnalysisDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
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
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallEvent(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setDeferredInstallEvent(null);
    };
    // Detect standalone display mode
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallEvent) return;
    try {
      await deferredInstallEvent.prompt();
      // Optionally inspect userChoice here
      setDeferredInstallEvent(null);
    } catch (_err) {
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
  const isActive = (path: string) => location.pathname === path;
  
  // Helper to check if a path starts with the given prefix
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-container">
            <img src={AUTHENTIC_LOGO_URL} alt="Authentic Internet Logo" className="logo-image" />
            <h1 className="app-title">Authentic Reader</h1>
          </div>
        </div>
        
        <button 
          className="menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`} role="navigation" aria-label="Main navigation">
          <ul role="menubar">
            {/* Primary Navigation */}
            <li role="none">
              <Link 
                to="/" 
                className={isActive('/') ? 'active' : ''} 
                aria-current={isActive('/') ? 'page' : undefined}
                role="menuitem"
                tabIndex={0}
              >
                Balanced Feed
              </Link>
            </li>
            
            <li role="none">
              <Link 
                to="/settings" 
                className={isActive('/settings') ? 'active' : ''} 
                aria-current={isActive('/settings') ? 'page' : undefined}
                role="menuitem"
                tabIndex={0}
              >
                <FiSettings />
                Settings
              </Link>
            </li>
            
            <li role="none">
              <Link 
                to="/media-literacy-guide" 
                className={isActive('/media-literacy-guide') ? 'active' : ''} 
                aria-current={isActive('/media-literacy-guide') ? 'page' : undefined}
                role="menuitem"
                tabIndex={0}
              >
                <FiBook />
                Media Literacy
              </Link>
            </li>
            
            <li role="none">
              <Link 
                to="/political-analysis" 
                className={isActive('/political-analysis') ? 'active' : ''} 
                aria-current={isActive('/political-analysis') ? 'page' : undefined}
                role="menuitem"
                tabIndex={0}
              >
                <FiTarget />
                Political Analysis
              </Link>
            </li>
            
            <li role="none">
              <Link 
                to="/about" 
                className={isActive('/about') ? 'active' : ''} 
                aria-current={isActive('/about') ? 'page' : undefined}
                role="menuitem"
                tabIndex={0}
              >
                About
              </Link>
            </li>
            
            {/* Analysis Dropdown */}
            <li role="none" ref={analysisDropdownRef}>
              <button
                className={`dropdown-toggle ${isActivePrefix('/analysis') ? 'active' : ''}`}
                onClick={() => setIsAnalysisDropdownOpen(!isAnalysisDropdownOpen)}
                aria-expanded={isAnalysisDropdownOpen}
                role="menuitem"
                tabIndex={0}
              >
                Analysis
                <FiChevronDown />
              </button>
              {isAnalysisDropdownOpen && (
                <ul className="dropdown-menu" role="menu">
                  <li role="none">
                    <Link to="/analysis" role="menuitem" tabIndex={0}>
                      Content Analysis
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/analysis/bias" role="menuitem" tabIndex={0}>
                      Bias Detection
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/analysis/rhetorical" role="menuitem" tabIndex={0}>
                      Rhetorical Analysis
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/analysis/comparative" role="menuitem" tabIndex={0}>
                      Comparative Analysis
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/analytics" role="menuitem" tabIndex={0}>
                      Analytics Dashboard
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/analysis/enhanced-bias" role="menuitem" tabIndex={0}>
                      Enhanced Bias Detection
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/journalists" role="menuitem" tabIndex={0}>
                      Journalist Ratings
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/daily-deep-dive" role="menuitem" tabIndex={0}>
                      Daily Deep Dive
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/agentic-dashboard" role="menuitem" tabIndex={0}>
                      <FiCpu />
                      Agentic AI Dashboard
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            
            {/* Install App (PWA) */}
            {!isStandalone && deferredInstallEvent && (
              <li role="none">
                <button
                  onClick={handleInstallClick}
                  className="auth-button"
                  role="menuitem"
                  tabIndex={0}
                >
                  Install App
                </button>
              </li>
            )}

            {/* User Menu */}
            {isLoggedIn ? (
              <li role="none" ref={userDropdownRef}>
                <button
                  className="dropdown-toggle user-dropdown"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  aria-expanded={isUserDropdownOpen}
                  role="menuitem"
                  tabIndex={0}
                >
                  <FiUser />
                  {user?.username || 'User'}
                  <FiChevronDown />
                </button>
                {isUserDropdownOpen && (
                  <ul className="dropdown-menu" role="menu">
                    <li role="none">
                      <Link to="/library" role="menuitem" tabIndex={0}>
                        <FiBook />
                        Library
                      </Link>
                    </li>
                    <li role="none">
                      <button onClick={handleLogout} role="menuitem" tabIndex={0}>
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            ) : (
              <li role="none">
                <button
                  onClick={handleLogin}
                  className="auth-button"
                  role="menuitem"
                  tabIndex={0}
                >
                  Login
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalView}
      />
    </header>
  );
};

export default Header; 