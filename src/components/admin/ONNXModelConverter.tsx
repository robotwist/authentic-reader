import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, Space, Switch, InputNumber, Alert, Typography, Divider } from 'antd';
import { ConvertibleModels } from '../../types/onnx.types';
import { logger } from '../../utils/logger';
import { API_BASE_URL } from '../../config/api.config';

const { Option } = Select;
const { Title, Text } = Typography;

// Model types that can be converted to ONNX
const modelTypes = [
  { value: 'ner', label: 'Named Entity Recognition' },
  { value: 'zeroShot', label: 'Zero-Shot Classification' },
  { value: 'sentiment', label: 'Sentiment Analysis' },
];

// Common Hugging Face models for each type
const commonModels: Record<string, string[]> = {
  ner: [
    'dslim/bert-base-NER',
    'dbmdz/bert-large-cased-finetuned-conll03-english',
    'Jean-Baptiste/camembert-ner'
  ],
  zeroShot: [
    'facebook/bart-large-mnli', 
    'cross-encoder/nli-distilroberta-base',
    'MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli'
  ],
  sentiment: [
    'cardiffnlp/twitter-roberta-base-sentiment',
    'distilbert-base-uncased-finetuned-sst-2-english',
    'ProsusAI/finbert'
  ]
};

interface ONNXModelConverterProps {
  onConversionComplete?: () => void;
}

const ONNXModelConverter: React.FC<ONNXModelConverterProps> = ({ onConversionComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modelType, setModelType] = useState<string>('ner');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Update form when preset is selected
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    form.setFieldsValue({ modelId: value });
  };

  // Update preset options when model type changes
  const handleModelTypeChange = (value: string) => {
    setModelType(value);
    setSelectedPreset(null);
    form.setFieldsValue({ modelId: '' });
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/onnx/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // Assuming you store the token in localStorage
        },
        body: JSON.stringify({
          modelType: values.modelType,
          modelId: values.modelId,
          quantize: values.quantize,
          optimizationLevel: values.optimizationLevel
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert model');
      }

      const data = await response.json();
      logger.debug('Model conversion response:', data);
      setSuccess(`Successfully converted model to ONNX: ${values.modelId}`);
      
      // Call the completion callback if provided
      if (onConversionComplete) {
        onConversionComplete();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during model conversion';
      setError(errorMessage);
      logger.error('Failed to convert model:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<Title level={4}>Convert Hugging Face Model to ONNX</Title>}>
      {error && (
        <Alert
          message="Conversion Failed"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {success && (
        <Alert
          message="Conversion Successful"
          description={success}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          modelType: 'ner',
          optimizationLevel: 3,
          quantize: true,
        }}
      >
        <Form.Item
          name="modelType"
          label="Model Type"
          rules={[{ required: true, message: 'Please select a model type' }]}
        >
          <Select 
            onChange={handleModelTypeChange}
            placeholder="Select model type"
          >
            {modelTypes.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Common Models">
          <Select
            value={selectedPreset || undefined}
            onChange={handlePresetChange}
            placeholder="Select a common model (optional)"
            allowClear
          >
            {commonModels[modelType]?.map(model => (
              <Option key={model} value={model}>{model}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="modelId"
          label="Hugging Face Model ID"
          rules={[{ required: true, message: 'Please enter a model ID' }]}
        >
          <Input placeholder="e.g., dslim/bert-base-NER" />
        </Form.Item>

        <Divider>Advanced Options</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item
            name="optimizationLevel"
            label="Optimization Level"
            tooltip="Higher levels enable more optimization but take longer"
          >
            <Select>
              <Option value={0}>Level 0 (Disabled)</Option>
              <Option value={1}>Level 1 (Basic)</Option>
              <Option value={2}>Level 2 (Extended)</Option>
              <Option value={3}>Level 3 (Maximum)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantize"
            label="Enable Quantization"
            valuePropName="checked"
            tooltip="Reduces model size but may slightly impact accuracy"
          >
            <Switch />
          </Form.Item>
        </Space>

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Convert Model
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          Note: Model conversion can take several minutes depending on the model size and your server's processing power.
          The model will be saved to your server's configured ONNX models directory.
        </Text>
      </div>
    </Card>
  );
};

export default ONNXModelConverter; 