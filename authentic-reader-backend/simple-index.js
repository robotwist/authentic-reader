import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API endpoints
app.get('/api/sources', (req, res) => {
  res.json({ sources: [] });
});

app.get('/api/articles', (req, res) => {
  res.json({ articles: [] });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
