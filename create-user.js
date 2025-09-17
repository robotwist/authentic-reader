const { User } = require('./models');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    // Regular user credentials - document these for the user
    const username = 'user';
    const email = 'user@example.com';
    const password = 'password123';
    
    console.log('Creating regular test user...');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { 
        email 
      } 
    });
    
    if (existingUser) {
      console.log('Test user already exists. Updating password...');
      
      // Update the user
      existingUser.password = await bcrypt.hash(password, 10);
      await existingUser.save();
      
      console.log(`Test user updated successfully: ${existingUser.username} (${existingUser.email})`);
      return;
    }
    
    // Create new test user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: false
    });
    
    console.log(`Test user created successfully: ${user.username} (${user.email})`);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit();
  }
}

createTestUser(); 