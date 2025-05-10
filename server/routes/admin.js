const express = require('express');
const router = express.Router();
const { authenticate, adminRequired } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const onnxAdminRoutes = require('./admin/onnx');

// All routes in this file require authentication
router.use(authenticate);

// All routes in this file require admin privileges
router.use(adminRequired);

// User management routes
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Stats and dashboard data
router.get('/stats', adminController.getStats);

// ONNX model management routes
router.use('/onnx', onnxAdminRoutes);

module.exports = router; 