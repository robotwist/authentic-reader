import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../contexts/AuthContext';
const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
    const [view, setView] = useState(initialView);
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
    return (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "modal-container", children: [_jsx("button", { className: "modal-close-btn", onClick: onClose, children: "\u00D7" }), _jsx("div", { className: "modal-content", children: view === 'login' ? (_jsx(Login, { onClose: onClose, switchToRegister: handleSwitchToRegister })) : (_jsx(Register, { onClose: onClose, switchToLogin: handleSwitchToLogin })) })] }) }));
};
export default AuthModal;
