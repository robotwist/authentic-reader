import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import '../styles/Auth.css';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
const Login = () => {
    const [loginMethod, setLoginMethod] = useState('email');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
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
            }
            else {
                await login({ username, password });
            }
            logger.info('Login successful, redirecting to admin dashboard');
            // Redirect to admin page after successful login
            navigate('/admin');
        }
        catch (err) {
            logger.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Authentication failed');
        }
        finally {
            setIsLoading(false);
        }
    };
    const toggleLoginMethod = () => {
        setLoginMethod(prev => prev === 'email' ? 'username' : 'email');
        setError(null);
    };
    return (_jsx("div", { className: "auth-container", children: _jsxs("div", { className: "auth-card", children: [_jsxs("div", { className: "auth-header", children: [_jsx("h1", { children: "Welcome Back" }), _jsx("p", { children: "Sign in to continue your authentic reading experience" })] }), error && (_jsxs("div", { className: "auth-error", children: [_jsx(FiAlertCircle, {}), _jsx("span", { children: error })] })), _jsxs("div", { className: "login-method-toggle", children: [_jsx("button", { type: "button", className: `toggle-btn ${loginMethod === 'email' ? 'active' : ''}`, onClick: () => setLoginMethod('email'), children: "Email" }), _jsx("button", { type: "button", className: `toggle-btn ${loginMethod === 'username' ? 'active' : ''}`, onClick: () => setLoginMethod('username'), children: "Username" })] }), _jsxs("form", { className: "auth-form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: loginMethod, children: loginMethod === 'email' ? 'Email' : 'Username' }), _jsx("div", { className: "input-with-icon", children: loginMethod === 'email' ? (_jsxs(_Fragment, { children: [_jsx(FiMail, { className: "input-icon" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Enter your email", disabled: isLoading, autoComplete: "email" })] })) : (_jsxs(_Fragment, { children: [_jsx(FiUser, { className: "input-icon" }), _jsx("input", { id: "username", type: "text", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Enter your username", disabled: isLoading, autoComplete: "username" })] })) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "password", children: "Password" }), _jsxs("div", { className: "input-with-icon", children: [_jsx(FiLock, { className: "input-icon" }), _jsx("input", { id: "password", type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter your password", disabled: isLoading, autoComplete: "current-password" }), _jsx("button", { type: "button", className: "toggle-password", onClick: () => setShowPassword(!showPassword), tabIndex: -1, children: showPassword ? _jsx(FiEyeOff, {}) : _jsx(FiEye, {}) })] })] }), _jsxs("div", { className: "form-options", children: [_jsxs("label", { className: "remember-me", children: [_jsx("input", { type: "checkbox" }), " Remember me"] }), _jsx(Link, { to: "/forgot-password", className: "forgot-password", children: "Forgot password?" })] }), _jsx("button", { type: "submit", className: "auth-button", disabled: isLoading, children: isLoading ? 'Signing in...' : 'Sign In' })] }), _jsx("div", { className: "auth-divider", children: _jsx("span", { children: "OR" }) }), _jsx("button", { className: "social-button google", children: "Continue with Google" }), _jsxs("div", { className: "auth-footer", children: [_jsxs("p", { children: ["Don't have an account? ", _jsx(Link, { to: "/register", children: "Sign up" })] }), _jsxs("p", { className: "demo-info", children: [_jsx("strong", { children: "Note:" }), " Contact your administrator for login credentials"] })] })] }) }));
};
export default Login;
