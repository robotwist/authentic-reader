require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcrypt');

async function debugLogin() {
  try {
    console.log('=== LOGIN DEBUG SCRIPT ===');
    
    // Check database connection
    console.log('\nChecking database connection...');
    try {
      await User.sequelize.authenticate();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    
    // Check if tables exist
    console.log('\nChecking users table...');
    const users = await User.findAll();
    console.log(`Found ${users.length} users in the database:`);
    
    if (users.length === 0) {
      console.log('⚠️ No users found in the database');
      
      // Create a test user
      console.log('\nCreating a test user...');
      const testUser = await createTestUser('tester', 'test@example.com', 'password123', true);
      console.log(`✅ Created test user: ${testUser.username} (${testUser.email})`);
      
      // Verify the test user can log in
      await testUserLogin('tester', null, 'password123');
      await testUserLogin(null, 'test@example.com', 'password123');
      
      return;
    }
    
    // List all users
    console.log('\nExisting users:');
    for (const user of users) {
      console.log(`- ${user.id}: ${user.username} (${user.email}) ${user.isAdmin ? '[ADMIN]' : ''}`);
      console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
      
      // Test login for each user with a known password
      console.log(`  Testing login for ${user.username} with current password:`);
      await user.validPassword('password123')
        .then(isValid => {
          console.log(`  Result from user.validPassword: ${isValid}`);
        })
        .catch(error => {
          console.error(`  Error calling validPassword: ${error.message}`);
        });
      
      // Manual check with bcrypt
      const bcryptResult = await bcrypt.compare('password123', user.password);
      console.log(`  Result from bcrypt.compare: ${bcryptResult}`);
      
      // Create a fresh hash with a known password and update the user
      console.log('  Resetting password for this user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      console.log(`  New hash: ${hashedPassword}`);
      
      try {
        // Direct database update to avoid Sequelize hooks
        await user.sequelize.query(
          'UPDATE users SET password = ? WHERE id = ?',
          {
            replacements: [hashedPassword, user.id],
            type: user.sequelize.QueryTypes.UPDATE
          }
        );
        console.log('  ✅ Password reset to "password123" via direct SQL');
        
        // Refresh the user object
        const refreshedUser = await User.findByPk(user.id);
        console.log(`  Refreshed password hash: ${refreshedUser.password.substring(0, 20)}...`);
        
        // Test login again
        console.log('  Testing login after password reset:');
        await refreshedUser.validPassword('password123')
          .then(isValid => {
            console.log(`  Result from user.validPassword after reset: ${isValid}`);
          })
          .catch(error => {
            console.error(`  Error calling validPassword after reset: ${error.message}`);
          });
          
        // Manual check with bcrypt again
        const bcryptResultAfter = await bcrypt.compare('password123', refreshedUser.password);
        console.log(`  Result from bcrypt.compare after reset: ${bcryptResultAfter}`);
      } catch (error) {
        console.error(`  Error updating password: ${error.message}`);
      }
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
    console.log('All users should now have their passwords reset to "password123"');
    
  } catch (error) {
    console.error('Error in debug script:', error);
  } finally {
    process.exit();
  }
}

async function createTestUser(username, email, password, isAdmin = false) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await User.create({
    username,
    email,
    password: hashedPassword,
    isAdmin
  });
}

async function testUserLogin(username, email, password) {
  try {
    // Find user
    const query = username ? { username } : { email };
    const user = await User.findOne({ where: query });
    
    if (!user) {
      console.log(`  ❌ Login failed: User ${username || email} not found`);
      return false;
    }
    
    // Test validPassword method
    try {
      const isValid = await user.validPassword(password);
      if (isValid) {
        console.log(`  ✅ Login successful: Password is valid for ${user.username}`);
        return true;
      } else {
        console.log(`  ❌ Login failed: Invalid password for ${user.username}`);
        return false;
      }
    } catch (error) {
      console.error(`  ❌ Error in validPassword method:`, error.message);
      
      // Fallback to direct bcrypt comparison
      const bcryptResult = await bcrypt.compare(password, user.password);
      console.log(`  Direct bcrypt comparison result: ${bcryptResult}`);
      return bcryptResult;
    }
  } catch (error) {
    console.error(`  ❌ Error testing login:`, error.message);
    return false;
  }
}

debugLogin(); 