import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress, 
  Tab, 
  Tabs, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  CheckCircleOutline as CheckIcon, 
  ErrorOutline as ErrorIcon, 
  WarningAmber as WarningIcon, 
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Dns as ServerIcon,
  NetworkCheck as NetworkIcon
} from '@mui/icons-material';

interface ServerMetrics {
  uptime: string;
  memory: {
    usagePercent: number;
    used: string;
    total: string;
  };
  requests: {
    total: number;
    success: number;
    failed: number;
    activeConnections: number;
  };
  responseTimes: {
    avg: string;
    max: string;
  };
  errors: number;
  timestamp: string;
}

interface ResponseTimeMetrics {
  overall: {
    avg: string;
    min: string;
    max: string;
  };
  endpoints: Array<{
    endpoint: string;
    avgResponseTime: string;
    requests: number;
    successRate: string;
  }>;
}

interface ErrorEntry {
  type: string;
  message: string;
  stack: string | null;
  timestamp: string;
}

interface ErrorMetrics {
  total: number;
  errors: ErrorEntry[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitor-tabpanel-${index}`}
      aria-labelledby={`monitor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ServerMonitor: React.FC = () => {
  const [summary, setSummary] = useState<ServerMetrics | null>(null);
  const [responseTimes, setResponseTimes] = useState<ResponseTimeMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState<number>(10000); // 10 seconds
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchMonitorData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch summary metrics
      const summaryResponse = await axios.get('/api/monitor/summary');
      setSummary(summaryResponse.data);
      
      // Fetch response time metrics
      const responseTimesResponse = await axios.get('/api/monitor/response-times');
      setResponseTimes(responseTimesResponse.data);
      
      // Fetch error metrics
      const errorsResponse = await axios.get('/api/monitor/errors');
      setErrors(errorsResponse.data);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Failed to fetch monitoring data. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMonitorData();
    
    // Set up auto-refresh
    const intervalId = setInterval(() => {
      fetchMonitorData();
    }, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]); // Re-run if refresh interval changes

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ p: 2 }}>
        <ServerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Server Monitoring
      </Typography>
      
      {lastUpdated && (
        <Typography variant="body2" color="textSecondary" sx={{ pl: 2, pb: 2 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Typography>
      )}
      
      {summary && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {/* Server Status */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Server Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h5" component="div">
                      Online
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Uptime: {summary.uptime}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Memory Usage */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <MemoryIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                    Memory Usage
                  </Typography>
                  <Typography variant="h5" component="div">
                    {summary.memory.usagePercent}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={summary.memory.usagePercent} 
                    color={summary.memory.usagePercent > 80 ? "error" : "primary"}
                    sx={{ my: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {summary.memory.used} / {summary.memory.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Request Statistics */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <NetworkIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                    Requests
                  </Typography>
                  <Typography variant="h5" component="div">
                    {summary.requests.total.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Success: {summary.requests.success.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Failed: {summary.requests.failed.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active: {summary.requests.activeConnections}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Response Times */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <SpeedIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                    Response Time
                  </Typography>
                  <Typography variant="h5" component="div">
                    {summary.responseTimes.avg}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Max: {summary.responseTimes.max}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Errors: {summary.errors}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="monitoring tabs">
          <Tab label="Response Times" id="monitor-tab-0" />
          <Tab label="Errors" id="monitor-tab-1" />
        </Tabs>
      </Box>
      
      {/* Response Times Tab */}
      <TabPanel value={tabValue} index={0}>
        {responseTimes ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="right">Avg. Response Time</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell align="right">Success Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responseTimes.endpoints.map((endpoint) => (
                  <TableRow key={endpoint.endpoint}>
                    <TableCell component="th" scope="row">
                      {endpoint.endpoint}
                    </TableCell>
                    <TableCell align="right">
                      {parseFloat(endpoint.avgResponseTime) > 1000 ? (
                        <Typography color="error">{endpoint.avgResponseTime}ms</Typography>
                      ) : parseFloat(endpoint.avgResponseTime) > 500 ? (
                        <Typography color="warning.main">{endpoint.avgResponseTime}ms</Typography>
                      ) : (
                        <Typography>{endpoint.avgResponseTime}ms</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{endpoint.requests}</TableCell>
                    <TableCell align="right">
                      {parseFloat(endpoint.successRate) < 90 ? (
                        <Chip 
                          label={endpoint.successRate} 
                          color="error" 
                          size="small" 
                        />
                      ) : parseFloat(endpoint.successRate) < 95 ? (
                        <Chip 
                          label={endpoint.successRate} 
                          color="warning" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          label={endpoint.successRate} 
                          color="success" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </TabPanel>
      
      {/* Errors Tab */}
      <TabPanel value={tabValue} index={1}>
        {errors ? (
          <>
            <Typography variant="h6" gutterBottom>
              Recent Errors ({errors.total})
            </Typography>
            
            {errors.errors.length === 0 ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                No errors have been recorded
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {errors.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={error.type} 
                            color="error" 
                            size="small" 
                            icon={<ErrorIcon />}
                          />
                        </TableCell>
                        <TableCell>{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default ServerMonitor; 