# Authentic Reader Backend

Backend API server for the Authentic Reader application.

## Features

- Article analysis and bias detection
- RSS feed processing
- User authentication
- Content credibility assessment
- Logical fallacy detection
- Network analysis

## Deployment

This repository is configured for Railway deployment.

### Environment Variables

- `NODE_ENV=production`
- `PORT=3000` (Railway will set this automatically)

### Health Check

The application provides a health check endpoint at `/health`.

## API Endpoints

- `GET /health` - Health check
- `GET /api/sources/public` - Public sources
- `GET /api/balanced-feed` - Balanced news feed
- `POST /api/analyze-article` - Article analysis
