import React from 'react';
import { UserPreferences } from '../types';
import '../styles/SettingsPage.css';

interface SettingsPageProps {
  preferences: UserPreferences;
  onPreferenceChange: (key: keyof UserPreferences, value: any) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ preferences, onPreferenceChange }) => {
  // Handle toggle change
  const handleToggleChange = (key: keyof UserPreferences) => {
    onPreferenceChange(key, !preferences[key]);
  };
  
  // Handle select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, key: keyof UserPreferences) => {
    onPreferenceChange(key, e.target.value);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="subtitle">Customize your reading experience</p>
      </div>
      
      <div className="settings-content">
        <section className="settings-section">
          <h2>Display Settings</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Text Size</h3>
              <p className="setting-description">Adjust the size of text throughout the application</p>
            </div>
            <div className="setting-control">
              <select 
                value={preferences.textSize || 'medium'} 
                onChange={(e) => handleSelectChange(e, 'textSize')}
                className="settings-select"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Dyslexic Font</h3>
              <p className="setting-description">Use a font designed to be more readable for people with dyslexia</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.dyslexicFont || false}
                  onChange={() => handleToggleChange('dyslexicFont')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Focus Mode</h3>
              <p className="setting-description">Reduce distractions while reading</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.focusMode || false}
                  onChange={() => handleToggleChange('focusMode')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>
        
        <section className="settings-section">
          <h2>Content Preferences</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Auto-save Highlights</h3>
              <p className="setting-description">Automatically save text that you highlight</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.autoSaveHighlights || false}
                  onChange={() => handleToggleChange('autoSaveHighlights')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Notifications</h3>
              <p className="setting-description">Receive notifications about new content and features</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notificationsEnabled || false}
                  onChange={() => handleToggleChange('notificationsEnabled')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>
        
        <section className="settings-section">
          <h2>Analysis Settings</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Auto-analyze Articles</h3>
              <p className="setting-description">Automatically analyze articles when they're opened</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.autoAnalyzeArticles || false}
                  onChange={() => handleToggleChange('autoAnalyzeArticles')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>
        
        <div className="settings-footer">
          <p>
            Your settings are saved automatically and will be applied across all your devices 
            when you're signed in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 