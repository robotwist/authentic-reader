import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Row, Col, Typography, Tabs, Divider, Alert, Card } from 'antd';
import ONNXModelStatus from '../components/admin/ONNXModelStatus';
import ONNXModelConverter from '../components/admin/ONNXModelConverter';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '@reach/router';
import { logger } from '../utils/logger';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const ONNXAdminPage = () => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('status');
    // Ensure only admins can access this page
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }
        if (!isAdmin) {
            navigate('/dashboard', { replace: true });
            logger.warn('Non-admin user attempted to access ONNX admin page');
            return;
        }
    }, [isAuthenticated, isAdmin]);
    // Handle model conversion completion
    const handleConversionComplete = () => {
        // Switch to the status tab to see the new model
        setActiveTab('status');
    };
    // If not authenticated or not admin, don't render the content
    if (!isAuthenticated || !isAdmin) {
        return null;
    }
    return (_jsx("div", { className: "onnx-admin-page", children: _jsxs(Row, { gutter: [16, 24], children: [_jsxs(Col, { span: 24, children: [_jsx(Title, { level: 2, children: "ONNX Models Administration" }), _jsx(Paragraph, { children: "This page allows you to manage ONNX models for optimized inference performance. Convert Hugging Face models to ONNX format, view model status, and configure runtime settings." }), _jsx(Alert, { message: "Performance Impact", description: "ONNX Runtime can significantly improve inference speed (2-5x faster) and reduce memory usage compared to traditional PyTorch or TensorFlow models.", type: "info", showIcon: true, style: { marginBottom: 24 } })] }), _jsx(Col, { span: 24, children: _jsx(Card, { children: _jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, children: [_jsx(TabPane, { tab: "Model Status", children: _jsx(ONNXModelStatus, {}) }, "status"), _jsx(TabPane, { tab: "Convert Models", children: _jsx(ONNXModelConverter, { onConversionComplete: handleConversionComplete }) }, "convert"), _jsx(TabPane, { tab: "Runtime Settings", children: _jsxs(Card, { title: _jsx(Title, { level: 4, children: "ONNX Runtime Settings" }), children: [_jsx(Alert, { message: "Coming Soon", description: "Runtime configuration settings will be available in a future update. For now, these can be configured through environment variables.", type: "warning", showIcon: true }), _jsx(Divider, {}), _jsx(Title, { level: 5, children: "Current Environment Settings" }), _jsx(Paragraph, { children: "The following settings are configured through environment variables:" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "ONNX_THREADS" }), ": Number of threads for inference (default: 4)"] }), _jsxs("li", { children: [_jsx("strong", { children: "ONNX_EXECUTION_PROVIDERS" }), ": Hardware acceleration (cpu, cuda, etc.)"] }), _jsxs("li", { children: [_jsx("strong", { children: "ONNX_OPT_LEVEL" }), ": Optimization level (0-3)"] }), _jsxs("li", { children: [_jsx("strong", { children: "ONNX_GRAPH_OPTIMIZATION" }), ": Enable graph optimizations"] }), _jsxs("li", { children: [_jsx("strong", { children: "ONNX_MEMORY_LIMIT" }), ": Memory limit in MB (0 for unlimited)"] }), _jsxs("li", { children: [_jsx("strong", { children: "ONNX_ENABLE_QUANTIZATION" }), ": Enable quantized models"] }), _jsxs("li", { children: [_jsx("strong", { children: "ONNX_ENABLE_PROFILING" }), ": Enable performance profiling"] })] }), _jsxs(Paragraph, { children: ["To modify these settings, update the ", _jsx("code", { children: ".env" }), " file on the server and restart."] })] }) }, "settings")] }) }) })] }) }));
};
export default ONNXAdminPage;
