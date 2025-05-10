/**
 * Authentic Reader - Server Monitoring Script
 * 
 * This script provides real-time monitoring capabilities for the Authentic Reader server,
 * including system information, database status, process details, and logs.
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec, execSync } from 'child_process';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Configuration
const PORT = process.env.MONITOR_PORT || 8888;
const LOG_FILE_PATH = path.join(__dirname, 'server', 'logs', 'app.log');
const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'authentic_reader',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Initialize Express app and Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Create a PostgreSQL connection pool
let pool;
try {
  pool = new Pool(DB_CONFIG);
  console.log('Created PostgreSQL connection pool');
} catch (err) {
  console.error('Failed to create PostgreSQL connection pool:', err);
}

// Serve static dashboard file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'monitor-dashboard.html'));
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Handle system information requests
  socket.on('requestSystemInfo', async () => {
    try {
      const systemInfo = await getSystemInfo();
      socket.emit('systemInfo', systemInfo);
    } catch (error) {
      console.error('Error fetching system info:', error);
      socket.emit('error', { message: 'Failed to fetch system information' });
    }
  });
  
  // Handle database status requests
  socket.on('requestDatabaseStatus', async () => {
    try {
      const dbStatus = await getDatabaseStatus();
      socket.emit('databaseStatus', dbStatus);
    } catch (error) {
      console.error('Error fetching database status:', error);
      socket.emit('error', { message: 'Failed to fetch database status' });
    }
  });
  
  // Handle process information requests
  socket.on('requestProcessInfo', async () => {
    try {
      const processInfo = await getProcessInfo();
      socket.emit('processInfo', processInfo);
    } catch (error) {
      console.error('Error fetching process info:', error);
      socket.emit('error', { message: 'Failed to fetch process information' });
    }
  });
  
  // Handle logs requests
  socket.on('requestLogs', async () => {
    try {
      const logs = await getLogs();
      socket.emit('logs', logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      socket.emit('error', { message: 'Failed to fetch logs' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

/**
 * Get system information including CPU, memory, and uptime
 */
async function getSystemInfo() {
  try {
    // Get CPU usage
    let cpuUsage = 0;
    
    try {
      // Try to get CPU usage via 'top' command (more accurate)
      const cpuData = execSync("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'").toString().trim();
      cpuUsage = parseFloat(cpuData);
    } catch (err) {
      // Fallback method: calculate from os.cpus()
      const cpus = os.cpus();
      let idleMs = 0;
      let totalMs = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalMs += cpu.times[type];
        }
        idleMs += cpu.times.idle;
      }
      
      cpuUsage = 100 - (idleMs / totalMs) * 100;
    }
    
    // Memory information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      cpuUsage: cpuUsage.toFixed(1),
      memoryUsed: usedMemory,
      memoryTotal: totalMemory,
    };
  } catch (error) {
    console.error('Failed to get system information:', error);
    throw error;
  }
}

/**
 * Get database connection status and statistics
 */
async function getDatabaseStatus() {
  try {
    if (!pool) {
      return {
        connected: false,
        activeConnections: 0,
        maxConnections: DB_CONFIG.max,
        activeQueries: 0,
        responseTime: 0,
      };
    }
    
    const startTime = Date.now();
    const client = await pool.connect();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Get active connection count
    const poolStats = await client.query('SELECT count(*) as connections FROM pg_stat_activity WHERE datname = $1', [DB_CONFIG.database]);
    const activeConnections = parseInt(poolStats.rows[0].connections, 10);
    
    // Get active queries count
    const queryStats = await client.query(
      "SELECT count(*) as queries FROM pg_stat_activity WHERE datname = $1 AND state = 'active' AND pid <> pg_backend_pid()",
      [DB_CONFIG.database]
    );
    const activeQueries = parseInt(queryStats.rows[0].queries, 10);
    
    client.release();
    
    return {
      connected: true,
      activeConnections,
      maxConnections: DB_CONFIG.max,
      activeQueries,
      responseTime,
    };
  } catch (error) {
    console.error('Failed to get database status:', error);
    return {
      connected: false,
      activeConnections: 0,
      maxConnections: DB_CONFIG.max,
      activeQueries: 0,
      responseTime: 0,
      error: error.message,
    };
  }
}

/**
 * Get information about running server processes
 */
async function getProcessInfo() {
  return new Promise((resolve, reject) => {
    exec('pm2 jlist', (error, stdout) => {
      if (error) {
        // PM2 is not installed or not running
        console.warn('Failed to get PM2 process list:', error);
        resolve([
          {
            name: 'ar-server',
            running: false,
            pid: null,
            memory: null,
            cpu: null,
          },
          {
            name: 'ar-monitor',
            running: true,
            pid: process.pid,
            memory: process.memoryUsage().rss,
            cpu: null,
          }
        ]);
        return;
      }
      
      try {
        const processes = JSON.parse(stdout);
        const formattedProcesses = processes.map(proc => ({
          name: proc.name,
          running: proc.pm2_env.status === 'online',
          pid: proc.pid,
          memory: proc.monit.memory,
          cpu: proc.monit.cpu.toFixed(1),
          uptime: proc.pm2_env.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : null,
        }));
        
        // Add current monitoring process if not managed by PM2
        const monitorInList = formattedProcesses.some(p => p.name === 'ar-monitor');
        if (!monitorInList) {
          formattedProcesses.push({
            name: 'ar-monitor',
            running: true,
            pid: process.pid,
            memory: process.memoryUsage().rss,
            cpu: null,
          });
        }
        
        resolve(formattedProcesses);
      } catch (err) {
        console.error('Error parsing PM2 process list:', err);
        resolve([
          {
            name: 'ar-monitor',
            running: true,
            pid: process.pid,
            memory: process.memoryUsage().rss,
            cpu: null,
          }
        ]);
      }
    });
  });
}

/**
 * Get recent logs from the log file
 */
async function getLogs() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(LOG_FILE_PATH)) {
        // Try to get logs from stdout if log file doesn't exist
        exec('pm2 logs ar-server --lines 50 --nostream', (error, stdout) => {
          if (error) {
            resolve('No logs available. Server might not be running with PM2.');
            return;
          }
          resolve(stdout);
        });
        return;
      }
      
      // Get last 50 lines from log file
      exec(`tail -n 50 ${LOG_FILE_PATH}`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    } catch (error) {
      console.error('Failed to read logs:', error);
      reject(error);
    }
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Authentic Reader Monitor started on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down monitor server...');
  
  // Close database pool if it exists
  if (pool) {
    await pool.end();
    console.log('Database pool closed');
  }
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force exit after 3 seconds if server doesn't close gracefully
  setTimeout(() => {
    console.error('Forcing server shutdown');
    process.exit(1);
  }, 3000);
}); 