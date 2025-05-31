import express from 'express';
const router = express.Router();

// Placeholder ONNX routes
router.post('/analyze', (req, res) => {
  res.json({ message: 'ONNX analysis endpoint (placeholder)' });
});

router.get('/status', (req, res) => {
  res.json({ message: 'ONNX status endpoint (placeholder)' });
});

export default router; 