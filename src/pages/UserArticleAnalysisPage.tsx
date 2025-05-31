import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, CircularProgress, Alert } from '@mui/material';
import { analyzeArticle } from '../services/analysis-service';

const UserArticleAnalysisPage: React.FC = () => {
  const [articleUrl, setArticleUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeArticle(articleUrl);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analyze Your Article
        </Typography>
        <TextField
          fullWidth
          label="Article URL"
          variant="outlined"
          value={articleUrl}
          onChange={(e) => setArticleUrl(e.target.value)}
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleAnalyze} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Analyze'}
        </Button>
        {error && <Alert severity="error">{error}</Alert>}
        {analysis && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>
            <Typography variant="body1">
              Sentiment: {analysis.sentiment}
            </Typography>
            <Typography variant="body1">
              Subjectivity: {analysis.subjectivity}
            </Typography>
            <Typography variant="body1">
              Bias: {analysis.bias}
            </Typography>
            <Typography variant="body1">
              Reliability: {analysis.reliability}
            </Typography>
            <Typography variant="body1">
              Details: {JSON.stringify(analysis.details)}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default UserArticleAnalysisPage; 