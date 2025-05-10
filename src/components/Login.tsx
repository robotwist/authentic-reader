import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import '../styles/Auth.css';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the login function from AuthContext
      await login({ email, password });
      logger.info('Login successful, redirecting to admin dashboard');
      
      // Redirect to home page after successful login
      navigate('/admin');
    } catch (err) {
      logger.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue your authentic reading experience</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
          
          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <button className="social-button google">
          Continue with Google
        </button>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
          
          <p className="demo-info">
            <strong>Admin credentials:</strong> simpleadmin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 