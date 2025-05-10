// API service for handling all backend API requests
// This service provides interfaces and functions for interacting with our backend API
import {
  User,
  UserPreferences,
  APISource as Source,
  APIArticle as Article,
  ArticleAnalysis,
  PaginatedResponse
} from '../types';

// API base URL - replace with your production URL when deploying
const API_BASE_URL = 'http://localhost:3001';

// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

// Authentication helper functions
export const setAuth = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Add timeout for API calls to prevent hanging
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 30000) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create a timeout promise
  const timeoutId = setTimeout(() => {
    // Add a specific reason when aborting to avoid "signal is aborted without reason"
    controller.abort("Request timeout exceeded");
    // Note: The reject will be handled by the fetch's own error handler
  }, timeoutMs);
  
  try {
    // Create the fetch promise with the abort signal
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    // Clear the timeout if the fetch completes successfully
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    // Add more context to AbortError messages
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request to ${url} was aborted: timeout of ${timeoutMs}ms exceeded`);
    }
    
    throw error;
  }
};

// API Error class for better error handling
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if required and available
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (requiresAuth) {
      // Return a rejected promise if auth is required but no token exists
      return Promise.reject(new ApiError('Authentication required', 401));
    }
  }
  
  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };
  
  try {
    // Add an outer try/catch to improve error handling for connectivity issues
    let response;
    try {
      // Use a longer timeout for initial requests
      response = await fetchWithTimeout(url, options, 30000);
    } catch (fetchError) {
      // Network error or timeout (connectivity issues or server not available)
      console.error(`Network error accessing ${url}:`, fetchError);
      
      // Provide a more specific error for different scenarios
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          throw new ApiError(`Request timeout (server may be unreachable): ${fetchError.message}`, 0);
        } else if (fetchError.message.includes('Failed to fetch') || 
                  fetchError.message.includes('Network request failed')) {
          throw new ApiError('Server is unreachable. Please check your connection and verify the server is running.', 0);
        }
      }
      
      // Re-throw with a better message
      throw new ApiError(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`, 0);
    }
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle API errors
        throw new ApiError(
          responseData.message || 'An error occurred', 
          response.status,
          responseData
        );
      }
      
      return responseData as T;
    } else {
      // Handle non-JSON response
      const text = await response.text();
      
      if (!response.ok) {
        throw new ApiError(`HTTP Error: ${response.status}`, response.status, text);
      }
      
      // Try to convert to expected type if it's a simple text response
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    }
  } catch (error) {
    // Re-throw ApiErrors as is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Convert other errors to ApiError with better messages
    console.error(`API error (${method} ${endpoint}):`, error);
    
    // Provide more specific error messages based on common patterns
    let errorMessage = 'Network error';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
        errorMessage = 'Server is unreachable. Please check your connection and verify the server is running.';
      } else {
        errorMessage = error.message;
      }
    }
    
    throw new ApiError(errorMessage, 0);
  }
}

// Authentication API
export const authApi = {
  // Register a new user
  register: async (username: string, email: string, password: string): Promise<User> => {
    const data = await apiRequest<User & { token: string }>(
      '/api/users/register',
      'POST',
      { username, email, password },
      false
    );
    
    // Store auth data
    if (data.token) {
      setAuth(data.token, data);
    }
    
    return data;
  },
  
  // Login user
  login: async (credentials: { email?: string; username?: string; password: string }): Promise<User> => {
    const data = await apiRequest<User & { token: string }>(
      '/api/users/login',
      'POST',
      credentials,
      false
    );
    
    // Store auth data
    if (data.token) {
      setAuth(data.token, data);
    }
    
    return data;
  },
  
  // Logout user
  logout: () => {
    clearAuth();
  },
  
  // Get user profile
  getProfile: async (): Promise<User> => {
    return apiRequest<User>('/api/users/profile');
  },
  
  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    return apiRequest<User>('/api/users/profile', 'PUT', updates);
  },
  
  // Update user password
  updatePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      '/api/users/password',
      'PUT',
      { currentPassword, newPassword }
    );
  },
  
  // Get user preferences
  getPreferences: async (): Promise<UserPreferences> => {
    return apiRequest<UserPreferences>('/api/users/preferences');
  },
  
  // Update user preferences
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    return apiRequest<UserPreferences>('/api/users/preferences', 'PUT', preferences);
  }
};

