import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Auth routes (no auth required)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// Protected routes (auth required)
router.use(authenticate);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.patch('/password', userController.changePassword);
router.delete('/account', userController.deleteAccount);

export default router; 