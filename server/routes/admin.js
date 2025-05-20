import express from 'express';
import { authenticate, adminRequired } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';
import onnxAdminRoutes from './admin/onnx.js';

const router = express.Router();

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

export default router; 