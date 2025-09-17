import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, UserPreferences } from '../services/apiService';

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
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
    if (!user) return;
    
    try {
      setIsLoadingPrefs(true);
      const prefs = await authApi.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setMessage({
        text: 'Failed to load preferences. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  // Update user profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      await updateUser({ username, email });
      setMessage({
        text: 'Profile updated successfully!',
        type: 'success'
      });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({
        text: error.message || 'Failed to update profile. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update user preferences
  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;
    
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
    } catch (error: any) {
      setMessage({
        text: error.message || 'Failed to update preferences. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  // Handle preference toggles
  const handleTogglePreference = (key: keyof UserPreferences) => {
    if (!preferences || typeof preferences[key] !== 'boolean') return;
    
    handleUpdatePreferences({
      [key]: !preferences[key]
    });
  };

  if (!user) {
    return (
      <div className="profile-container">
        <h2>User Profile</h2>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
          <button className="alert-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}
      
      <div className="profile-section">
        <h3>Account Information</h3>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="profile-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  if (user) {
                    setUsername(user.username);
                    setEmail(user.email);
                  }
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Username:</span>
              <span className="info-value">{username}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{email}</span>
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
      
      <div className="profile-section">
        <h3>Reading Preferences</h3>
        
        {isLoadingPrefs ? (
          <div className="preferences-loading">Loading preferences...</div>
        ) : preferences ? (
          <div className="preferences-list">
            <div className="preference-item">
              <span className="preference-label">Dark Mode</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={() => handleTogglePreference('darkMode')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="preference-item">
              <span className="preference-label">Mute Outrage Content</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={preferences.muteOutrage}
                  onChange={() => handleTogglePreference('muteOutrage')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="preference-item">
              <span className="preference-label">Block Doomscrolling</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={preferences.blockDoomscroll}
                  onChange={() => handleTogglePreference('blockDoomscroll')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="preference-item range-preference">
              <span className="preference-label">Refresh Interval (minutes)</span>
              <div className="range-control">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={preferences.refreshInterval}
                  onChange={(e) => handleUpdatePreferences({ 
                    refreshInterval: parseInt(e.target.value) 
                  })}
                />
                <span className="range-value">{preferences.refreshInterval}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="preferences-error">
            <p>Could not load preferences.</p>
            <button 
              className="btn btn-secondary"
              onClick={loadUserPreferences}
            >
              Retry
            </button>
          </div>
        )}
      </div>
      
      <div className="profile-section">
        <h3>Account Security</h3>
        <div className="security-options">
          <button className="btn btn-secondary">Change Password</button>
          <button className="btn btn-secondary">Two-Factor Authentication</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;