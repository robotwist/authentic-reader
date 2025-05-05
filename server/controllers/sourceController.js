const { Source, UserSource, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Get all sources
exports.getAllSources = async (req, res) => {
  try {
    const sources = await Source.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ message: 'Server error fetching sources' });
  }
};

// Get a single source by ID
exports.getSourceById = async (req, res) => {
  try {
    const source = await Source.findByPk(req.params.id);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }
    
    res.json(source);
  } catch (error) {
    console.error('Error fetching source:', error);
    res.status(500).json({ message: 'Server error fetching source' });
  }
};

// Create a new source
exports.createSource = async (req, res) => {
  try {
    const { name, url, category, description } = req.body;
    
    // Validate input
    if (!name || !url || !category) {
      return res.status(400).json({ message: 'Name, URL and category are required' });
    }
    
    // Check if source URL already exists
    const existingSource = await Source.findOne({ where: { url } });
    
    if (existingSource) {
      return res.status(400).json({ message: 'Source with this URL already exists' });
    }
    
    // Create source
    const source = await Source.create({
      name,
      url,
      category,
      description: description || ''
    });
    
    res.status(201).json(source);
  } catch (error) {
    console.error('Error creating source:', error);
    res.status(500).json({ message: 'Server error creating source' });
  }
};

// Update a source
exports.updateSource = async (req, res) => {
  try {
    const { name, url, category, description } = req.body;
    const sourceId = req.params.id;
    
    // Find source
    const source = await Source.findByPk(sourceId);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }
    
    // Check if URL is being changed and already exists
    if (url && url !== source.url) {
      const existingSource = await Source.findOne({ 
        where: { 
          url,
          id: { [Op.ne]: sourceId }
        } 
      });
      
      if (existingSource) {
        return res.status(400).json({ message: 'Source with this URL already exists' });
      }
    }
    
    // Update source
    if (name) source.name = name;
    if (url) source.url = url;
    if (category) source.category = category;
    if (description !== undefined) source.description = description;
    
    await source.save();
    
    res.json(source);
  } catch (error) {
    console.error('Error updating source:', error);
    res.status(500).json({ message: 'Server error updating source' });
  }
};

// Delete a source
exports.deleteSource = async (req, res) => {
  try {
    const sourceId = req.params.id;
    
    // Find source
    const source = await Source.findByPk(sourceId);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }
    
    // Delete source
    await source.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting source:', error);
    res.status(500).json({ message: 'Server error deleting source' });
  }
};

// Get user's subscribed sources
exports.getUserSources = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Getting sources for user ID:', userId);
    
    // First try to find the user to confirm they exist
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      console.error(`User with ID ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all source IDs this user is subscribed to
    const userSources = await UserSource.findAll({
      where: { userId }
    });
    
    if (!userSources || userSources.length === 0) {
      console.log(`User ${userId} has no subscriptions`);
      return res.json([]);
    }
    
    const sourceIds = userSources.map(us => us.sourceId);
    
    // Get full source details
    const sources = await Source.findAll({
      where: {
        id: {
          [Op.in]: sourceIds
        }
      }
    });
    
    // Merge with display order information
    const result = sources.map(source => {
      const userSource = userSources.find(us => us.sourceId === source.id);
      return {
        ...source.get(),
        displayOrder: userSource ? userSource.displayOrder : 0
      };
    });
    
    // Sort by display order
    result.sort((a, b) => a.displayOrder - b.displayOrder);
    
    console.log(`Found ${result.length} sources for user ${userId}`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching user sources:', error);
    res.status(500).json({ message: 'Server error fetching user sources' });
  }
};

// Subscribe to a source
exports.subscribeToSource = async (req, res) => {
  try {
    const userId = req.user.id;
    const sourceId = req.params.id;
    
    // Check if source exists
    const source = await Source.findByPk(sourceId);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }
    
    // Check if already subscribed
    const existingSubscription = await UserSource.findOne({
      where: { userId, sourceId }
    });
    
    if (existingSubscription) {
      return res.status(400).json({ message: 'Already subscribed to this source' });
    }
    
    // Get the highest display order for this user
    const highestOrder = await UserSource.max('displayOrder', {
      where: { userId }
    }) || 0;
    
    // Create subscription
    const subscription = await UserSource.create({
      userId,
      sourceId,
      displayOrder: highestOrder + 1
    });
    
    res.status(201).json({
      ...source.get(),
      displayOrder: subscription.displayOrder
    });
  } catch (error) {
    console.error('Error subscribing to source:', error);
    res.status(500).json({ message: 'Server error subscribing to source' });
  }
};

// Unsubscribe from a source
exports.unsubscribeFromSource = async (req, res) => {
  try {
    const userId = req.user.id;
    const sourceId = req.params.id;
    
    // Find subscription
    const subscription = await UserSource.findOne({
      where: { userId, sourceId }
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    // Delete subscription
    await subscription.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error unsubscribing from source:', error);
    res.status(500).json({ message: 'Server error unsubscribing from source' });
  }
};

// Update source display order
exports.updateSourceOrder = async (req, res) => {
  const userId = req.user.id;
  const { sourceOrders } = req.body;
  
  // Validate input
  if (!Array.isArray(sourceOrders)) {
    return res.status(400).json({ message: 'sourceOrders must be an array' });
  }

  // Use a transaction to ensure atomicity
  try {
    // Access sequelize instance via an imported model
    const sequelize = Source.sequelize; 
    await sequelize.transaction(async (t) => {
      // Update each source's display order within the transaction
      await Promise.all(
        sourceOrders.map(({ sourceId, displayOrder }) => 
          UserSource.update(
            { displayOrder },
            { where: { userId, sourceId }, transaction: t } // Pass transaction object
          )
        )
      );
    }); // Transaction commits here if no errors
    
    res.json({ message: 'Source order updated successfully' });
  } catch (error) {
    console.error('Error updating source order:', error);
    // Transaction automatically rolls back on error
    res.status(500).json({ message: 'Server error updating source order' });
  }
}; 