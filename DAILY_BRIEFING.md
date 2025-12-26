# Daily Briefing Generator

## Overview

The Daily Briefing system automatically fetches, analyzes, and publishes 1 trending article for each of 5 critical topics every 24 hours. Each article is analyzed by our PhD-level LLM expert system to identify manipulation, logical fallacies, and unsupported claims.

## Topics

1. **War in Ukraine** 🇺🇦
2. **War in Gaza/Palestine** 🇵🇸
3. **Jeffrey Epstein** 📋
4. **Emerging Infectious Diseases** 🦠
5. **Donald Trump** 🇺🇸

## How It Works

1. **Fetch**: Scans RSS feeds from diverse, established sources (BBC, Reuters, AP, Al Jazeera, NPR, etc.)
2. **Filter**: Selects the best article for each topic (prioritizes length > 500 words, diverse sources)
3. **Analyze**: Sends articles to our enhanced AI analysis service with the expert system prompt
4. **Publish**: Saves results to `data/daily_briefing.json` for instant frontend loading

## Running the Daily Briefing

### Manual Execution

```bash
cd authentic-reader-backend
npm run daily-briefing
```

### Automated (Cron Job)

The system uses `node-cron` (already installed). To set up automated daily execution:

1. **Option A: Add to existing cron setup**
   - The script can be called from a cron job or scheduler

2. **Option B: Use Heroku Scheduler**
   - Add a scheduled job in Heroku to run: `npm run daily-briefing`
   - Set to run daily at your preferred time (e.g., 6:00 AM UTC)

### Environment Variables Required

Make sure these are set in your environment:

- `OLLAMA_SERVICE_URL` or `LLAMA_SERVICE_URL` - URL to your LLM service
- `OLLAMA_HOST` - Ollama API host (if using direct Ollama)
- `OLLAMA_API_KEY` - API key for Ollama (if required)

## Output Format

The system generates `data/daily_briefing.json` with this structure:

```json
{
  "generatedAt": "2025-12-26T20:00:00.000Z",
  "version": "1.0.0",
  "topics": {
    "ukraine": {
      "topic": "War in Ukraine",
      "icon": "🇺🇦",
      "article": {
        "title": "Article Title",
        "url": "https://...",
        "source": "BBC News",
        "publishDate": "2025-12-26T...",
        "content": "Full article content..."
      },
      "analysis": {
        "keySentences": [...],
        "manipulationAnalysis": {
          "logicalFallacies": [...]
        },
        "overallAssessment": {
          "reliabilityScore": 75
        }
      }
    },
    // ... other topics
  }
}
```

## Frontend Access

The daily briefing is accessible at:
- **Route**: `/daily-briefing`
- **API Endpoint**: `/api/daily-briefing`

The frontend automatically loads the briefing and provides:
- Topic selector with icons
- Article display with ReaderView
- Fallacy highlighting and analysis
- Reliability scores
- Links to original articles

## Article Selection Logic

For each topic, the system:
1. Filters articles matching topic keywords
2. Scores articles based on:
   - **Length**: Articles > 500 words get highest priority
   - **Recency**: More recent articles preferred
   - **Source Diversity**: Ensures mix of sources across topics
3. Selects the highest-scoring article

## Analysis Features

Each article is analyzed using our expert system prompt that identifies:
- **Logical Fallacies**: Ad Hominem, Straw Man, Motte and Bailey, etc.
- **Manipulation Techniques**: Emotional appeals, loaded language, framing devices
- **Bias Indicators**: Political bias, cognitive biases
- **Missing Context**: What information is omitted
- **Reliability Score**: 0-100 assessment of article credibility

## Troubleshooting

### No articles found for a topic
- Check that RSS feeds are accessible
- Verify topic keywords match current news
- Ensure sources are returning articles

### Analysis fails
- Check LLM service connectivity
- Verify environment variables are set
- Check logs for specific error messages

### Frontend shows "not yet generated"
- Run the daily briefing script manually
- Check that `data/daily_briefing.json` exists
- Verify file permissions

## Dependencies

Already installed:
- `@mozilla/readability` - Content extraction
- `jsdom` - HTML parsing
- `axios` - HTTP requests
- `node-cron` - Scheduling (optional)

No additional packages needed!

