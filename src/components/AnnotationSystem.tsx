import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { 
  Box, Button, Typography, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, CircularProgress, 
  IconButton, Menu, MenuItem, InputAdornment, Chip, Tooltip,
  Badge, Avatar, Divider, Card, CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Group as GroupIcon,
  Bookmark as BookmarkIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  PersonOutline as UserIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an auth context
import BiasTagger from './BiasTagger';
import '../styles/AnnotationSystem.css';

// Type definitions
export interface Annotation {
  id: string;
  userId: string;
  username?: string;
  userAvatar?: string;
  articleId?: string;
  url?: string;
  title?: string;
  text: string;
  richText?: string; // HTML or markdown for rich text
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  type: 'note' | 'highlight' | 'comment' | 'question' | 'summary';
  tags: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  visibility: 'private' | 'public' | 'shared';
  sharedWith?: string[];
  reactionCount?: number;
  reactions?: {type: string, count: number, userReacted: boolean}[];
  replies?: Annotation[];
  parentId?: string;
  collectionId?: string;
  version?: number;
  versionHistory?: {version: number, timestamp: string}[];
  createdAt: string;
  updatedAt: string;
  biasTags?: {type: string, confidence: number}[];
  rhetoricalTags?: {type: string, confidence: number}[];
}

export interface SelectionData {
  text: string;
  start: number;
  end: number;
}

export interface AnnotationSystemProps {
  articleId?: string;
  url?: string;
  title?: string;
  onAnnotationCreated?: (annotation: Annotation) => void;
  onAnnotationUpdated?: (annotation: Annotation) => void;
  onAnnotationDeleted?: (id: string) => void;
}

export const AnnotationSystem: React.FC<AnnotationSystemProps> = ({
  articleId,
  url,
  title,
  onAnnotationCreated,
  onAnnotationUpdated,
  onAnnotationDeleted
}) => {
  // Auth context for current user
  const { user } = useAuth();
  
  // State for annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for current annotation being edited
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  
  // Search and filter state
  const [searchText, setSearchText] = useState<string>('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAnnotation, setMenuAnnotation] = useState<Annotation | null>(null);
  
  // Bias tagger state
  const [biasTagOpen, setBiasTagOpen] = useState<boolean>(false);
  const [currentSelection, setCurrentSelection] = useState<SelectionData | null>(null);
  
  // Socket.io connection
  const socketRef = useRef<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<{userId: string, username: string, avatar?: string}[]>([]);
  const [lockedAnnotations, setLockedAnnotations] = useState<{[key: string]: {userId: string, username: string}}>({}); 
  
  // Collection state
  const [collections, setCollections] = useState<{id: string, name: string}[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL);
    
    // Set user data
    if (user) {
      socketRef.current.emit('set_user_data', {
        userId: user.id,
        username: user.username || user.name,
        avatar: user.avatar
      });
    }
    
    // Join article room if articleId is available
    if (articleId) {
      socketRef.current.emit('join_room', {
        type: 'article',
        id: articleId
      });
    }
    
    // Set up socket event listeners
    const socket = socketRef.current;
    
    socket.on('room_joined', (data) => {
      setActiveUsers(data.activeUsers);
      console.log('Joined room:', data.room);
    });
    
    socket.on('user_joined', (data) => {
      setActiveUsers(data.activeUsers);
      console.log('User joined:', data.user);
    });
    
    socket.on('user_left', (data) => {
      setActiveUsers(data.activeUsers);
      console.log('User left:', data.user);
    });
    
    socket.on('new_annotation', (data) => {
      setAnnotations(prev => [data.annotation, ...prev]);
      console.log('New annotation received:', data.annotation);
    });
    
    socket.on('updated_annotation', (data) => {
      setAnnotations(prev => 
        prev.map(a => a.id === data.annotation.id ? data.annotation : a)
      );
      console.log('Updated annotation received:', data.annotation);
    });
    
    socket.on('deleted_annotation', (data) => {
      setAnnotations(prev => 
        prev.filter(a => a.id !== data.annotationId)
      );
      console.log('Deleted annotation:', data.annotationId);
    });
    
    socket.on('annotation_lock', (data) => {
      setLockedAnnotations(prev => ({
        ...prev,
        [data.annotationId]: {
          userId: data.userId,
          username: data.username
        }
      }));
      console.log('Annotation locked:', data);
    });
    
    socket.on('annotation_unlock', (data) => {
      setLockedAnnotations(prev => {
        const updated = {...prev};
        delete updated[data.annotationId];
        return updated;
      });
      console.log('Annotation unlocked:', data.annotationId);
    });
    
    socket.on('error', (data) => {
      console.error('Socket error:', data);
      // Handle specific errors, e.g., show notification if annotation is locked
      if (data.code === 'LOCKED') {
        // Show notification that annotation is locked
        alert(`This annotation is being edited by ${data.lockedBy}`);
      }
    });
    
    // Clean up socket connection on unmount
    return () => {
      if (articleId && socket) {
        socket.emit('leave_room', {
          type: 'article',
          id: articleId
        });
      }
      socket.disconnect();
    };
  }, [articleId, user]);
  
  // Fetch annotations
  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query params
        const params = new URLSearchParams();
        if (articleId) params.append('articleId', articleId);
        if (url) params.append('url', url);
        if (selectedCollection) params.append('collectionId', selectedCollection);
        
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annotations`, { params });
        setAnnotations(response.data);
      } catch (err) {
        console.error('Error fetching annotations:', err);
        setError('Failed to fetch annotations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnotations();
  }, [articleId, url, selectedCollection]);
  
  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annotations/collections`);
        setCollections(response.data);
      } catch (err) {
        console.error('Error fetching collections:', err);
      }
    };
    
    if (user) {
      fetchCollections();
    }
  }, [user]);
  
  // Create annotation
  const createAnnotation = async (annotation: Partial<Annotation>) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/annotations`, annotation);
      const newAnnotation = response.data;
      
      // Update local state
      setAnnotations(prev => [newAnnotation, ...prev]);
      
      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('new_annotation', {
          articleId: annotation.articleId || articleId,
          annotation: newAnnotation
        });
      }
      
      // Callback
      if (onAnnotationCreated) {
        onAnnotationCreated(newAnnotation);
      }
      
      return newAnnotation;
    } catch (err) {
      console.error('Error creating annotation:', err);
      throw err;
    }
  };
  
  // Update annotation
  const updateAnnotation = async (id: string, updates: Partial<Annotation>) => {
    try {
      // Lock the annotation first
      if (socketRef.current) {
        socketRef.current.emit('annotation_lock', {
          annotationId: id,
          articleId: updates.articleId || articleId
        });
      }
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/annotations/${id}`, updates);
      const updatedAnnotation = response.data;
      
      // Update local state
      setAnnotations(prev => 
        prev.map(a => a.id === id ? updatedAnnotation : a)
      );
      
      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('updated_annotation', {
          annotation: updatedAnnotation
        });
        
        // Unlock the annotation
        socketRef.current.emit('annotation_unlock', {
          annotationId: id,
          articleId: updatedAnnotation.articleId || articleId
        });
      }
      
      // Callback
      if (onAnnotationUpdated) {
        onAnnotationUpdated(updatedAnnotation);
      }
      
      return updatedAnnotation;
    } catch (err) {
      console.error('Error updating annotation:', err);
      throw err;
    }
  };
  
  // Delete annotation
  const deleteAnnotation = async (id: string) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/annotations/${id}`);
      
      // Get the annotation before removing it
      const annotation = annotations.find(a => a.id === id);
      
      // Update local state
      setAnnotations(prev => prev.filter(a => a.id !== id));
      
      // Emit socket event
      if (socketRef.current && annotation) {
        socketRef.current.emit('deleted_annotation', {
          articleId: annotation.articleId || articleId,
          annotationId: id
        });
      }
      
      // Callback
      if (onAnnotationDeleted) {
        onAnnotationDeleted(id);
      }
    } catch (err) {
      console.error('Error deleting annotation:', err);
      throw err;
    }
  };
  
  // Add reaction to annotation
  const addReaction = async (annotationId: string, reactionType: string) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/annotations/${annotationId}/reactions`, {
        type: reactionType
      });
      
      // Update annotation in local state
      const updatedAnnotations = [...annotations];
      const index = updatedAnnotations.findIndex(a => a.id === annotationId);
      
      if (index !== -1) {
        const annotation = {...updatedAnnotations[index]};
        
        // Update or add reaction
        if (!annotation.reactions) {
          annotation.reactions = [];
        }
        
        const reactionIndex = annotation.reactions.findIndex(r => r.type === reactionType);
        
        if (reactionIndex !== -1) {
          annotation.reactions[reactionIndex] = {
            ...annotation.reactions[reactionIndex],
            count: annotation.reactions[reactionIndex].count + 1,
            userReacted: true
          };
        } else {
          annotation.reactions.push({
            type: reactionType,
            count: 1,
            userReacted: true
          });
        }
        
        // Update total reaction count
        annotation.reactionCount = (annotation.reactionCount || 0) + 1;
        
        updatedAnnotations[index] = annotation;
        setAnnotations(updatedAnnotations);
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, annotation: Annotation) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuAnnotation(annotation);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuAnnotation(null);
  };
  
  // Handle edit annotation
  const handleEditAnnotation = () => {
    if (menuAnnotation) {
      // Check if annotation is locked by another user
      if (lockedAnnotations[menuAnnotation.id] && 
          lockedAnnotations[menuAnnotation.id].userId !== user?.id) {
        alert(`This annotation is being edited by ${lockedAnnotations[menuAnnotation.id].username}`);
        handleMenuClose();
        return;
      }
      
      setCurrentAnnotation(menuAnnotation);
      setDialogMode('edit');
      setOpenDialog(true);
      handleMenuClose();
    }
  };
  
  // Handle delete annotation
  const handleDeleteAnnotation = () => {
    if (menuAnnotation) {
      if (window.confirm('Are you sure you want to delete this annotation?')) {
        deleteAnnotation(menuAnnotation.id);
      }
      handleMenuClose();
    }
  };
  
  // Handle dialog save
  const handleDialogSave = async () => {
    if (!currentAnnotation) return;
    
    try {
      if (dialogMode === 'create') {
        await createAnnotation({
          ...currentAnnotation,
          userId: user?.id,
          articleId: articleId || currentAnnotation.articleId,
          url: url || currentAnnotation.url,
          title: title || currentAnnotation.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateAnnotation(currentAnnotation.id, {
          ...currentAnnotation,
          updatedAt: new Date().toISOString()
        });
      }
      
      setOpenDialog(false);
      setCurrentAnnotation(null);
    } catch (err) {
      console.error('Error saving annotation:', err);
      alert('Failed to save annotation. Please try again.');
    }
  };
  
  // Handle opening bias tagger
  const handleOpenBiasTagger = (annotation?: Annotation) => {
    if (annotation) {
      setCurrentAnnotation(annotation);
      setCurrentSelection({
        text: annotation.text,
        start: 0,
        end: annotation.text.length
      });
    }
    setBiasTagOpen(true);
  };
  
  // Handle applying bias tags
  const handleApplyBiasTags = async (tags: {type: string, confidence: number}[]) => {
    if (!currentAnnotation) return;
    
    try {
      const updatedAnnotation = await updateAnnotation(currentAnnotation.id, {
        biasTags: tags
      });
      
      setBiasTagOpen(false);
      setCurrentAnnotation(null);
    } catch (err) {
      console.error('Error applying bias tags:', err);
      alert('Failed to apply bias tags. Please try again.');
    }
  };
  
  // Filter and sort annotations
  const filteredAnnotations = annotations
    .filter(annotation => {
      // Text search
      if (searchText && !annotation.text.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filterType && annotation.type !== filterType) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by date or popularity
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === 'popular') {
        return (b.reactionCount || 0) - (a.reactionCount || 0);
      }
      return 0;
    });
  
  // Render annotation type icon
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <EditIcon fontSize="small" />;
      case 'highlight':
        return <BookmarkIcon fontSize="small" />;
      case 'comment':
        return <CommentIcon fontSize="small" />;
      case 'question':
        return <HelpIcon fontSize="small" />;
      case 'summary':
        return <SummarizeIcon fontSize="small" />;
      default:
        return <EditIcon fontSize="small" />;
    }
  };
  
  return (
    <div className="annotation-system">
      {/* Header with active users */}
      <div className="annotation-header">
        <Typography variant="h6">Annotations</Typography>
        <div className="active-users">
          {activeUsers.length > 0 && (
            <Tooltip title={`${activeUsers.length} active users`}>
              <div className="user-avatars">
                {activeUsers.slice(0, 3).map(user => (
                  <Avatar 
                    key={user.userId} 
                    src={user.avatar} 
                    className="user-avatar"
                    alt={user.username}
                  >
                    {!user.avatar && user.username?.charAt(0)}
                  </Avatar>
                ))}
                {activeUsers.length > 3 && (
                  <Avatar className="user-avatar">+{activeUsers.length - 3}</Avatar>
                )}
              </div>
            </Tooltip>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="annotation-controls">
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentAnnotation({
              id: '',
              userId: user?.id || '',
              text: '',
              type: 'note',
              tags: [],
              visibility: 'private',
              createdAt: '',
              updatedAt: ''
            });
            setDialogMode('create');
            setOpenDialog(true);
          }}
        >
          New Annotation
        </Button>
        
        {/* Collection selector */}
        {collections.length > 0 && (
          <Box sx={{ ml: 2 }}>
            <Select
              value={selectedCollection || ''}
              onChange={(e) => setSelectedCollection(e.target.value)}
              displayEmpty
              variant="outlined"
              size="small"
            >
              <MenuItem value="">All Annotations</MenuItem>
              {collections.map(collection => (
                <MenuItem key={collection.id} value={collection.id}>
                  {collection.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}
      </div>
      
      {/* Search and filter */}
      <div className="annotation-search">
        <TextField
          placeholder="Search annotations..."
          variant="outlined"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        <div className="filter-buttons">
          <Tooltip title="Filter by type">
            <IconButton onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Sort annotations">
            <IconButton onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
              <SortIcon />
            </IconButton>
          </Tooltip>
        </div>
        
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl) && !menuAnnotation}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">Filter by Type</Typography>
          </MenuItem>
          <MenuItem onClick={() => { setFilterType(null); handleMenuClose(); }}>
            All Types
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('note'); handleMenuClose(); }}>
            Notes
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('highlight'); handleMenuClose(); }}>
            Highlights
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('comment'); handleMenuClose(); }}>
            Comments
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('question'); handleMenuClose(); }}>
            Questions
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('summary'); handleMenuClose(); }}>
            Summaries
          </MenuItem>
          <Divider />
          <MenuItem disabled>
            <Typography variant="subtitle2">Sort by</Typography>
          </MenuItem>
          <MenuItem onClick={() => { setSortOrder('newest'); handleMenuClose(); }}>
            Newest first
          </MenuItem>
          <MenuItem onClick={() => { setSortOrder('oldest'); handleMenuClose(); }}>
            Oldest first
          </MenuItem>
          <MenuItem onClick={() => { setSortOrder('popular'); handleMenuClose(); }}>
            Most popular
          </MenuItem>
        </Menu>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="annotation-loading">
          <CircularProgress />
          <Typography>Loading annotations...</Typography>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="annotation-error">
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}
      
      {/* Annotations list */}
      <div className="annotation-list">
        {!loading && filteredAnnotations.length === 0 && (
          <div className="no-annotations">
            <Typography>No annotations found</Typography>
          </div>
        )}
        
        {filteredAnnotations.map(annotation => (
          <Card key={annotation.id} className="annotation-item">
            <CardContent>
              <div className="annotation-header">
                <div className="annotation-user">
                  <Avatar src={annotation.userAvatar} className="user-avatar">
                    {!annotation.userAvatar && (annotation.username || 'U').charAt(0)}
                  </Avatar>
                  <div>
                    <Typography variant="subtitle2">
                      {annotation.username || 'Anonymous'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
                    </Typography>
                  </div>
                </div>
                
                <div className="annotation-actions">
                  {/* Lock indicator */}
                  {lockedAnnotations[annotation.id] && (
                    <Tooltip title={`Being edited by ${lockedAnnotations[annotation.id].username}`}>
                      <LockIcon fontSize="small" color="warning" />
                    </Tooltip>
                  )}
                  
                  {annotation.userId === user?.id && (
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, annotation)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
              </div>
              
              <div className="annotation-content">
                <div className="annotation-type">
                  <Tooltip title={annotation.type}>
                    {renderTypeIcon(annotation.type)}
                  </Tooltip>
                </div>
                
                <div className="annotation-text">
                  {annotation.richText ? (
                    <div dangerouslySetInnerHTML={{ __html: annotation.richText }} />
                  ) : (
                    <Typography>{annotation.text}</Typography>
                  )}
                  
                  {/* Selected text preview */}
                  {annotation.selectedText && (
                    <div className="selected-text">
                      <Typography variant="caption" color="textSecondary">
                        "{annotation.selectedText}"
                      </Typography>
                    </div>
                  )}
                  
                  {/* Bias tags */}
                  {annotation.biasTags && annotation.biasTags.length > 0 && (
                    <div className="annotation-tags">
                      {annotation.biasTags.map((tag, index) => (
                        <Chip 
                          key={index}
                          label={`${tag.type} (${Math.round(tag.confidence * 100)}%)`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          className="bias-tag"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tags */}
              {annotation.tags && annotation.tags.length > 0 && (
                <div className="annotation-tags">
                  {annotation.tags.map((tag, index) => (
                    <Chip 
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      className="tag"
                    />
                  ))}
                </div>
              )}
              
              {/* Reactions */}
              <div className="annotation-reactions">
                <Tooltip title="Like">
                  <IconButton 
                    size="small"
                    onClick={() => addReaction(annotation.id, 'like')}
                    color={annotation.reactions?.find(r => r.type === 'like' && r.userReacted) ? 'primary' : 'default'}
                  >
                    <Badge 
                      badgeContent={annotation.reactions?.find(r => r.type === 'like')?.count || 0} 
                      color="primary"
                    >
                      <ThumbUpIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Add comment">
                  <IconButton size="small">
                    <Badge 
                      badgeContent={annotation.replies?.length || 0} 
                      color="primary"
                    >
                      <CommentIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="View history">
                  <IconButton 
                    size="small"
                    disabled={!annotation.versionHistory || annotation.versionHistory.length <= 1}
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Analyze bias">
                  <IconButton 
                    size="small"
                    onClick={() => handleOpenBiasTagger(annotation)}
                  >
                    <AssessmentIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Annotation dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Annotation' : 'Edit Annotation'}
        </DialogTitle>
        
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Text"
            fullWidth
            multiline
            rows={4}
            value={currentAnnotation?.text || ''}
            onChange={(e) => setCurrentAnnotation(prev => 
              prev ? {...prev, text: e.target.value} : null
            )}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Type</Typography>
            <div className="annotation-type-selector">
              {['note', 'highlight', 'comment', 'question', 'summary'].map(type => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  icon={renderTypeIcon(type)}
                  onClick={() => setCurrentAnnotation(prev => 
                    prev ? {...prev, type: type as any} : null
                  )}
                  color={currentAnnotation?.type === type ? 'primary' : 'default'}
                  variant={currentAnnotation?.type === type ? 'filled' : 'outlined'}
                  className="type-chip"
                />
              ))}
            </div>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Tags</Typography>
            <TextField
              placeholder="Add tags separated by commas"
              fullWidth
              value={currentAnnotation?.tags.join(', ') || ''}
              onChange={(e) => setCurrentAnnotation(prev => 
                prev ? {...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)} : null
              )}
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Visibility</Typography>
            <div className="annotation-visibility-selector">
              {['private', 'public', 'shared'].map(visibility => (
                <Chip
                  key={visibility}
                  label={visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                  onClick={() => setCurrentAnnotation(prev => 
                    prev ? {...prev, visibility: visibility as any} : null
                  )}
                  color={currentAnnotation?.visibility === visibility ? 'primary' : 'default'}
                  variant={currentAnnotation?.visibility === visibility ? 'filled' : 'outlined'}
                  className="visibility-chip"
                />
              ))}
            </div>
          </Box>
          
          {/* Collection selector */}
          {collections.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Collection</Typography>
              <Select
                value={currentAnnotation?.collectionId || ''}
                onChange={(e) => setCurrentAnnotation(prev => 
                  prev ? {...prev, collectionId: e.target.value} : null
                )}
                displayEmpty
                fullWidth
              >
                <MenuItem value="">No Collection</MenuItem>
                {collections.map(collection => (
                  <MenuItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDialogSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Annotation menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl) && Boolean(menuAnnotation)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditAnnotation}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleOpenBiasTagger(menuAnnotation!); handleMenuClose(); }}>
          <ListItemIcon>
            <AssessmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Bias Analysis</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDeleteAnnotation}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Bias Tagger Dialog */}
      <BiasTagger
        open={biasTagOpen}
        onClose={() => setBiasTagOpen(false)}
        selectedText={currentSelection?.text || ''}
        existingTags={currentAnnotation?.biasTags || []}
        onApplyTags={handleApplyBiasTags}
      />
    </div>
  );
};

export default AnnotationSystem; 