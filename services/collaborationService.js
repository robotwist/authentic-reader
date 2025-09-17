/**
 * Collaboration Service
 * 
 * Handles real-time collaboration features for annotations using Socket.io.
 * Enables multiple users to see live updates when annotations are created,
 * edited, or deleted.
 */

const socketIO = require('socket.io');
const { Pool } = require('pg');

// Room naming convention: annotation:{articleId} or collection:{collectionId}
const ROOM_TYPES = {
  ARTICLE: 'article',
  COLLECTION: 'collection',
  ANNOTATION: 'annotation',
  USER: 'user'
};

// Event types for socket communication
const EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  NEW_ANNOTATION: 'new_annotation',
  UPDATED_ANNOTATION: 'updated_annotation',
  DELETED_ANNOTATION: 'deleted_annotation',
  NEW_REACTION: 'new_reaction',
  NEW_REPLY: 'new_reply',
  CURSOR_POSITION: 'cursor_position',
  SELECTION: 'selection',
  ANNOTATION_LOCK: 'annotation_lock',
  ANNOTATION_UNLOCK: 'annotation_unlock',
  ERROR: 'error'
};

// Active users by room
const activeUsers = new Map();
// Active locks on annotations (prevents concurrent editing)
const annotationLocks = new Map();

class CollaborationService {
  constructor(server) {
    // Initialize Socket.IO
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Initialize database connection pool
    this.pool = new Pool({
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'authentic_reader_dev',
    });
    
    this.setupSocketHandlers();
    console.log('Collaboration service initialized');
  }

  /**
   * Set up socket event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`New connection: ${socket.id}`);
      const userData = { socketId: socket.id };
      
      // Set user data when they connect
      socket.on('set_user_data', (data) => {
        userData.userId = data.userId;
        userData.username = data.username;
        userData.avatar = data.avatar;
        console.log(`User data set for ${socket.id}:`, userData);
      });
      
      // Handle joining rooms (article, collection, annotation)
      socket.on(EVENTS.JOIN_ROOM, (data) => {
        const { type, id } = data;
        if (!type || !id) {
          socket.emit(EVENTS.ERROR, { message: 'Invalid room data' });
          return;
        }
        
        const room = this.getRoomName(type, id);
        socket.join(room);
        
        // Add user to active users for this room
        if (!activeUsers.has(room)) {
          activeUsers.set(room, new Map());
        }
        activeUsers.get(room).set(socket.id, userData);
        
        // Broadcast to others in the room that a new user joined
        socket.to(room).emit(EVENTS.USER_JOINED, {
          user: userData,
          activeUsers: this.getActiveUsersInRoom(room)
        });
        
        // Send current active users to the joining client
        socket.emit('room_joined', {
          room,
          activeUsers: this.getActiveUsersInRoom(room)
        });
        
        console.log(`Socket ${socket.id} joined room: ${room}`);
      });
      
      // Handle leaving rooms
      socket.on(EVENTS.LEAVE_ROOM, (data) => {
        const { type, id } = data;
        const room = this.getRoomName(type, id);
        this.handleRoomLeave(socket, room);
      });
      
      // Handle new annotation created
      socket.on(EVENTS.NEW_ANNOTATION, (data) => {
        const { articleId, annotation } = data;
        const room = this.getRoomName(ROOM_TYPES.ARTICLE, articleId);
        socket.to(room).emit(EVENTS.NEW_ANNOTATION, { annotation });
        
        // Log activity if needed
        this.logCollaborationActivity('create', annotation.id, userData.userId);
      });
      
      // Handle annotation updates
      socket.on(EVENTS.UPDATED_ANNOTATION, (data) => {
        const { annotation } = data;
        
        // Broadcast to article room
        const articleRoom = this.getRoomName(ROOM_TYPES.ARTICLE, annotation.articleId);
        socket.to(articleRoom).emit(EVENTS.UPDATED_ANNOTATION, { annotation });
        
        // Broadcast to annotation-specific room
        const annotationRoom = this.getRoomName(ROOM_TYPES.ANNOTATION, annotation.id);
        socket.to(annotationRoom).emit(EVENTS.UPDATED_ANNOTATION, { annotation });
        
        // Log activity
        this.logCollaborationActivity('update', annotation.id, userData.userId);
      });
      
      // Handle annotation deletion
      socket.on(EVENTS.DELETED_ANNOTATION, (data) => {
        const { articleId, annotationId } = data;
        
        // Broadcast to article room
        const articleRoom = this.getRoomName(ROOM_TYPES.ARTICLE, articleId);
        socket.to(articleRoom).emit(EVENTS.DELETED_ANNOTATION, { annotationId });
        
        // Log activity
        this.logCollaborationActivity('delete', annotationId, userData.userId);
      });
      
      // Handle cursor position updates (for collaborative editing)
      socket.on(EVENTS.CURSOR_POSITION, (data) => {
        const { annotationId, position } = data;
        const room = this.getRoomName(ROOM_TYPES.ANNOTATION, annotationId);
        
        // Only broadcast cursor position to others editing the same annotation
        socket.to(room).emit(EVENTS.CURSOR_POSITION, {
          userId: userData.userId,
          username: userData.username,
          position
        });
      });
      
      // Handle text selection broadcasting
      socket.on(EVENTS.SELECTION, (data) => {
        const { articleId, selection } = data;
        const room = this.getRoomName(ROOM_TYPES.ARTICLE, articleId);
        
        // Broadcast user's selection to others viewing the same article
        socket.to(room).emit(EVENTS.SELECTION, {
          userId: userData.userId,
          username: userData.username,
          selection
        });
      });
      
      // Handle annotation locking (prevents concurrent edits)
      socket.on(EVENTS.ANNOTATION_LOCK, (data) => {
        const { annotationId } = data;
        
        // Check if annotation is already locked
        if (annotationLocks.has(annotationId)) {
          const lock = annotationLocks.get(annotationId);
          socket.emit(EVENTS.ERROR, {
            code: 'LOCKED',
            message: 'This annotation is being edited by another user',
            lockedBy: lock.username
          });
          return;
        }
        
        // Lock the annotation
        annotationLocks.set(annotationId, {
          socketId: socket.id,
          userId: userData.userId,
          username: userData.username,
          timestamp: Date.now()
        });
        
        // Broadcast lock to others
        const annotationRoom = this.getRoomName(ROOM_TYPES.ANNOTATION, annotationId);
        const articleRoom = this.getRoomName(ROOM_TYPES.ARTICLE, data.articleId);
        
        [annotationRoom, articleRoom].forEach(room => {
          this.io.to(room).emit(EVENTS.ANNOTATION_LOCK, {
            annotationId,
            userId: userData.userId,
            username: userData.username
          });
        });
      });
      
      // Handle annotation unlocking
      socket.on(EVENTS.ANNOTATION_UNLOCK, (data) => {
        const { annotationId } = data;
        this.unlockAnnotation(annotationId, socket, userData, data.articleId);
      });
      
      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        // Clear any locks held by this user
        this.clearUserLocks(socket.id);
        
        // Remove user from all rooms they were in
        for (const [room, users] of activeUsers.entries()) {
          if (users.has(socket.id)) {
            this.handleRoomLeave(socket, room);
          }
        }
      });
    });
  }
  
  /**
   * Handle a user leaving a room
   */
  handleRoomLeave(socket, room) {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
    
    // Remove user from active users in this room
    if (activeUsers.has(room)) {
      const users = activeUsers.get(room);
      const userData = users.get(socket.id);
      users.delete(socket.id);
      
      // If room is now empty, remove it
      if (users.size === 0) {
        activeUsers.delete(room);
      } else {
        // Notify others that user left
        socket.to(room).emit(EVENTS.USER_LEFT, {
          user: userData,
          activeUsers: this.getActiveUsersInRoom(room)
        });
      }
    }
  }
  