// Sources API
export const sourcesApi = {
  // Get all sources
  getAllSources: async (retryCount = 2): Promise<Source[]> => {
    try {
      return await apiRequest<Source[]>('/api/sources', 'GET', undefined, false);
    } catch (error) {
      if (retryCount > 0 && (error instanceof ApiError || error instanceof Error)) {
        console.warn(`Retrying getAllSources (${retryCount} retries left)...`);
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry with one less retry count
        return sourcesApi.getAllSources(retryCount - 1);
      }
      
      console.error('Failed to fetch sources after retries:', error);
      
      // If we've exhausted retries or it's not a retryable error, return empty array
      return [];
    }
  },
  
  // Get source by ID
  getSource: async (id: number): Promise<Source> => {
    return apiRequest<Source>(`/api/sources/${id}`, 'GET', undefined, false);
  },
  
  // Get user's subscribed sources
  getUserSources: async (): Promise<Source[]> => {
    return apiRequest<Source[]>('/api/sources/user/subscriptions');
  },
  
  // Subscribe to a source
  subscribeToSource: async (sourceId: number): Promise<Source> => {
    return apiRequest<Source>(`/api/sources/${sourceId}/subscribe`, 'POST');
  },
  
  // Unsubscribe from a source
  unsubscribeFromSource: async (sourceId: number): Promise<void> => {
    return apiRequest<void>(`/api/sources/${sourceId}/subscribe`, 'DELETE');
  },
  
  // Update source order
  updateSourceOrder: async (sourceOrders: { sourceId: number, displayOrder: number }[]): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/api/sources/user/order', 'PUT', { sourceOrders });
  },
  
  // Create a new source (admin function)
  createSource: async (source: Omit<Source, 'id'>): Promise<Source> => {
    return apiRequest<Source>('/api/sources', 'POST', source);
  },
  
  // Update a source (admin function)
  updateSource: async (id: number, updates: Partial<Source>): Promise<Source> => {
    return apiRequest<Source>(`/api/sources/${id}`, 'PUT', updates);
  },
  
  // Delete a source (admin function)
  deleteSource: async (id: number): Promise<void> => {
    return apiRequest<void>(`/api/sources/${id}`, 'DELETE');
  }
};

// Articles API
export const articlesApi = {
  // Get all articles with optional filters
  getAllArticles: async (
    options: {
      limit?: number;
      offset?: number;
      sourceId?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<PaginatedResponse<Article>> => {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return apiRequest<PaginatedResponse<Article>>(
      `/api/articles${queryString}`,
      'GET',
      undefined,
      isAuthenticated()
    );
  },
  
  // Get articles from a source
  getArticlesFromSource: async (sourceId: number | string): Promise<Article[]> => {
    return apiRequest<Article[]>(
      `/api/articles/source/${sourceId}`,
      'GET',
      undefined,
      isAuthenticated()
    );
  },
  
  // Get user's saved articles
  getSavedArticles: async (
    options: { limit?: number; offset?: number } = {}
  ): Promise<PaginatedResponse<Article>> => {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return apiRequest<PaginatedResponse<Article>>(
      `/api/articles/saved${queryString}`
    );
  },
  
  // Mark article as read/unread
  markAsRead: async (articleId?: number, guid?: string, isRead: boolean = true): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      '/api/articles/read',
      'POST',
      { articleId, guid, isRead }
    );
  },
  
  // Save/unsave article
  saveArticle: async (articleId?: number, guid?: string, isSaved: boolean = true): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      '/api/articles/save',
      'POST',
      { articleId, guid, isSaved }
    );
  },
  
  // Get article analysis
  getArticleAnalysis: async (articleId?: number, guid?: string): Promise<ArticleAnalysis> => {
    if (articleId) {
      return apiRequest<ArticleAnalysis>(
        `/api/articles/${articleId}/analysis`,
        'GET',
        undefined,
        isAuthenticated()
      );
    } else if (guid) {
      return apiRequest<ArticleAnalysis>(
        `/api/articles/guid/${guid}/analysis`,
        'GET',
        undefined,
        isAuthenticated()
      );
    }
    
    throw new ApiError('Either articleId or guid is required', 400);
  },
  
  // Create article analysis
  createArticleAnalysis: async (analysis: Partial<ArticleAnalysis>): Promise<ArticleAnalysis> => {
    return apiRequest<ArticleAnalysis>(
      '/api/articles/analysis',
      'POST',
      analysis,
      isAuthenticated()
    );
  }
};

export default {
  authApi,
  sourcesApi,
  articlesApi
}; 