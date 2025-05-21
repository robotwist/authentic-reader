import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, clearAuth, getCurrentUser, isAuthenticated } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  login: (credentials: { email?: string; username?: string; password: string }) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: async () => {},
  loading: true,
  error: null,
});

// Hook for easy access to the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing user session on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          const storedToken = localStorage.getItem('auth_token');
          
          if (currentUser && storedToken) {
            try {
              // Verify token validity by calling an API
              const profile = await authApi.getProfile();
              setUser(profile);
              setToken(storedToken);
            } catch (error) {
              console.error('Session expired or invalid token:', error);
              clearAuth();
              setUser(null);
              setToken(null);
            }
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        clearAuth();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login handler
  const login = async (credentials: { email?: string; username?: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authApi.login(credentials);
      setUser(userData);
      setToken(localStorage.getItem('auth_token'));
    } catch (error: any) {
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authApi.register(username, email, password);
      setUser(userData);
      setToken(localStorage.getItem('auth_token'));
    } catch (error: any) {
      setError(error.message || 'Failed to register');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };

  // Update user handler
  const updateUser = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await authApi.updateProfile(updates);
      setUser((prev) => prev ? { ...prev, ...updatedUser } : updatedUser);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isLoggedIn: !!user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 