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
        
        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul>
            {/* Primary Navigation */}
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''} aria-current={isActive('/') ? 'page' : undefined}>
                Home
              </Link>
            </li>
            
            <li>
              <Link 
                to="/library" 
                className={isActive('/library') ? 'active' : ''} 
                aria-current={isActive('/library') ? 'page' : undefined}
              >
                My Library
              </Link>
            </li>
            
            {/* Analysis Dropdown - Simplified */}
            <li ref={analysisDropdownRef} className="dropdown">
              <button 
                className={`nav-link dropdown-toggle ${isActivePrefix('/analysis') ? 'active' : ''}`}
                onClick={() => setIsAnalysisDropdownOpen(!isAnalysisDropdownOpen)}
                aria-expanded={isAnalysisDropdownOpen}
                aria-haspopup="true"
              >
                Analysis Tools <FiChevronDown className={`dropdown-icon ${isAnalysisDropdownOpen ? 'open' : ''}`} />
              </button>
              
              {isAnalysisDropdownOpen && (
                <div className="dropdown-menu" role="menu">
                  <Link to="/analysis" className="dropdown-item" role="menuitem">
                    Analysis Dashboard
                  </Link>
                  <Link to="/article/:id" className="dropdown-item" role="menuitem">
                    Critical Reader
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link to="/analysis/bias" className="dropdown-item" role="menuitem">
                    Bias Detection
                  </Link>
                  <Link to="/analysis/rhetorical" className="dropdown-item" role="menuitem">
                    Rhetorical Analysis
                  </Link>
                  <Link to="/analysis/entity" className="dropdown-item" role="menuitem">
                    Entity Relationships
                  </Link>
                </div>
              )}
            </li>
            
            {/* User-specific Navigation */}
            {isLoggedIn ? (
              <li ref={userDropdownRef} className="dropdown user-dropdown">
                <button 
                  className={`nav-link dropdown-toggle ${isActivePrefix('/profile') || isActivePrefix('/settings') ? 'active' : ''}`}
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="true"
                >
                  <FiUser className="nav-icon" /> <FiChevronDown className={`dropdown-icon ${isUserDropdownOpen ? 'open' : ''}`} />
                </button>
                
                {isUserDropdownOpen && (
                  <div className="dropdown-menu user-menu" role="menu">
                    <div className="dropdown-header">
                      Signed in as <strong>{user?.username}</strong>
                    </div>
                    <Link to="/profile" className="dropdown-item" role="menuitem">
                      <FiUser className="dropdown-icon-left" /> Profile
                    </Link>
                    <Link to="/saved" className="dropdown-item" role="menuitem">
                      <FiBook className="dropdown-icon-left" /> Saved Articles
                    </Link>
                    <Link to="/settings" className="dropdown-item" role="menuitem">
                      <FiSettings className="dropdown-icon-left" /> Settings
                    </Link>
                    {user?.isAdmin && (
                      <Link to="/admin" className="dropdown-item" role="menuitem">
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={handleLogout} role="menuitem">
                      Sign Out
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <>
                <li><button className="nav-button" onClick={handleLogin}>Sign In</button></li>
                <li><button className="nav-button primary" onClick={handleRegister}>Register</button></li>
              </>
            )}
            
            {/* Search button - could be expanded to a full search bar */}
            <li className="search-button">
              <button className="icon-button" aria-label="Search">
                <FiSearch />
              </button>
            </li>
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