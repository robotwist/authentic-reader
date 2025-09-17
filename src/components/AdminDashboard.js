import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/AdminDashboard.css';
const AdminDashboard = () => {
    const { user, token } = useAuth();
    const [users, setUsers] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    // New user form state
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        isAdmin: false
    });
    // New source form state
    const [newSource, setNewSource] = useState({
        name: '',
        url: '',
        category: '',
        description: ''
    });
    // Fetch users and sources on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.isAdmin) {
                setError('You do not have permission to access this page');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                // Fetch users
                const usersResponse = await fetch('/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Handle authentication errors
                if (usersResponse.status === 401 || usersResponse.status === 403) {
                    const errorData = await usersResponse.json().catch(() => ({ message: 'Authentication failed' }));
                    throw new Error(errorData.message || 'Your session has expired. Please log in again.');
                }
                if (!usersResponse.ok) {
                    throw new Error('Failed to fetch users');
                }
                // Check if response is JSON (not HTML)
                const contentType = usersResponse.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Received invalid response format from server');
                }
                const usersData = await usersResponse.json();
                setUsers(usersData);
                // Fetch sources
                const sourcesResponse = await fetch('/api/sources', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Handle authentication errors for sources request too
                if (sourcesResponse.status === 401 || sourcesResponse.status === 403) {
                    const errorData = await sourcesResponse.json().catch(() => ({ message: 'Authentication failed' }));
                    throw new Error(errorData.message || 'Your session has expired. Please log in again.');
                }
                if (!sourcesResponse.ok) {
                    throw new Error('Failed to fetch sources');
                }
                // Check if response is JSON (not HTML)
                const sourcesContentType = sourcesResponse.headers.get('content-type');
                if (!sourcesContentType || !sourcesContentType.includes('application/json')) {
                    throw new Error('Received invalid response format from server');
                }
                const sourcesData = await sourcesResponse.json();
                setSources(sourcesData);
            }
            catch (error) {
                console.error('Dashboard error:', error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                setError(errorMessage);
                // If there's an authentication error, redirect to login
                if (errorMessage.includes('expired') ||
                    errorMessage.includes('log in') ||
                    errorMessage.includes('Authentication')) {
                    // Clear auth session
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('current_user');
                    window.location.href = '/login'; // Redirect to login page
                }
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, token]);
    // Handle user form input changes
    const handleUserInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewUser({
            ...newUser,
            [name]: type === 'checkbox' ? checked : value
        });
    };
    // Handle source form input changes
    const handleSourceInputChange = (e) => {
        const { name, value } = e.target;
        setNewSource({
            ...newSource,
            [name]: value
        });
    };
    // Create a new user
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });
            if (!response.ok) {
                throw new Error('Failed to create user');
            }
            const newUserData = await response.json();
            setUsers([...users, newUserData]);
            // Reset form
            setNewUser({
                username: '',
                email: '',
                password: '',
                isAdmin: false
            });
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create user');
        }
    };
    // Create a new source
    const handleCreateSource = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/sources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSource)
            });
            if (!response.ok) {
                throw new Error('Failed to create source');
            }
            const newSourceData = await response.json();
            setSources([...sources, newSourceData]);
            // Reset form
            setNewSource({
                name: '',
                url: '',
                category: '',
                description: ''
            });
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create source');
        }
    };
    // Delete a user
    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            // Remove user from state
            setUsers(users.filter(user => user.id !== userId));
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to delete user');
        }
    };
    // Delete a source
    const handleDeleteSource = async (sourceId) => {
        if (!confirm('Are you sure you want to delete this source?')) {
            return;
        }
        try {
            const response = await fetch(`/api/sources/${sourceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to delete source');
            }
            // Remove source from state
            setSources(sources.filter(source => source.id !== sourceId));
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to delete source');
        }
    };
    // Toggle user admin status
    const handleToggleAdmin = async (userId, currentStatus) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isAdmin: !currentStatus })
            });
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            // Update user in state
            setUsers(users.map(user => user.id === userId
                ? { ...user, isAdmin: !currentStatus }
                : user));
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update user');
        }
    };
    if (loading) {
        return _jsx("div", { className: "admin-loading", children: "Loading admin dashboard..." });
    }
    if (error) {
        return _jsx("div", { className: "admin-error", children: error });
    }
    if (!user?.isAdmin) {
        return _jsx("div", { className: "admin-unauthorized", children: "You do not have permission to access this page." });
    }
    return (_jsxs("div", { className: "admin-dashboard", children: [_jsx("h1", { children: "Admin Dashboard" }), _jsxs("div", { className: "admin-tabs", children: [_jsx("button", { className: `tab-button ${activeTab === 'users' ? 'active' : ''}`, onClick: () => setActiveTab('users'), children: "Users" }), _jsx("button", { className: `tab-button ${activeTab === 'sources' ? 'active' : ''}`, onClick: () => setActiveTab('sources'), children: "Sources" }), _jsx("button", { className: `tab-button ${activeTab === 'monitoring' ? 'active' : ''}`, onClick: () => setActiveTab('monitoring'), children: "Monitoring" })] }), activeTab === 'users' && (_jsxs("div", { className: "admin-section", children: [_jsx("h2", { children: "Users Management" }), _jsxs("form", { className: "admin-form", onSubmit: handleCreateUser, children: [_jsx("h3", { children: "Create New User" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "username", children: "Username:" }), _jsx("input", { type: "text", id: "username", name: "username", value: newUser.username, onChange: handleUserInputChange, required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "email", children: "Email:" }), _jsx("input", { type: "email", id: "email", name: "email", value: newUser.email, onChange: handleUserInputChange, required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "password", children: "Password:" }), _jsx("input", { type: "password", id: "password", name: "password", value: newUser.password, onChange: handleUserInputChange, required: true })] }), _jsxs("div", { className: "form-group checkbox", children: [_jsx("input", { type: "checkbox", id: "isAdmin", name: "isAdmin", checked: newUser.isAdmin, onChange: handleUserInputChange }), _jsx("label", { htmlFor: "isAdmin", children: "Admin User" })] }), _jsx("button", { type: "submit", className: "btn-primary", children: "Create User" })] }), _jsxs("div", { className: "admin-list", children: [_jsxs("h3", { children: ["User List (", users.length, ")"] }), _jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Username" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Admin" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: users.map(userItem => (_jsxs("tr", { children: [_jsx("td", { children: userItem.id }), _jsx("td", { children: userItem.username }), _jsx("td", { children: userItem.email }), _jsx("td", { children: _jsx("input", { type: "checkbox", checked: userItem.isAdmin, onChange: () => handleToggleAdmin(userItem.id, userItem.isAdmin), disabled: userItem.id === user?.id }) }), _jsx("td", { children: _jsx("button", { className: "btn-delete", onClick: () => handleDeleteUser(userItem.id), disabled: userItem.id === user?.id, children: "Delete" }) })] }, userItem.id))) })] })] })] })), activeTab === 'sources' && (_jsxs("div", { className: "admin-section", children: [_jsx("h2", { children: "Sources Management" }), _jsxs("form", { className: "admin-form", onSubmit: handleCreateSource, children: [_jsx("h3", { children: "Add New Source" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "name", children: "Name:" }), _jsx("input", { type: "text", id: "name", name: "name", value: newSource.name, onChange: handleSourceInputChange, required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "url", children: "URL:" }), _jsx("input", { type: "url", id: "url", name: "url", value: newSource.url, onChange: handleSourceInputChange, required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "category", children: "Category:" }), _jsxs("select", { id: "category", name: "category", value: newSource.category, onChange: handleSourceInputChange, required: true, children: [_jsx("option", { value: "", children: "Select category" }), _jsx("option", { value: "news", children: "News" }), _jsx("option", { value: "technology", children: "Technology" }), _jsx("option", { value: "science", children: "Science" }), _jsx("option", { value: "business", children: "Business" }), _jsx("option", { value: "entertainment", children: "Entertainment" }), _jsx("option", { value: "sports", children: "Sports" }), _jsx("option", { value: "health", children: "Health" }), _jsx("option", { value: "politics", children: "Politics" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "description", children: "Description:" }), _jsx("textarea", { id: "description", name: "description", value: newSource.description, onChange: handleSourceInputChange, rows: 3 })] }), _jsx("button", { type: "submit", className: "btn-primary", children: "Add Source" })] }), _jsxs("div", { className: "admin-list", children: [_jsxs("h3", { children: ["Source List (", sources.length, ")"] }), _jsxs("table", { className: "admin-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "URL" }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: sources.map(source => (_jsxs("tr", { children: [_jsx("td", { children: source.id }), _jsx("td", { children: source.name }), _jsx("td", { children: _jsxs("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", children: [source.url.substring(0, 30), "..."] }) }), _jsx("td", { children: source.category }), _jsx("td", { children: _jsx("button", { className: "btn-delete", onClick: () => handleDeleteSource(source.id), children: "Delete" }) })] }, source.id))) })] })] })] })), activeTab === 'monitoring' && (_jsxs("div", { className: "admin-section", children: [_jsx("h2", { children: "System Monitoring" }), _jsxs("div", { className: "monitoring-card", children: [_jsx("h3", { children: "Real-time Server Monitoring" }), _jsx("p", { children: "Monitor server performance, response times, memory usage, and application errors in real time. Use this dashboard to identify and diagnose issues." }), _jsx(Link, { to: "/admin/monitor", className: "btn-primary", children: "Open Monitoring Dashboard" })] }), _jsxs("div", { className: "monitoring-features", children: [_jsxs("div", { className: "feature-item", children: [_jsx("h4", { children: "Performance Metrics" }), _jsx("p", { children: "Track API response times, memory usage, and system load" })] }), _jsxs("div", { className: "feature-item", children: [_jsx("h4", { children: "Error Tracking" }), _jsx("p", { children: "View application errors and exceptions in real time" })] }), _jsxs("div", { className: "feature-item", children: [_jsx("h4", { children: "API Usage" }), _jsx("p", { children: "Monitor endpoint usage and success rates" })] })] })] }))] }));
};
export default AdminDashboard;
