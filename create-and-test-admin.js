const { User } = require('./models');
const bcrypt = require('bcrypt');

async function createAndTestAdmin() {
  try {
    const username = 'testadmin';
    const email = 'testadmin@example.com';
    const password = 'testing123';
    
    console.log('Creating test admin user...');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    // Hash the password directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed password:', hashedPassword);
    
    // Delete existing user if it exists
    await User.destroy({ where: { email } });
    
    // Create user directly with hashed password
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: true
    });
    
    console.log('Admin user created successfully with ID:', user.id);
    
    // Test password validation directly with bcrypt
    const testPassword = password;
    console.log('Testing password validation with bcrypt...');
    
    const bcryptMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Direct bcrypt compare result:', bcryptMatch);
    
    // Test using the User model's validPassword method
    const modelMatch = await user.validPassword(testPassword);
    console.log('Model validPassword method result:', modelMatch);
    
    // Try to find the user and login with "normal" method
    const foundUser = await User.findOne({ where: { email } });
    
    if (!foundUser) {
      console.log('Failed to find user by email');
    } else {
      console.log('User found by email, ID:', foundUser.id);
      
      // Test password validation again
      const foundUserMatch = await foundUser.validPassword(testPassword);
      console.log('Found user validPassword result:', foundUserMatch);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAndTestAdmin()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 