  /**
   * Get all active users in a room
   */
  getActiveUsersInRoom(room) {
    if (!activeUsers.has(room)) return [];
    
    return Array.from(activeUsers.get(room).values())
      .filter(user => user.userId) // Only include users with set user data
      .map(user => ({
        userId: user.userId,
        username: user.username,
        avatar: user.avatar
      }));
  }
  
  /**
   * Clear all annotation locks held by a specific socket
   */
  clearUserLocks(socketId) {
    for (const [annotationId, lock] of annotationLocks.entries()) {
      if (lock.socketId === socketId) {
        annotationLocks.delete(annotationId);
        
        // Broadcast unlock to relevant rooms
        const annotationRoom = this.getRoomName(ROOM_TYPES.ANNOTATION, annotationId);
        this.io.to(annotationRoom).emit(EVENTS.ANNOTATION_UNLOCK, { annotationId });
      }
    }
  }
  
  /**
   * Unlock a specific annotation
   */
  unlockAnnotation(annotationId, socket, userData, articleId) {
    // Check if this user holds the lock
    const lock = annotationLocks.get(annotationId);
    if (!lock || lock.socketId !== socket.id) {
      socket.emit(EVENTS.ERROR, {
        code: 'UNLOCK_FAILED',
        message: 'You do not hold the lock for this annotation'
      });
      return;
    }
    
    // Remove the lock
    annotationLocks.delete(annotationId);
    
    // Broadcast unlock to rooms
    const annotationRoom = this.getRoomName(ROOM_TYPES.ANNOTATION, annotationId);
    const articleRoom = this.getRoomName(ROOM_TYPES.ARTICLE, articleId);
    
    [annotationRoom, articleRoom].forEach(room => {
      this.io.to(room).emit(EVENTS.ANNOTATION_UNLOCK, { annotationId });
    });
  }
  
  /**
   * Generate a consistent room name from type and ID
   */
  getRoomName(type, id) {
    return `${type}:${id}`;
  }
  
  /**
   * Log collaboration activity to database for audit trail
   */
  async logCollaborationActivity(action, annotationId, userId) {
    try {
      await this.pool.query(
        'INSERT INTO collaboration_logs (user_id, annotation_id, action, timestamp) VALUES ($1, $2, $3, NOW())',
        [userId, annotationId, action]
      );
    } catch (error) {
      console.error('Error logging collaboration activity:', error);
    }
  }
  
  /**
   * Broadcast to all clients connected to a specific article
   */
  broadcastToArticle(articleId, event, data) {
    const room = this.getRoomName(ROOM_TYPES.ARTICLE, articleId);
    this.io.to(room).emit(event, data);
  }
  
  /**
   * Broadcast to all clients connected to a specific collection
   */
  broadcastToCollection(collectionId, event, data) {
    const room = this.getRoomName(ROOM_TYPES.COLLECTION, collectionId);
    this.io.to(room).emit(event, data);
  }
}

module.exports = CollaborationService; 