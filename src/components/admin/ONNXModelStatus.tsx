import React, { useEffect, useState } from 'react';
import { onnxService } from '../../services/onnxService';
import { logger } from '../../utils/logger';
import { Card, Table, Tag, Button, Spin, Alert, Typography, Space } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ModelStatus {
  loaded: boolean;
  exists: boolean;
  path: string;
  originalModel: string;
  lastUsed?: number;
  error?: string;
}

const ONNXModelStatus: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<Record<string, ModelStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format last used timestamp
  const formatLastUsed = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Fetch model status
  const fetchModelStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await onnxService.getModelStatus();
      setModelStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching model status';
      setError(errorMessage);
      logger.error('Failed to fetch ONNX model status:', err);
    } finally {
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
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_: any, record: any) => {
        if (!record.exists) {
          return <Tag icon={<CloseCircleOutlined />} color="error">Not Found</Tag>;
        }
        if (record.loaded) {
          return <Tag icon={<CheckCircleOutlined />} color="success">Loaded</Tag>;
        }
        return <Tag icon={<WarningOutlined />} color="warning">Available</Tag>;
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
      render: (lastUsed?: number) => formatLastUsed(lastUsed),
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      render: (error?: string) => error && <Text type="danger" ellipsis>{error}</Text>,
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

  return (
    <Card
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>ONNX Model Status</Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchModelStatus}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {error && (
        <Alert
          message="Error"
          description={`Failed to fetch model status: ${error}`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading model status...</div>
        </div>
      ) : (
        <>
          {dataSource.length === 0 ? (
            <Alert
              message="No ONNX models found"
              description="No ONNX models are currently available. Please convert Hugging Face models to ONNX format using the conversion tool."
              type="info"
              showIcon
            />
          ) : (
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              size="middle"
              scroll={{ x: true }}
            />
          )}
        </>
      )}
    </Card>
  );
};

export default ONNXModelStatus; 