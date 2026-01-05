# The Authentic Reader 📰

> *An autonomous AI pipeline that analyzes news for bias, logical fallacies, and emotional manipulation.*

[![Backend](https://img.shields.io/badge/Backend-Heroku-430098?style=flat&logo=heroku)](https://heroku.com)
[![Frontend](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=flat&logo=netlify)](https://netlify.com)
[![AI](https://img.shields.io/badge/AI-Llama--3.3--70b-FF6B35?style=flat&logo=meta)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)](https://reactjs.org/)

---

## 🚀 The Architecture

| Layer | Technology | Deployment |
|-------|------------|------------|
| **Backend** | Node.js / Express / TypeScript | Heroku |
| **Frontend** | React / TypeScript / Vite | Netlify |
| **Database** | PostgreSQL + JSON File Storage | Heroku Postgres + Local `/data` |
| **AI Engine** | Llama-3.3-70b via Groq API | Primary |
| **Resilience** | Custom Heuristic Fallback Engine | Safety Net |
| **Vector DB** | ChromaDB (Optional) | Local/Docker |

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Netlify CDN   │────▶│  Heroku Backend │────▶│  Groq API       │
│   (React SPA)   │     │  (Express API)  │     │  (Llama-3.3-70b)│
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │                       │
                                 ▼                       │ fallback
                        ┌─────────────────┐              ▼
                        │ Heroku Postgres │     ┌─────────────────┐
                        │ (Article Store) │     │ Heuristic Engine│
                        └─────────────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  JSON Storage   │
                        │  (/data/*.json) │
                        └─────────────────┘
```

---

## ⚡ Key Features

### 1. Autonomous "Daily Briefing" Agent

- Runs automatically at **6:00 AM UTC** via `node-cron` scheduler
- Scrapes high-reliability RSS feeds (BBC, CNBC, Al Jazeera, Reuters, NPR, and more)
- Deduplicates articles using URL hashing to prevent database bloat
- Processes up to 50 articles per run with intelligent rate limiting
- Stores articles in PostgreSQL with rich analysis payloads

### 2. Fault-Tolerant AI Pipeline ("Graceful Degradation")

| Layer | Service | Purpose |
|-------|---------|---------|
| **Primary** | Llama-3.3-70b (Groq) | Deep analysis: Bias Rating, Tone Check, Neutral Rewrite, Logical Fallacies |
| **Safety** | Heuristic Engine | Regex-based fallback for API outages |

**How it works:**
1. Article text is sent to **Llama-3.3-70b** for comprehensive analysis
2. If the AI fails (Rate Limit 429, Timeout, or Error), the system **automatically falls back** to the Heuristic Engine
3. **Result:** 100% data availability. Users never see empty screens, even during API outages.

### 3. Comprehensive Analysis Features

#### Bias Detection & Tagging
- Multi-dimensional bias scoring (0-100)
- Political lean detection (left, center-left, center, center-right, right)
- Interactive bias tagging with visual highlights
- Bias type categorization (loaded language, name-calling, exaggeration, etc.)

#### Dark Pattern Detection
- Identifies manipulative design patterns in news content
- Detects emotional manipulation techniques
- Highlights fear mongering, outrage bait, and clickbait patterns

#### Fact-Checking Assistant
- AI-powered claim verification
- Evidence analysis (supporting, contradicting, neutral)
- Source reliability assessment
- Confidence scoring for each claim
- Recent fact-check history

#### Source Comparison View
- Side-by-side comparison of articles from different sources
- AI-synthesized neutral "facts" column
- Visual diff highlighting spin differences
- Contrasting source recommendations

#### Sentiment Analysis Dashboard
- Emotional content analysis (joy, sadness, anger, fear, surprise, disgust)
- Tone detection (formal, informal, aggressive, passive, objective, subjective)
- Keyword extraction (positive, negative, emotional)
- Sentiment trends over time

#### Source Credibility Assessment
- Multi-dimensional credibility scoring (accuracy, transparency, objectivity, fact-checking, corrections, bias)
- Historical performance tracking
- Fact-check record analysis
- Correction rate monitoring
- Personalized recommendations

#### Comparative Analysis
- Compare multiple articles on the same subject
- Bias variation detection
- Conflicting claims identification
- Cross-source recommendations

#### Network Analysis
- Article relationship mapping
- Citation network visualization
- Shared topic detection
- Bias similarity clustering

### 4. Advanced AI Features

#### AI Agent Orchestrator
- Multi-agent system with 6 specialized agents:
  - Bias Detection Agent
  - Logical Fallacy Agent
  - Rhetorical Analysis Agent
  - Fact-Checking Agent
  - Sentiment Analysis Agent
  - Source Credibility Agent

#### Autonomous Learning Agent
- Self-improving AI models
- Continuous learning from user feedback
- Performance optimization
- Model versioning and tracking

#### Collaborative AI Network
- Multi-agent collaboration
- Consensus building
- Cross-validation of analysis results

### 5. Analytics & Insights

#### Analytics Dashboard
- Comprehensive metrics and statistics
- Real-time data visualization
- AI-powered insights
- Reading session tracking
- Bias exposure analysis
- Source diversity metrics

#### Feedback System
- User feedback collection on AI analysis
- Feedback dashboard for administrators
- ChromaDB integration for vector storage (optional)
- localStorage fallback

### 6. The "Neutral Rewrite" Engine

- Detects emotionally charged language (e.g., "slam," "blast," "destroy")
- Generates a **Neutral Alternative** summary to strip away the spin
- Highlights specific phrases that triggered bias detection

### 7. Progressive Web App (PWA)

- Offline support with service workers
- Installable on mobile and desktop
- Cached API responses for offline reading
- Auto-update capabilities

### 8. ONNX Model Support

- Local ONNX model inference
- Model conversion tools
- ONNX model status monitoring
- Fallback to cloud AI services

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js v20+
- PostgreSQL 14+
- Groq API Key ([Get one free](https://console.groq.com))
- (Optional) ChromaDB for vector storage

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

# Optional: ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
ENABLE_CHROMA=false  # Set to true if using ChromaDB
```

### 4. Database Setup

```bash
cd authentic-reader-backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 5. Initialize Data Directory

The application uses JSON file storage for sources and analysis data:

```bash
# Ensure /data directory exists
mkdir -p data

# Initial data files will be created automatically on first run
```

### 6. Run Locally

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
| `GET` | `/api/daily-briefing` | Get daily briefing articles |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze-article` | Analyze a single article |
| `POST` | `/api/analyze-url` | Analyze article from URL |
| `GET` | `/api/analysis/:id` | Get analysis by ID |
| `POST` | `/api/ai-analysis/comprehensive` | Comprehensive AI analysis |
| `POST` | `/api/fact-check` | Fact-check claims |
| `GET` | `/api/source-credibility/:sourceId` | Get source credibility assessment |
| `GET` | `/api/network-analysis` | Get article network relationships |
| `GET` | `/api/trends` | Get trending topics and analysis |

### Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login |
| `POST` | `/api/sources` | Add new RSS source |
| `DELETE` | `/api/sources/:id` | Remove source |
| `POST` | `/api/briefing/trigger` | Manually trigger briefing |
| `GET` | `/api/admin/monitor` | System monitoring dashboard |
| `GET` | `/api/admin/onnx/status` | ONNX model status |

### Feedback Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/feedback` | Submit feedback on analysis |
| `GET` | `/api/feedback/dashboard` | Get feedback statistics |

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
heroku config:set DATABASE_URL=postgres://...
```

### Frontend (Netlify)

The frontend auto-deploys from the `main` branch.

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20.x`

**Environment Variables:**
```bash
VITE_API_URL=https://your-backend.herokuapp.com
VITE_ENABLE_CHROMA=false  # Set to true if using ChromaDB
```

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
heroku run npm run daily-briefing --app authentic-reader-backend
```

### System Monitoring

Access the monitoring dashboard at `/api/admin/monitor` (admin auth required)

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Groq Rate Limit (429)** | Wait for token reset (rolling 24h) or reduce `GROQ_MODEL` to `llama-3.1-8b-instant` |
| **No articles saving** | Check database column names match model (`snake_case`) |
| **Heuristic fallback only** | Verify `GROQ_API_KEY` is set in Heroku config |
| **Logs not visible** | Logger outputs to console in all environments |
| **ChromaDB connection failed** | System automatically falls back to localStorage |
| **Frontend not connecting** | Verify `VITE_API_URL` is set correctly in Netlify |
| **Port conflicts** | Frontend uses 5173, backend uses 8080 by default |

---

## 📁 Project Structure

```
authentic-reader/
├── authentic-reader-backend/    # Express API Server
│   ├── controllers/             # Route handlers
│   ├── models/                  # Sequelize models
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   │   ├── productionAIService.js      # Groq + Heuristic engine
│   │   ├── industryLeadingAnalysisService.js  # Comprehensive analysis
│   │   ├── jsonStorageService.js       # JSON file operations
│   │   └── ...
│   ├── scripts/
│   │   └── dailyReliableFetch.js  # Autonomous agent
│   ├── data/                    # JSON data storage
│   │   ├── sources.json
│   │   ├── articles.json
│   │   └── analysis.json
│   └── index.js                 # Server entry point
├── src/                         # React Frontend
│   ├── components/              # UI components
│   │   ├── BiasTagger.tsx
│   │   ├── DarkPatternDetection.tsx
│   │   ├── FactCheckingAssistant.tsx
│   │   ├── SourceComparisonView.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── SentimentAnalysisDashboard.tsx
│   │   ├── SourceCredibilityAssessment.tsx
│   │   ├── ComparativeAnalysis.tsx
│   │   ├── AutonomousLearningAgent.tsx
│   │   └── ...
│   ├── pages/                   # Page components
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # API client
│   └── styles/                  # CSS modules
├── data/                        # JSON data files
│   ├── sources.json
│   ├── articles.json
│   └── analysis.json
└── README.md                    # You are here
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd authentic-reader-backend
npm test

# Frontend tests
cd authentic-reader
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow ESLint rules for consistent style
- Write tests for new features
- Update documentation as needed
- Follow the existing code structure

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for blazing-fast LLM inference
- [Heroku](https://heroku.com) for reliable backend hosting
- [Netlify](https://netlify.com) for seamless frontend deployment
- [Meta](https://meta.ai) for Llama models
- [ChromaDB](https://www.trychroma.com/) for vector database capabilities

---

## 📚 Additional Documentation

- [Architecture Documentation](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [SWOT Analysis](SWOT_ANALYSIS.md)
- [UX Assessment](UX_ASSESSMENT.md)
- [AI Feedback Loop System](README-FEEDBACK-LOOP.md)

---

<p align="center">
  <strong>Built with ❤️ for media literacy</strong>
</p>
