# Article Stockpile System

## Overview

The Article Stockpile System is a comprehensive solution that transforms how we handle news articles. Instead of fetching and analyzing articles on-demand, we now:

1. **Pre-fetch articles** from RSS feeds every 15 minutes
2. **Pre-analyze all articles** with comprehensive AI analysis
3. **Store everything in the database** for instant retrieval
4. **Track user interactions** to improve analysis over time
5. **Generate rich analytics** and visualizations

## Key Benefits

### 🚀 **Performance**
- **Instant article loading** - No more waiting for RSS fetching
- **Pre-analyzed content** - Analysis is ready immediately
- **Database caching** - Fast queries and filtering

### 📊 **Analytics**
- **Real-time charts** - Source distribution, bias analysis, sentiment trends
- **User engagement tracking** - How users interact with articles
- **Credibility metrics** - Clickbait and outrage bait detection
- **Topic analysis** - Trending keywords and entities

### 🧠 **AI Learning**
- **User feedback integration** - Analysis improves based on user interactions
- **Continuous refinement** - System learns from user behavior
- **Adaptive analysis** - Better accuracy over time

## System Architecture

### 1. **Article Stockpile Service**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RSS Feeds     │───▶│  Stockpile      │───▶│   Database      │
│   (Every 15min) │    │   Service       │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Analysis       │
                       │   Queue         │
                       └─────────────────┘
