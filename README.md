# Logical Fallacy Analyzer

A simple web application that analyzes articles for logical fallacies to help readers identify rhetorical manipulation.

## Purpose

**Input:** User provides an RSS feed URL or article link  
**Process:** Fetches article text → Passes to LLM (PhD-level rhetoric and logic expert)  
**Output:** Identifies logical fallacies and explains how, when, where, why, and for what purpose the author used them  
**Goal:** Prevent readers from being manipulated by rhetoric

## How It Works

1. User enters an RSS feed URL or article URL
2. Application fetches the article content
3. Article text is sent to an LLM service configured as a PhD-level expert in rhetoric and logic
4. LLM analyzes the text and identifies logical fallacies
5. Results are displayed with detailed explanations of each fallacy:
   - **What** fallacy was used
   - **How** it was employed
   - **When** it appears in the text
   - **Where** it occurs
   - **Why** it was used (rhetorical purpose)
   - **For what purpose** the author included it

## Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** Node.js + Express
- **LLM Integration:** (Configure your LLM service endpoint)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Set up your LLM service endpoint in environment variables:

```bash
LLM_SERVICE_URL=http://localhost:8105  # Your LLM service endpoint
```

### Development

```bash
# Start backend
npm run dev:backend

# Start frontend (in separate terminal)
npm run dev:frontend
```

The application will be available at `http://localhost:5173`

## API Endpoints

### POST /api/analyze-article
Analyzes an article for logical fallacies.

**Request Body:**
```json
{
  "url": "https://example.com/article",
  "title": "Article Title",
  "content": "Article content text..."
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "logicalFallacies": [
      {
        "type": "strawman",
        "confidence": 0.85,
        "explanation": "Detailed explanation...",
        "location": "Paragraph 3, sentence 2",
        "excerpt": "The specific text where fallacy appears",
        "how": "How the fallacy was constructed",
        "why": "Why it was used rhetorically",
        "purpose": "The intended effect on the reader"
      }
    ],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/fetch-article?url=<article_url>
Fetches article content from a URL.

### GET /api/rss?url=<rss_feed_url>
Fetches and parses an RSS feed (returns first article or feed metadata).

## Project Structure

```
/
├── src/                  # Frontend React application
│   ├── components/       # React components
│   │   ├── ArticleInput.tsx    # URL input form
│   │   └── FallacyAnalysis.tsx # Analysis results display
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx  # Main input page
│   │   └── AnalysisPage.tsx # Results page
│   ├── services/         # API services
│   │   ├── articleService.ts   # Article fetching
│   │   └── analysisService.ts  # LLM analysis
│   └── App.tsx           # Main app component
├── server/               # Backend Express server (if separate)
│   ├── routes/           # API routes
│   └── services/         # Business logic
└── README.md             # This file
```

## Core Principle

This application does **one thing**: analyze articles for logical fallacies. All features have been removed except those directly supporting this single purpose.

## License

[Your License Here]
