# Authentic Reader Backend 🔧

> Express.js API server powering the Authentic Reader news analysis platform.

[![Heroku](https://img.shields.io/badge/Deployed-Heroku-430098?style=flat&logo=heroku)](https://heroku.com)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Server                         │
├─────────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Models → PostgreSQL      │
│                              ↓                               │
│                    productionAIService                       │
│                    ┌─────────────────┐                       │
│                    │   Groq API      │ ← Primary             │
│                    │  (Llama-3-70b)  │                       │
│                    └────────┬────────┘                       │
│                             │ fallback                       │
│                    ┌────────▼────────┐                       │
│                    │ Heuristic Engine│ ← Safety Net          │
│                    └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Start server
npm start
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 8080) |
| `NODE_ENV` | No | Environment (development/production) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GROQ_API_KEY` | Yes | Groq API key for Llama-3 |
| `GROQ_MODEL` | No | Model name (default: llama-3.3-70b-versatile) |
| `RUN_BRIEFING_ON_STARTUP` | No | Run daily briefing on server start |
| `JWT_SECRET` | Yes | Secret for JWT authentication |

---

## 📁 Project Structure

```
authentic-reader-backend/
├── controllers/          # Request handlers
├── middleware/           # Auth, validation, logging
├── models/               # Sequelize models
│   ├── article.js        # Article with analysisPayload
│   ├── source.js         # RSS feed sources
│   └── user.js           # User authentication
├── routes/               # API route definitions
├── services/
│   ├── productionAIService.js  # Groq + Heuristic fallback
│   ├── rssService.js           # RSS feed fetcher
│   └── analysisService.js      # Analysis orchestration
├── scripts/
│   └── dailyBriefing.js        # Autonomous agent
├── utils/
│   └── logger.js               # Winston logger
├── index.js              # Server entry point
└── Procfile              # Heroku process definition
```

---

## 🤖 The AI Pipeline

### Primary: Groq API (Llama-3-70b)

```javascript
// services/productionAIService.js
const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: analysisPrompt }]
});
```

### Fallback: Heuristic Engine

When Groq fails (429 rate limit, timeout, error), the system automatically falls back:

```javascript
// Regex-based analysis
const biasPatterns = [
  /slam|blast|destroy|attack/gi,  // Aggressive language
  /radical|extreme|dangerous/gi,   // Loaded terms
  /sources say|reportedly/gi       // Vague attribution
];
```

---

## ⏰ Daily Briefing Scheduler

The autonomous agent runs at **6:00 AM UTC** daily:

```javascript
// index.js
cron.schedule('0 6 * * *', async () => {
  await generateDailyBriefing();
});
```

**What it does:**
1. Fetches articles from all active RSS sources
2. Deduplicates by URL hash
3. Analyzes each article (Groq → Heuristic fallback)
4. Saves to PostgreSQL with `analysisPayload`

---

## 📡 API Reference

### Health

```http
GET /health
```

### Articles

```http
GET /api/articles
GET /api/articles/:id
POST /api/analyze-article
POST /api/analyze-url
```

### Sources

```http
GET /api/sources/public
POST /api/sources          # Auth required
DELETE /api/sources/:id    # Auth required
```

### Authentication

```http
POST /api/auth/login
POST /api/auth/register
```

---

## 🚢 Deployment (Heroku)

```bash
# Deploy
git push heroku main

# Set config
heroku config:set GROQ_API_KEY=gsk_...
heroku config:set NODE_ENV=production

# View logs
heroku logs --tail

# Restart (triggers immediate briefing if RUN_BRIEFING_ON_STARTUP=true)
heroku restart
```

---

## 🔍 Monitoring Commands

```bash
# Article count by analysis service
heroku pg:psql -c "SELECT analysis_payload->>'service' as service, COUNT(*) FROM articles GROUP BY 1;"

# Recent articles
heroku pg:psql -c "SELECT title, created_at FROM articles ORDER BY created_at DESC LIMIT 5;"

# Source count
heroku pg:psql -c "SELECT COUNT(*) FROM sources;"
```

---

## 🐛 Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Groq 429` | Daily token limit (100K) | Wait 24h or use smaller model |
| `column does not exist` | Schema mismatch | Run migrations or rename columns |
| `localhost connection refused` | Old fallback code | Update to latest productionAIService |
| `No logs visible` | Winston file-only | Logger now outputs to console |

---

## 📄 License

MIT License - see [LICENSE](../LICENSE)
