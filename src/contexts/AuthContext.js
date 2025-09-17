import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { authApi, clearAuth, getCurrentUser, isAuthenticated } from '../services/apiService';
// Create the context with default values
const AuthContext = createContext({
    user: null,
    isLoggedIn: false,
    token: null,
    login: async () => { },
    register: async () => { },
    logout: () => { },
    updateUser: async () => { },
    loading: true,
    error: null,
});
// Hook for easy access to the auth context
export const useAuth = () => useContext(AuthContext);
// Auth Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                        }
                        catch (error) {
                            console.error('Session expired or invalid token:', error);
                            clearAuth();
                            setUser(null);
                            setToken(null);
                        }
                    }
                }
            }
            catch (err) {
                console.error('Error checking auth status:', err);
                clearAuth();
                setUser(null);
                setToken(null);
            }
            finally {
                setLoading(false);
            }
        };
        checkAuthStatus();
    }, []);
    // Login handler
    const login = async (credentials) => {
        try {
            setLoading(true);
            setError(null);
            const userData = await authApi.login(credentials);
            setUser(userData);
            setToken(localStorage.getItem('auth_token'));
        }
        catch (error) {
            setError(error.message || 'Failed to login');
            throw error;
        }
        finally {
            setLoading(false);
        }
    };
    // Register handler
    const register = async (username, email, password) => {
        try {
            setLoading(true);
            setError(null);
            const userData = await authApi.register(username, email, password);
            setUser(userData);
            setToken(localStorage.getItem('auth_token'));
        }
        catch (error) {
            setError(error.message || 'Failed to register');
            throw error;
        }
        finally {
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
    const updateUser = async (updates) => {
        try {
            setLoading(true);
            setError(null);
            const updatedUser = await authApi.updateProfile(updates);
            setUser((prev) => prev ? { ...prev, ...updatedUser } : updatedUser);
        }
        catch (error) {
            setError(error.message || 'Failed to update profile');
            throw error;
        }
        finally {
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
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export default AuthContext;
