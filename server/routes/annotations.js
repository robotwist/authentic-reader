const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const cacheService = require('../services/cacheService');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'authentic_reader_dev',
});

/**
 * Get all annotations for a specific article with pagination
 * GET /api/annotations?articleId=xyz&page=1&limit=20
 */
router.get('/', cacheService.cacheMiddleware({
  prefix: 'annotations',
  ttl: cacheService.TTL.SHORT, // Short TTL for annotations list
  queryFields: ['articleId', 'userId', 'url', 'page', 'limit', 'collectionId', 'parentId']
}), async (req, res) => {
  try {
    const { articleId, userId, url, page = 1, limit = 20, collectionId, parentId } = req.query;
    
    let query = 'SELECT * FROM annotations WHERE 1=1';
    const values = [];
    let paramCount = 1;
    
    if (articleId) {
      query += ` AND article_id = $${paramCount}`;
      values.push(articleId);
      paramCount++;
    }
    
    if (userId) {
      query += ` AND (user_id = $${paramCount} OR visibility = 'public')`;
      values.push(userId);
      paramCount++;
    } else {
      query += ` AND visibility = 'public'`;
    }
    
    if (url) {
      query += ` AND url = $${paramCount}`;
      values.push(url);
      paramCount++;
    }

    if (collectionId) {
      query += ` AND collection_id = $${paramCount}`;
      values.push(collectionId);
      paramCount++;
    }

    if (parentId) {
      query += ` AND parent_id = $${paramCount}`;
      values.push(parentId);
      paramCount++;
    } else {
      // If not looking for replies, exclude replies by default
      query += ` AND (is_reply = FALSE OR is_reply IS NULL)`;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM annotations WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;
    
    if (articleId) {
      countQuery += ` AND article_id = $${countParamCount}`;
      countValues.push(articleId);
      countParamCount++;
    }
    
    if (userId) {
      countQuery += ` AND (user_id = $${countParamCount} OR visibility = 'public')`;
      countValues.push(userId);
      countParamCount++;
    } else {
      countQuery += ` AND visibility = 'public'`;
    }
    
    if (url) {
      countQuery += ` AND url = $${countParamCount}`;
      countValues.push(url);
      countParamCount++;
    }

    if (collectionId) {
      countQuery += ` AND collection_id = $${countParamCount}`;
      countValues.push(collectionId);
      countParamCount++;
    }

    if (parentId) {
      countQuery += ` AND parent_id = $${countParamCount}`;
      countValues.push(parentId);
      countParamCount++;
    } else {
      // If not looking for replies, exclude replies by default
      countQuery += ` AND (is_reply = FALSE OR is_reply IS NULL)`;
    }
    
    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      annotations: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ error: 'Failed to fetch annotations' });
  }
});

/**
 * Get a specific annotation by id
 * GET /api/annotations/:id
 */
router.get('/:id', cacheService.cacheMiddleware({
  prefix: 'annotation',
  ttl: cacheService.TTL.MEDIUM, // Medium TTL for single annotation
  paramFields: ['id'],
  queryFields: ['includeReplies', 'includeVersions']
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { includeReplies, includeVersions } = req.query;
    
    // Get the annotation
    const result = await pool.query('SELECT * FROM annotations WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annotation not found' });
    }
    
    const annotation = result.rows[0];
    
    // If requested, include replies
    if (includeReplies === 'true') {
      const repliesResult = await pool.query(
        'SELECT * FROM annotations WHERE parent_id = $1 ORDER BY created_at ASC',
        [id]
      );
      annotation.replies = repliesResult.rows;
    }
    
    // If requested, include version history
    if (includeVersions === 'true') {
      const versionsResult = await pool.query(
        'SELECT * FROM annotation_versions WHERE annotation_id = $1 ORDER BY version DESC',
        [id]
      );
      annotation.versions = versionsResult.rows;
    }
    
    res.json(annotation);
  } catch (error) {
    console.error('Error fetching annotation:', error);
    res.status(500).json({ error: 'Failed to fetch annotation' });
  }
});