```

### 2. **Analytics Service**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │───▶│  Analytics      │───▶│   Charts &      │
│   Articles      │    │   Service       │    │   Graphs        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Stockpile Endpoints

#### `GET /api/stockpile/articles`
Get articles from the stockpile with pre-analysis.

**Query Parameters:**
- `limit` (number): Number of articles to return (default: 50)
- `categories` (string): Comma-separated list of categories
- `sources` (string): Comma-separated list of source IDs
- `offset` (number): Pagination offset (default: 0)
- `includeAnalysis` (boolean): Include analysis data (default: true)

**Response:**
```json
{
  "articles": [
    {
      "id": 123,
      "title": "Article Title",
      "link": "https://example.com/article",
      "author": "Author Name",
      "publishDate": "2025-08-23T12:00:00Z",
      "content": "Article content...",
      "summary": "Article summary...",
      "source": "Source Name",
      "sourceCategory": "center",
      "biasRating": "center",
      "reliability": "high",
      "categories": ["politics", "technology"],
      "analysis": {
        "biasScore": 0.2,
        "biasDirection": "center",
        "sentiment": 0.1,
        "entities": ["entity1", "entity2"],
        "topKeywords": ["keyword1", "keyword2"],
        "readingLevel": "medium",
        "clickbaitScore": 0.1,
        "outrageBaitScore": 0.05,
        "summary": "AI-generated summary"
      }
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0,
  "timestamp": "2025-08-23T12:00:00Z"
}
```

#### `GET /api/stockpile/status`
Get the current status of the stockpile service.

**Response:**
```json
{
  "isRunning": true,
  "isAnalyzing": false,
  "lastFetchTime": "2025-08-23T11:45:00Z",
  "queueSize": 0,
  "fetchInterval": 900000
}
```

#### `POST /api/stockpile/fetch` (Admin Only)
Manually trigger RSS fetching and stockpiling.

#### `POST /api/stockpile/interaction` (Authenticated)
Track user interaction for analysis improvement.

**Request Body:**
```json
{
  "articleId": 123,
  "interactionType": "read|save|share|feedback",
  "feedback": {
    "analysisFeedback": "The bias analysis was incorrect",
    "rating": 3
  }
}
```

### Analytics Endpoints

#### `GET /api/analytics/dashboard`
Get comprehensive analytics dashboard data.

**Response:**
```json
{
  "overview": {
    "totalArticles": 15000,
    "totalAnalyses": 15000,
    "recentArticles": 150,
    "avgReadingTime": 5,
    "analysisCoverage": 100
  },
  "sourceDistribution": {
    "type": "pie",
    "data": [
      {
        "name": "BBC News",
        "value": 2500,
        "category": "center",
        "biasRating": "center",
        "reliability": "high"
      }
    ],
    "total": 15000
  },
  "biasAnalysis": {
    "distribution": [
      {
        "direction": "center",
        "count": 5000,
        "avgScore": 0.1
      }
    ],
    "spectrum": {
      "avgBiasScore": 0.15,
      "biasStdDev": 0.3
    }
  },
  "sentimentTrends": {
    "type": "line",
    "data": [
      {
        "date": "2025-08-23",
        "avgSentiment": 0.1,
        "articleCount": 150
      }
    ]
  },
  "topTopics": {
    "topKeywords": [
      {
        "keyword": "politics",
        "frequency": 500
      }
    ],
    "keywordCloud": [
      {
        "text": "politics",
        "value": 500
      }
    ]
  },
  "credibilityMetrics": {
    "overall": {
      "avgClickbaitScore": 0.2,
      "avgOutrageBaitScore": 0.1,
      "totalArticles": 15000
    },
    "clickbaitDistribution": [
      {
        "level": "Low",
        "count": 12000
      }
    ]
  }
}
```

#### `GET /api/analytics/sources`
Get source distribution and credibility analytics.

#### `GET /api/analytics/bias`
Get bias analysis charts and metrics.

#### `GET /api/analytics/sentiment`
Get sentiment trends over time.

#### `GET /api/analytics/topics`
Get top topics, keywords, and entity analysis.

#### `GET /api/analytics/credibility`
Get credibility metrics and clickbait analysis.

#### `GET /api/analytics/engagement` (Admin Only)
Get user engagement analytics.

## Database Schema

### Articles Table
```sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  link VARCHAR(1000) NOT NULL,
  author VARCHAR(200),
  publish_date TIMESTAMP,
  content TEXT,
  summary TEXT,
  image_url VARCHAR(1000),
  categories TEXT[],
  guid VARCHAR(500) UNIQUE,
  source_id INTEGER REFERENCES sources(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Analyses Table
```sql
CREATE TABLE analyses (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id),
  user_id INTEGER REFERENCES users(id),
  bias_score FLOAT,
  bias_direction VARCHAR(50),
  sentiment FLOAT,
  entities JSONB,
  top_keywords TEXT[],
  reading_level VARCHAR(50),
  clickbait_score FLOAT,
  outrage_bait_score FLOAT,
  summary_text TEXT,
  user_feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Articles Table
```sql
CREATE TABLE user_articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  article_id INTEGER REFERENCES articles(id),
  interaction_type VARCHAR(50),
  feedback JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Environment Variables
```bash
# Stockpile Configuration
STOCKPILE_FETCH_INTERVAL=900000  # 15 minutes in milliseconds
STOCKPILE_MAX_ARTICLES_PER_SOURCE=50
STOCKPILE_ANALYSIS_DELAY=1000    # Delay between analyses in milliseconds

# Analytics Configuration
ANALYTICS_CACHE_TIMEOUT=300000   # 5 minutes in milliseconds
ANALYTICS_MAX_CACHE_SIZE=1000
```

### Service Configuration
```javascript
// Article Stockpile Service
const stockpileConfig = {
  fetchInterval: 15 * 60 * 1000, // 15 minutes
  maxArticlesPerSource: 50,
  analysisDelay: 1000, // 1 second between analyses
  enableFullContentFetch: true,
  enableUserFeedback: true
};

// Analytics Service
const analyticsConfig = {
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 1000,
  enableRealTimeUpdates: true
};
```

## Monitoring and Maintenance

### Health Checks
- **Stockpile Service**: Check if RSS fetching is running
- **Analysis Queue**: Monitor queue size and processing speed
- **Database**: Monitor storage usage and query performance
- **Analytics**: Check cache hit rates and generation times

### Performance Metrics
- **Articles per hour**: How many new articles are being added
- **Analysis coverage**: Percentage of articles with analysis
- **User engagement**: Interaction rates and feedback quality
- **System response time**: API response times for stockpile queries

### Maintenance Tasks
- **Clean old articles**: Remove articles older than 30 days
- **Optimize database**: Regular index maintenance and query optimization
- **Update analysis models**: Retrain models based on user feedback
- **Backup analytics**: Regular backup of analytics data

## Frontend Integration

### Using the Stockpile API
```javascript
// Fetch articles with analysis
const response = await fetch('/api/stockpile/articles?limit=20&categories=politics,technology');
const data = await response.json();

// Display articles with pre-analyzed data
data.articles.forEach(article => {
  console.log(`Title: ${article.title}`);
  console.log(`Bias: ${article.analysis.biasDirection} (${article.analysis.biasScore})`);
  console.log(`Sentiment: ${article.analysis.sentiment}`);
  console.log(`Clickbait Score: ${article.analysis.clickbaitScore}`);
});
```

### Analytics Dashboard
```javascript
// Get comprehensive analytics
const analytics = await fetch('/api/analytics/dashboard');
const data = await analytics.json();

// Create charts
const biasChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: data.biasAnalysis.distribution.map(d => d.direction),
    datasets: [{
      data: data.biasAnalysis.distribution.map(d => d.count)
    }]
  }
});
```

## Future Enhancements

### Planned Features
1. **Machine Learning Integration**: Use user feedback to improve analysis models
2. **Real-time Analytics**: WebSocket updates for live dashboard
3. **Advanced Filtering**: More sophisticated article filtering options
4. **Personalization**: User-specific article recommendations
5. **Export Features**: Export analytics data and reports

### Scalability Improvements
1. **Distributed Processing**: Multiple analysis workers
2. **Database Sharding**: Split data across multiple databases
3. **CDN Integration**: Cache static analytics data
4. **Microservices**: Split into separate services for better scaling

## Troubleshooting

### Common Issues

#### Stockpile Service Not Running
```bash
# Check service status
curl https://your-api.com/api/stockpile/status

# Check logs for errors
docker logs your-container-name
```

#### Analysis Queue Backlog
```bash
# Check queue size
curl https://your-api.com/api/stockpile/status

# Manually trigger fetch (admin only)
curl -X POST https://your-api.com/api/stockpile/fetch \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Analytics Not Updating
```bash
# Clear analytics cache
curl -X POST https://your-api.com/api/analytics/clear-cache

# Check analytics status
curl https://your-api.com/api/analytics/status
```

### Performance Optimization
1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Query Optimization**: Use database query analysis tools
3. **Caching Strategy**: Implement appropriate caching layers
4. **Load Balancing**: Distribute load across multiple instances

## Conclusion

The Article Stockpile System provides a robust, scalable solution for news aggregation and analysis. By pre-fetching and pre-analyzing articles, we deliver a much better user experience while building a rich dataset for analytics and machine learning improvements.

The system is designed to be:
- **Fast**: Instant article loading with pre-analysis
- **Scalable**: Can handle thousands of articles and users
- **Intelligent**: Learns from user interactions
- **Analytics-rich**: Comprehensive insights and visualizations
- **Maintainable**: Clear architecture and monitoring

This foundation enables us to build advanced features like personalized recommendations, trend analysis, and automated fact-checking in the future.
