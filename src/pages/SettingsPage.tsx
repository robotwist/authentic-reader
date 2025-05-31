import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Switch, FormControlLabel } from '@mui/material';
import { UserPreferences } from '../types';
import '../styles/SettingsPage.css';

interface SettingsPageProps {
  preferences: UserPreferences;
  onPreferenceChange: (key: keyof UserPreferences, value: any) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ preferences, onPreferenceChange }) => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(true);

  // Handle toggle change
  const handleToggleChange = (key: keyof UserPreferences) => {
    onPreferenceChange(key, !preferences[key]);
  };
  
  // Handle select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, key: keyof UserPreferences) => {
    onPreferenceChange(key, e.target.value);
  };

  const handleSave = () => {
    // Logic to save settings
    console.log('Settings saved:', { userName, email, notifications });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <TextField
          fullWidth
          label="User Name"
          variant="outlined"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
        />
        <FormControlLabel
          control={
            <Switch
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          }
          label="Enable Notifications"
        />
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </Box>
    </Container>
  );
};

export default SettingsPage; 