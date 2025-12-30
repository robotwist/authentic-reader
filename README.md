# The Authentic Reader 📰

> *An autonomous AI pipeline that analyzes news for bias, logical fallacies, and emotional manipulation.*

[![Backend](https://img.shields.io/badge/Backend-Heroku-430098?style=flat&logo=heroku)](https://heroku.com)
[![Frontend](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=flat&logo=netlify)](https://netlify.com)
[![AI](https://img.shields.io/badge/AI-Llama--3--70b-FF6B35?style=flat&logo=meta)](https://groq.com)

---

## 🚀 The Architecture

| Layer | Technology | Deployment |
|-------|------------|------------|
| **Backend** | Node.js / Express | Heroku |
| **Frontend** | React / Vite | Netlify |
| **Database** | PostgreSQL | Heroku Postgres |
| **AI Engine** | Llama-3-70b via Groq API | Primary |
| **Resilience** | Custom Heuristic Fallback Engine | Safety Net |

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Netlify CDN   │────▶│  Heroku Backend │────▶│  Groq API       │
│   (React SPA)   │     │  (Express API)  │     │  (Llama-3-70b)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │                       │
                                 ▼                       │ fallback
                        ┌─────────────────┐              ▼
                        │ Heroku Postgres │     ┌─────────────────┐
                        │ (Article Store) │     │ Heuristic Engine│
                        └─────────────────┘     └─────────────────┘
```

---

## ⚡ Key Features

### 1. Autonomous "Daily Briefing" Agent

- Runs automatically at **6:00 AM UTC** via `node-cron` scheduler
- Scrapes high-reliability RSS feeds (BBC, CNBC, Al Jazeera, Reuters, NPR)
- Deduplicates articles using URL hashing to prevent database bloat
- Processes up to 50 articles per run with intelligent rate limiting

### 2. Fault-Tolerant AI Pipeline ("Graceful Degradation")

| Layer | Service | Purpose |
|-------|---------|---------|
| **Primary** | Llama-3-70b (Groq) | Deep analysis: Bias Rating, Tone Check, Neutral Rewrite |
| **Safety** | Heuristic Engine | Regex-based fallback for API outages |

**How it works:**
1. Article text is sent to **Llama-3-70b** for comprehensive analysis
2. If the AI fails (Rate Limit 429, Timeout, or Error), the system **automatically falls back** to the Heuristic Engine
3. **Result:** 100% data availability. Users never see empty screens, even during API outages.

### 3. The "Neutral Rewrite" Engine

- Detects emotionally charged language (e.g., "slam," "blast," "destroy")
- Generates a **Neutral Alternative** summary to strip away the spin
- Highlights specific phrases that triggered bias detection

### 4. Multi-Dimensional Analysis

| Metric | Description |
|--------|-------------|
| **Bias Score** | 0-100 rating of political/ideological lean |
| **Logic Score** | Detection of logical fallacies and reasoning errors |
| **Tone Analysis** | Emotional vs. neutral language assessment |
| **Source Credibility** | Historical reliability of the publication |

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Groq API Key ([Get one free](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/authentic-reader.git
cd authentic-reader
```

### 2. Install Dependencies

```bash
# Backend
cd authentic-reader-backend
npm install

# Frontend
cd ../
npm install
```

### 3. Environment Variables

Create `.env` in `authentic-reader-backend/`:

```bash
# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/authentic_reader

# AI Service
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Scheduler
RUN_BRIEFING_ON_STARTUP=false  # Set to true for dev testing
```

### 4. Database Setup

```bash
cd authentic-reader-backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 5. Run Locally

```bash
# Terminal 1: Backend
cd authentic-reader-backend
npm start

# Terminal 2: Frontend
cd authentic-reader
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8080

---

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/sources/public` | List all news sources |
| `GET` | `/api/articles` | Get analyzed articles |
| `GET` | `/api/balanced-feed` | Curated balanced news feed |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze-article` | Analyze a single article |
| `POST` | `/api/analyze-url` | Analyze article from URL |
| `GET` | `/api/analysis/:id` | Get analysis by ID |

### Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login |
| `POST` | `/api/sources` | Add new RSS source |
| `DELETE` | `/api/sources/:id` | Remove source |
| `POST` | `/api/briefing/trigger` | Manually trigger briefing |

---

## 🚢 Deployment

### Backend (Heroku)

```bash
cd authentic-reader-backend
git push heroku main
```

**Required Config Vars:**
```bash
heroku config:set GROQ_API_KEY=gsk_...
heroku config:set NODE_ENV=production
heroku config:set RUN_BRIEFING_ON_STARTUP=true
```

### Frontend (Netlify)

The frontend auto-deploys from the `main` branch.

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`

---

## 📊 Monitoring

### Check Article Status

```bash
heroku pg:psql -c "SELECT analysis_payload->>'service' as service, COUNT(*) FROM articles GROUP BY 1;"
```

### View Logs

```bash
heroku logs --tail --app authentic-reader-backend
```

### Manual Briefing Trigger

```bash
heroku restart --app authentic-reader-backend
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Groq Rate Limit (429)** | Wait for token reset (rolling 24h) or reduce `GROQ_MODEL` to `llama-3.1-8b-instant` |
| **No articles saving** | Check database column names match model (`snake_case`) |
| **Heuristic fallback only** | Verify `GROQ_API_KEY` is set in Heroku config |
| **Logs not visible** | Logger outputs to console in all environments |

---

## 📁 Project Structure

```
authentic-reader/
├── authentic-reader-backend/    # Express API Server
│   ├── controllers/             # Route handlers
│   ├── models/                  # Sequelize models
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   │   └── productionAIService.js  # Groq + Heuristic engine
│   ├── scripts/
│   │   └── dailyBriefing.js     # Autonomous agent
│   └── index.js                 # Server entry point
├── src/                         # React Frontend
│   ├── components/              # UI components
│   ├── pages/                   # Page components
│   └── services/                # API client
└── README.md                    # You are here
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for blazing-fast LLM inference
- [Heroku](https://heroku.com) for reliable backend hosting
- [Netlify](https://netlify.com) for seamless frontend deployment

---

<p align="center">
  <strong>Built with ❤️ for media literacy</strong>
</p>
