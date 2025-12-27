import { Article, Vote } from '../models/index.js';

/**
 * POST /api/vote
 * Cast a vote on an article's AI analysis
 * Body: { articleId, voteType, userFingerprint }
 */
export const castVote = async (req, res) => {
  try {
    const { articleId, voteType, userFingerprint } = req.body;

    // Validate required fields
    if (!articleId || !voteType || !userFingerprint) {
      return res.status(400).json({ 
        message: 'articleId, voteType, and userFingerprint are required' 
      });
    }

    // Validate voteType
    const validVoteTypes = ['UPVOTE', 'DOWNVOTE', 'FLAG_MISSING'];
    if (!validVoteTypes.includes(voteType)) {
      return res.status(400).json({ 
        message: `voteType must be one of: ${validVoteTypes.join(', ')}` 
      });
    }

    // Check if article exists
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check if user has already voted on this article
    const existingVote = await Vote.findOne({
      where: {
        articleId,
        userFingerprint
      }
    });

    let vote;
    let scoreChange = 0;

    if (existingVote) {
      // Update existing vote
      const oldVoteType = existingVote.voteType;
      
      // Calculate score change: remove old vote's contribution, add new vote's contribution
      let oldScore = 0;
      if (oldVoteType === 'UPVOTE') {
        oldScore = 1;
      } else if (oldVoteType === 'DOWNVOTE') {
        oldScore = -1;
      }
      // FLAG_MISSING has score of 0
      
      let newScore = 0;
      if (voteType === 'UPVOTE') {
        newScore = 1;
      } else if (voteType === 'DOWNVOTE') {
        newScore = -1;
      }
      // FLAG_MISSING has score of 0
      
      scoreChange = newScore - oldScore;

      existingVote.voteType = voteType;
      await existingVote.save();
      vote = existingVote;
    } else {
      // Create new vote
      vote = await Vote.create({
        articleId,
        userFingerprint,
        voteType
      });

      // Calculate score change for new vote
      if (voteType === 'UPVOTE') {
        scoreChange = 1;
      } else if (voteType === 'DOWNVOTE') {
        scoreChange = -1;
      }
      // FLAG_MISSING doesn't affect consensus score (scoreChange = 0)
    }

    // Update article consensus score
    const newConsensusScore = Math.max(0, (article.consensusScore || 0) + scoreChange);
    await article.update({ consensusScore: newConsensusScore });

    // Get vote statistics for response
    const voteStats = await Vote.findAll({
      where: { articleId },
      attributes: ['voteType']
    });

    const totalVotes = voteStats.length;
    const upvoteCount = voteStats.filter(v => v.voteType === 'UPVOTE').length;
    const agreePercentage = totalVotes > 0 ? Math.round((upvoteCount / totalVotes) * 100) : 0;

    res.status(200).json({
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        articleId: vote.articleId,
        voteType: vote.voteType,
        createdAt: vote.createdAt
      },
      consensus: {
        score: newConsensusScore,
        totalVotes,
        upvoteCount,
        agreePercentage,
        downvoteCount: voteStats.filter(v => v.voteType === 'DOWNVOTE').length,
        flagMissingCount: voteStats.filter(v => v.voteType === 'FLAG_MISSING').length
      }
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ 
      message: 'Server error casting vote',
      error: error.message 
    });
  }
};

/**
 * GET /api/vote/:articleId
 * Get vote statistics for an article
 */
export const getVoteStats = async (req, res) => {
  try {
    const { articleId } = req.params;

    // Check if article exists
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Get all votes for this article
    const votes = await Vote.findAll({
      where: { articleId }
    });

    const totalVotes = votes.length;
    const upvoteCount = votes.filter(v => v.voteType === 'UPVOTE').length;
    const downvoteCount = votes.filter(v => v.voteType === 'DOWNVOTE').length;
    const flagMissingCount = votes.filter(v => v.voteType === 'FLAG_MISSING').length;
    const agreePercentage = totalVotes > 0 ? Math.round((upvoteCount / totalVotes) * 100) : 0;

    res.status(200).json({
      articleId: parseInt(articleId),
      consensus: {
        score: article.consensusScore || 0,
        totalVotes,
        upvoteCount,
        agreePercentage,
        downvoteCount,
        flagMissingCount
      }
    });
  } catch (error) {
    console.error('Error fetching vote stats:', error);
    res.status(500).json({ 
      message: 'Server error fetching vote statistics',
      error: error.message 
    });
  }
};

