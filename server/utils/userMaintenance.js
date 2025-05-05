const { User } = require('../models');
const bcrypt = require('bcrypt');

/**
 * Check for administrator accounts and ensure they're properly configured.
 * If no admin users exist, this will create a default admin.
 */
async function ensureAdminUsers() {
  try {
    console.log('Checking for admin users...');
    
    // Find admin users
    const adminUsers = await User.findAll({
      where: { isAdmin: true }
    });
    
    // Create a default admin if none exist
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating default admin account...');
      
      const defaultAdmin = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        isAdmin: true
      };
      
      try {
        // Check if user exists but is not admin
        const existingUser = await User.findOne({
          where: { email: defaultAdmin.email }
        });
        
        if (existingUser) {
          console.log('Found existing user with admin email. Promoting to admin...');
          existingUser.isAdmin = true;
          await existingUser.save();
          console.log(`User "${existingUser.username}" promoted to admin.`);
        } else {
          // Create new admin
          const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
          
          const admin = await User.create({
            username: defaultAdmin.username,
            email: defaultAdmin.email,
            password: hashedPassword,
            isAdmin: true
          });
          
          console.log(`Default admin account created: ${admin.username} (${admin.email})`);
          console.log('Default password: password123 - PLEASE CHANGE THIS IMMEDIATELY!');
        }
      } catch (error) {
        console.error('Error creating default admin:', error);
      }
    } else {
      console.log(`Found ${adminUsers.length} admin users.`);
    }
  } catch (error) {
    console.error('Error checking admin users:', error);
  }
}

/**
 * Verify that user password hashes are valid and fix them if needed.
 * This helps recover from issues with password hashing.
 */
async function verifyUserPasswords() {
  try {
    // Only run this check in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    console.log('Development mode: checking user password hashes...');
    
    // Check recently created users
    const users = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    // No users found
    if (users.length === 0) {
      return;
    }
    
    // Test if the most recent user has a working password validation
    const testUser = users[0];
    
    // If we can't validate any password, the hashing might be broken
    try {
      // Try validating with a dummy password
      await testUser.validPassword('test');
      console.log('Password validation is working correctly.');
    } catch (error) {
      console.error('Warning: Password validation is not functioning correctly.');
      console.error('Error:', error.message);
      
      // Notify about the issue but don't automatically reset passwords in production
      if (process.env.NODE_ENV === 'production') {
        console.error('Please check password hashing implementation.');
        return;
      }
      
      // In development, offer to reset test accounts
      if (testUser.email.includes('@example.com') || testUser.username === 'admin' || testUser.username === 'user') {
        console.log('Resetting password for test user:', testUser.username);
        
        // Reset the password hash
        const hashedPassword = await bcrypt.hash('password123', 10);
        testUser.password = hashedPassword;
        await testUser.save();
        
        // Verify the fix worked
        const validationTest = await testUser.validPassword('password123');
        if (validationTest) {
          console.log('✅ Password reset successful. Test user can now log in with "password123"');
        } else {
          console.error('❌ Password reset failed. Please check the User model implementation.');
        }
      }
    }
  } catch (error) {
    console.error('Error verifying user passwords:', error);
  }
}

module.exports = {
  ensureAdminUsers,
  verifyUserPasswords
}; 