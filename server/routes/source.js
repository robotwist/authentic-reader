import express from 'express';
const router = express.Router();

// Placeholder source routes
router.get('/', (req, res) => {
  res.json({ message: 'List sources endpoint (placeholder)' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create source endpoint (placeholder)' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get source endpoint (placeholder)' });
});

export default router; 