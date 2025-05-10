/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints and settings
 */

// Determine the API base URL from environment variables or default to localhost
export const API_BASE_URL = (() => {
  // Check for environment variables in Vite format first
  const viteUrl = import.meta.env?.VITE_API_URL;
  if (viteUrl) return viteUrl;
  
  // Then check for CRA format environment variables
  const craUrl = window.env?.REACT_APP_API_URL;
  if (craUrl) return craUrl;
  
  // Default to localhost development server
  return 'http://localhost:3001';
})();

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