import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Box, Button, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton, Menu, MenuItem, InputAdornment, Chip, Tooltip, Badge, Avatar, Divider, Card, CardContent, Paper } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon, ThumbUp as ThumbUpIcon, Comment as CommentIcon, Sort as SortIcon, FilterList as FilterIcon, Bookmark as BookmarkIcon, MoreVert as MoreVertIcon, History as HistoryIcon, Lock as LockIcon, Assessment as AssessmentIcon, Help as HelpIcon, Summarize as SummarizeIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an auth context
import BiasTagger from './BiasTagger';
import '../styles/AnnotationSystem.css';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
export const AnnotationSystem = ({ articleId, url, title, onAnnotationCreated, onAnnotationUpdated, onAnnotationDeleted }) => {
    // Auth context for current user
    const { user } = useAuth();
    // State for annotations
    const [annotations, setAnnotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // State for current annotation being edited
    const [currentAnnotation, setCurrentAnnotation] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    // Search and filter state
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
    // Menu state
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [menuAnnotation, setMenuAnnotation] = useState(null);
    // Bias tagger state
    const [biasTagOpen, setBiasTagOpen] = useState(false);
    const [currentSelection, setCurrentSelection] = useState(null);
    // Socket.io connection
    const socketRef = useRef(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [lockedAnnotations, setLockedAnnotations] = useState({});
    // Collection state
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
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
            setAnnotations(prev => prev.map(a => a.id === data.annotation.id ? data.annotation : a));
            console.log('Updated annotation received:', data.annotation);
        });
        socket.on('deleted_annotation', (data) => {
            setAnnotations(prev => prev.filter(a => a.id !== data.annotationId));
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
                const updated = { ...prev };
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
                if (articleId)
                    params.append('articleId', articleId);
                if (url)
                    params.append('url', url);
                if (selectedCollection)
                    params.append('collectionId', selectedCollection);
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annotations`, { params });
                setAnnotations(response.data);
            }
            catch (err) {
                console.error('Error fetching annotations:', err);
                setError('Failed to fetch annotations. Please try again.');
            }
            finally {
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
            }
            catch (err) {
                console.error('Error fetching collections:', err);
            }
        };
        if (user) {
            fetchCollections();
        }
    }, [user]);
    // Create annotation
    const createAnnotation = async (annotation) => {
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
        }
        catch (err) {
            console.error('Error creating annotation:', err);
            throw err;
        }
    };
    // Update annotation
    const updateAnnotation = async (id, updates) => {
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
            setAnnotations(prev => prev.map(a => a.id === id ? updatedAnnotation : a));
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
        }
        catch (err) {
            console.error('Error updating annotation:', err);
            throw err;
        }
    };
    // Delete annotation
    const deleteAnnotation = async (id) => {
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
        }
        catch (err) {
            console.error('Error deleting annotation:', err);
            throw err;
        }
    };
    // Add reaction to annotation
    const addReaction = async (annotationId, reactionType) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/annotations/${annotationId}/reactions`, {
                type: reactionType
            });
            // Update annotation in local state
            const updatedAnnotations = [...annotations];
            const index = updatedAnnotations.findIndex(a => a.id === annotationId);
            if (index !== -1) {
                const annotation = { ...updatedAnnotations[index] };
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
                }
                else {
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
        }
        catch (err) {
            console.error('Error adding reaction:', err);
        }
    };
    // Handle menu open
    const handleMenuOpen = (event, annotation) => {
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
        if (!currentAnnotation)
            return;
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
            }
            else {
                await updateAnnotation(currentAnnotation.id, {
                    ...currentAnnotation,
                    updatedAt: new Date().toISOString()
                });
            }
            setOpenDialog(false);
            setCurrentAnnotation(null);
        }
        catch (err) {
            console.error('Error saving annotation:', err);
            alert('Failed to save annotation. Please try again.');
        }
    };
    // Handle opening bias tagger
    const handleOpenBiasTagger = (annotation) => {
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
    const handleApplyBiasTags = async (tags) => {
        if (!currentAnnotation)
            return;
        try {
            const updatedAnnotation = await updateAnnotation(currentAnnotation.id, {
                biasTags: tags
            });
            setBiasTagOpen(false);
            setCurrentAnnotation(null);
        }
        catch (err) {
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
        }
        else if (sortOrder === 'oldest') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        else if (sortOrder === 'popular') {
            return (b.reactionCount || 0) - (a.reactionCount || 0);
        }
        return 0;
    });
    // Render annotation type icon
    const renderTypeIcon = (type) => {
        switch (type) {
            case 'note':
                return _jsx(EditIcon, { fontSize: "small" });
            case 'highlight':
                return _jsx(BookmarkIcon, { fontSize: "small" });
            case 'comment':
                return _jsx(CommentIcon, { fontSize: "small" });
            case 'question':
                return _jsx(HelpIcon, { fontSize: "small" });
            case 'summary':
                return _jsx(SummarizeIcon, { fontSize: "small" });
            default:
                return _jsx(EditIcon, { fontSize: "small" });
        }
    };
    // Define the virtualized list item renderer
    const AnnotationItem = React.memo(({ data, index, style }) => {
        const annotation = data.annotations[index];
        const { handleMenuOpen, addReaction, handleOpenBiasTagger, lockedAnnotations, user, renderTypeIcon } = data;
        return (_jsx("div", { style: { ...style, paddingRight: '8px' }, children: _jsx(Card, { className: "annotation-item", children: _jsxs(CardContent, { children: [_jsxs("div", { className: "annotation-header", children: [_jsxs("div", { className: "annotation-user", children: [_jsx(Avatar, { src: annotation.userAvatar, className: "user-avatar", children: !annotation.userAvatar && (annotation.username || 'U').charAt(0) }), _jsxs("div", { children: [_jsx(Typography, { variant: "subtitle2", children: annotation.username || 'Anonymous' }), _jsx(Typography, { variant: "caption", color: "textSecondary", children: formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true }) })] })] }), _jsxs("div", { className: "annotation-actions", children: [lockedAnnotations[annotation.id] && (_jsx(Tooltip, { title: `Being edited by ${lockedAnnotations[annotation.id].username}`, children: _jsx(LockIcon, { fontSize: "small", color: "warning" }) })), annotation.userId === user?.id && (_jsx(IconButton, { size: "small", onClick: (e) => handleMenuOpen(e, annotation), children: _jsx(MoreVertIcon, { fontSize: "small" }) }))] })] }), _jsxs("div", { className: "annotation-content", children: [_jsx("div", { className: "annotation-type", children: _jsx(Tooltip, { title: annotation.type, children: renderTypeIcon(annotation.type) }) }), _jsxs("div", { className: "annotation-text", children: [annotation.richText ? (_jsx("div", { dangerouslySetInnerHTML: { __html: annotation.richText } })) : (_jsx(Typography, { children: annotation.text })), annotation.selectedText && (_jsx("div", { className: "selected-text", children: _jsxs(Typography, { variant: "caption", color: "textSecondary", children: ["\"", annotation.selectedText, "\""] }) })), annotation.biasTags && annotation.biasTags.length > 0 && (_jsx("div", { className: "annotation-tags", children: annotation.biasTags.map((tag, index) => (_jsx(Chip, { label: `${tag.type} (${Math.round(tag.confidence * 100)}%)`, size: "small", color: "primary", variant: "outlined", className: "bias-tag" }, index))) }))] })] }), annotation.tags && annotation.tags.length > 0 && (_jsx("div", { className: "annotation-tags", children: annotation.tags.map((tag, index) => (_jsx(Chip, { label: tag, size: "small", variant: "outlined", className: "tag" }, index))) })), _jsxs("div", { className: "annotation-reactions", children: [_jsx(Tooltip, { title: "Like", children: _jsx(IconButton, { size: "small", onClick: () => addReaction(annotation.id, 'like'), color: annotation.reactions?.find(r => r.type === 'like' && r.userReacted) ? 'primary' : 'default', children: _jsx(Badge, { badgeContent: annotation.reactions?.find(r => r.type === 'like')?.count || 0, color: "primary", children: _jsx(ThumbUpIcon, { fontSize: "small" }) }) }) }), _jsx(Tooltip, { title: "Add comment", children: _jsx(IconButton, { size: "small", children: _jsx(Badge, { badgeContent: annotation.replies?.length || 0, color: "primary", children: _jsx(CommentIcon, { fontSize: "small" }) }) }) }), _jsx(Tooltip, { title: "View history", children: _jsx(IconButton, { size: "small", disabled: !annotation.versionHistory || annotation.versionHistory.length <= 1, children: _jsx(HistoryIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Analyze bias", children: _jsx(IconButton, { size: "small", onClick: () => handleOpenBiasTagger(annotation), children: _jsx(AssessmentIcon, { fontSize: "small" }) }) })] })] }) }) }));
    });
    return (_jsxs("div", { className: "annotation-system", children: [_jsxs("div", { className: "annotation-header", children: [_jsx(Typography, { variant: "h6", children: "Annotations" }), _jsx("div", { className: "active-users", children: activeUsers.length > 0 && (_jsx(Tooltip, { title: `${activeUsers.length} active users`, children: _jsxs("div", { className: "user-avatars", children: [activeUsers.slice(0, 3).map(user => (_jsx(Avatar, { src: user.avatar, className: "user-avatar", alt: user.username, children: !user.avatar && user.username?.charAt(0) }, user.userId))), activeUsers.length > 3 && (_jsxs(Avatar, { className: "user-avatar", children: ["+", activeUsers.length - 3] }))] }) })) })] }), _jsxs("div", { className: "annotation-controls", children: [_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(AddIcon, {}), onClick: () => {
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
                        }, children: "New Annotation" }), collections.length > 0 && (_jsx(Box, { sx: { ml: 2 }, children: _jsxs(Select, { value: selectedCollection || '', onChange: (e) => setSelectedCollection(e.target.value), displayEmpty: true, variant: "outlined", size: "small", children: [_jsx(MenuItem, { value: "", children: "All Annotations" }), collections.map(collection => (_jsx(MenuItem, { value: collection.id, children: collection.name }, collection.id)))] }) }))] }), _jsxs("div", { className: "annotation-search", children: [_jsx(TextField, { placeholder: "Search annotations...", variant: "outlined", fullWidth: true, value: searchText, onChange: (e) => setSearchText(e.target.value), InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, {}) }))
                        } }), _jsxs("div", { className: "filter-buttons", children: [_jsx(Tooltip, { title: "Filter by type", children: _jsx(IconButton, { onClick: (e) => setMenuAnchorEl(e.currentTarget), children: _jsx(FilterIcon, {}) }) }), _jsx(Tooltip, { title: "Sort annotations", children: _jsx(IconButton, { onClick: (e) => setMenuAnchorEl(e.currentTarget), children: _jsx(SortIcon, {}) }) })] }), _jsxs(Menu, { anchorEl: menuAnchorEl, open: Boolean(menuAnchorEl) && !menuAnnotation, onClose: handleMenuClose, children: [_jsx(MenuItem, { disabled: true, children: _jsx(Typography, { variant: "subtitle2", children: "Filter by Type" }) }), _jsx(MenuItem, { onClick: () => { setFilterType(null); handleMenuClose(); }, children: "All Types" }), _jsx(MenuItem, { onClick: () => { setFilterType('note'); handleMenuClose(); }, children: "Notes" }), _jsx(MenuItem, { onClick: () => { setFilterType('highlight'); handleMenuClose(); }, children: "Highlights" }), _jsx(MenuItem, { onClick: () => { setFilterType('comment'); handleMenuClose(); }, children: "Comments" }), _jsx(MenuItem, { onClick: () => { setFilterType('question'); handleMenuClose(); }, children: "Questions" }), _jsx(MenuItem, { onClick: () => { setFilterType('summary'); handleMenuClose(); }, children: "Summaries" }), _jsx(Divider, {}), _jsx(MenuItem, { disabled: true, children: _jsx(Typography, { variant: "subtitle2", children: "Sort by" }) }), _jsx(MenuItem, { onClick: () => { setSortOrder('newest'); handleMenuClose(); }, children: "Newest first" }), _jsx(MenuItem, { onClick: () => { setSortOrder('oldest'); handleMenuClose(); }, children: "Oldest first" }), _jsx(MenuItem, { onClick: () => { setSortOrder('popular'); handleMenuClose(); }, children: "Most popular" })] })] }), _jsx("div", { className: "annotation-list-container", children: !loading && filteredAnnotations.length === 0 ? (_jsx("div", { className: "no-annotations", children: _jsx(Typography, { children: "No annotations found" }) })) : loading ? (_jsxs("div", { className: "annotation-loading", children: [_jsx(CircularProgress, {}), _jsx(Typography, { children: "Loading annotations..." })] })) : (_jsx(Paper, { elevation: 0, className: "virtualized-list-container", children: _jsx(AutoSizer, { children: ({ height, width }) => (_jsx(FixedSizeList, { height: height || 500, width: width || 400, itemSize: 200, itemCount: filteredAnnotations.length, overscanCount: 5, itemData: {
                                annotations: filteredAnnotations,
                                handleMenuOpen,
                                addReaction,
                                handleOpenBiasTagger,
                                lockedAnnotations,
                                user,
                                renderTypeIcon
                            }, children: AnnotationItem })) }) })) }), _jsxs(Dialog, { open: openDialog, onClose: () => setOpenDialog(false), fullWidth: true, maxWidth: "md", children: [_jsx(DialogTitle, { children: dialogMode === 'create' ? 'Create New Annotation' : 'Edit Annotation' }), _jsxs(DialogContent, { children: [_jsx(TextField, { autoFocus: true, margin: "dense", label: "Text", fullWidth: true, multiline: true, rows: 4, value: currentAnnotation?.text || '', onChange: (e) => setCurrentAnnotation(prev => prev ? { ...prev, text: e.target.value } : null) }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Type" }), _jsx("div", { className: "annotation-type-selector", children: ['note', 'highlight', 'comment', 'question', 'summary'].map(type => (_jsx(Chip, { label: type.charAt(0).toUpperCase() + type.slice(1), icon: renderTypeIcon(type), onClick: () => setCurrentAnnotation(prev => prev ? { ...prev, type: type } : null), color: currentAnnotation?.type === type ? 'primary' : 'default', variant: currentAnnotation?.type === type ? 'filled' : 'outlined', className: "type-chip" }, type))) })] }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Tags" }), _jsx(TextField, { placeholder: "Add tags separated by commas", fullWidth: true, value: currentAnnotation?.tags.join(', ') || '', onChange: (e) => setCurrentAnnotation(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : null) })] }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Visibility" }), _jsx("div", { className: "annotation-visibility-selector", children: ['private', 'public', 'shared'].map(visibility => (_jsx(Chip, { label: visibility.charAt(0).toUpperCase() + visibility.slice(1), onClick: () => setCurrentAnnotation(prev => prev ? { ...prev, visibility: visibility } : null), color: currentAnnotation?.visibility === visibility ? 'primary' : 'default', variant: currentAnnotation?.visibility === visibility ? 'filled' : 'outlined', className: "visibility-chip" }, visibility))) })] }), collections.length > 0 && (_jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Collection" }), _jsxs(Select, { value: currentAnnotation?.collectionId || '', onChange: (e) => setCurrentAnnotation(prev => prev ? { ...prev, collectionId: e.target.value } : null), displayEmpty: true, fullWidth: true, children: [_jsx(MenuItem, { value: "", children: "No Collection" }), collections.map(collection => (_jsx(MenuItem, { value: collection.id, children: collection.name }, collection.id)))] })] }))] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpenDialog(false), children: "Cancel" }), _jsx(Button, { onClick: handleDialogSave, color: "primary", variant: "contained", children: "Save" })] })] }), _jsxs(Menu, { anchorEl: menuAnchorEl, open: Boolean(menuAnchorEl) && Boolean(menuAnnotation), onClose: handleMenuClose, children: [_jsxs(MenuItem, { onClick: handleEditAnnotation, children: [_jsx(ListItemIcon, { children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Edit" })] }), _jsxs(MenuItem, { onClick: () => { handleOpenBiasTagger(menuAnnotation); handleMenuClose(); }, children: [_jsx(ListItemIcon, { children: _jsx(AssessmentIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Add Bias Analysis" })] }), _jsxs(MenuItem, { onClick: handleDeleteAnnotation, children: [_jsx(ListItemIcon, { children: _jsx(DeleteIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Delete" })] })] }), _jsx(BiasTagger, { open: biasTagOpen, onClose: () => setBiasTagOpen(false), selectedText: currentSelection?.text || '', existingTags: currentAnnotation?.biasTags || [], onApplyTags: handleApplyBiasTags })] }));
};
export default AnnotationSystem;
