import express from 'express';
const router = express.Router();

// Placeholder user routes
router.post('/register', (req, res) => {
  res.json({ message: 'Registration endpoint (placeholder)' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint (placeholder)' });
});

router.get('/profile', (req, res) => {
  res.json({ message: 'Profile endpoint (placeholder)' });
});

export default router; 