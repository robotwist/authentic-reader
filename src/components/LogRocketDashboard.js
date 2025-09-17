import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
const LogRocketDashboard = () => {
    const { user } = useAuth();
    const [errorSessions, setErrorSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Only allow admins to access this dashboard
        if (!user || user.role !== 'admin') {
            return;
        }
        const fetchErrorSessions = async () => {
            try {
                setLoading(true);
                // This would connect to your backend API that stores error sessions
                const response = await fetch('/api/admin/error-sessions');
                if (!response.ok) {
                    throw new Error('Failed to fetch error sessions');
                }
                const data = await response.json();
                setErrorSessions(data);
            }
            catch (error) {
                console.error('Error fetching LogRocket sessions:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchErrorSessions();
        // Set up polling to refresh data every minute
        const intervalId = setInterval(fetchErrorSessions, 60000);
        return () => clearInterval(intervalId);
    }, [user]);
    if (!user || user.role !== 'admin') {
        return (_jsxs("div", { className: "logrocket-dashboard access-denied", children: [_jsx("h2", { children: "Access Denied" }), _jsx("p", { children: "You do not have permission to view this dashboard." })] }));
    }
    return (_jsxs("div", { className: "logrocket-dashboard", children: [_jsx("h2", { children: "Error Tracking Dashboard" }), loading ? (_jsx("div", { className: "loading", children: "Loading error sessions..." })) : errorSessions.length === 0 ? (_jsx("div", { className: "no-errors", children: _jsx("p", { children: "No errors recorded yet. That's great news!" }) })) : (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["Showing ", errorSessions.length, " recorded error sessions:"] }), _jsxs("table", { className: "error-sessions-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Time" }), _jsx("th", { children: "User" }), _jsx("th", { children: "Error" }), _jsx("th", { children: "Session" })] }) }), _jsx("tbody", { children: errorSessions.map((session) => (_jsxs("tr", { children: [_jsx("td", { children: new Date(session.timestamp).toLocaleString() }), _jsx("td", { children: session.userId || 'Anonymous' }), _jsx("td", { className: "error-message", children: session.error }), _jsx("td", { children: _jsx("a", { href: session.sessionUrl, target: "_blank", rel: "noopener noreferrer", className: "session-link", children: "View Session" }) })] }, session.id))) })] })] })), _jsx("div", { className: "dashboard-footer", children: _jsxs("p", { children: [_jsx("strong", { children: "About this dashboard:" }), " This page shows errors captured by LogRocket from user sessions. Click \"View Session\" to replay the user's actions leading up to the error."] }) })] }));
};
export default LogRocketDashboard;
