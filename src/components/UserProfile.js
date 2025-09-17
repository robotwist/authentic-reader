import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/apiService';
const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState(null);
    const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
    // Load user data
    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
            loadUserPreferences();
        }
    }, [user]);
    // Load user preferences
    const loadUserPreferences = async () => {
        if (!user)
            return;
        try {
            setIsLoadingPrefs(true);
            const prefs = await authApi.getPreferences();
            setPreferences(prefs);
        }
        catch (error) {
            console.error('Error loading user preferences:', error);
            setMessage({
                text: 'Failed to load preferences. Please try again.',
                type: 'error'
            });
        }
        finally {
            setIsLoadingPrefs(false);
        }
    };
    // Update user profile
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user)
            return;
        try {
            setLoading(true);
            await updateUser({ username, email });
            setMessage({
                text: 'Profile updated successfully!',
                type: 'success'
            });
            setIsEditing(false);
        }
        catch (error) {
            setMessage({
                text: error.message || 'Failed to update profile. Please try again.',
                type: 'error'
            });
        }
        finally {
            setLoading(false);
        }
    };
    // Update user preferences
    const handleUpdatePreferences = async (updates) => {
        if (!preferences)
            return;
        try {
            setIsLoadingPrefs(true);
            const updatedPrefs = await authApi.updatePreferences({
                ...preferences,
                ...updates
            });
            setPreferences(updatedPrefs);
            setMessage({
                text: 'Preferences updated successfully!',
                type: 'success'
            });
        }
        catch (error) {
            setMessage({
                text: error.message || 'Failed to update preferences. Please try again.',
                type: 'error'
            });
        }
        finally {
            setIsLoadingPrefs(false);
        }
    };
    // Handle preference toggles
    const handleTogglePreference = (key) => {
        if (!preferences || typeof preferences[key] !== 'boolean')
            return;
        handleUpdatePreferences({
            [key]: !preferences[key]
        });
    };
    if (!user) {
        return (_jsxs("div", { className: "profile-container", children: [_jsx("h2", { children: "User Profile" }), _jsx("p", { children: "Please sign in to view your profile." })] }));
    }
    return (_jsxs("div", { className: "profile-container", children: [_jsx("h2", { children: "User Profile" }), message && (_jsxs("div", { className: `alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`, children: [message.text, _jsx("button", { className: "alert-close", onClick: () => setMessage(null), children: "\u00D7" })] })), _jsxs("div", { className: "profile-section", children: [_jsx("h3", { children: "Account Information" }), isEditing ? (_jsxs("form", { onSubmit: handleSubmit, className: "profile-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "username", children: "Username" }), _jsx("input", { id: "username", type: "text", value: username, onChange: (e) => setUsername(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "profile-actions", children: [_jsx("button", { type: "submit", className: "btn btn-primary", disabled: loading, children: loading ? 'Saving...' : 'Save Changes' }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => {
                                            setIsEditing(false);
                                            if (user) {
                                                setUsername(user.username);
                                                setEmail(user.email);
                                            }
                                        }, disabled: loading, children: "Cancel" })] })] })) : (_jsxs("div", { className: "profile-info", children: [_jsxs("div", { className: "info-row", children: [_jsx("span", { className: "info-label", children: "Username:" }), _jsx("span", { className: "info-value", children: username })] }), _jsxs("div", { className: "info-row", children: [_jsx("span", { className: "info-label", children: "Email:" }), _jsx("span", { className: "info-value", children: email })] }), _jsx("button", { className: "btn btn-secondary", onClick: () => setIsEditing(true), children: "Edit Profile" })] }))] }), _jsxs("div", { className: "profile-section", children: [_jsx("h3", { children: "Reading Preferences" }), isLoadingPrefs ? (_jsx("div", { className: "preferences-loading", children: "Loading preferences..." })) : preferences ? (_jsxs("div", { className: "preferences-list", children: [_jsxs("div", { className: "preference-item", children: [_jsx("span", { className: "preference-label", children: "Dark Mode" }), _jsxs("label", { className: "toggle", children: [_jsx("input", { type: "checkbox", checked: preferences.darkMode, onChange: () => handleTogglePreference('darkMode') }), _jsx("span", { className: "toggle-slider" })] })] }), _jsxs("div", { className: "preference-item", children: [_jsx("span", { className: "preference-label", children: "Mute Outrage Content" }), _jsxs("label", { className: "toggle", children: [_jsx("input", { type: "checkbox", checked: preferences.muteOutrage, onChange: () => handleTogglePreference('muteOutrage') }), _jsx("span", { className: "toggle-slider" })] })] }), _jsxs("div", { className: "preference-item", children: [_jsx("span", { className: "preference-label", children: "Block Doomscrolling" }), _jsxs("label", { className: "toggle", children: [_jsx("input", { type: "checkbox", checked: preferences.blockDoomscroll, onChange: () => handleTogglePreference('blockDoomscroll') }), _jsx("span", { className: "toggle-slider" })] })] }), _jsxs("div", { className: "preference-item range-preference", children: [_jsx("span", { className: "preference-label", children: "Refresh Interval (minutes)" }), _jsxs("div", { className: "range-control", children: [_jsx("input", { type: "range", min: "5", max: "60", step: "5", value: preferences.refreshInterval, onChange: (e) => handleUpdatePreferences({
                                                    refreshInterval: parseInt(e.target.value)
                                                }) }), _jsx("span", { className: "range-value", children: preferences.refreshInterval })] })] })] })) : (_jsxs("div", { className: "preferences-error", children: [_jsx("p", { children: "Could not load preferences." }), _jsx("button", { className: "btn btn-secondary", onClick: loadUserPreferences, children: "Retry" })] }))] }), _jsxs("div", { className: "profile-section", children: [_jsx("h3", { children: "Account Security" }), _jsxs("div", { className: "security-options", children: [_jsx("button", { className: "btn btn-secondary", children: "Change Password" }), _jsx("button", { className: "btn btn-secondary", children: "Two-Factor Authentication" })] })] })] }));
};
export default UserProfile;
