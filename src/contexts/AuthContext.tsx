import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getCurrentUser, isAuthenticated as checkAuth, authApi } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(checkAuth());

  // Load user on mount
  useEffect(() => {
    if (isLoggedIn) {
      refreshUser().catch(() => {
        // If refresh fails, user might not be valid anymore
        logout();
      });
    }
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const loggedInUser = await authApi.login({
        email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
        username: emailOrUsername.includes('@') ? undefined : emailOrUsername,
        password,
      });
      setUser(loggedInUser);
      setIsLoggedIn(true);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const newUser = await authApi.register(username, email, password);
      setUser(newUser);
      setIsLoggedIn(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getProfile();
      setUser(currentUser);
      setIsLoggedIn(true);
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

