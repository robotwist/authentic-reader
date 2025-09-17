import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import LogRocket from '../utils/logRocket';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error, errorInfo: null };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error to LogRocket
        LogRocket.captureException(error);
        // Get the LogRocket session URL for this error
        const sessionUrl = LogRocket.sessionURL;
        // Send error details to our backend API
        if (sessionUrl) {
            fetch('/api/admin/error-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionUrl,
                    error: error.toString(),
                    userId: window.currentUserId || null
                }),
            }).catch(err => console.error('Failed to send error to backend API:', err));
        }
        // Set the error info in state
        this.setState({ errorInfo });
        // You can also log to console for development
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            // If a custom fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default fallback UI
            return (_jsxs("div", { className: "error-boundary-fallback", children: [_jsx("h2", { children: "Something went wrong." }), _jsx("p", { children: "Our team has been notified and is looking into the issue." }), process.env.NODE_ENV === 'development' && (_jsxs("div", { children: [_jsx("p", { children: this.state.error?.toString() }), _jsx("pre", { children: this.state.errorInfo?.componentStack })] })), _jsx("button", { onClick: () => window.location.reload(), children: "Refresh the page" })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
