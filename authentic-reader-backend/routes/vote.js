import express from 'express';
import * as voteController from '../controllers/voteController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes (optional authentication for anonymous users)
router.post('/', optionalAuthenticate, voteController.castVote);
router.get('/:articleId', optionalAuthenticate, voteController.getVoteStats);

export default router;

