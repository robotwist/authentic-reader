import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert, LinearProgress } from '@mui/material';
import { CheckCircleOutline as CheckIcon, ErrorOutline as ErrorIcon, Speed as SpeedIcon, Memory as MemoryIcon, Dns as ServerIcon, NetworkCheck as NetworkIcon } from '@mui/icons-material';
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (_jsx("div", { role: "tabpanel", hidden: value !== index, id: `monitor-tabpanel-${index}`, "aria-labelledby": `monitor-tab-${index}`, ...other, children: value === index && (_jsx(Box, { sx: { p: 3 }, children: children })) }));
}
const ServerMonitor = () => {
    const [summary, setSummary] = useState(null);
    const [responseTimes, setResponseTimes] = useState(null);
    const [errors, setErrors] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds
    const [lastUpdated, setLastUpdated] = useState(null);
    const handleTabChange = (event, newValue) => {
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
        }
        catch (err) {
            console.error('Error fetching monitoring data:', err);
            setError('Failed to fetch monitoring data. See console for details.');
        }
        finally {
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
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', p: 4 }, children: _jsx(CircularProgress, {}) }));
    }
    if (error) {
        return (_jsx(Alert, { severity: "error", sx: { m: 2 }, children: error }));
    }
    return (_jsxs(Box, { sx: { width: '100%', mb: 4 }, children: [_jsxs(Typography, { variant: "h4", component: "h1", gutterBottom: true, sx: { p: 2 }, children: [_jsx(ServerIcon, { sx: { mr: 1, verticalAlign: 'middle' } }), "Server Monitoring"] }), lastUpdated && (_jsxs(Typography, { variant: "body2", color: "textSecondary", sx: { pl: 2, pb: 2 }, children: ["Last updated: ", lastUpdated.toLocaleTimeString()] })), summary && (_jsx(Box, { sx: { mb: 4 }, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { color: "textSecondary", gutterBottom: true, children: "Server Status" }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CheckIcon, { color: "success", sx: { mr: 1 } }), _jsx(Typography, { variant: "h5", component: "div", children: "Online" })] }), _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Uptime: ", summary.uptime] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { color: "textSecondary", gutterBottom: true, children: [_jsx(MemoryIcon, { sx: { mr: 1, verticalAlign: 'text-bottom' } }), "Memory Usage"] }), _jsxs(Typography, { variant: "h5", component: "div", children: [summary.memory.usagePercent, "%"] }), _jsx(LinearProgress, { variant: "determinate", value: summary.memory.usagePercent, color: summary.memory.usagePercent > 80 ? "error" : "primary", sx: { my: 1 } }), _jsxs(Typography, { variant: "body2", color: "textSecondary", children: [summary.memory.used, " / ", summary.memory.total] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { color: "textSecondary", gutterBottom: true, children: [_jsx(NetworkIcon, { sx: { mr: 1, verticalAlign: 'text-bottom' } }), "Requests"] }), _jsx(Typography, { variant: "h5", component: "div", children: summary.requests.total.toLocaleString() }), _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Success: ", summary.requests.success.toLocaleString()] }), _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Failed: ", summary.requests.failed.toLocaleString()] }), _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Active: ", summary.requests.activeConnections] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { color: "textSecondary", gutterBottom: true, children: [_jsx(SpeedIcon, { sx: { mr: 1, verticalAlign: 'text-bottom' } }), "Response Time"] }), _jsx(Typography, { variant: "h5", component: "div", children: summary.responseTimes.avg }), _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Max: ", summary.responseTimes.max] }), _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Errors: ", summary.errors] })] }) }) })] }) })), _jsx(Box, { sx: { borderBottom: 1, borderColor: 'divider' }, children: _jsxs(Tabs, { value: tabValue, onChange: handleTabChange, "aria-label": "monitoring tabs", children: [_jsx(Tab, { label: "Response Times", id: "monitor-tab-0" }), _jsx(Tab, { label: "Errors", id: "monitor-tab-1" })] }) }), _jsx(TabPanel, { value: tabValue, index: 0, children: responseTimes ? (_jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Endpoint" }), _jsx(TableCell, { align: "right", children: "Avg. Response Time" }), _jsx(TableCell, { align: "right", children: "Requests" }), _jsx(TableCell, { align: "right", children: "Success Rate" })] }) }), _jsx(TableBody, { children: responseTimes.endpoints.map((endpoint) => (_jsxs(TableRow, { children: [_jsx(TableCell, { component: "th", scope: "row", children: endpoint.endpoint }), _jsx(TableCell, { align: "right", children: parseFloat(endpoint.avgResponseTime) > 1000 ? (_jsxs(Typography, { color: "error", children: [endpoint.avgResponseTime, "ms"] })) : parseFloat(endpoint.avgResponseTime) > 500 ? (_jsxs(Typography, { color: "warning.main", children: [endpoint.avgResponseTime, "ms"] })) : (_jsxs(Typography, { children: [endpoint.avgResponseTime, "ms"] })) }), _jsx(TableCell, { align: "right", children: endpoint.requests }), _jsx(TableCell, { align: "right", children: parseFloat(endpoint.successRate) < 90 ? (_jsx(Chip, { label: endpoint.successRate, color: "error", size: "small" })) : parseFloat(endpoint.successRate) < 95 ? (_jsx(Chip, { label: endpoint.successRate, color: "warning", size: "small" })) : (_jsx(Chip, { label: endpoint.successRate, color: "success", size: "small" })) })] }, endpoint.endpoint))) })] }) })) : (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', p: 4 }, children: _jsx(CircularProgress, {}) })) }), _jsx(TabPanel, { value: tabValue, index: 1, children: errors ? (_jsxs(_Fragment, { children: [_jsxs(Typography, { variant: "h6", gutterBottom: true, children: ["Recent Errors (", errors.total, ")"] }), errors.errors.length === 0 ? (_jsx(Alert, { severity: "success", sx: { mt: 2 }, children: "No errors have been recorded" })) : (_jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Time" }), _jsx(TableCell, { children: "Type" }), _jsx(TableCell, { children: "Message" })] }) }), _jsx(TableBody, { children: errors.errors.map((error, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: new Date(error.timestamp).toLocaleTimeString() }), _jsx(TableCell, { children: _jsx(Chip, { label: error.type, color: "error", size: "small", icon: _jsx(ErrorIcon, {}) }) }), _jsx(TableCell, { children: error.message })] }, index))) })] }) }))] })) : (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', p: 4 }, children: _jsx(CircularProgress, {}) })) })] }));
};
export default ServerMonitor;
