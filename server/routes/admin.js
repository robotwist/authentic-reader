import express from 'express';
const router = express.Router();

// Placeholder admin routes
router.get('/stats', (req, res) => {
  res.json({ message: 'Admin stats endpoint (placeholder)' });
});

router.get('/users', (req, res) => {
  res.json({ message: 'Admin users endpoint (placeholder)' });
});

export default router; 