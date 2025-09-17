import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Form, Input, Button, Select, Card, Space, Switch, Alert, Typography, Divider } from 'antd';
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
const commonModels = {
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
const ONNXModelConverter = ({ onConversionComplete }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [modelType, setModelType] = useState('ner');
    const [selectedPreset, setSelectedPreset] = useState(null);
    // Update form when preset is selected
    const handlePresetChange = (value) => {
        setSelectedPreset(value);
        form.setFieldsValue({ modelId: value });
    };
    // Update preset options when model type changes
    const handleModelTypeChange = (value) => {
        setModelType(value);
        setSelectedPreset(null);
        form.setFieldsValue({ modelId: '' });
    };
    // Handle form submission
    const handleSubmit = async (values) => {
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
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error during model conversion';
            setError(errorMessage);
            logger.error('Failed to convert model:', err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Card, { title: _jsx(Title, { level: 4, children: "Convert Hugging Face Model to ONNX" }), children: [error && (_jsx(Alert, { message: "Conversion Failed", description: error, type: "error", showIcon: true, style: { marginBottom: 16 } })), success && (_jsx(Alert, { message: "Conversion Successful", description: success, type: "success", showIcon: true, style: { marginBottom: 16 } })), _jsxs(Form, { form: form, layout: "vertical", onFinish: handleSubmit, initialValues: {
                    modelType: 'ner',
                    optimizationLevel: 3,
                    quantize: true,
                }, children: [_jsx(Form.Item, { name: "modelType", label: "Model Type", rules: [{ required: true, message: 'Please select a model type' }], children: _jsx(Select, { onChange: handleModelTypeChange, placeholder: "Select model type", children: modelTypes.map(type => (_jsx(Option, { value: type.value, children: type.label }, type.value))) }) }), _jsx(Form.Item, { label: "Common Models", children: _jsx(Select, { value: selectedPreset || undefined, onChange: handlePresetChange, placeholder: "Select a common model (optional)", allowClear: true, children: commonModels[modelType]?.map(model => (_jsx(Option, { value: model, children: model }, model))) }) }), _jsx(Form.Item, { name: "modelId", label: "Hugging Face Model ID", rules: [{ required: true, message: 'Please enter a model ID' }], children: _jsx(Input, { placeholder: "e.g., dslim/bert-base-NER" }) }), _jsx(Divider, { children: "Advanced Options" }), _jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsx(Form.Item, { name: "optimizationLevel", label: "Optimization Level", tooltip: "Higher levels enable more optimization but take longer", children: _jsxs(Select, { children: [_jsx(Option, { value: 0, children: "Level 0 (Disabled)" }), _jsx(Option, { value: 1, children: "Level 1 (Basic)" }), _jsx(Option, { value: 2, children: "Level 2 (Extended)" }), _jsx(Option, { value: 3, children: "Level 3 (Maximum)" })] }) }), _jsx(Form.Item, { name: "quantize", label: "Enable Quantization", valuePropName: "checked", tooltip: "Reduces model size but may slightly impact accuracy", children: _jsx(Switch, {}) })] }), _jsx(Form.Item, { style: { marginTop: 24 }, children: _jsx(Button, { type: "primary", htmlType: "submit", loading: loading, block: true, children: "Convert Model" }) })] }), _jsx("div", { style: { marginTop: 16 }, children: _jsx(Text, { type: "secondary", children: "Note: Model conversion can take several minutes depending on the model size and your server's processing power. The model will be saved to your server's configured ONNX models directory." }) })] }));
};
export default ONNXModelConverter;
