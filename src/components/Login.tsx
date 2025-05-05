import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onClose: () => void;
  switchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose, switchToRegister }) => {
  const { login, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    try {
      setError(null);
      // Check if identifier is an email or username
      const isEmail = identifier.includes('@');
      if (isEmail) {
        await login({ email: identifier, password });
      } else {
        await login({ username: identifier, password });
      }
      onClose(); // Close modal on successful login
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Sign In</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="identifier">Username or Email</label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
            placeholder="Username or email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="auth-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
      <div className="auth-links">
        <p>
          Don't have an account?{' '}
          <button type="button" className="link-button" onClick={switchToRegister}>
            Register
          </button>
        </p>
        <p>
          <button type="button" className="link-button">
            Forgot password?
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login; 