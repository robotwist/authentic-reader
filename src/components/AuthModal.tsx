import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialView = 'login' 
}) => {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const { isLoggedIn } = useAuth();

  // If user is already logged in, no need to show the modal
  if (isLoggedIn) {
    return null;
  }
  
  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  const handleSwitchToRegister = () => {
    setView('register');
  };

  const handleSwitchToLogin = () => {
    setView('login');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <div className="modal-content">
          {view === 'login' ? (
            <Login 
              onClose={onClose} 
              switchToRegister={handleSwitchToRegister} 
            />
          ) : (
            <Register 
              onClose={onClose} 
              switchToLogin={handleSwitchToLogin} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
