import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { onnxService } from '../../services/onnxService';
import { logger } from '../../utils/logger';
import { Card, Table, Tag, Button, Spin, Alert, Typography, Space } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;
const ONNXModelStatus = () => {
    const [modelStatus, setModelStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Format last used timestamp
    const formatLastUsed = (timestamp) => {
        if (!timestamp)
            return 'Never';
        return new Date(timestamp).toLocaleString();
    };
    // Fetch model status
    const fetchModelStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const status = await onnxService.getModelStatus();
            setModelStatus(status);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching model status';
            setError(errorMessage);
            logger.error('Failed to fetch ONNX model status:', err);
        }
        finally {
            setLoading(false);
        }
    };
    // Load model status on component mount
    useEffect(() => {
        fetchModelStatus();
    }, []);
    // Table columns
    const columns = [
        {
            title: 'Model Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => _jsx("strong", { children: text }),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (_, record) => {
                if (!record.exists) {
                    return _jsx(Tag, { icon: _jsx(CloseCircleOutlined, {}), color: "error", children: "Not Found" });
                }
                if (record.loaded) {
                    return _jsx(Tag, { icon: _jsx(CheckCircleOutlined, {}), color: "success", children: "Loaded" });
                }
                return _jsx(Tag, { icon: _jsx(WarningOutlined, {}), color: "warning", children: "Available" });
            },
        },
        {
            title: 'Path',
            dataIndex: 'path',
            key: 'path',
            ellipsis: true,
        },
        {
            title: 'Original Model',
            dataIndex: 'originalModel',
            key: 'originalModel',
            ellipsis: true,
        },
        {
            title: 'Last Used',
            dataIndex: 'lastUsed',
            key: 'lastUsed',
            render: (lastUsed) => formatLastUsed(lastUsed),
        },
        {
            title: 'Error',
            dataIndex: 'error',
            key: 'error',
            render: (error) => error && _jsx(Text, { type: "danger", ellipsis: true, children: error }),
        },
    ];
    // Convert model status object to array for table
    const dataSource = Object.entries(modelStatus).map(([name, status]) => ({
        key: name,
        name,
        exists: status.exists,
        loaded: status.loaded,
        path: status.path,
        originalModel: status.originalModel,
        lastUsed: status.lastUsed,
        error: status.error,
    }));
    return (_jsxs(Card, { title: _jsxs(Space, { children: [_jsx(Title, { level: 4, style: { margin: 0 }, children: "ONNX Model Status" }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: fetchModelStatus, loading: loading, size: "small", children: "Refresh" })] }), children: [error && (_jsx(Alert, { message: "Error", description: `Failed to fetch model status: ${error}`, type: "error", showIcon: true, style: { marginBottom: 16 } })), loading ? (_jsxs("div", { style: { textAlign: 'center', padding: '20px' }, children: [_jsx(Spin, { size: "large" }), _jsx("div", { style: { marginTop: 16 }, children: "Loading model status..." })] })) : (_jsx(_Fragment, { children: dataSource.length === 0 ? (_jsx(Alert, { message: "No ONNX models found", description: "No ONNX models are currently available. Please convert Hugging Face models to ONNX format using the conversion tool.", type: "info", showIcon: true })) : (_jsx(Table, { dataSource: dataSource, columns: columns, pagination: false, size: "middle", scroll: { x: true } })) }))] }));
};
export default ONNXModelStatus;
