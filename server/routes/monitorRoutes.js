/**
 * Monitor API Routes
 * 
 * This file defines routes for accessing application monitoring data.
 */

import express from 'express';
import monitorService from '../services/monitorService.js';

const router = express.Router();

/**
 * GET /api/monitor/metrics
 * Get all current monitoring metrics
 */
router.get('/metrics', (req, res) => {
  const metrics = monitorService.getMetrics();
  res.json(metrics);
});

/**
 * GET /api/monitor/health
 * Basic health check endpoint
 */
router.get('/health', (req, res) => {
  const metrics = monitorService.getMetrics();
  const memory = metrics.memory;
  const memoryUsagePercent = memory.usagePercent || 0;
  
  // Determine health status based on metrics
  const isHealthy = 
    memoryUsagePercent < 90 && // Memory usage below 90%
    metrics.requests.failed / Math.max(metrics.requests.total, 1) < 0.05; // Error rate below 5%
  
  const status = isHealthy ? 'healthy' : 'unhealthy';
  
  res.json({
    status,
    uptime: monitorService.formatUptime(metrics.uptime),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/monitor/errors
 * Get recent application errors
 */
router.get('/errors', (req, res) => {
  const metrics = monitorService.getMetrics();
  res.json({
    total: metrics.errors.length,
    errors: metrics.errors
  });
});

/**
 * GET /api/monitor/response-times
 * Get API response time metrics
 */
router.get('/response-times', (req, res) => {
  const metrics = monitorService.getMetrics();
  
  // Get endpoint-specific metrics
  const endpoints = Object.entries(metrics.requests.byEndpoint).map(([endpoint, data]) => ({
    endpoint,
    avgResponseTime: data.avgResponseTime.toFixed(2),
    requests: data.total,
    successRate: ((data.success / Math.max(data.total, 1)) * 100).toFixed(1) + '%'
  }));
  
  // Sort by average response time (slowest first)
  endpoints.sort((a, b) => b.avgResponseTime - a.avgResponseTime);
  
  res.json({
    overall: {
      avg: metrics.responseTime.avg.toFixed(2),
      min: metrics.responseTime.min === Infinity ? 0 : metrics.responseTime.min.toFixed(2),
      max: metrics.responseTime.max.toFixed(2)
    },
    endpoints
  });
});

/**
 * GET /api/monitor/summary
 * Get a summary of key metrics
 */
router.get('/summary', (req, res) => {
  const metrics = monitorService.getMetrics();
  
  res.json({
    uptime: monitorService.formatUptime(metrics.uptime),
    memory: {
      usagePercent: metrics.memory.usagePercent || 0,
      used: monitorService.formatBytes(metrics.memory.usage),
      total: monitorService.formatBytes(metrics.memory.total)
    },
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      failed: metrics.requests.failed,
      activeConnections: metrics.activeConnections
    },
    responseTimes: {
      avg: metrics.responseTime.avg.toFixed(2) + 'ms',
      max: metrics.responseTime.max.toFixed(2) + 'ms'
    },
    errors: metrics.errors.length,
    timestamp: metrics.timestamp
  });
});

export default router; 