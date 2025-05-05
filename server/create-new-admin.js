 // Create a simple admin user with known password
async function main() {
  try {
    const user = await User.create({
      username: 'newadmin',
      email: 'newadmin@example.com',
      password: 'newadmin123',
      isAdmin: true
    });
    console.log('Admin user created:', user.username, user.email);
    console.log('Password: newadmin123');
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    process.exit();
  }
}
main();
