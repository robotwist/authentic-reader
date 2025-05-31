import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArticleCard from '../components/ArticleCard';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
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
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
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
  );
};

export default HomePage; 