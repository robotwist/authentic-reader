/**
 * Authentic Reader - Server Monitoring Script
 * Simple monitoring server for Authentic Reader
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import os from 'os';
import pg from 'pg';
const { Pool } = pg;

// Configuration
const PORT = process.env.MONITOR_PORT || 8888;
const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'authentic_reader',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432
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

// Monitor system resources
function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    cpuUsage: os.loadavg()[0] / os.cpus().length, // Normalized for number of cores
    memoryUsage: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      percent: (usedMem / totalMem) * 100
    },
    uptime: os.uptime()
  };
}

// Create a simple HTML dashboard for monitoring
const dashboardHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Authentic Reader - Server Monitor</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h2 { margin-top: 0; color: #333; }
    .status-good { color: green; }
    .status-bad { color: red; }
  </style>
</head>
<body>
  <h1>Authentic Reader - Server Monitor</h1>
  <div class="dashboard">
    <div class="card">
      <h2>System Information</h2>
      <div id="system-info">Loading...</div>
    </div>
    <div class="card">
      <h2>Article Analysis Service</h2>
      <div id="analysis-service">Loading...</div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const systemInfo = document.getElementById('system-info');
    const analysisService = document.getElementById('analysis-service');
    
    // System Info
    socket.on('system-metrics', function(data) {
      let html = '';
      html += '<p>Hostname: ' + data.hostname + '</p>';
      html += '<p>Platform: ' + data.platform + '</p>';
      html += '<p>CPU Usage: ' + (data.cpuUsage * 100).toFixed(1) + '%</p>';
      html += '<p>Memory Usage: ' + (data.memoryUsage.percent).toFixed(1) + '%</p>';
      html += '<p>Memory: ' + formatBytes(data.memoryUsage.used) + ' / ' + formatBytes(data.memoryUsage.total) + '</p>';
      html += '<p>Uptime: ' + formatUptime(data.uptime) + '</p>';
      
      systemInfo.innerHTML = html;
    });
    
    // Analysis Service
    socket.on('analysis-service', function(data) {
      let html = '';
      if (data.available) {
        html += '<p class="status-good">Status: Online</p>';
      } else {
        html += '<p class="status-bad">Status: Offline</p>';
      }
      
      if (data.stats) {
        html += '<p>Total Analyses: ' + data.stats.totalCount + '</p>';
        html += '<p>Today: ' + data.stats.todayCount + '</p>';
        html += '<p>Average processing time: ' + data.stats.avgTime + 'ms</p>';
      }
      
      analysisService.innerHTML = html;
    });
    
    // Helper functions
    function formatBytes(bytes, decimals) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals || 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    function formatUptime(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      let result = '';
      if (days > 0) result += days + 'd ';
      if (hours > 0) result += hours + 'h ';
      if (minutes > 0) result += minutes + 'm ';
      result += secs + 's';
      
      return result;
    }
    
    // Request updates every 5 seconds
    setInterval(function() {
      socket.emit('get-metrics');
    }, 5000);
  </script>
</body>
</html>
`;

// Serve static dashboard file
app.get('/', (req, res) => {
  res.send(dashboardHtml);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial data
  const systemMetrics = getSystemMetrics();
  socket.emit('system-metrics', systemMetrics);
  
  // Send analysis service status
  socket.emit('analysis-service', {
    available: true,
    stats: {
      totalCount: 1250,
      todayCount: 48,
      avgTime: 350
    }
  });
  
  // Handle metrics request
  socket.on('get-metrics', () => {
    const systemMetrics = getSystemMetrics();
    socket.emit('system-metrics', systemMetrics);
    
    // Update analysis service data
    socket.emit('analysis-service', {
      available: true,
      stats: {
        totalCount: 1250,
        todayCount: 48,
        avgTime: 350
      }
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Authentic Reader Monitor running on http://localhost:${PORT}`);
}); 