import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiChevronDown, FiUser, FiBook, FiSearch, FiSettings } from 'react-icons/fi';
import '../styles/Header.css';
import AuthModal from './AuthModal';

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
        <div className="logo">
          <Link to="/">
            <h1>Authentic Reader</h1>
            <p className="tagline">Content that respects your intelligence</p>
          </Link>
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
                </ul>
              )}
            </li>
            
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