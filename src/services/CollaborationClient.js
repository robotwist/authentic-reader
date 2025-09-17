/**
 * Collaboration Client
 *
 * Client-side service for handling real-time collaboration features
 * using Socket.io. Provides hooks and methods for integrating with
 * the annotation system.
 */
import { io } from 'socket.io-client';
// Room types for Socket.io
export var RoomType;
(function (RoomType) {
    RoomType["ARTICLE"] = "article";
    RoomType["COLLECTION"] = "collection";
    RoomType["ANNOTATION"] = "annotation";
    RoomType["USER"] = "user";
})(RoomType || (RoomType = {}));
// Event types for Socket.io
export var CollaborationEvent;
(function (CollaborationEvent) {
    CollaborationEvent["JOIN_ROOM"] = "join_room";
    CollaborationEvent["LEAVE_ROOM"] = "leave_room";
    CollaborationEvent["USER_JOINED"] = "user_joined";
    CollaborationEvent["USER_LEFT"] = "user_left";
    CollaborationEvent["NEW_ANNOTATION"] = "new_annotation";
    CollaborationEvent["UPDATED_ANNOTATION"] = "updated_annotation";
    CollaborationEvent["DELETED_ANNOTATION"] = "deleted_annotation";
    CollaborationEvent["NEW_REACTION"] = "new_reaction";
    CollaborationEvent["NEW_REPLY"] = "new_reply";
    CollaborationEvent["CURSOR_POSITION"] = "cursor_position";
    CollaborationEvent["SELECTION"] = "selection";
    CollaborationEvent["ANNOTATION_LOCK"] = "annotation_lock";
    CollaborationEvent["ANNOTATION_UNLOCK"] = "annotation_unlock";
    CollaborationEvent["ERROR"] = "error";
})(CollaborationEvent || (CollaborationEvent = {}));
class CollaborationClient {
    constructor() {
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "user", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "callbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "currentRooms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "isConnected", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
    }
    /**
     * Initialize collaboration client with user data
     */
    initialize(socketUrl, user) {
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
                this.joinRoom(type, id);
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
    setupEventListeners() {
        if (!this.socket)
            return;
        // Room events
        this.socket.on('room_joined', (data) => {
            console.log(`Joined room: ${data.room} with ${data.activeUsers.length} active users`);
        });
        this.socket.on(CollaborationEvent.USER_JOINED, (data) => {
            console.log(`User joined: ${data.user.username}`);
            if (this.callbacks.onUserJoined) {
                this.callbacks.onUserJoined(data.user, data.activeUsers);
            }
        });
        this.socket.on(CollaborationEvent.USER_LEFT, (data) => {
            console.log(`User left: ${data.user.username}`);
            if (this.callbacks.onUserLeft) {
                this.callbacks.onUserLeft(data.user, data.activeUsers);
            }
        });
        // Annotation events
        this.socket.on(CollaborationEvent.NEW_ANNOTATION, (data) => {
            console.log('New annotation received:', data.annotation);
            if (this.callbacks.onNewAnnotation) {
                this.callbacks.onNewAnnotation(data.annotation);
            }
        });
        this.socket.on(CollaborationEvent.UPDATED_ANNOTATION, (data) => {
            console.log('Updated annotation received:', data.annotation);
            if (this.callbacks.onUpdatedAnnotation) {
                this.callbacks.onUpdatedAnnotation(data.annotation);
            }
        });
        this.socket.on(CollaborationEvent.DELETED_ANNOTATION, (data) => {
            console.log('Deleted annotation:', data.annotationId);
            if (this.callbacks.onDeletedAnnotation) {
                this.callbacks.onDeletedAnnotation(data.annotationId);
            }
        });
        // Cursor and selection events
        this.socket.on(CollaborationEvent.CURSOR_POSITION, (data) => {
            if (this.callbacks.onCursorPosition) {
                this.callbacks.onCursorPosition(data.userId, data.username, data.position);
            }
        });
        this.socket.on(CollaborationEvent.SELECTION, (data) => {
            if (this.callbacks.onSelection) {
                this.callbacks.onSelection(data.userId, data.username, data.selection);
            }
        });
        // Lock events
        this.socket.on(CollaborationEvent.ANNOTATION_LOCK, (data) => {
            console.log(`Annotation ${data.annotationId} locked by ${data.username}`);
            if (this.callbacks.onAnnotationLock) {
                this.callbacks.onAnnotationLock(data.annotationId, data.userId, data.username);
            }
        });
        this.socket.on(CollaborationEvent.ANNOTATION_UNLOCK, (data) => {
            console.log(`Annotation ${data.annotationId} unlocked`);
            if (this.callbacks.onAnnotationUnlock) {
                this.callbacks.onAnnotationUnlock(data.annotationId);
            }
        });
        // Error handling
        this.socket.on(CollaborationEvent.ERROR, (data) => {
            console.error('Collaboration error:', data);
            if (this.callbacks.onError) {
                this.callbacks.onError(data);
            }
        });
    }
    /**
     * Set event callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    /**
     * Join a room (article, collection, annotation)
     */
    joinRoom(type, id) {
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
    leaveRoom(type, id) {
        if (!this.socket || !this.isConnected)
            return;
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
    sendCursorPosition(annotationId, position) {
        if (!this.socket || !this.isConnected)
            return;
        this.socket.emit(CollaborationEvent.CURSOR_POSITION, {
            annotationId,
            position
        });
    }
    /**
     * Send selection update
     */
    sendSelection(articleId, selection) {
        if (!this.socket || !this.isConnected)
            return;
        this.socket.emit(CollaborationEvent.SELECTION, {
            articleId,
            selection
        });
    }
    /**
     * Create a new annotation
     */
    createAnnotation(articleId, annotation) {
        if (!this.socket || !this.isConnected)
            return;
        this.socket.emit(CollaborationEvent.NEW_ANNOTATION, {
            articleId,
            annotation
        });
    }
    /**
     * Update an annotation
     */
    updateAnnotation(annotation) {
        if (!this.socket || !this.isConnected)
            return;
        this.socket.emit(CollaborationEvent.UPDATED_ANNOTATION, {
            annotation
        });
    }
    /**
     * Delete an annotation
     */
    deleteAnnotation(articleId, annotationId) {
        if (!this.socket || !this.isConnected)
            return;
        this.socket.emit(CollaborationEvent.DELETED_ANNOTATION, {
            articleId,
            annotationId
        });
    }
    /**
     * Lock an annotation for editing
     */
    lockAnnotation(annotationId, articleId) {
        if (!this.socket || !this.isConnected)
            return;
        this.socket.emit(CollaborationEvent.ANNOTATION_LOCK, {
            annotationId,
            articleId
        });
    }
    /**
     * Unlock an annotation
     */
    unlockAnnotation(annotationId, articleId) {
        if (!this.socket || !this.isConnected)
            return;
        this.socket.emit(CollaborationEvent.ANNOTATION_UNLOCK, {
            annotationId,
            articleId
        });
    }
    /**
     * Disconnect from the collaboration server
     */
    disconnect() {
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
    isClientConnected() {
        return this.isConnected;
    }
}
// Create singleton instance
const collaborationClient = new CollaborationClient();
export default collaborationClient;
