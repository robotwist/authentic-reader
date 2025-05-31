import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Analysis Components
import BiasDetection from '../components/BiasDetection';
import RhetoricalAnalysis from '../components/RhetoricalAnalysis';
import NetworkAnalysis from '../components/NetworkAnalysis';
import ManipulationAnalysis from '../components/ManipulationAnalysis';
import EmotionAnalysis from '../components/EmotionAnalysis';
import TextOverlayHighlighter from '../components/TextOverlayHighlighter';

// Types
interface Article {
  id: string;
  title: string;
  content: string;
  source: {
    name: string;
    bias: number;
    reliability: number;
  };
  pubDate: string;
  author: string;
  analysis?: {
    bias?: any;
    rhetorical?: any;
    network?: any;
    manipulation?: any;
    emotion?: any;
  };
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${id}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!article) return <Alert severity="warning">Article not found</Alert>;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {article.title}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {article.source.name} • {new Date(article.pubDate).toLocaleDateString()}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            By {article.author}
          </Typography>
        </Box>

        <StyledPaper>
          <TextOverlayHighlighter text={article.content} />
        </StyledPaper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Bias Analysis" />
            <Tab label="Rhetorical Analysis" />
            <Tab label="Network Analysis" />
            <Tab label="Manipulation Detection" />
            <Tab label="Emotion Analysis" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && (
            <BiasDetection
              content={article.content}
              sourceBias={article.source.bias}
              sourceReliability={article.source.reliability}
            />
          )}
          {activeTab === 1 && (
            <RhetoricalAnalysis content={article.content} />
          )}
          {activeTab === 2 && (
            <NetworkAnalysis content={article.content} />
          )}
          {activeTab === 3 && (
            <ManipulationAnalysis content={article.content} />
          )}
          {activeTab === 4 && (
            <EmotionAnalysis content={article.content} />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ArticleDetailPage; 