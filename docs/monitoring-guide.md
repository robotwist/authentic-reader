# Authentic Reader - Monitoring Guide

This document provides an overview of the monitoring capabilities in the Authentic Reader application.

## Table of Contents

1. [Server Monitoring Dashboard](#server-monitoring-dashboard)
2. [LogRocket Frontend Monitoring](#logrocket-frontend-monitoring)
3. [Error Tracking with LogRocket](#error-tracking-with-logrocket)
4. [Custom Event Tracking](#custom-event-tracking)
5. [Performance Monitoring](#performance-monitoring)

## Server Monitoring Dashboard

The Authentic Reader application includes a comprehensive server monitoring dashboard that provides real-time insights into the health and performance of your server.

### Accessing the Dashboard

1. Start the monitoring server:
   ```
   node server-monitor.js
   ```

2. Open the dashboard in your browser:
   ```
   http://localhost:8888
   ```

### Dashboard Features

The dashboard includes the following sections:

- **System Information**: Shows server hostname, platform, uptime, CPU model, CPU load, and memory usage.
- **Database Status**: Displays database connection status, configuration, and recent queries.
- **Server Processes**: Lists all running processes related to the application with their resource usage.
- **Recent Server Logs**: Shows the most recent server logs with colored indicators for different log levels.
- **LogRocket Error Sessions**: Displays recent frontend errors captured by LogRocket with links to session replays.

### Auto-Refresh

The dashboard automatically refreshes every 30 seconds, but you can manually refresh each section using the "Refresh" buttons.

## LogRocket Frontend Monitoring

The Authentic Reader application uses LogRocket for frontend monitoring and session replay.

### How LogRocket Works

LogRocket records user sessions, allowing you to:

- Replay user sessions to understand how users interact with your application
- View console logs, network requests, and Redux/state changes
- Track JavaScript errors and understand their context
- Identify UI/UX issues through session replay

### Privacy Considerations

Our LogRocket implementation includes built-in privacy protections:

- Passwords and authentication tokens are automatically redacted
- Sensitive API requests and responses are sanitized
- Personal information is handled according to our privacy policy

## Error Tracking with LogRocket

### Error Boundary

The application includes a React Error Boundary component that:

1. Catches errors that occur during rendering
2. Reports them to LogRocket
3. Sends error details to the server for centralized tracking
4. Displays a user-friendly fallback UI

### Viewing Error Sessions

Administrators can view error sessions in two ways:

1. **Server Monitoring Dashboard**: The LogRocket Error Sessions section shows recent errors with links to session replays.

2. **LogRocket Dashboard**: For more detailed analysis, administrators can log in to the LogRocket dashboard directly:
   ```
   https://app.logrocket.com/ltv1sb/authentic-reader
   ```

## Custom Event Tracking

The application includes a global `trackEvent` function that can be used to track custom events:

```javascript
// Track a simple event
window.trackEvent('article_viewed');

// Track an event with properties
window.trackEvent('article_shared', { 
  articleId: 123,
  platform: 'twitter' 
});
```

### Standard Events

The application automatically tracks the following events:

- **Page Views**: When users navigate to different pages
- **Authentication Events**: Login, logout, registration
- **Article Interactions**: Views, likes, shares, comments
- **Search Events**: When users perform searches

## Performance Monitoring

### Long Task Detection

The application monitors for "long tasks" (operations that take more than 50ms) that might affect user experience. These are automatically tracked in LogRocket.

### Network Performance

LogRocket automatically tracks API request performance, helping identify slow endpoints.

### Memory Usage

The server monitoring dashboard tracks memory usage to help identify potential memory leaks.

## Adding Custom Monitoring

To add additional monitoring to specific components, use the `LogRocket` object:

```javascript
import LogRocket from '../utils/logRocket';

// Log a custom error
LogRocket.captureException(error);

// Add breadcrumbs for debugging
LogRocket.track('User clicked important button', { buttonId: 'submit-form' });
```

---

For any questions about monitoring, please contact the development team. 