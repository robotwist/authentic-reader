const { User } = require('./models');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  try {
    // Admin user credentials - document these for the user
    const username = 'admin';
    const email = 'admin@example.com';
    const password = 'password123';
    
    console.log('Creating admin user...');
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
      console.log('Admin user already exists. Updating password and ensuring admin privileges...');
      
      // Update the user
      existingUser.password = await bcrypt.hash(password, 10);
      existingUser.isAdmin = true;
      await existingUser.save();
      
      console.log(`Admin user updated successfully: ${existingUser.username} (${existingUser.email})`);
      return;
    }
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: true
    });
    
    console.log(`Admin user created successfully: ${user.username} (${user.email})`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdminUser(); 