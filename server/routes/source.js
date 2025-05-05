const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');
const { authenticate, optionalAuthenticate, adminRequired } = require('../middleware/auth');

// Public routes
router.get('/', sourceController.getAllSources);
router.get('/:id', sourceController.getSourceById);

// Protected routes for admin functions
router.post('/', authenticate, adminRequired, sourceController.createSource);
router.put('/:id', authenticate, adminRequired, sourceController.updateSource);
router.delete('/:id', authenticate, adminRequired, sourceController.deleteSource);

// User-specific routes
router.get('/user/subscriptions', authenticate, sourceController.getUserSources);
router.post('/:id/subscribe', authenticate, sourceController.subscribeToSource);
router.delete('/:id/subscribe', authenticate, sourceController.unsubscribeFromSource);
router.put('/user/order', authenticate, sourceController.updateSourceOrder);

module.exports = router; 