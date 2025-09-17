import React, { useState, useEffect } from 'react';
import { 
  Rate, 
  Button, 
  Typography, 
  Input, 
  Card, 
  Divider,
  Tag,
  Space,
  Collapse,
} from 'antd';
import { 
  LikeOutlined, 
  DislikeOutlined, 
  DownOutlined, 
  UpOutlined, 
  SendOutlined, 
  LikeFilled, 
  DislikeFilled
} from '@ant-design/icons';
import { chromaService } from '../services/chromaService';
import { logger } from '../utils/logger';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Panel } = Collapse;

interface FeedbackPanelProps {
  articleId: string;
  analysisType: string;  // e.g., "fallacy", "sentiment", "summary"
  originalPrediction: any;
  onFeedbackSubmitted?: (feedback: any) => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ 
  articleId,
  analysisType,
  originalPrediction,
  onFeedbackSubmitted
}) => {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  const handleRatingChange = (value: number) => {
    setRating(value);
  };
  
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };
  
  const handleThumbClick = (isCorrect: boolean) => {
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
    } catch (error) {
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
  
  return (
    <Card 
      style={{ 
        marginTop: 16, 
        borderRadius: '8px'
      }}
      size="small"
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={handleExpandClick}
      >
        <Text type="secondary">
          {submitted ? "Thanks for your feedback!" : "How was this analysis?"}
        </Text>
        {expanded ? <UpOutlined /> : <DownOutlined />}
      </div>
      
      {expanded && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          
          {!submitted ? (
            <div style={{ padding: 8 }}>
              <Text style={{ marginBottom: 8, display: 'block' }}>
                Was this analysis helpful?
              </Text>
              
              <Space style={{ marginBottom: 16 }}>
                <Button 
                  size="small" 
                  type={correct === true ? "primary" : "default"} 
                  icon={correct === true ? <LikeFilled /> : <LikeOutlined />}
                  onClick={() => handleThumbClick(true)}
                >
                  Yes
                </Button>
                <Button 
                  size="small" 
                  type={correct === false ? "primary" : "default"} 
                  danger={correct === false}
                  icon={correct === false ? <DislikeFilled /> : <DislikeOutlined />}
                  onClick={() => handleThumbClick(false)}
                >
                  No
                </Button>
              </Space>
              
              <Text style={{ marginBottom: 8, display: 'block' }}>
                Rate the quality of this analysis:
              </Text>
              
              <Rate
                allowClear
                value={rating || 0}
                onChange={handleRatingChange}
                style={{ marginBottom: 16, display: 'block' }}
              />
              
              <TextArea
                rows={2}
                placeholder="Additional comments (optional)"
                value={comment}
                onChange={handleCommentChange}
                style={{ marginBottom: 16 }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 8, textAlign: 'center' }}>
              <Text type="success" strong style={{ fontSize: '16px', display: 'block', marginBottom: 8 }}>
                Thank you for your feedback!
              </Text>
              <Text type="secondary">
                Your input helps us improve our analysis.
              </Text>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default FeedbackPanel; 