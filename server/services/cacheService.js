/**
 * Cache Service
 * 
 * Provides caching functionality for the API to improve performance.
 * Uses a combination of in-memory caching for frequently accessed data
 * and implements cache invalidation strategies.
 */

const NodeCache = require('node-cache');

// Cache configuration
const SHORT_TTL = 60; // 1 minute
const MEDIUM_TTL = 300; // 5 minutes 
const LONG_TTL = 3600; // 1 hour

// Initialize cache with standard TTL and check period
const cache = new NodeCache({
  stdTTL: MEDIUM_TTL,
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone objects when storing or retrieving 
});

/**
 * Generate a cache key from prefix and parameters
 * @param {string} prefix - Cache key prefix 
 * @param {Object} params - Parameters to include in the key
 * @returns {string} The generated cache key
 */
const generateCacheKey = (prefix, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      // Skip null/undefined values
      if (params[key] !== null && params[key] !== undefined) {
        result[key] = params[key];
      }
      return result;
    }, {});
  
  return `${prefix}:${JSON.stringify(sortedParams)}`;
};

/**
 * Cache middleware for Express routes
 * @param {Object} options - Cache options
 * @returns {Function} Express middleware function
 */
const cacheMiddleware = (options = {}) => {
  const {
    prefix = 'api',
    ttl = MEDIUM_TTL,
    paramFields = [],
    queryFields = []
  } = options;
  
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Extract relevant parameters
    const paramValues = {};
    paramFields.forEach(field => {
      if (req.params[field]) {
        paramValues[field] = req.params[field];
      }
    });
    
    // Extract relevant query parameters
    const queryValues = {};
    queryFields.forEach(field => {
      if (req.query[field]) {
        queryValues[field] = req.query[field];
      }
    });
    
    // Generate cache key
    const cacheKey = generateCacheKey(
      `${prefix}:${req.baseUrl}${req.path}`,
      { ...paramValues, ...queryValues }
    );
    
    // Check if response exists in cache
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.json(cachedResponse);
    }
    
    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function(data) {
      // Store in cache
      cache.set(cacheKey, data, ttl);
      console.log(`Cache set: ${cacheKey}`);
      
      // Call the original method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Invalidate cache entries
 * @param {string} pattern - Pattern for keys to invalidate
 */
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
    console.log(`Invalidated ${matchingKeys.length} cache keys matching pattern: ${pattern}`);
  }
};

/**
 * Clear the entire cache
 */
const clearCache = () => {
  cache.flushAll();
  console.log('Cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  clearCache,
  getCacheStats,
  TTL: {
    SHORT: SHORT_TTL,
    MEDIUM: MEDIUM_TTL,
    LONG: LONG_TTL
  }
}; 