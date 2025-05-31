import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  CardMedia,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArticleCard from '../components/ArticleCard';
import { FiBookOpen, FiShield, FiTarget, FiTrendingUp } from 'react-icons/fi';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const HeroSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
  color: theme.palette.primary.contrastText,
  textAlign: 'center',
  marginBottom: theme.spacing(6)
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)'
  }
}));

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
    doomScore?: number;
    errorScore?: number;
  };
}

const features = [
  {
    icon: <FiShield size={32} />,
    title: 'Bias Detection',
    description: 'Advanced AI analysis to identify potential biases in content'
  },
  {
    icon: <FiTarget size={32} />,
    title: 'Rhetorical Analysis',
    description: 'Understand the persuasive techniques used in articles'
  },
  {
    icon: <FiTrendingUp size={32} />,
    title: 'Quality Metrics',
    description: 'Comprehensive scoring of article reliability and credibility'
  },
  {
    icon: <FiBookOpen size={32} />,
    title: 'Smart Library',
    description: 'Organize and analyze your reading collection'
  }
];

const HomePage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [doomArticle, setDoomArticle] = useState<Article | null>(null);
  const [errorArticle, setErrorArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles');
        if (!response.ok) throw new Error('Failed to fetch articles');
        const data = await response.json();
        setArticles(data);

        // Find doomscroll and error articles
        const doom = data.reduce((max: Article, article: Article) => 
          (article.analysis?.doomScore || 0) > (max.analysis?.doomScore || 0) ? article : max
        , data[0]);

        const error = data.reduce((max: Article, article: Article) => 
          (article.analysis?.errorScore || 0) > (max.analysis?.errorScore || 0) ? article : max
        , data[0]);

        setDoomArticle(doom);
        setErrorArticle(error);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Read Smarter, Not Harder
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
            Understand the hidden aspects of what you read with AI-powered analysis
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" color="secondary" size="large">
              Try Analysis
            </Button>
            <Button variant="outlined" color="inherit" size="large">
              Learn More
            </Button>
          </Stack>
        </Container>
      </HeroSection>

      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
            Key Features
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <FeatureCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" gutterBottom align="center">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Today's Highlights
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <Typography variant="h6" gutterBottom>
                  Doomscroll of the Day
                </Typography>
                {doomArticle && (
                  <ArticleCard
                    article={doomArticle}
                    highlight="doom"
                  />
                )}
              </StyledPaper>
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <Typography variant="h6" gutterBottom>
                  Most Erroneous Article
                </Typography>
                {errorArticle && (
                  <ArticleCard
                    article={errorArticle}
                    highlight="error"
                  />
                )}
              </StyledPaper>
            </Grid>
          </Grid>

          <Typography variant="h4" component="h2" gutterBottom>
            Latest Articles
          </Typography>

          <Grid container spacing={3}>
            {articles.map((article) => (
              <Grid item xs={12} md={6} lg={4} key={article.id}>
                <ArticleCard article={article} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage; 