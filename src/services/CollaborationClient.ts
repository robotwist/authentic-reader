/**
 * Collaboration Client
 * 
 * Client-side service for handling real-time collaboration features
 * using Socket.io. Provides hooks and methods for integrating with
 * the annotation system.
 */

import { io, Socket } from 'socket.io-client';
import { Annotation } from '../components/AnnotationSystem';

// Room types for Socket.io
export enum RoomType {
  ARTICLE = 'article',
  COLLECTION = 'collection',
  ANNOTATION = 'annotation',
  USER = 'user'
}

// Event types for Socket.io
export enum CollaborationEvent {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  NEW_ANNOTATION = 'new_annotation',
  UPDATED_ANNOTATION = 'updated_annotation',
  DELETED_ANNOTATION = 'deleted_annotation',
  NEW_REACTION = 'new_reaction',
  NEW_REPLY = 'new_reply',
  CURSOR_POSITION = 'cursor_position',
  SELECTION = 'selection',
  ANNOTATION_LOCK = 'annotation_lock',
  ANNOTATION_UNLOCK = 'annotation_unlock',
  ERROR = 'error'
}

// User information interface
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

// Selection data interface
export interface SelectionData {
  text: string;
  start: number;
  end: number;
}

// Cursor position interface
export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  username: string;
}

// Event callbacks interface
export interface CollaborationCallbacks {
  onUserJoined?: (user: User, activeUsers: User[]) => void;
  onUserLeft?: (user: User, activeUsers: User[]) => void;
  onNewAnnotation?: (annotation: Annotation) => void;
  onUpdatedAnnotation?: (annotation: Annotation) => void;
  onDeletedAnnotation?: (annotationId: string) => void;
  onCursorPosition?: (userId: string, username: string, position: {x: number, y: number}) => void;
  onSelection?: (userId: string, username: string, selection: SelectionData) => void;
  onAnnotationLock?: (annotationId: string, userId: string, username: string) => void;
  onAnnotationUnlock?: (annotationId: string) => void;
  onError?: (error: any) => void;
}

class CollaborationClient {
  private socket: Socket | null = null;
  private user: User | null = null;
  private callbacks: CollaborationCallbacks = {};
  private currentRooms: Map<string, string> = new Map();
  private isConnected: boolean = false;
  
