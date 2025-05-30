import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, UserPrefs } from '../models/index.js';
import { Op } from 'sequelize';

// Register a new user
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password // Hashed by Sequelize hook
    });

    // Create default user preferences
    await UserPrefs.create({
      userId: user.id,
      darkMode: false,
      muteOutrage: false,
      blockDoomscroll: false,
      refreshInterval: 60
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data and token
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if ((!email && !username) || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    console.log('Login attempt:', { email, username });

    // Find user by email or username
    const user = await User.findOne({ 
      where: email ? { email } : { username }
    });

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found, ID:', user.id);
    
    // Check password directly with bcrypt
    try {
      const match = await bcrypt.compare(password, user.password);
      console.log('Password match result:', match);
      
      if (!match) {
        console.log('Password does not match');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT with id instead of userId
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data and token
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || false,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const { id, username, email } = req.user;

    // Get user preferences
    const userPrefs = await UserPrefs.findOne({
      where: { userId: id }
    });

    res.json({
      id,
      username,
      email,
      preferences: userPrefs || {}
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = req.user;

    // Check if new username or email is already in use
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: user.id } },
            { [Op.or]: [
              username ? { username } : null,
              email ? { email } : null
            ].filter(Boolean) }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already in use' });
      }
    }

    // Update user fields if provided
    if (username) user.username = username;
    if (email) user.email = email;

    // Save changes
    await user.save();

    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// Update user password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    // Check current password directly with bcrypt
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword; // Will be hashed by Sequelize hook
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
};

// Get user preferences
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find or create user preferences
    const [userPrefs, created] = await UserPrefs.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        darkMode: false,
        muteOutrage: false,
        blockDoomscroll: false,
        refreshInterval: 60
      }
    });

    res.json(userPrefs);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error fetching preferences' });
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { darkMode, muteOutrage, blockDoomscroll, refreshInterval } = req.body;

    // Find or create user preferences
    const [userPrefs, created] = await UserPrefs.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        darkMode: false,
        muteOutrage: false,
        blockDoomscroll: false,
        refreshInterval: 60
      }
    });

    // Update preferences
    if (darkMode !== undefined) userPrefs.darkMode = darkMode;
    if (muteOutrage !== undefined) userPrefs.muteOutrage = muteOutrage;
    if (blockDoomscroll !== undefined) userPrefs.blockDoomscroll = blockDoomscroll;
    if (refreshInterval !== undefined) userPrefs.refreshInterval = refreshInterval;

    // Save changes
    await userPrefs.save();

    res.json(userPrefs);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    
    // Delete user's preferences first (to handle foreign key constraints)
    await UserPrefs.destroy({
      where: { userId: user.id }
    });
    
    // Delete the user
    await User.destroy({
      where: { id: user.id }
    });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Verify the existing token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Check if user exists
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a new token
    const newToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || false,
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error refreshing token' });
  }
}; 