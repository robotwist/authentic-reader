import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { authLimiter, apiLimiter, publicLimiter } from '../rateLimit.js'

// Create a simple test app
const createTestApp = (limiter) => {
  const app = express()
  app.use(limiter)
  app.get('/test', (req, res) => {
    res.json({ message: 'success' })
  })
  return app
}

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authLimiter', () => {
    it('allows requests within limit', async () => {
      const app = createTestApp(authLimiter)
      
      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/test')
        expect(response.status).toBe(200)
      }
    })

    it('blocks requests over limit', async () => {
      const app = createTestApp(authLimiter)
      
      // Make 6 requests (over limit)
      for (let i = 0; i < 5; i++) {
        await request(app).get('/test')
      }
      
      const response = await request(app).get('/test')
      expect(response.status).toBe(429)
      expect(response.body.error).toBe('Too many authentication attempts')
    })
  })

  describe('apiLimiter', () => {
    it('allows requests within limit', async () => {
      const app = createTestApp(apiLimiter)
      
      // Make 100 requests (within limit)
      for (let i = 0; i < 100; i++) {
        const response = await request(app).get('/test')
        expect(response.status).toBe(200)
      }
    })

    it('blocks requests over limit', async () => {
      const app = createTestApp(apiLimiter)
      
      // Make 101 requests (over limit)
      for (let i = 0; i < 100; i++) {
        await request(app).get('/test')
      }
      
      const response = await request(app).get('/test')
      expect(response.status).toBe(429)
      expect(response.body.error).toBe('Too many API requests')
    })
  })

  describe('publicLimiter', () => {
    it('allows requests within limit', async () => {
      const app = createTestApp(publicLimiter)
      
      // Make 300 requests (within limit)
      for (let i = 0; i < 300; i++) {
        const response = await request(app).get('/test')
        expect(response.status).toBe(200)
      }
    })

    it('blocks requests over limit', async () => {
      const app = createTestApp(publicLimiter)
      
      // Make 301 requests (over limit)
      for (let i = 0; i < 300; i++) {
        await request(app).get('/test')
      }
      
      const response = await request(app).get('/test')
      expect(response.status).toBe(429)
      expect(response.body.error).toBe('Too many requests')
    })
  })

  describe('Rate limit headers', () => {
    it('includes rate limit headers', async () => {
      const app = createTestApp(authLimiter)
      
      const response = await request(app).get('/test')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
    })
  })
})
