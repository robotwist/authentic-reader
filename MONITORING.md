# Authentic Reader - Monitoring Dashboard

This document provides instructions for setting up and using the Authentic Reader monitoring dashboard. The dashboard provides real-time monitoring capabilities for the server, including:

- System information (CPU, memory, uptime)
- Database status and connections
- Server processes
- Application logs

## Installation

The monitoring dashboard has been set up with the following components:

1. `server-monitor.js` - The main monitoring server script
2. `monitor-dashboard.html` - The HTML/CSS/JS for the dashboard UI
3. `setup-monitor.js` - Setup script to install dependencies and configure the environment

To set up the monitoring dashboard:

```bash
# Run the setup script
node setup-monitor.js

# If the dependencies installation fails, you can run it manually
npm install socket.io@^4.5.4 express@^4.18.2 chart.js@^4.3.0 pm2@^5.3.0
```

## Usage

### Starting the Monitoring Dashboard

You can start the monitoring dashboard in two ways:

1. **Foreground mode**:
   ```bash
   npm run monitor
   ```

2. **Background mode** (using PM2):
   ```bash
   npm run monitor:pm2
   ```

Once started, you can access the dashboard at:
```
http://localhost:8888
```

### Running the Server with PM2

For optimal monitoring, you can run the Authentic Reader server using PM2:

```bash
# Start the server in the background
npm run server:pm2

# Check the status of all PM2 services
npm run pm2:status

# View server logs
npm run server:logs

# View monitor logs
npm run monitor:logs
```

### Managing PM2 Processes

```bash
# Stop all processes
npm run pm2:stop:all

# Restart all processes
npm run pm2:restart:all

# List all processes
npx pm2 list

# Show process details
npx pm2 show ar-server
npx pm2 show ar-monitor
```

## Dashboard Features

The monitoring dashboard provides the following features:

### System Information
- Host name and platform
- CPU usage (with visual indicators)
- Memory usage (with visual indicators)
- System uptime

### Database Status
- Connection status
- Active connections
- Connection pool information
- Active queries
- Response time

### Server Processes
- List of PM2-managed processes
- Process status (running/stopped)
- Process ID
- Memory usage
- CPU usage

### Logs
- Real-time server logs
- Manual refresh option

## Troubleshooting

### Database Connection Issues

If the dashboard shows database connection issues:

1. Verify that the PostgreSQL service is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check the database configuration in `.env` or `server/.env`

### PM2 Issues

If PM2 commands fail:

1. Make sure PM2 is installed globally:
   ```bash
   npm install -g pm2
   ```

2. Try restarting PM2:
   ```bash
   npx pm2 kill
   npx pm2 resurrect
   ```

### Monitoring Dashboard Not Loading

If the monitoring dashboard isn't loading:

1. Check if the monitor server is running:
   ```bash
   npx pm2 list
   ```

2. Check the logs for errors:
   ```bash
   npm run monitor:logs
   ```

3. Verify that port 8888 is not being used by another application:
   ```bash
   lsof -i :8888
   ```

## Accessing the Admin Dashboard

To access the admin dashboard:

1. Start the application with `npm run dev`
2. Go to http://localhost:5173/login
3. Login with: simpleadmin@example.com / admin123
4. Navigate to http://localhost:5173/admin 