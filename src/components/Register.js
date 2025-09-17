import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import '../styles/Auth.css';
const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation
        if (!username.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all required fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        setIsLoading(true);
        setError(null);
        // Simulate API call for registration
        setTimeout(() => {
            // In a real application, this would be an actual API call
            setIsLoading(false);
            setSuccess(true);
        }, 1500);
    };
    return (_jsx("div", { className: "auth-container", children: _jsx("div", { className: "auth-card", children: success ? (_jsxs("div", { className: "success-message", children: [_jsx("div", { className: "success-icon", children: _jsx(FiCheck, {}) }), _jsx("h2", { children: "Registration Successful!" }), _jsx("p", { children: "Your account has been created. You can now sign in with your credentials." }), _jsx(Link, { to: "/login", className: "auth-button", children: "Sign In" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "auth-header", children: [_jsx("h1", { children: "Create an Account" }), _jsx("p", { children: "Join Authentic Reader to enhance your reading experience" })] }), error && (_jsxs("div", { className: "auth-error", children: [_jsx(FiAlertCircle, {}), _jsx("span", { children: error })] })), _jsxs("form", { className: "auth-form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "username", children: "Username" }), _jsxs("div", { className: "input-with-icon", children: [_jsx(FiUser, { className: "input-icon" }), _jsx("input", { id: "username", type: "text", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Choose a username", disabled: isLoading, autoComplete: "username" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsxs("div", { className: "input-with-icon", children: [_jsx(FiMail, { className: "input-icon" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Enter your email", disabled: isLoading, autoComplete: "email" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "password", children: "Password" }), _jsxs("div", { className: "input-with-icon", children: [_jsx(FiLock, { className: "input-icon" }), _jsx("input", { id: "password", type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Create a password", disabled: isLoading, autoComplete: "new-password" }), _jsx("button", { type: "button", className: "toggle-password", onClick: () => setShowPassword(!showPassword), tabIndex: -1, children: showPassword ? _jsx(FiEyeOff, {}) : _jsx(FiEye, {}) })] }), _jsxs("div", { className: "password-strength", children: [_jsx("div", { className: `strength-bar ${password.length >= 8 ? 'strong' : 'weak'}` }), _jsx("span", { className: "strength-text", children: password.length === 0 ? 'Password strength' :
                                                    password.length < 8 ? 'Weak' : 'Strong' })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "confirm-password", children: "Confirm Password" }), _jsxs("div", { className: "input-with-icon", children: [_jsx(FiLock, { className: "input-icon" }), _jsx("input", { id: "confirm-password", type: showPassword ? 'text' : 'password', value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Confirm your password", disabled: isLoading, autoComplete: "new-password" })] })] }), _jsx("div", { className: "terms-agreement", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", required: true }), _jsxs("span", { children: ["I agree to the ", _jsx(Link, { to: "/terms", children: "Terms of Service" }), " and ", _jsx(Link, { to: "/privacy", children: "Privacy Policy" })] })] }) }), _jsx("button", { type: "submit", className: "auth-button", disabled: isLoading, children: isLoading ? 'Creating Account...' : 'Create Account' })] }), _jsx("div", { className: "auth-divider", children: _jsx("span", { children: "OR" }) }), _jsx("button", { className: "social-button google", children: "Sign up with Google" }), _jsx("div", { className: "auth-footer", children: _jsxs("p", { children: ["Already have an account? ", _jsx(Link, { to: "/login", children: "Sign in" })] }) })] })) }) }));
};
export default Register;
