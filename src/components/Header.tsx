import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface HeaderProps {}

const Header = ({}: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  
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
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <h1>Authentic Reader</h1>
          <p className="tagline">Content that respects your intelligence</p>
        </div>
        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <button 
            className="menu-toggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul>
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
            </li>
            <li>
              <Link to="/sources" className={isActive('/sources') ? 'active' : ''}>My Sources</Link>
            </li>
            <li>
              <Link to="/reader" className="nav-link">
                Reader
              </Link>
            </li>
            <li>
              <Link to="/analysis" className="nav-link">
                Analysis
              </Link>
            </li>
            <li>
              <Link to="/benchmark" className={isActive('/benchmark') ? 'active' : ''}>
                Benchmark
              </Link>
            </li>
            <li>
              <Link to="/env-test" className={isActive('/env-test') ? 'active' : ''}>Env Test</Link>
            </li>
            
            {isLoggedIn ? (
              <>
                <li>
                  <Link to="/saved" className={isActive('/saved') ? 'active' : ''}>Saved Articles</Link>
                </li>
                {user?.isAdmin && (
                  <li>
                    <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>Admin Dashboard</Link>
                  </li>
                )}
                <li>
                  <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>
                    Profile ({user?.username})
                  </Link>
                </li>
                <li>
                  <button className="nav-button" onClick={handleLogout}>Sign Out</button>
                </li>
              </>
            ) : (
              <>
                <li><button className="nav-button" onClick={handleLogin}>Sign In</button></li>
                <li><button className="nav-button primary" onClick={handleRegister}>Register</button></li>
              </>
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