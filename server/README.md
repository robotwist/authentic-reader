# Authentic Reader Backend

This is a simple backend server for the Authentic Reader application. It provides a proxy API for fetching RSS feeds without CORS issues.

## Features

- RSS feed proxy endpoint
- CORS support
- Error handling
- XML to JSON conversion

## Installation

1. Make sure you have Node.js and npm installed
2. Install dependencies:

```bash
cd server
npm install
```

## Usage

### Development

Start the server in development mode:

```bash
npm run dev
```

This will start the server on port 3000 with auto-reloading using nodemon.

### Production

Start the server in production mode:

```bash
npm start
```

### Environment Variables

- `PORT`: Port number (default: 3000)

## API Endpoints

### RSS Feed Proxy

`GET /api/rss?url=<RSS_FEED_URL>`

Fetches an RSS feed and returns it as JSON.

**Parameters:**
- `url` (required): URL of the RSS feed to fetch

**Example:**
```
GET /api/rss?url=https://feeds.bbci.co.uk/news/world/rss.xml
```

**Response:**
```json
{
  "rss": {
    "channel": {
      "title": "BBC News - World",
      "description": "BBC News - World",
      "item": [
        {
          "title": "Example Article",
          "link": "https://example.com/article",
          "description": "Example article description",
          "pubDate": "Wed, 01 Jan 2023 12:00:00 GMT"
        }
        // Additional items...
      ]
    }
  }
}
```

### Health Check

`GET /health`

Returns a simple health check response.

**Response:**
```json
{
  "status": "ok"
}
```

## Deployment

You can deploy this server to platforms like:

- Heroku
- Railway
- Render
- Fly.io
- DigitalOcean App Platform

Remember to update the `API_BASE_URL` in the frontend to point to your deployed server URL.

## Future Enhancements

- Database integration
- User authentication
- Personalized feeds
- Content analysis
- Feed caching

## Admin System

This project includes a Django-like admin system for managing users and sources. For detailed documentation about the admin system, please see [ADMIN.md](./ADMIN.md). 