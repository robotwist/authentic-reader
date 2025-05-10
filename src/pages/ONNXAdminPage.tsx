import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Tabs, Divider, Alert, Card } from 'antd';
import ONNXModelStatus from '../components/admin/ONNXModelStatus';
import ONNXModelConverter from '../components/admin/ONNXModelConverter';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '@reach/router';
import { logger } from '../utils/logger';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const ONNXAdminPage: React.FC = () => {
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
  
  return (
    <div className="onnx-admin-page">
      <Row gutter={[16, 24]}>
        <Col span={24}>
          <Title level={2}>ONNX Models Administration</Title>
          <Paragraph>
            This page allows you to manage ONNX models for optimized inference performance.
            Convert Hugging Face models to ONNX format, view model status, and configure runtime settings.
          </Paragraph>
          
          <Alert
            message="Performance Impact"
            description="ONNX Runtime can significantly improve inference speed (2-5x faster) and reduce memory usage compared to traditional PyTorch or TensorFlow models."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        </Col>
        
        <Col span={24}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Model Status" key="status">
                <ONNXModelStatus />
              </TabPane>
              
              <TabPane tab="Convert Models" key="convert">
                <ONNXModelConverter onConversionComplete={handleConversionComplete} />
              </TabPane>
              
              <TabPane tab="Runtime Settings" key="settings">
                <Card title={<Title level={4}>ONNX Runtime Settings</Title>}>
                  <Alert
                    message="Coming Soon"
                    description="Runtime configuration settings will be available in a future update. For now, these can be configured through environment variables."
                    type="warning"
                    showIcon
                  />
                  
                  <Divider />
                  
                  <Title level={5}>Current Environment Settings</Title>
                  <Paragraph>
                    The following settings are configured through environment variables:
                  </Paragraph>
                  
                  <ul>
                    <li><strong>ONNX_THREADS</strong>: Number of threads for inference (default: 4)</li>
                    <li><strong>ONNX_EXECUTION_PROVIDERS</strong>: Hardware acceleration (cpu, cuda, etc.)</li>
                    <li><strong>ONNX_OPT_LEVEL</strong>: Optimization level (0-3)</li>
                    <li><strong>ONNX_GRAPH_OPTIMIZATION</strong>: Enable graph optimizations</li>
                    <li><strong>ONNX_MEMORY_LIMIT</strong>: Memory limit in MB (0 for unlimited)</li>
                    <li><strong>ONNX_ENABLE_QUANTIZATION</strong>: Enable quantized models</li>
                    <li><strong>ONNX_ENABLE_PROFILING</strong>: Enable performance profiling</li>
                  </ul>
                  
                  <Paragraph>
                    To modify these settings, update the <code>.env</code> file on the server and restart.
                  </Paragraph>
                </Card>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ONNXAdminPage; 