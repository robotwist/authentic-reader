/**
 * Application Monitoring Service
 * 
 * This service provides real-time monitoring of application performance,
 * memory usage, API response times, and other critical metrics.
 */

import os from 'os';
import { performance } from 'perf_hooks';
import winston from 'winston';
import { EventEmitter } from 'events';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/monitor.log' })
  ]
});

class MonitorService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      uptime: 0,
      responseTime: {
        avg: 0,
        min: Infinity,
        max: 0,
        samples: []
      },
      memory: {
        usage: 0,
        free: 0,
        total: 0
      },
      cpu: {
        usage: 0,
        loadAvg: [0, 0, 0]
      },
      requests: {
        total: 0,
        success: 0,
        failed: 0,
        byEndpoint: {}
      },
      activeConnections: 0,
      errors: []
    };
    
    this.startTime = Date.now();
    this.updateInterval = null;
    this.sampleSize = 100; // Number of response time samples to keep
    this.initialized = false;
  }

  /**
   * Initialize the monitoring service
   */
  init() {
    if (this.initialized) return;
    
    logger.info('Initializing Monitor Service');
    
    // Start periodic updates
    this.updateInterval = setInterval(() => this.updateMetrics(), 5000);
    
    // Register process event handlers
    process.on('uncaughtException', (error) => {
      this.recordError('uncaughtException', error);
    });
    
    process.on('unhandledRejection', (reason) => {
      this.recordError('unhandledRejection', reason);
    });
    
    this.initialized = true;
    logger.info('Monitor Service initialized');
  }

  /**
   * Update system metrics (memory, CPU)
   */
  updateMetrics() {
    // Update uptime
    this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Update memory metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    this.metrics.memory = {
      usage: usedMem,
      usagePercent: Math.round((usedMem / totalMem) * 100),
      free: freeMem,
      total: totalMem
    };
    
    // Update CPU metrics
    this.metrics.cpu.loadAvg = os.loadavg();
    
    // Emit updated metrics event
    this.emit('metrics-updated', this.getMetrics());
    
    // Log metrics periodically
    if (this.metrics.uptime % 60 === 0) { // Log every minute
      logger.info('System metrics:', {
        uptime: this.formatUptime(this.metrics.uptime),
        memory: `${Math.round(this.metrics.memory.usagePercent)}% (${this.formatBytes(this.metrics.memory.usage)} / ${this.formatBytes(this.metrics.memory.total)})`,
        cpu: this.metrics.cpu.loadAvg.map(load => load.toFixed(2)).join(', '),
        requests: this.metrics.requests.total
      });
    }
  }

  /**
   * Record the start of a request
   * @param {string} endpoint - API endpoint being requested
   * @param {string} method - HTTP method
   * @param {string} requestId - Unique request ID
   */
  startRequest(endpoint, method, requestId) {
    // Create request tracking object
    const requestData = {
      id: requestId,
      endpoint,
      method,
      startTime: performance.now(),
      endTime: null,
      duration: null,
      status: null
    };
    
    // Store in active requests
    this.metrics.activeConnections++;
    this.metrics.requests.byEndpoint[endpoint] = this.metrics.requests.byEndpoint[endpoint] || {
      total: 0,
      success: 0,
      failed: 0,
      avgResponseTime: 0
    };
    
    // Return request object for later completion
    return requestData;
  }

  /**
   * Record the completion of a request
   * @param {Object} requestData - Request data from startRequest
   * @param {number} statusCode - HTTP status code
   */
  endRequest(requestData, statusCode) {
    if (!requestData || !requestData.startTime) {
      return;
    }
    
    // Calculate request duration
    const endTime = performance.now();
    const duration = endTime - requestData.startTime;
    
    // Update request data
    requestData.endTime = endTime;
    requestData.duration = duration;
    requestData.status = statusCode;
    
    // Update overall metrics
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    this.metrics.requests.total++;
    
    const isSuccess = statusCode >= 200 && statusCode < 400;
    if (isSuccess) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Update response time metrics
    this.updateResponseTimeMetrics(duration);
    
    // Update endpoint-specific metrics
    const endpoint = requestData.endpoint;
    const endpointMetrics = this.metrics.requests.byEndpoint[endpoint];
    
    if (endpointMetrics) {
      endpointMetrics.total++;
      if (isSuccess) {
        endpointMetrics.success++;
      } else {
        endpointMetrics.failed++;
      }
      
      // Update average response time for this endpoint
      const oldAvg = endpointMetrics.avgResponseTime;
      const newAvg = oldAvg + (duration - oldAvg) / endpointMetrics.total;
      endpointMetrics.avgResponseTime = newAvg;
    }
    
    // Log slow requests
    if (duration > 1000) { // More than 1 second
      logger.warn('Slow request detected', {
        endpoint,
        method: requestData.method,
        duration: `${duration.toFixed(2)}ms`,
        status: statusCode
      });
    }
    
    return requestData;
  }

  /**
   * Update response time metrics with a new sample
   * @param {number} duration - Request duration in milliseconds
   */
  updateResponseTimeMetrics(duration) {
    const responseTime = this.metrics.responseTime;
    
    // Add to samples, keeping only the most recent samples
    responseTime.samples.push(duration);
    if (responseTime.samples.length > this.sampleSize) {
      responseTime.samples.shift();
    }
    
    // Update min/max
    responseTime.min = Math.min(responseTime.min, duration);
    responseTime.max = Math.max(responseTime.max, duration);
    
    // Update average
    const sum = responseTime.samples.reduce((total, time) => total + time, 0);
    responseTime.avg = sum / responseTime.samples.length;
  }

  /**
   * Record an application error
   * @param {string} type - Error type
   * @param {Error|any} error - Error object or message
   */
  recordError(type, error) {
    const errorData = {
      type,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString()
    };
    
    // Add to error collection (keep last 100 errors)
    this.metrics.errors.unshift(errorData);
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.pop();
    }
    
    // Log the error
    logger.error(`Application error: ${type}`, errorData);
    
    // Emit error event
    this.emit('error', errorData);
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format bytes into human-readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Format uptime into human-readable format
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  /**
   * Clean up resources
   */
  shutdown() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.initialized = false;
    logger.info('Monitor Service shut down');
  }
}

// Create and export singleton instance
const monitorService = new MonitorService();

export default monitorService; 