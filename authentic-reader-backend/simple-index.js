import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import jsonStorage from './services/jsonStorageService.js';
import { analyzeArticle } from './services/onDemandAnalysisService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'https://authentic-reader.netlify.app',
  'http://localhost:5173'
];

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  }
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Helpers
const toArray = (value) => Array.isArray(value) ? value : (value != null ? [value] : []);
const first = (value) => Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
const asStringArray = (value) => toArray(value).map((v) => (typeof v === 'object' && v && v._) ? v._ : String(v));

function normalizeArticle(raw) {
  const id = raw.id || raw.articleId || first(raw.guid)?._ || first(raw.guid) || `article_${Date.now()}`;
  const title = first(raw.title) || '';
  const url = first(raw.link) || raw.url || '';
  const publishDate = first(raw.pubDate) || raw.publishDate || raw.publishedAt || '';
  const author = first(raw.author) || first(raw['dc:creator']) || '';
  const description = first(raw.description) || raw.summary || '';
  const categories = asStringArray(raw.category);
  const sourceName = (raw.source && (raw.source.name || raw.source)) || '';
  return { id, title, url, publishDate, author, description, categories, sourceName };
}

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('base64');
}

function sendCachedJson(req, res, body, maxAgeSeconds = 60) {
  const etag = `W/"${hashBody(body)}"`;
  const ifNoneMatch = req.headers['if-none-match'];
  res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}`);
  res.setHeader('ETag', etag);
  if (ifNoneMatch && ifNoneMatch === etag) {
    return res.status(304).end();
  }
  return res.json(body);
}

// Basic API endpoints (JSON-backed)
app.get('/api/sources', async (req, res) => {
  try {
    const sourcesObj = await jsonStorage.getSources();
    const sources = Object.entries(sourcesObj).map(([name, data]) => ({ name, ...data }));
    return sendCachedJson(req, res, { sources }, 300);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load sources' });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    const { limit, offset, sources: sourcesFilter, categories: categoriesFilter, search, includeContent, includeAnalysis } = req.query;
    const take = Math.max(1, Math.min(Number(limit) || 20, 50));
    const skip = Math.max(0, Number(offset) || 0);
    const sourcesQ = toArray(sourcesFilter).map(String.toString);
    const categoriesQ = toArray(categoriesFilter).map(String.toString);
    const searchQ = (search || '').toString().trim().toLowerCase();

    const articlesObj = await jsonStorage.getArticles();
    const normalized = Object.entries(articlesObj).map(([id, data]) => ({
      normalized: normalizeArticle({ id, ...data }),
      raw: { id, ...data }
    }));

    const filtered = normalized.filter(({ normalized: a }) => {
      const bySource = sourcesQ.length === 0 || (a.sourceName && sourcesQ.includes(a.sourceName));
      const byCategory = categoriesQ.length === 0 || a.categories.some((c) => categoriesQ.includes(c));
      const bySearch = !searchQ || (a.title.toLowerCase().includes(searchQ) || a.description.toLowerCase().includes(searchQ));
      return bySource && byCategory && bySearch;
    });

    const total = filtered.length;
    let page = filtered.slice(skip, skip + take);

    const includeContentBool = includeContent === '1' || includeContent === 'true';
    const includeAnalysisBool = includeAnalysis === '1' || includeAnalysis === 'true';
    let analysisMap = null;
    if (includeAnalysisBool) {
      analysisMap = await jsonStorage.getAnalysis();
    }

    const articles = page.map(({ normalized: a, raw }) => {
      const out = { ...a };
      if (includeContentBool && raw && typeof raw.content === 'string') {
        out.content = raw.content;
      }
      if (includeAnalysisBool) {
        const analysis = analysisMap ? (analysisMap[a.id] || analysisMap[raw.articleId] || null) : null;
        if (analysis) out.analysis = analysis;
      }
      return out;
    });

    return sendCachedJson(req, res, { total, limit: take, offset: skip, articles }, 60);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load articles' });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { includeAnalysis } = req.query;
    const includeAnalysisBool = includeAnalysis === '1' || includeAnalysis === 'true';

    const articlesObj = await jsonStorage.getArticles();
    const raw = articlesObj[id] || null;
    if (!raw) return res.status(404).json({ error: 'Article not found' });

    const article = normalizeArticle({ id, ...raw });
    if (typeof raw.content === 'string') {
      article.content = raw.content;
    }
    if (includeAnalysisBool) {
      const analysisMap = await jsonStorage.getAnalysis();
      article.analysis = analysisMap[id] || analysisMap[raw.articleId] || null;
    }
    return sendCachedJson(req, res, { article }, 120);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load article' });
  }
});

app.get('/api/articles/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const analysisMap = await jsonStorage.getAnalysis();
    const analysis = analysisMap[id] || null;
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    return sendCachedJson(req, res, { analysis }, 300);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load analysis' });
  }
});

app.post('/api/articles/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const articlesObj = await jsonStorage.getArticles();
    const raw = articlesObj[id] || null;
    if (!raw) return res.status(404).json({ error: 'Article not found' });
    const normalized = normalizeArticle({ id, ...raw });
    const result = await analyzeArticle({ title: normalized.title, url: normalized.url, content: raw.content });
    await jsonStorage.saveAnalysis(id, result);
    return res.status(202).json({ ok: true, analysisId: id });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to run analysis' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Admin refresh endpoint (simple trigger)
app.post('/api/admin/refresh', async (req, res) => {
  try {
    // In future, invoke real refresh function or queue a job
    return res.json({ ok: true, message: 'Refresh scheduled' });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to schedule refresh' });
  }
});
