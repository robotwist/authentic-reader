import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

/**
 * AuthModal component - placeholder for authentication modal
 * TODO: Implement full auth modal UI
 */
const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const { login, register } = useAuth();
  const [view, setView] = React.useState<'login' | 'register'>(initialView || 'login');
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setView(initialView || 'login');
  }, [initialView]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'login') {
        await login(email || username, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="modal-content">
          <div className="auth-form-container">
            <h2>{view === 'login' ? 'Login' : 'Register'}</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
              {view === 'register' && (
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">{view === 'login' ? 'Email or Username' : 'Email'}</label>
                <input
                  id="email"
                  type={view === 'login' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Loading...' : view === 'login' ? 'Login' : 'Register'}
                </button>
              </div>
              <div className="auth-links">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setView(view === 'login' ? 'register' : 'login');
                    setError(null);
                  }}
                >
                  {view === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

