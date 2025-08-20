/**
 * Analysis Controller
 * 
 * Handles API routes for article analysis functionality.
 */
import { Analysis, User } from '../models/index.js';

// Get public analyses
export const getPublicAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.findAll({
      where: { visibility: 'public' },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(analyses);
  } catch (error) {
    console.error('Error fetching public analyses:', error);
    res.status(500).json({ message: 'Server error fetching analyses' });
  }
};

// Get a specific public analysis
export const getPublicAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      where: { 
        id: req.params.id,
        visibility: 'public'
      }
    });
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error fetching public analysis:', error);
    res.status(500).json({ message: 'Server error fetching analysis' });
  }
};

// Get analyses for the logged-in user
export const getUserAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(analyses);
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    res.status(500).json({ message: 'Server error fetching analyses' });
  }
};

// Create a new analysis
export const createAnalysis = async (req, res) => {
  try {
    const { articleId, content, results, visibility } = req.body;
    
    if (!content || !results) {
      return res.status(400).json({ message: 'Content and results are required' });
    }
    
    const analysis = await Analysis.create({
      userId: req.user.id,
      articleId,
      content,
      results,
      visibility: visibility || 'private'
    });
    
    res.status(201).json(analysis);
  } catch (error) {
    console.error('Error creating analysis:', error);
    res.status(500).json({ message: 'Server error creating analysis' });
  }
};

// Get a specific analysis
export const getAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user has access
    if (analysis.userId !== req.user.id && analysis.visibility === 'private') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ message: 'Server error fetching analysis' });
  }
};

// Update an analysis
export const updateAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user owns the analysis
    if (analysis.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { content, results, visibility } = req.body;
    
    await analysis.update({
      content: content || analysis.content,
      results: results || analysis.results,
      visibility: visibility || analysis.visibility
    });
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error updating analysis:', error);
    res.status(500).json({ message: 'Server error updating analysis' });
  }
};

// Delete an analysis
export const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user owns the analysis
    if (analysis.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await analysis.destroy();
    
    res.status(200).json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ message: 'Server error deleting analysis' });
  }
};

// Add a bias tag to an analysis
export const addBiasTag = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user owns the analysis
    if (analysis.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { type, confidence } = req.body;
    
    if (!type || typeof confidence !== 'number') {
      return res.status(400).json({ message: 'Type and confidence are required' });
    }
    
    // Add bias tag
    const biasTags = analysis.biasTags || [];
    biasTags.push({ type, confidence, id: Date.now().toString() });
    
    await analysis.update({ biasTags });
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error adding bias tag:', error);
    res.status(500).json({ message: 'Server error adding bias tag' });
  }
};

// Remove a bias tag from an analysis
export const removeBiasTag = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user owns the analysis
    if (analysis.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const tagId = req.params.tagId;
    
    // Remove bias tag
    let biasTags = analysis.biasTags || [];
    biasTags = biasTags.filter(tag => tag.id !== tagId);
    
    await analysis.update({ biasTags });
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error removing bias tag:', error);
    res.status(500).json({ message: 'Server error removing bias tag' });
  }
};

// Share an analysis with another user
export const shareAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user owns the analysis
    if (analysis.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Verify the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add to shared list
    const sharedWith = analysis.sharedWith || [];
    if (!sharedWith.includes(userId)) {
      sharedWith.push(userId);
    }
    
    await analysis.update({ sharedWith });
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error sharing analysis:', error);
    res.status(500).json({ message: 'Server error sharing analysis' });
  }
};

// Unshare an analysis with a user
export const unshareAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user owns the analysis
    if (analysis.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const userId = req.params.userId;
    
    // Remove from shared list
    let sharedWith = analysis.sharedWith || [];
    sharedWith = sharedWith.filter(id => id !== userId);
    
    await analysis.update({ sharedWith });
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error unsharing analysis:', error);
    res.status(500).json({ message: 'Server error unsharing analysis' });
  }
}; 