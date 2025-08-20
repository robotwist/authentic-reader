#!/usr/bin/env node

const { exec } = require('child_process');
const readline = require('readline');
const { promisify } = require('util');
const { sequelize, User } = require('./models');
const bcrypt = require('bcrypt');
const execPromise = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Create the database if it doesn't exist
 */
async function createDatabase() {
  try {
    // Get database name from config
    const config = require('./config/database');
    const env = process.env.NODE_ENV || 'development';
    const { database, username, password, host } = config[env];

    console.log('Checking if database exists...');
    
    try {
      // Try to authenticate to check if DB exists
      await sequelize.authenticate();
      console.log('✅ Database exists and connection is successful.');
      return true;
    } catch (error) {
      if (error.original && error.original.code === '3D000') {
        console.log(`Database '${database}' does not exist. Creating it now...`);
        
        // Create database using postgres command
        const createDbCommand = password
          ? `PGPASSWORD=${password} createdb -h ${host} -U ${username} ${database}`
          : `createdb -h ${host} -U ${username} ${database}`;
        
        try {
          await execPromise(createDbCommand);
          console.log(`✅ Database '${database}' created successfully.`);
          return true;
        } catch (createError) {
          console.error('Failed to create database:', createError.message);
          
          // Ask user if they want to run the command manually
          const manualCommand = `createdb -h ${host} -U ${username} ${database}`;
          console.log(`\nYou can try to create the database manually with this command:\n${manualCommand}`);
          
          const createManually = await question('Do you want to continue anyway? (y/n): ');
          return createManually.toLowerCase() === 'y';
        }
      } else {
        console.error('Database connection error:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.error('Error in createDatabase:', error);
    return false;
  }
}

/**
 * Run migrations
 */
async function runMigrations() {
  try {
    console.log('\nRunning migrations...');
    await execPromise('npx sequelize-cli db:migrate');
    console.log('✅ Migrations completed successfully.');
    return true;
  } catch (error) {
    console.error('Migration error:', error.message);
    return false;
  }
}

/**
 * Create a superuser
 */
async function createSuperuser() {
  console.log('\n📝 Create a superuser (admin) account');
  
  let username, email, password, confirmPassword;
  
  do {
    username = await question('Username: ');
    if (!username) {
      console.log('Username cannot be empty.');
    }
  } while (!username);
  
  do {
    email = await question('Email: ');
    if (!email || !email.includes('@')) {
      console.log('Please enter a valid email.');
    }
  } while (!email || !email.includes('@'));
  
  do {
    password = await question('Password: ');
    if (!password || password.length < 8) {
      console.log('Password must be at least 8 characters long.');
      continue;
    }
    
    confirmPassword = await question('Confirm password: ');
    if (password !== confirmPassword) {
      console.log('Passwords do not match.');
    }
  } while (!password || password.length < 8 || password !== confirmPassword);
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('User with this email already exists. Updating to superuser...');
      existingUser.isAdmin = true;
      await existingUser.save();
      console.log(`✅ User '${username}' updated to superuser successfully.`);
      return true;
    }
    
    // Create hash of password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the superuser
    await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: true
    });
    
    console.log(`✅ Superuser '${username}' created successfully.`);
    return true;
  } catch (error) {
    console.error('Error creating superuser:', error);
    return false;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log('🚀 Starting Authentic Reader setup...\n');
  
  // Create database if not exists
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    console.log('❌ Database setup failed. Exiting...');
    rl.close();
    return;
  }
  
  // Run migrations
  const migrationsRun = await runMigrations();
  if (!migrationsRun) {
    console.log('❌ Migration failed. Exiting...');
    rl.close();
    return;
  }
  
  // Create superuser
  const superuserCreated = await createSuperuser();
  if (!superuserCreated) {
    console.log('❌ Superuser creation failed. Exiting...');
    rl.close();
    return;
  }
  
  console.log('\n✨ Setup completed successfully!');
  console.log('You can now start the server with: npm run dev');
  
  rl.close();
}

// Run setup
setup(); 