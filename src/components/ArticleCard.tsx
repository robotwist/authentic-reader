import React, { useState } from 'react';
import '../styles/ArticleCard.css';
import { Article } from '../types/Article';
import { formatDate, truncateText } from '../utils/textUtils';
import { 
  FaBookmark, FaRegBookmark, FaChevronRight, 
  FaEye, FaEyeSlash, FaTextHeight, FaSpinner 
} from 'react-icons/fa';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { Badge } from './ui/Badge';
import { getArticleTypeIcon } from '../utils/articleUtils';
import defaultImage from '../assets/default-article.svg';
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Rating
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface ArticleCardProps {
  article: Article;
  onRead: (articleId: string) => void;
  onSave: (articleId: string) => void;
  onAnalyze?: (article: Article) => void;
  highlight?: 'doom' | 'error';
}

const StyledCard = styled(Card)<{ highlight?: string }>(({ theme, highlight }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  ...(highlight === 'doom' && {
    border: `2px solid ${theme.palette.error.main}`,
    backgroundColor: theme.palette.error.light,
  }),
  ...(highlight === 'error' && {
    border: `2px solid ${theme.palette.warning.main}`,
    backgroundColor: theme.palette.warning.light,
  }),
}));

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  onRead, 
  onSave, 
  onAnalyze,
  highlight
}) => {
  const [imageError, setImageError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  // Check if article has a valid image
  const hasValidImage = article.image && !imageError;

  // Get the appropriate image source with fallbacks
  const getImageSource = () => {
    if (imageError || !article.image) {
      return article.source?.favicon ? article.source.favicon : defaultImage;
    }
    return article.image;
  };

  // Get the article URL with fallbacks
  const getArticleUrl = () => {
    return article.url || 
           (article as any).link || 
           (article as any).guid?.toString() || 
           '#';
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on buttons or links
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLAnchorElement ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return;
    }
    
    console.log('Article clicked:', article);
    
    // Try different possible URL properties
    const articleUrl = article.url || 
                      (article as any).link || 
                      (article as any).guid?.toString() || 
                      '';
    
    if (articleUrl) {
      console.log('Opening article URL:', articleUrl);
      window.open(articleUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.error('No URL found for article:', article);
      alert('Sorry, this article does not have a valid URL to open.');
    }
  };

  const handleReadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRead(article.id);
  };

  const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSave(article.id);
  };

  const handleAnalyzeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAnalyzing) return; // Prevent multiple clicks
    
    setIsAnalyzing(true);
    logger.debug('🔍 Analyze button clicked for article:', article.title);
    
    try {
      if (onAnalyze) {
        // Pass the whole article object to the handler
        await onAnalyze(article);
      }
    } catch (error) {
      logger.error('Error in handleAnalyzeClick:', error);
    } finally {
      // Add a small delay before resetting to prevent flickering
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 500);
    }
  };

  const handleClick = () => {
    navigate(`/article/${article.id}`);
  };

  return (
    <StyledCard highlight={highlight}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {article.title}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {article.source?.name} • {new Date(article.pubDate).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            By {article.author}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={`Bias: ${article.source?.bias.toFixed(1)}`}
            color={article.source?.bias > 0.5 ? 'error' : 'success'}
            size="small"
          />
          <Chip
            label={`Reliability: ${article.source?.reliability.toFixed(1)}`}
            color={article.source?.reliability > 0.5 ? 'success' : 'error'}
            size="small"
          />
        </Box>

        {highlight === 'doom' && article.analysis?.doomScore && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="error">
              Doomscroll Score: {article.analysis.doomScore.toFixed(1)}
            </Typography>
            <Rating value={article.analysis.doomScore} max={1} readOnly />
          </Box>
        )}

        {highlight === 'error' && article.analysis?.errorScore && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="warning.main">
              Error Score: {article.analysis.errorScore.toFixed(1)}
            </Typography>
            <Rating value={article.analysis.errorScore} max={1} readOnly />
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}>
          {article.content}
        </Typography>

        <Box sx={{ mt: 2 }}>
          {article.analysis && (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  label={`Bias: ${article.analysis.bias || 'Unknown'}`}
                  color={article.analysis.bias === 'high' ? 'error' : 
                         article.analysis.bias === 'medium' ? 'warning' : 'success'}
                  size="small"
                />
                <Chip
                  label={`Reliability: ${article.analysis.reliability || 'Unknown'}`}
                  color={article.analysis.reliability === 'high' ? 'success' : 
                         article.analysis.reliability === 'medium' ? 'warning' : 'error'}
                  size="small"
                />
              </Box>

              {article.analysis.details && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Analysis Summary:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {article.analysis.details.bias && (
                      <Typography variant="caption" display="block">
                        • Bias Score: {article.analysis.details.bias.biasIndicators?.emotionalLanguage?.toFixed(2) || 'N/A'}
                      </Typography>
                    )}
                    {article.analysis.details.rhetorical && (
                      <Typography variant="caption" display="block">
                        • Argument Strength: {article.analysis.details.rhetorical.argumentStrength?.toFixed(2) || 'N/A'}
                      </Typography>
                    )}
                    {article.analysis.details.manipulation && (
                      <Typography variant="caption" display="block">
                        • Manipulation Risk: {article.analysis.details.manipulation.riskLevel || 'N/A'}
                      </Typography>
                    )}
                    {article.analysis.details.emotion && (
                      <Typography variant="caption" display="block">
                        • Dominant Emotion: {article.analysis.details.emotion.dominantEmotion || 'N/A'}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" onClick={handleClick}>
          Read More
        </Button>
      </CardActions>
    </StyledCard>
  );
};

export default ArticleCard; 