import express from 'express';
const router = express.Router();

// Placeholder monitor routes
router.get('/status', (req, res) => {
  res.json({ message: 'Monitor status endpoint (placeholder)' });
});

router.get('/metrics', (req, res) => {
  res.json({ message: 'Monitor metrics endpoint (placeholder)' });
});

export default router; 