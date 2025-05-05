// Script to create an admin user with a simple password
const { User } = require('./models');
const bcrypt = require('bcrypt');

async function createSimpleAdmin() {
  try {
    // Use very simple credentials
    const username = 'simpleadmin';
    const email = 'simpleadmin@example.com';
    const rawPassword = 'admin123';
    
    console.log('Creating simple admin user...');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${rawPassword} (SAVE THIS INFORMATION)`);
    
    // Delete any existing user with this email
    await User.destroy({ where: { email } });
    
    // Hash the password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    console.log('Password hash:', hashedPassword);
    
    // Create user directly with the hashed password
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: true
    }, { hooks: false }); // Skip hooks to avoid double-hashing
    
    console.log('Admin user created with ID:', user.id);
    
    // Test the password directly
    const testResult = await bcrypt.compare(rawPassword, user.password);
    console.log('Direct password test result:', testResult);
    
    if (testResult) {
      console.log('SUCCESS: Password validation is working correctly');
      console.log('');
      console.log('LOGIN CREDENTIALS:');
      console.log('------------------');
      console.log(`Username: ${username}`);
      console.log(`Password: ${rawPassword}`);
    } else {
      console.log('WARNING: Password validation failed');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createSimpleAdmin()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 