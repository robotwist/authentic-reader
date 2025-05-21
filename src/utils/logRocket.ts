import LogRocket from 'logrocket';

// Initialize LogRocket with your app ID
LogRocket.init('ltv1sb/authentic-reader', {
  // Optional settings
  release: process.env.REACT_APP_VERSION || '1.0.0',
  console: {
    shouldAggregateConsoleErrors: true
  },
  network: {
    // Request & response sanitization for privacy
    requestSanitizer: request => {
      // Don't log sensitive request data
      if (request.url.includes('/api/auth') || request.url.includes('/api/users')) {
        try {
          const sanitizedBody = JSON.parse(request.body);
          if (sanitizedBody.password) {
            sanitizedBody.password = '[REDACTED]';
          }
          if (sanitizedBody.token) {
            sanitizedBody.token = '[REDACTED]';
          }
          request.body = JSON.stringify(sanitizedBody);
        } catch (e) {
          // If body isn't JSON, leave it as is
        }
      }
      return request;
    },
    responseSanitizer: response => {
      // Don't log auth tokens or sensitive user data
      if (response.url.includes('/api/auth') || response.url.includes('/api/users')) {
        try {
          const sanitizedBody = JSON.parse(response.body);
          if (sanitizedBody.token) {
            sanitizedBody.token = '[REDACTED]';
          }
          if (sanitizedBody.refreshToken) {
            sanitizedBody.refreshToken = '[REDACTED]';
          }
          response.body = JSON.stringify(sanitizedBody);
        } catch (e) {
          // If body isn't JSON, leave it as is
        }
      }
      return response;
    }
  }
});

// Function to identify users in LogRocket sessions
export function identifyUser(user: { id: string; email?: string; name?: string; role?: string }) {
  if (!user || !user.id) return;
  
  // Store the current user ID on the window object for error tracking
  (window as any).currentUserId = user.id;
  
  // Identify the user in LogRocket
  LogRocket.identify(user.id, {
    name: user.name || 'Unknown',
    email: user.email || 'no-email@example.com',
    role: user.role || 'user',
    // Add any other user traits you want to track
  });
}

// Export LogRocket instance for direct use
export default LogRocket; 