/**
 * Create a new annotation
 * POST /api/annotations
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      articleId,
      url,
      title,
      text,
      richText,
      type = 'highlight',
      tags = [],
      sentiment = 0,
      visibility = 'private',
      selection,
      collectionId,
      parentId,
      isReply = false
    } = req.body;
    
    // Basic validation
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!text) {
      return res.status(400).json({ error: 'Annotation text is required' });
    }
    
    if (!(articleId || url)) {
      return res.status(400).json({ error: 'Either articleId or URL is required' });
    }
    
    // If this is a reply, validate parent exists
    if (isReply && parentId) {
      const parentCheck = await pool.query('SELECT * FROM annotations WHERE id = $1', [parentId]);
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent annotation not found' });
      }
    }
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const id = uuidv4();
      const createdAt = new Date();
      const version = 1;
      
      // Insert the annotation
      const query = `
        INSERT INTO annotations (
          id, user_id, article_id, url, title, text, rich_text, type, tags, 
          sentiment, visibility, selection, collection_id, parent_id, is_reply, 
          version, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
        RETURNING *
      `;
      
      const values = [
        id,
        userId,
        articleId || null,
        url || null,
        title || null,
        text,
        richText ? JSON.stringify(richText) : null,
        type,
        JSON.stringify(tags),
        sentiment,
        visibility,
        selection ? JSON.stringify(selection) : null,
        collectionId || null,
        parentId || null,
        isReply,
        version,
        createdAt
      ];
      
      const result = await client.query(query, values);
      
      // Create initial version history entry
      const versionId = uuidv4();
      const versionQuery = `
        INSERT INTO annotation_versions (
          id, annotation_id, user_id, text, rich_text, type, tags, version, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const versionValues = [
        versionId,
        id,
        userId,
        text,
        richText ? JSON.stringify(richText) : null,
        type,
        JSON.stringify(tags),
        version,
        createdAt
      ];
      
      await client.query(versionQuery, versionValues);
      
      // If this is a reply, update the parent's reply count
      if (isReply && parentId) {
        // Note: In a production system, you'd use a trigger for this
        // Here we're doing it manually for simplicity
        await client.query(
          'UPDATE annotations SET reply_count = COALESCE(reply_count, 0) + 1 WHERE id = $1',
          [parentId]
        );
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Invalidate related caches after successful creation
      cacheService.invalidateCache('annotations');
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ error: 'Failed to create annotation' });
  }
});

/**
 * Update an existing annotation
 * PUT /api/annotations/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userId,
      text,
      richText,
      type,
      tags,
      sentiment,
      visibility,
      collectionId
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Verify the annotation exists
    const checkResult = await pool.query('SELECT * FROM annotations WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annotation not found' });
    }
    
    const annotation = checkResult.rows[0];
    
    // Check if the user owns the annotation or has edit rights
    if (annotation.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to edit this annotation' });
    }
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the annotation
      const updatedAt = new Date();
      const newVersion = annotation.version + 1;
      
      const query = `
        UPDATE annotations
        SET 
          text = COALESCE($1, text),
          rich_text = COALESCE($2, rich_text),
          type = COALESCE($3, type),
          tags = COALESCE($4, tags),
          sentiment = COALESCE($5, sentiment),
          visibility = COALESCE($6, visibility),
          collection_id = COALESCE($7, collection_id),
          version = $8,
          updated_at = $9
        WHERE id = $10
        RETURNING *
      `;
      
      const values = [
        text,
        richText ? JSON.stringify(richText) : null,
        type,
        tags ? JSON.stringify(tags) : null,
        sentiment,
        visibility,
        collectionId,
        newVersion,
        updatedAt,
        id
      ];
      
      const result = await client.query(query, values);
      
      // Create a new version history entry
      const versionId = uuidv4();
      const versionQuery = `
        INSERT INTO annotation_versions (
          id, annotation_id, user_id, text, rich_text, type, tags, version, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const versionValues = [
        versionId,
        id,
        userId,
        text || annotation.text,
        richText ? JSON.stringify(richText) : annotation.rich_text,
        type || annotation.type,
        tags ? JSON.stringify(tags) : annotation.tags,
        newVersion,
        updatedAt
      ];
      
      await client.query(versionQuery, versionValues);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Invalidate related caches after successful update
      cacheService.invalidateCache(`annotation:${id}`);
      cacheService.invalidateCache('annotations');
      
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating annotation:', error);
    res.status(500).json({ error: 'Failed to update annotation' });
  }
});

/**
 * Delete an annotation
 * DELETE /api/annotations/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // First check if the annotation exists
    const checkResult = await pool.query('SELECT * FROM annotations WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annotation not found' });
    }
    
    const annotation = checkResult.rows[0];
    
    // Check if the user owns the annotation
    if (annotation.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this annotation' });
    }
    
    // Check if the annotation has replies
    const repliesResult = await pool.query(
      'SELECT COUNT(*) FROM annotations WHERE parent_id = $1',
      [id]
    );
    
    const replyCount = parseInt(repliesResult.rows[0].count, 10);
    
    // If the annotation has replies, don't delete it but mark it as deleted
    if (replyCount > 0) {
      await pool.query(
        'UPDATE annotations SET text = \'[Deleted]\', is_deleted = TRUE WHERE id = $1',
        [id]
      );
      
      return res.status(200).json({ message: 'Annotation marked as deleted' });
    }
    
    // Otherwise, delete it completely
    await pool.query('DELETE FROM annotations WHERE id = $1', [id]);
    
    // Update parent if it's a reply
    if (annotation.parent_id) {
      await pool.query(
        'UPDATE annotations SET reply_count = GREATEST(0, COALESCE(reply_count, 0) - 1) WHERE id = $1',
        [annotation.parent_id]
      );
    }
    
    // Invalidate related caches after successful deletion
    cacheService.invalidateCache(`annotation:${id}`);
    cacheService.invalidateCache('annotations');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});

/**
 * Add a reaction to an annotation
 * POST /api/annotations/:id/reactions
 */
