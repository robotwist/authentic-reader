/**
 * Request Monitoring Middleware
 * 
 * This middleware tracks request performance metrics using the monitor service.
 */

import { v4 as uuidv4 } from 'uuid';
import monitorService from '../services/monitorService.js';

/**
 * Express middleware to track request performance
 */
export const requestMonitor = (req, res, next) => {
  // Generate unique request ID
  const requestId = req.id || uuidv4();
  req.id = requestId;

  // Set request start time and endpoint
  const endpoint = `${req.method} ${req.originalUrl.split('?')[0]}`;
  
  // Start tracking request
  const requestData = monitorService.startRequest(endpoint, req.method, requestId);
  
  // Store request data for later use
  req.monitorData = requestData;
  
  // Track response
  const originalEnd = res.end;
  
  res.end = function(...args) {
    // Complete the request monitoring
    monitorService.endRequest(req.monitorData, res.statusCode);
    
    // Call original end method
    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Express error monitoring middleware
 */
export const errorMonitor = (err, req, res, next) => {
  // Record the error in monitor service
  monitorService.recordError('express', err);
  
  // Complete the request with error status if we were tracking it
  if (req.monitorData) {
    monitorService.endRequest(req.monitorData, res.statusCode || 500);
  }
  
  // Continue to regular error handler
  next(err);
}; 