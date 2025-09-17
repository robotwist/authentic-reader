import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Rate, Button, Typography, Input, Card, Divider, Space, Collapse, } from 'antd';
import { LikeOutlined, DislikeOutlined, DownOutlined, UpOutlined, SendOutlined, LikeFilled, DislikeFilled } from '@ant-design/icons';
import { chromaService } from '../services/chromaService';
import { logger } from '../utils/logger';
const { TextArea } = Input;
const { Text, Title } = Typography;
const { Panel } = Collapse;
const FeedbackPanel = ({ articleId, analysisType, originalPrediction, onFeedbackSubmitted }) => {
    const [expanded, setExpanded] = useState(false);
    const [rating, setRating] = useState(null);
    const [comment, setComment] = useState('');
    const [correct, setCorrect] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleExpandClick = () => {
        setExpanded(!expanded);
    };
    const handleRatingChange = (value) => {
        setRating(value);
    };
    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };
    const handleThumbClick = (isCorrect) => {
        setCorrect(isCorrect);
    };
    const handleSubmit = async () => {
        if (correct === null && rating === null && !comment) {
            return; // Nothing to submit
        }
        setLoading(true);
        const feedback = {
            articleId,
            analysisType,
            originalPrediction,
            userFeedback: {
                isCorrect: correct,
                rating: rating,
                comment: comment || undefined
            },
            timestamp: Date.now()
        };
        try {
            // Store feedback in ChromaDB
            await chromaService.storeFeedback(feedback);
            setSubmitted(true);
            setLoading(false);
            // Reset form
            setRating(null);
            setComment('');
            setCorrect(null);
            // Call the callback if provided
            if (onFeedbackSubmitted) {
                onFeedbackSubmitted(feedback);
            }
            logger.info(`Feedback for ${analysisType} analysis on article ${articleId} submitted`);
        }
        catch (error) {
            logger.error('Error submitting feedback:', error);
            setLoading(false);
        }
    };
    // Reset the submitted state when expanding the panel again
    useEffect(() => {
        if (expanded) {
            setSubmitted(false);
        }
    }, [expanded]);
    return (_jsxs(Card, { style: {
            marginTop: 16,
            borderRadius: '8px'
        }, size: "small", children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }, onClick: handleExpandClick, children: [_jsx(Text, { type: "secondary", children: submitted ? "Thanks for your feedback!" : "How was this analysis?" }), expanded ? _jsx(UpOutlined, {}) : _jsx(DownOutlined, {})] }), expanded && (_jsxs(_Fragment, { children: [_jsx(Divider, { style: { margin: '12px 0' } }), !submitted ? (_jsxs("div", { style: { padding: 8 }, children: [_jsx(Text, { style: { marginBottom: 8, display: 'block' }, children: "Was this analysis helpful?" }), _jsxs(Space, { style: { marginBottom: 16 }, children: [_jsx(Button, { size: "small", type: correct === true ? "primary" : "default", icon: correct === true ? _jsx(LikeFilled, {}) : _jsx(LikeOutlined, {}), onClick: () => handleThumbClick(true), children: "Yes" }), _jsx(Button, { size: "small", type: correct === false ? "primary" : "default", danger: correct === false, icon: correct === false ? _jsx(DislikeFilled, {}) : _jsx(DislikeOutlined, {}), onClick: () => handleThumbClick(false), children: "No" })] }), _jsx(Text, { style: { marginBottom: 8, display: 'block' }, children: "Rate the quality of this analysis:" }), _jsx(Rate, { allowClear: true, value: rating || 0, onChange: handleRatingChange, style: { marginBottom: 16, display: 'block' } }), _jsx(TextArea, { rows: 2, placeholder: "Additional comments (optional)", value: comment, onChange: handleCommentChange, style: { marginBottom: 16 } }), _jsx("div", { style: { display: 'flex', justifyContent: 'flex-end' }, children: _jsx(Button, { type: "primary", icon: _jsx(SendOutlined, {}), onClick: handleSubmit, loading: loading, children: "Submit Feedback" }) })] })) : (_jsxs("div", { style: { padding: 8, textAlign: 'center' }, children: [_jsx(Text, { type: "success", strong: true, style: { fontSize: '16px', display: 'block', marginBottom: 8 }, children: "Thank you for your feedback!" }), _jsx(Text, { type: "secondary", children: "Your input helps us improve our analysis." })] }))] }))] }));
};
export default FeedbackPanel;