  /**
   * Initialize collaboration client with user data
   */
  initialize(socketUrl: string, user: User): void {
    if (this.socket) {
      console.warn('CollaborationClient already initialized');
      return;
    }
    
    this.socket = io(socketUrl);
    this.user = user;
    this.isConnected = false;
    
    // Set up connection event listeners
    this.socket.on('connect', () => {
      console.log('Socket.io connected');
      this.isConnected = true;
      
      // Set user data
      this.socket.emit('set_user_data', {
        userId: user.id,
        username: user.username,
        avatar: user.avatar
      });
      
      // Rejoin any current rooms after reconnection
      this.currentRooms.forEach((id, type) => {
        this.joinRoom(type as RoomType, id);
      });
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      this.isConnected = false;
    });
    
    // Set up event listeners for collaboration
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for collaboration events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Room events
    this.socket.on('room_joined', (data: {room: string, activeUsers: User[]}) => {
      console.log(`Joined room: ${data.room} with ${data.activeUsers.length} active users`);
    });
    
    this.socket.on(CollaborationEvent.USER_JOINED, (data: {user: User, activeUsers: User[]}) => {
      console.log(`User joined: ${data.user.username}`);
      if (this.callbacks.onUserJoined) {
        this.callbacks.onUserJoined(data.user, data.activeUsers);
      }
    });
    
    this.socket.on(CollaborationEvent.USER_LEFT, (data: {user: User, activeUsers: User[]}) => {
      console.log(`User left: ${data.user.username}`);
      if (this.callbacks.onUserLeft) {
        this.callbacks.onUserLeft(data.user, data.activeUsers);
      }
    });
    
    // Annotation events
    this.socket.on(CollaborationEvent.NEW_ANNOTATION, (data: {annotation: Annotation}) => {
      console.log('New annotation received:', data.annotation);
      if (this.callbacks.onNewAnnotation) {
        this.callbacks.onNewAnnotation(data.annotation);
      }
    });
    
    this.socket.on(CollaborationEvent.UPDATED_ANNOTATION, (data: {annotation: Annotation}) => {
      console.log('Updated annotation received:', data.annotation);
      if (this.callbacks.onUpdatedAnnotation) {
        this.callbacks.onUpdatedAnnotation(data.annotation);
      }
    });
    
    this.socket.on(CollaborationEvent.DELETED_ANNOTATION, (data: {annotationId: string}) => {
      console.log('Deleted annotation:', data.annotationId);
      if (this.callbacks.onDeletedAnnotation) {
        this.callbacks.onDeletedAnnotation(data.annotationId);
      }
    });
    
    // Cursor and selection events
    this.socket.on(CollaborationEvent.CURSOR_POSITION, (data: {userId: string, username: string, position: {x: number, y: number}}) => {
      if (this.callbacks.onCursorPosition) {
        this.callbacks.onCursorPosition(data.userId, data.username, data.position);
      }
    });
    
    this.socket.on(CollaborationEvent.SELECTION, (data: {userId: string, username: string, selection: SelectionData}) => {
      if (this.callbacks.onSelection) {
        this.callbacks.onSelection(data.userId, data.username, data.selection);
      }
    });
    
    // Lock events
    this.socket.on(CollaborationEvent.ANNOTATION_LOCK, (data: {annotationId: string, userId: string, username: string}) => {
      console.log(`Annotation ${data.annotationId} locked by ${data.username}`);
      if (this.callbacks.onAnnotationLock) {
        this.callbacks.onAnnotationLock(data.annotationId, data.userId, data.username);
      }
    });
    
    this.socket.on(CollaborationEvent.ANNOTATION_UNLOCK, (data: {annotationId: string}) => {
      console.log(`Annotation ${data.annotationId} unlocked`);
      if (this.callbacks.onAnnotationUnlock) {
        this.callbacks.onAnnotationUnlock(data.annotationId);
      }
    });
    
    // Error handling
    this.socket.on(CollaborationEvent.ERROR, (data: any) => {
      console.error('Collaboration error:', data);
      if (this.callbacks.onError) {
        this.callbacks.onError(data);
      }
    });
  }
  
  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: CollaborationCallbacks): void {
    this.callbacks = {...this.callbacks, ...callbacks};
  }
  
  /**
   * Join a room (article, collection, annotation)
   */
  joinRoom(type: RoomType, id: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join room: Socket not connected');
      return;
    }
    
    // Save to current rooms for reconnection handling
    this.currentRooms.set(type, id);
    
    this.socket.emit(CollaborationEvent.JOIN_ROOM, {
      type,
      id
    });
    
    console.log(`Joined ${type} room for ID: ${id}`);
  }
  
  /**
   * Leave a room
   */
  leaveRoom(type: RoomType, id: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.LEAVE_ROOM, {
      type,
      id
    });
    
    // Remove from current rooms
    this.currentRooms.delete(type);
    
    console.log(`Left ${type} room for ID: ${id}`);
  }
  
  /**
   * Send cursor position update
   */
  sendCursorPosition(annotationId: string, position: {x: number, y: number}): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.CURSOR_POSITION, {
      annotationId,
      position
    });
  }
  
  /**
   * Send selection update
   */
  sendSelection(articleId: string, selection: SelectionData): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.SELECTION, {
      articleId,
      selection
    });
  }
  
  /**
   * Create a new annotation
   */
  createAnnotation(articleId: string, annotation: Annotation): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.NEW_ANNOTATION, {
      articleId,
      annotation
    });
  }
  
  /**
   * Update an annotation
   */
  updateAnnotation(annotation: Annotation): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.UPDATED_ANNOTATION, {
      annotation
    });
  }
  
  /**
   * Delete an annotation
   */
  deleteAnnotation(articleId: string, annotationId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.DELETED_ANNOTATION, {
      articleId,
      annotationId
    });
  }
  
  /**
   * Lock an annotation for editing
   */
  lockAnnotation(annotationId: string, articleId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.ANNOTATION_LOCK, {
      annotationId,
      articleId
    });
  }
  
  /**
   * Unlock an annotation
   */
  unlockAnnotation(annotationId: string, articleId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(CollaborationEvent.ANNOTATION_UNLOCK, {
      annotationId,
      articleId
    });
  }
  
  /**
   * Disconnect from the collaboration server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRooms.clear();
    }
  }
  
  /**
   * Check if the client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
const collaborationClient = new CollaborationClient();

export default collaborationClient; 