import { API_BASE_URL } from '../config/api.config';
// Debug logging
console.log('[API Service] Initializing with base URL:', API_BASE_URL);
console.log('[API Service] Environment:', {
    mode: import.meta.env?.MODE || 'development',
    viteApiUrl: import.meta.env?.VITE_API_URL,
    baseUrl: API_BASE_URL
});
// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';
// Authentication helper functions
export const setAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};
export const getCurrentUser = () => {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};
export const isAuthenticated = () => {
    return !!getToken();
};
// Add timeout for API calls to prevent hanging
const fetchWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
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
    }
    catch (error) {
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
    constructor(message, status, data) {
        super(message);
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}
// API request helper
async function apiRequest(endpoint, method = 'GET', data, requiresAuth = true) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API Request] ${method} ${url}`, {
        data,
        requiresAuth,
        baseUrl: API_BASE_URL,
        endpoint,
        env: import.meta.env?.MODE,
        viteApiUrl: import.meta.env?.VITE_API_URL
    });
    const headers = {
        'Content-Type': 'application/json',
    };
    // Add auth token if required and available
    if (requiresAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('[API Request] Using auth token');
        }
        else if (requiresAuth) {
            console.log('[API Request] Auth required but no token found');
            // Return a rejected promise if auth is required but no token exists
            return Promise.reject(new ApiError('Authentication required', 401));
        }
    }
    const options = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        mode: 'cors', // Explicitly enable CORS
        credentials: 'include' // Include credentials if needed
    };
    try {
        // Add an outer try/catch to improve error handling for connectivity issues
        let response;
        try {
            // Use a longer timeout for initial requests
            console.log('[API Request] Sending request with options:', {
                method: options.method,
                headers: options.headers,
                mode: options.mode,
                credentials: options.credentials
            });
            response = await fetchWithTimeout(url, options, 30000);
            console.log('[API Response] Status:', response.status, response.statusText);
            console.log('[API Response] Headers:', Object.fromEntries(response.headers.entries()));
        }
        catch (fetchError) {
            // Network error or timeout (connectivity issues or server not available)
            console.error(`[API Error] Network error accessing ${url}:`, fetchError);
            // Provide a more specific error for different scenarios
            if (fetchError instanceof Error) {
                if (fetchError.name === 'AbortError') {
                    throw new ApiError(`Request timeout (server may be unreachable): ${fetchError.message}`, 0);
                }
                else if (fetchError.message.includes('Failed to fetch') ||
                    fetchError.message.includes('Network request failed')) {
                    throw new ApiError('Server is unreachable. Please check your connection and verify the server is running.', 0);
                }
            }
            // Re-throw with a better message
            throw new ApiError(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`, 0);
        }
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        console.log('[API Response] Content-Type:', contentType);
        if (contentType && contentType.includes('application/json')) {
            const responseData = await response.json();
            console.log('[API Response] Data:', responseData);
            if (!response.ok) {
                // Handle API errors
                throw new ApiError(responseData.message || 'An error occurred', response.status, responseData);
            }
            return responseData;
        }
        else {
            // Handle non-JSON response
            const text = await response.text();
            console.log('[API Response] Text:', text);
            if (!response.ok) {
                throw new ApiError(`HTTP Error: ${response.status}`, response.status, text);
            }
            // Try to convert to expected type if it's a simple text response
            try {
                return JSON.parse(text);
            }
            catch {
                return text;
            }
        }
    }
    catch (error) {
        // Re-throw ApiErrors as is
        if (error instanceof ApiError) {
            console.error('[API Error] ApiError:', error.message, error.status, error.data);
            throw error;
        }
        // Convert other errors to ApiError with better messages
        console.error(`[API Error] (${method} ${endpoint}):`, error);
        // Provide more specific error messages based on common patterns
        let errorMessage = 'Network error';
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
                errorMessage = 'Server is unreachable. Please check your connection and verify the server is running.';
            }
            else {
                errorMessage = error.message;
            }
        }
        throw new ApiError(errorMessage, 0);
    }
}
// Authentication API
export const authApi = {
    // Register a new user
    register: async (username, email, password) => {
        const data = await apiRequest('/api/users/register', 'POST', { username, email, password }, false);
        // Store auth data
        if (data.token) {
            setAuth(data.token, data);
        }
        return data;
    },
    // Login user
    login: async (credentials) => {
        const data = await apiRequest('/api/users/login', 'POST', credentials, false);
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
    getProfile: async () => {
        return apiRequest('/api/users/profile');
    },
    // Update user profile
    updateProfile: async (updates) => {
        return apiRequest('/api/users/profile', 'PUT', updates);
    },
    // Update user password
    updatePassword: async (currentPassword, newPassword) => {
        return apiRequest('/api/users/password', 'PUT', { currentPassword, newPassword });
    },
    // Get user preferences
    getPreferences: async () => {
        return apiRequest('/api/users/preferences');
    },
    // Update user preferences
    updatePreferences: async (preferences) => {
        return apiRequest('/api/users/preferences', 'PUT', preferences);
    }
};
// Sources API
export const sourcesApi = {
    // Get all sources
    getAllSources: async (retryCount = 2) => {
        try {
            // Use public endpoint when not authenticated; use user endpoint when authenticated
            const endpoint = isAuthenticated() ? '/api/sources' : '/api/sources/public';
            return await apiRequest(endpoint, 'GET', undefined, !!isAuthenticated());
        }
        catch (error) {
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
    getSource: async (id) => {
        // Prefer public variant when not authenticated
        const endpoint = isAuthenticated() ? `/api/sources/${id}` : `/api/sources/public/${id}`;
        return apiRequest(endpoint, 'GET', undefined, !!isAuthenticated());
    },
    // Get user's subscribed sources
    getUserSources: async () => {
        // Backend exposes user sources at GET /api/sources (auth required)
        return apiRequest('/api/sources');
    },
    // Subscribe to a source
    subscribeToSource: async (sourceId) => {
        return apiRequest(`/api/sources/${sourceId}/subscribe`, 'POST');
    },
    // Unsubscribe from a source
    unsubscribeFromSource: async (sourceId) => {
        return apiRequest(`/api/sources/${sourceId}/subscribe`, 'DELETE');
    },
    // Update source order
    updateSourceOrder: async (sourceOrders) => {
        // Note: Ensure matching backend route exists. Placeholder path if implemented server-side.
        return apiRequest('/api/sources/user/order', 'PUT', { sourceOrders });
    },
    // Create a new source (admin function)
    createSource: async (source) => {
        return apiRequest('/api/sources', 'POST', source);
    },
    // Update a source (admin function)
    updateSource: async (id, updates) => {
        return apiRequest(`/api/sources/${id}`, 'PUT', updates);
    },
    // Delete a source (admin function)
    deleteSource: async (id) => {
        return apiRequest(`/api/sources/${id}`, 'DELETE');
    }
};
// Articles API
export const articlesApi = {
    // Get all articles with optional filters
    getAllArticles: async (options = {}) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options)) {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        }
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return apiRequest(`/api/articles${queryString}`, 'GET', undefined, isAuthenticated());
    },
    // Get articles from a source
    getArticlesFromSource: async (sourceId) => {
        return apiRequest(`/api/articles/source/${sourceId}`, 'GET', undefined, isAuthenticated());
    },
    // Get user's saved articles
    getSavedArticles: async (options = {}) => {
        const params = new URLSearchParams();
        if (options.limit)
            params.append('limit', options.limit.toString());
        if (options.offset)
            params.append('offset', options.offset.toString());
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return apiRequest(`/api/articles/saved${queryString}`);
    },
    // Mark article as read/unread
    markAsRead: async (articleId, guid, isRead = true) => {
        return apiRequest('/api/articles/read', 'POST', { articleId, guid, isRead });
    },
    // Save/unsave article
    saveArticle: async (articleId, guid, isSaved = true) => {
        return apiRequest('/api/articles/save', 'POST', { articleId, guid, isSaved });
    },
    // Get article analysis
    getArticleAnalysis: async (articleId, guid) => {
        if (articleId) {
            return apiRequest(`/api/articles/${articleId}/analysis`, 'GET', undefined, isAuthenticated());
        }
        else if (guid) {
            return apiRequest(`/api/articles/guid/${guid}/analysis`, 'GET', undefined, isAuthenticated());
        }
        throw new ApiError('Either articleId or guid is required', 400);
    },
    // Create article analysis
    createArticleAnalysis: async (analysis) => {
        return apiRequest('/api/articles/analysis', 'POST', analysis, isAuthenticated());
    }
};
// Stockpile Analytics API functions
export const getStockpileAnalytics = async () => {
    try {
        const response = await apiRequest('/api/stockpile/analytics');
        return response;
    }
    catch (error) {
        console.error('[API Service] Error fetching stockpile analytics:', error);
        throw error;
    }
};
export const getStockpileStatus = async () => {
    try {
        const response = await apiRequest('/api/stockpile/status');
        return response;
    }
    catch (error) {
        console.error('[API Service] Error fetching stockpile status:', error);
        throw error;
    }
};
export default {
    authApi,
    sourcesApi,
    articlesApi
};