router.post('/:id/reactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type = 'like' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if the annotation exists
    const annotationCheck = await pool.query('SELECT * FROM annotations WHERE id = $1', [id]);
    
    if (annotationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Annotation not found' });
    }
    
    // Check if reaction already exists
    const reactionCheck = await pool.query(
      'SELECT * FROM annotation_reactions WHERE annotation_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (reactionCheck.rows.length > 0) {
      // If it exists, update it
      const updateResult = await pool.query(
        'UPDATE annotation_reactions SET type = $1, created_at = $2 WHERE annotation_id = $3 AND user_id = $4 RETURNING *',
        [type, new Date(), id, userId]
      );
      
      // Update reaction count
      await updateReactionCount(id);
      
      return res.json(updateResult.rows[0]);
    }
    
    // If not, create a new reaction
    const reactionId = uuidv4();
    const createdAt = new Date();
    
    const insertResult = await pool.query(
      'INSERT INTO annotation_reactions (id, annotation_id, user_id, type, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [reactionId, id, userId, type, createdAt]
    );
    
    // Update reaction count
    await updateReactionCount(id);
    
    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

/**
 * Remove a reaction from an annotation
 * DELETE /api/annotations/:id/reactions/:userId
 */
router.delete('/:id/reactions/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    await pool.query(
      'DELETE FROM annotation_reactions WHERE annotation_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    // Update reaction count
    await updateReactionCount(id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

/**
 * Create a new collection
 * POST /api/annotations/collections
 */
router.post('/collections', async (req, res) => {
  try {
    const { userId, name, description, isPublic = false } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    
    const id = uuidv4();
    const createdAt = new Date();
    
    const query = `
      INSERT INTO annotation_collections (
        id, user_id, name, description, is_public, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING *
    `;
    
    const values = [id, userId, name, description || '', isPublic, createdAt];
    
    const result = await pool.query(query, values);
    // Invalidate related caches after successful creation
    cacheService.invalidateCache('annotation-collections');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

/**
 * Get collections for a user
 * GET /api/annotations/collections?userId=xyz
 */
router.get('/collections', cacheService.cacheMiddleware({
  prefix: 'annotation-collections',
  ttl: cacheService.TTL.MEDIUM,
  queryFields: ['userId', 'page', 'limit']
}), async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT * FROM annotation_collections 
      WHERE user_id = $1 OR is_public = TRUE
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM annotation_collections WHERE user_id = $1 OR is_public = TRUE',
      [userId]
    );
    
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      collections: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

/**
 * Get a single collection with its annotations
 * GET /api/annotations/collections/:id
 */
router.get('/collections/:id', cacheService.cacheMiddleware({
  prefix: 'annotation-collection',
  ttl: cacheService.TTL.MEDIUM,
  paramFields: ['id'],
  queryFields: ['userId', 'page', 'limit']
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, page = 1, limit = 20 } = req.query;
    
    // Get the collection
    const collectionResult = await pool.query(
      'SELECT * FROM annotation_collections WHERE id = $1',
      [id]
    );
    
    if (collectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const collection = collectionResult.rows[0];
    
    // Check if user has access to this collection
    if (!collection.is_public && collection.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this collection' });
    }
    
    // Get annotations in this collection with pagination
    const offset = (page - 1) * limit;
    
    const annotationsQuery = `
      SELECT * FROM annotations 
      WHERE collection_id = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const annotationsResult = await pool.query(annotationsQuery, [id, limit, offset]);
    
    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM annotations WHERE collection_id = $1',
      [id]
    );
    
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);
    
    collection.annotations = annotationsResult.rows;
    collection.pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalCount,
      totalPages
    };
    
    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

/**
 * Update a collection
 * PUT /api/annotations/collections/:id
 */
router.put('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name, description, isPublic } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if collection exists and user owns it
    const collectionCheck = await pool.query(
      'SELECT * FROM annotation_collections WHERE id = $1',
      [id]
    );
    
    if (collectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collectionCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this collection' });
    }
    
    const updatedAt = new Date();
    
    const query = `
      UPDATE annotation_collections
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        is_public = COALESCE($3, is_public),
        updated_at = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [name, description, isPublic, updatedAt, id];
    
    const result = await pool.query(query, values);
    // Invalidate related caches after successful update
    cacheService.invalidateCache(`annotation-collection:${id}`);
    cacheService.invalidateCache('annotation-collections');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

/**
 * Delete a collection
 * DELETE /api/annotations/collections/:id
 */
router.delete('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if collection exists and user owns it
    const collectionCheck = await pool.query(
      'SELECT * FROM annotation_collections WHERE id = $1',
      [id]
    );
    
    if (collectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collectionCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this collection' });
    }
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remove collection_id from all annotations in this collection
      await client.query(
        'UPDATE annotations SET collection_id = NULL WHERE collection_id = $1',
        [id]
      );
      
      // Delete the collection
      await client.query(
        'DELETE FROM annotation_collections WHERE id = $1',
        [id]
      );
      
      await client.query('COMMIT');
      // Invalidate related caches after successful deletion
      cacheService.invalidateCache(`annotation-collection:${id}`);
      cacheService.invalidateCache('annotation-collections');
      res.status(204).send();
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

/**
 * Get version history for an annotation
 * GET /api/annotations/:id/versions
 */
router.get('/:id/versions', cacheService.cacheMiddleware({
  prefix: 'annotation-versions',
  ttl: cacheService.TTL.LONG, // Long TTL for version history (rarely changes)
  paramFields: ['id'],
  queryFields: ['page', 'limit']
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Check if annotation exists
    const annotationCheck = await pool.query(
      'SELECT * FROM annotations WHERE id = $1',
      [id]
    );
    
    if (annotationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Annotation not found' });
    }
    
    const offset = (page - 1) * limit;
    
    const versionsQuery = `
      SELECT * FROM annotation_versions
      WHERE annotation_id = $1
      ORDER BY version DESC
      LIMIT $2 OFFSET $3
    `;
    
    const versionsResult = await pool.query(versionsQuery, [id, limit, offset]);
    
    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM annotation_versions WHERE annotation_id = $1',
      [id]
    );
    
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      versions: versionsResult.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

/**
 * Helper function to update reaction count for an annotation
 */
async function updateReactionCount(annotationId) {
  try {
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM annotation_reactions WHERE annotation_id = $1',
      [annotationId]
    );
    
    const reactionCount = parseInt(countResult.rows[0].count, 10);
    
    await pool.query(
      'UPDATE annotations SET reaction_count = $1 WHERE id = $2',
      [reactionCount, annotationId]
    );
    
    // Invalidate cache for this annotation after updating reaction count
    cacheService.invalidateCache(`annotation:${annotationId}`);
  } catch (error) {
    console.error('Error updating reaction count:', error);
  }
}

module.exports = router; 