# Authentic Reader NLP Service

This service provides Natural Language Processing (NLP) capabilities for the Authentic Reader application, including sentiment analysis, entity extraction, and bias detection.

## Features

- **Named Entity Recognition (NER)**: Extract entities like people, organizations, locations from text
- **Zero-Shot Classification**: Classify text without pre-defined training examples
- **Optimized Performance**: ONNX Runtime integration for faster inference

## Requirements

- Python 3.8+
- Virtual environment (recommended)

## Installation

1. Clone the repository
2. Navigate to the nlp-service directory
3. Set up a virtual environment and install dependencies:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### Start the service

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Environment Variables

The service can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ZERO_SHOT_MODEL` | Model to use for zero-shot classification | facebook/bart-large-mnli |
| `NER_MODEL` | Model to use for named entity recognition | dslim/bert-base-NER |
| `USE_ONNX` | Whether to use ONNX Runtime for inference | 1 (true) |

## ONNX Model Optimization

This service includes ONNX Runtime optimization for improved performance. ONNX (Open Neural Network Exchange) allows for faster inference with optimized computational graphs.

### Generate ONNX Models

Before using ONNX optimization, you need to generate the ONNX models:

```bash
# Make the script executable
chmod +x generate_onnx_models.sh

# Run the script
./generate_onnx_models.sh
```

This will:
1. Set up the required environment
2. Download the specified Hugging Face models
3. Convert them to ONNX format
4. Save them in the `onnx_models` directory

### Using ONNX Models

Once the models are generated, you can enable ONNX inference with:

```bash
# Enable ONNX Runtime
USE_ONNX=1 uvicorn main:app --reload
```

### Benchmark

You can benchmark the performance difference between ONNX and standard Hugging Face models:

```bash
curl -X POST "http://localhost:8000/benchmark" \
  -H "Content-Type: application/json" \
  -d '{"text":"Sample text for benchmarking performance.", "candidate_labels": ["politics", "sports", "technology"]}'
```

## API Endpoints

Once running, the service exposes the following endpoints:

### Health Check
```
GET /health
```

### Named Entity Recognition
```
POST /analyze/entities
Content-Type: application/json
{
  "text": "Apple Inc. is planning to open a new store in New York City, said Tim Cook."
}
```

### Zero-Shot Classification
```
POST /analyze/zero-shot
Content-Type: application/json
{
  "text": "This new phone has an incredible camera and long battery life.",
  "candidate_labels": ["technology", "sports", "politics", "entertainment"]
}
```

## Architecture

The service uses a modular architecture:

1. **FastAPI Application**: Handles HTTP requests and responses
2. **Model Management**: Loads and manages NLP models
3. **Inference Layer**: Provides both Hugging Face and ONNX inference paths
4. **Fallback Mechanism**: Falls back to Hugging Face models if ONNX fails

## License

[MIT](LICENSE) 