/**
 * Alert Service
 * 
 * Provides monitoring alerts for critical system issues,
 * performance degradation, and security events.
 */

import { EventEmitter } from 'events';

class AlertService extends EventEmitter {
  constructor() {
    super();
    this.alerts = [];
    this.thresholds = {
      responseTime: 2000, // 2 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.85, // 85%
      cpuUsage: 0.80, // 80%
      diskUsage: 0.90, // 90%
      activeConnections: 1000
    };
    this.alertHistory = [];
    this.maxHistory = 100;
  }

  /**
   * Check system metrics and generate alerts
   */
  checkMetrics(metrics) {
    const alerts = [];

    // Response time alert
    if (metrics.responseTime?.avg > this.thresholds.responseTime) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `High response time: ${Math.round(metrics.responseTime.avg)}ms`,
        timestamp: new Date().toISOString(),
        metric: 'responseTime',
        value: metrics.responseTime.avg,
        threshold: this.thresholds.responseTime
      });
    }

    // Error rate alert
    const errorRate = metrics.requests?.failed / (metrics.requests?.total || 1);
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error',
        severity: 'critical',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: new Date().toISOString(),
        metric: 'errorRate',
        value: errorRate,
        threshold: this.thresholds.errorRate
      });
    }

    // Memory usage alert
    if (metrics.memory?.usage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'resource',
        severity: 'warning',
        message: `High memory usage: ${(metrics.memory.usage * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        metric: 'memoryUsage',
        value: metrics.memory.usage,
        threshold: this.thresholds.memoryUsage
      });
    }

    // CPU usage alert
    if (metrics.cpu?.usage > this.thresholds.cpuUsage) {
      alerts.push({
        type: 'resource',
        severity: 'warning',
        message: `High CPU usage: ${(metrics.cpu.usage * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        metric: 'cpuUsage',
        value: metrics.cpu.usage,
        threshold: this.thresholds.cpuUsage
      });
    }

    // Active connections alert
    if (metrics.activeConnections > this.thresholds.activeConnections) {
      alerts.push({
        type: 'capacity',
        severity: 'warning',
        message: `High connection count: ${metrics.activeConnections}`,
        timestamp: new Date().toISOString(),
        metric: 'activeConnections',
        value: metrics.activeConnections,
        threshold: this.thresholds.activeConnections
      });
    }

    // Process alerts
    alerts.forEach(alert => this.processAlert(alert));

    return alerts;
  }

  /**
   * Process a new alert
   */
  processAlert(alert) {
    // Add to history
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory.pop();
    }

    // Emit alert event
    this.emit('alert', alert);

    // Log alert
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);

    // Store in alerts array
    this.alerts.unshift(alert);
    if (this.alerts.length > 50) {
      this.alerts.pop();
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10) {
    return this.alerts.slice(0, limit);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Clear resolved alerts
   */
  clearAlerts() {
    this.alerts = [];
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds() {
    return { ...this.thresholds };
  }

  /**
   * Check if system is healthy
   */
  isHealthy() {
    return this.alerts.filter(alert => alert.severity === 'critical').length === 0;
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const criticalAlerts = this.alerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = this.alerts.filter(alert => alert.severity === 'warning');

    if (criticalAlerts.length > 0) {
      return { status: 'critical', message: `${criticalAlerts.length} critical issues` };
    } else if (warningAlerts.length > 0) {
      return { status: 'warning', message: `${warningAlerts.length} warnings` };
    } else {
      return { status: 'healthy', message: 'All systems operational' };
    }
  }
}

export default new AlertService();
