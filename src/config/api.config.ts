/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints and settings
 */

// Debug logging for environment variables
console.log('[API Config] Environment variables:', {
  viteApiUrl: import.meta.env?.VITE_API_URL,
  nodeEnv: import.meta.env?.MODE,
  allEnv: import.meta.env
});

// Determine the API base URL from environment variables or default to production
export const API_BASE_URL = (() => {
  // Check for environment variables in Vite format first
  const viteUrl = import.meta.env?.VITE_API_URL;
  if (viteUrl) {
    console.log('[API Config] Using Vite API URL:', viteUrl);
    return viteUrl;
  }
  
  // Then check for CRA format environment variables
  const craUrl = window.env?.REACT_APP_API_URL;
  if (craUrl) {
    console.log('[API Config] Using CRA API URL:', craUrl);
    return craUrl;
  }
  
  // Check for Railway URL (will be set by Railway)
  const railwayUrl = import.meta.env?.VITE_RAILWAY_URL;
  if (railwayUrl) {
    console.log('[API Config] Using Railway API URL:', railwayUrl);
    return railwayUrl;
  }
  
  // Production fallback - use Heroku backend
  if (import.meta.env?.MODE === 'production' || window.location.hostname !== 'localhost') {
    console.log('[API Config] Using production Heroku API URL');
    return 'https://authentic-reader-api-8b0a83fb7d96.herokuapp.com';
  }
  
  // Default to Heroku backend for development (no local backend running)
  console.log('[API Config] Using Heroku backend for development');
  return 'https://authentic-reader-api-8b0a83fb7d96.herokuapp.com';
})();

// Log the final API base URL
console.log('[API Config] Final API base URL:', API_BASE_URL);

// API configuration object
export const API_CONFIG = {
  // Base URL for all API requests
  BASE_URL: API_BASE_URL,
  
  // Request timeout in milliseconds
  TIMEOUT_MS: 30000,
  
  // Maximum number of retries for failed requests
  MAX_RETRIES: 3,
  
  // Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/api/users/login',
      REGISTER: '/api/users/register',
      PROFILE: '/api/users/profile',
      REFRESH: '/api/users/refresh-token',
    },
    
    // RSS and content endpoints
    RSS: '/api/rss',
    CONTENT: '/api/content',
    
    // Sources endpoints
    SOURCES: '/api/sources',
    
    // Articles endpoints
    ARTICLES: '/api/articles',
    
    // Admin endpoints
    ADMIN: '/api/admin',
    
    // ONNX endpoints
    ONNX: '/api/onnx',
    
    // Feedback endpoints
    FEEDBACK: '/api/feedback',
    
    // Health check endpoint
    HEALTH: '/health'
  },
  
  // HTTP status codes
  STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  }
};

// Export default for convenience
export default API_CONFIG; 