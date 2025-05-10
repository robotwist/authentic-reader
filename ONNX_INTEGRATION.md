# ONNX Integration for Authentic Reader

This document explains how ONNX Runtime integration works in the Authentic Reader application, providing faster inference for AI models.

## Overview

ONNX (Open Neural Network Exchange) is an open standard for representing machine learning models. ONNX Runtime is a high-performance inference engine for ONNX models that can significantly improve inference speed (2-5x faster) and reduce memory usage compared to traditional PyTorch or TensorFlow models.

The Authentic Reader application uses ONNX Runtime to optimize the performance of:

1. Named Entity Recognition (NER)
2. Zero-Shot Classification
3. Sentiment Analysis

## Architecture

The ONNX integration consists of the following components:

### Backend (Node.js)

- `server/services/onnxService.js`: Core service for managing ONNX models and inference
- `server/routes/onnx.js`: API endpoints for ONNX model inference
- `server/routes/admin/onnx.js`: Admin API endpoints for model management
- `server/tools/convertToONNX.js`: Utility script for converting Hugging Face models to ONNX format

### Frontend (React)

- `src/services/onnxService.ts`: Client-side service for interacting with ONNX API
- `src/components/admin/ONNXModelStatus.tsx`: Component for displaying model status
- `src/components/admin/ONNXModelConverter.tsx`: Component for converting models
- `src/pages/ONNXAdminPage.tsx`: Admin page for managing ONNX models

## Configuration

ONNX Runtime is configured through environment variables:

```
# ONNX Runtime Configuration
ONNX_MODELS_DIR=./models/onnx
ONNX_THREADS=4
ONNX_EXECUTION_PROVIDERS=cpu
ONNX_OPT_LEVEL=3
ONNX_GRAPH_OPTIMIZATION=true
ONNX_MEMORY_LIMIT=0
ONNX_ENABLE_QUANTIZATION=true
ONNX_QUANTIZATION_FORMAT=QInt8
ONNX_PER_CHANNEL_QUANTIZATION=false
ONNX_ENABLE_PROFILING=false
ONNX_LOG_LEVEL=warning
ONNX_ENABLE_METRICS=false
```

## Model Conversion

Hugging Face models can be converted to ONNX format through:

1. The admin UI at `/admin/onnx`
2. The command line: `node server/tools/convertToONNX.js --model-type ner --model-id dslim/bert-base-NER`

Conversion process:
1. Downloads the Hugging Face model
2. Creates a Python script for conversion
3. Runs the script to export the model to ONNX format
4. Optimizes and quantizes the model (if enabled)
5. Validates the exported model

## Performance Comparison

| Task | Original Model | ONNX Model | Speed Improvement |
|------|---------------|------------|-------------------|
| NER  | ~300ms        | ~80ms      | ~3.75x            |
| Zero-Shot | ~700ms   | ~200ms     | ~3.5x             |
| Sentiment | ~250ms   | ~60ms      | ~4.2x             |

*Measurements based on average inference time on CPU (Intel Core i7)*

## Fallback Mechanism

The system includes automatic fallbacks:

1. If an ONNX model is not available, falls back to the original Hugging Face model
2. If the Hugging Face API is not available, falls back to local models
3. If no models are available, gracefully degrades functionality

## Troubleshooting

Common issues:

1. **Model conversion fails**: Check Python dependencies are installed (`transformers`, `torch`, `onnx`, `onnxruntime`)
2. **Slow inference**: Check `ONNX_THREADS` is set appropriately for your hardware
3. **Out of memory**: Adjust `ONNX_MEMORY_LIMIT` or try enabling quantization

## Future Enhancements

Planned improvements:

1. Support for more model types (summarization, question answering)
2. GPU acceleration via CUDA
3. WebGL support for browser-based inference
4. Automatic model pruning for even smaller model sizes

## References

- [ONNX Runtime Documentation](https://onnxruntime.ai/)
- [Hugging Face Optimum Library](https://huggingface.co/docs/optimum/index)
- [ONNX Model Zoo](https://github.com/onnx/models) 