import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import '../styles/Auth.css';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const Login: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if ((loginMethod === 'email' && !email.trim()) || 
        (loginMethod === 'username' && !username.trim()) || 
        !password.trim()) {
      setError(`Please enter both ${loginMethod} and password`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the login function from AuthContext with appropriate credentials
      if (loginMethod === 'email') {
        await login({ email, password });
      } else {
        await login({ username, password });
      }
      
      logger.info('Login successful, redirecting to admin dashboard');
      
      // Redirect to admin page after successful login
      navigate('/admin');
    } catch (err) {
      logger.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(prev => prev === 'email' ? 'username' : 'email');
    setError(null);
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
        
        <div className="login-method-toggle">
          <button 
            type="button"
            className={`toggle-btn ${loginMethod === 'email' ? 'active' : ''}`} 
            onClick={() => setLoginMethod('email')}
          >
            Email
          </button>
          <button 
            type="button"
            className={`toggle-btn ${loginMethod === 'username' ? 'active' : ''}`} 
            onClick={() => setLoginMethod('username')}
          >
            Username
          </button>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor={loginMethod}>{loginMethod === 'email' ? 'Email' : 'Username'}</label>
            <div className="input-with-icon">
              {loginMethod === 'email' ? (
                <>
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
                </>
              ) : (
                <>
                  <FiUser className="input-icon" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </>
              )}
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
            <strong>Note:</strong> Contact your administrator for login credentials
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 