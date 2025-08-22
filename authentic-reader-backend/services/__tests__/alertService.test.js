import alertService from '../alertService.js'

describe('AlertService', () => {
  beforeEach(() => {
    // Reset alerts
    alertService.clearAlerts()
  })

  describe('checkMetrics', () => {
    it('generates alerts for high response time', () => {
      const metrics = {
        responseTime: { avg: 3000 }, // Over 2000ms threshold
        requests: { total: 100, failed: 2 },
        memory: { usage: 0.5 },
        cpu: { usage: 0.3 },
        activeConnections: 500
      }

      const alerts = alertService.checkMetrics(metrics)
      
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0].type).toBe('performance')
      expect(alerts[0].severity).toBe('warning')
      expect(alerts[0].message).toContain('High response time')
    })

    it('generates alerts for high error rate', () => {
      const metrics = {
        responseTime: { avg: 1000 },
        requests: { total: 100, failed: 10 }, // 10% error rate, over 5% threshold
        memory: { usage: 0.5 },
        cpu: { usage: 0.3 },
        activeConnections: 500
      }

      const alerts = alertService.checkMetrics(metrics)
      
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0].type).toBe('error')
      expect(alerts[0].severity).toBe('critical')
      expect(alerts[0].message).toContain('High error rate')
    })

    it('generates alerts for high memory usage', () => {
      const metrics = {
        responseTime: { avg: 1000 },
        requests: { total: 100, failed: 2 },
        memory: { usage: 0.9 }, // Over 85% threshold
        cpu: { usage: 0.3 },
        activeConnections: 500
      }

      const alerts = alertService.checkMetrics(metrics)
      
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0].type).toBe('resource')
      expect(alerts[0].severity).toBe('warning')
      expect(alerts[0].message).toContain('High memory usage')
    })

    it('does not generate alerts for normal metrics', () => {
      const metrics = {
        responseTime: { avg: 1000 },
        requests: { total: 100, failed: 2 },
        memory: { usage: 0.5 },
        cpu: { usage: 0.3 },
        activeConnections: 500
      }

      const alerts = alertService.checkMetrics(metrics)
      
      expect(alerts.length).toBe(0)
    })
  })

  describe('getRecentAlerts', () => {
    it('returns recent alerts', () => {
      const metrics = {
        responseTime: { avg: 3000 },
        requests: { total: 100, failed: 2 },
        memory: { usage: 0.5 },
        cpu: { usage: 0.3 },
        activeConnections: 500
      }

      alertService.checkMetrics(metrics)
      const alerts = alertService.getRecentAlerts()
      
      expect(alerts.length).toBeGreaterThan(0)
    })

    it('respects limit parameter', () => {
      const metrics = {
        responseTime: { avg: 3000 },
        requests: { total: 100, failed: 2 },
        memory: { usage: 0.5 },
        cpu: { usage: 0.3 },
        activeConnections: 500
      }

      alertService.checkMetrics(metrics)
      const alerts = alertService.getRecentAlerts(1)
      
      expect(alerts.length).toBeLessThanOrEqual(1)
    })
  })

  describe('getHealthStatus', () => {
    it('returns healthy status when no critical alerts', () => {
      const status = alertService.getHealthStatus()
      
      expect(status.status).toBe('healthy')
      expect(status.message).toBe('All systems operational')
    })

    it('returns critical status when critical alerts exist', () => {
      const metrics = {
        responseTime: { avg: 1000 },
        requests: { total: 100, failed: 10 }, // High error rate
        memory: { usage: 0.5 },
        cpu: { usage: 0.3 },
        activeConnections: 500
      }

      alertService.checkMetrics(metrics)
      const status = alertService.getHealthStatus()
      
      expect(status.status).toBe('critical')
      expect(status.message).toContain('critical issues')
    })
  })

  describe('updateThresholds', () => {
    it('updates thresholds correctly', () => {
      const originalThresholds = alertService.getThresholds()
      const newThresholds = { responseTime: 5000 }
      
      alertService.updateThresholds(newThresholds)
      const updatedThresholds = alertService.getThresholds()
      
      expect(updatedThresholds.responseTime).toBe(5000)
      expect(updatedThresholds.errorRate).toBe(originalThresholds.errorRate) // Unchanged
    })
  })

  describe('clearAlerts', () => {
    it('clears all alerts', () => {
      // Manually add some alerts to test clearing
      const testAlert = {
        type: 'test',
        severity: 'warning',
        message: 'Test alert',
        timestamp: new Date().toISOString(),
        metric: 'test',
        value: 1,
        threshold: 0
      }
      
      // Add alert directly to the service
      alertService.processAlert(testAlert)
      
      // Verify alert was added
      const alertsBefore = alertService.getRecentAlerts()
      expect(alertsBefore.length).toBeGreaterThan(0)
      
      // Clear alerts
      alertService.clearAlerts()
      
      // Verify alerts were cleared
      const alertsAfter = alertService.getRecentAlerts()
      expect(alertsAfter.length).toBe(0)
    })
  })
})
