/**
 * Setup script for Authentic Reader Monitoring Dashboard
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PACKAGE_JSON_PATH = path.join(__dirname, 'package.json');

// Logger
function log(message) {
  console.log(`[Setup] ${message}`);
}

function error(message) {
  console.error(`[Setup Error] ${message}`);
  process.exit(1);
}

// Main setup function
async function setupMonitoring() {
  log('Starting setup for Authentic Reader Monitoring Dashboard');
  
  // Check if package.json exists
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    error('package.json not found. Make sure you are in the project root directory.');
  }
  
  // Read package.json
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  } catch (err) {
    error(`Error reading package.json: ${err.message}`);
  }
  
  // Add monitoring dependencies if not present
  log('Adding monitoring dependencies...');
  const monitorDependencies = {
    'socket.io': '^4.5.4',
    'express': '^4.18.2',
    'chart.js': '^4.3.0',
    'pm2': '^5.3.0'
  };
  
  let dependenciesChanged = false;
  
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  
  Object.entries(monitorDependencies).forEach(([dep, version]) => {
    if (!packageJson.dependencies[dep]) {
      packageJson.dependencies[dep] = version;
      dependenciesChanged = true;
      log(`Added ${dep}@${version}`);
    }
  });
  
  // Add monitoring scripts
  log('Adding monitoring scripts to package.json...');
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  const monitoringScripts = {
    'monitor': 'node server-monitor.js',
    'monitor:pm2': 'pm2 start server-monitor.js --name ar-monitor',
    'server:pm2': 'pm2 start server/index.js --name ar-server',
    'server:logs': 'pm2 logs ar-server',
    'monitor:logs': 'pm2 logs ar-monitor',
    'pm2:status': 'pm2 status',
    'pm2:stop:all': 'pm2 stop all',
    'pm2:restart:all': 'pm2 restart all'
  };
  
  Object.entries(monitoringScripts).forEach(([script, command]) => {
    if (!packageJson.scripts[script]) {
      packageJson.scripts[script] = command;
      log(`Added script: ${script}`);
      dependenciesChanged = true;
    }
  });
  
  // Save package.json if changed
  if (dependenciesChanged) {
    try {
      fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
      log('Updated package.json with monitoring dependencies and scripts');
    } catch (err) {
      error(`Error writing package.json: ${err.message}`);
    }
    
    // Install dependencies
    log('Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('Dependencies installed successfully');
    } catch (err) {
      error(`Error installing dependencies: ${err.message}`);
    }
  }
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, 'server', 'logs');
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
      log('Created logs directory');
    } catch (err) {
      error(`Error creating logs directory: ${err.message}`);
    }
  }
  
  // Check if server-monitor.js exists
  if (!fs.existsSync(path.join(__dirname, 'server-monitor.js'))) {
    error('server-monitor.js not found. Make sure you have created this file first.');
  }
  
  log('Setup completed successfully!');
  log('\nTo start the monitoring dashboard:');
  log('1. Run "npm run monitor" to start the dashboard in foreground');
  log('2. Or run "npm run monitor:pm2" to start it with PM2 (background)');
  log('3. Then open http://localhost:8888 in your browser\n');
  
  log('To start the server with PM2:');
  log('1. Run "npm run server:pm2" to start the server in the background');
  log('2. Run "npm run pm2:status" to check the status of all services');
  log('3. Run "npm run server:logs" to view server logs\n');
  
  log('To access the admin dashboard:');
  log('1. Start the application with "npm run dev"');
  log('2. Go to http://localhost:5173/login');
  log('3. Login with: simpleadmin@example.com / admin123');
  log('4. Navigate to http://localhost:5173/admin');
}

// Run the setup
setupMonitoring().catch(err => {
  error(`Unexpected error: ${err.message}`);
}); 