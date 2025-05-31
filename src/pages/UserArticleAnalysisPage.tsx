import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  CircularProgress, 
  Alert,
  Paper,
  Grid,
  Chip,
  Divider
} from '@mui/material';
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

  const renderAnalysisSection = (title: string, content: any) => {
    if (!content) return null;
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {content}
      </Paper>
    );
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analyze Your Article
        </Typography>
        <Paper sx={{ p: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="Article URL"
            variant="outlined"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
            margin="normal"
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAnalyze} 
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze'}
          </Button>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {analysis && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Chip
                  label={`Bias: ${analysis.bias || 'Unknown'}`}
                  color={analysis.bias === 'high' ? 'error' : 
                         analysis.bias === 'medium' ? 'warning' : 'success'}
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={`Reliability: ${analysis.reliability || 'Unknown'}`}
                  color={analysis.reliability === 'high' ? 'success' : 
                         analysis.reliability === 'medium' ? 'warning' : 'error'}
                  sx={{ width: '100%' }}
                />
              </Grid>
            </Grid>

            {analysis.details && (
              <>
                {renderAnalysisSection('Bias Analysis', (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Source Bias: {analysis.details.bias?.sourceBias?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Emotional Language: {analysis.details.bias?.biasIndicators?.emotionalLanguage?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Loaded Terms: {analysis.details.bias?.biasIndicators?.loadedTerms?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Box>
                ))}

                {renderAnalysisSection('Rhetorical Analysis', (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Argument Strength: {analysis.details.rhetorical?.argumentStrength?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Complexity: {analysis.details.rhetorical?.complexity || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Rhetorical Devices:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        • Metaphors: {analysis.details.rhetorical?.rhetoricalDevices?.metaphors || 0}
                      </Typography>
                      <Typography variant="body2">
                        • Analogies: {analysis.details.rhetorical?.rhetoricalDevices?.analogies || 0}
                      </Typography>
                      <Typography variant="body2">
                        • Questions: {analysis.details.rhetorical?.rhetoricalDevices?.questions || 0}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {renderAnalysisSection('Manipulation Analysis', (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Risk Level: {analysis.details.manipulation?.riskLevel || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Manipulation Score: {analysis.details.manipulation?.manipulationScore?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Recommendations: {analysis.details.manipulation?.recommendations || 'N/A'}
                    </Typography>
                  </Box>
                ))}

                {renderAnalysisSection('Emotion Analysis', (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Dominant Emotion: {analysis.details.emotion?.dominantEmotion || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Emotional Intensity:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        • High: {(analysis.details.emotion?.emotionalIntensity?.high * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        • Medium: {(analysis.details.emotion?.emotionalIntensity?.medium * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        • Low: {(analysis.details.emotion?.emotionalIntensity?.low * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {renderAnalysisSection('Network Analysis', (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Related Articles: {analysis.details.network?.networkMetrics?.relatedArticles || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Source Connections: {analysis.details.network?.networkMetrics?.sourceConnections || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Topic Connections: {analysis.details.network?.networkMetrics?.topicConnections || 0}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default UserArticleAnalysisPage; 