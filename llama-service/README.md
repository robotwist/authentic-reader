# Llama Service for Authentic Reader

This service provides advanced text generation, summarization, and analysis capabilities using Llama 3 models through Ollama.

## Features

- **Text Generation**: Generate high-quality text responses based on prompts
- **Text Summarization**: Create concise summaries of longer texts
- **Content Analysis**: Analyze text for themes, sentiment, and key points
- **Local Execution**: All processing happens locally, with no data sent to external APIs
- **Caching**: Results are cached to improve performance for repeated queries

## Prerequisites

- Python 3.9+
- [Ollama](https://ollama.com/) installed and running
- At least 8GB of RAM (16GB recommended for better performance)
- Approximately 5GB of disk space for models

## Installation

### 1. Set up Ollama and download models

Run the provided setup script:

```bash
cd llama-service/scripts
./setup_ollama.sh
```

This script will:
- Check if Ollama is installed, and install it if needed
- Start the Ollama service if it's not running
- Download the Llama 3 model
- Set up a Python virtual environment
- Install required dependencies
- Create a default .env configuration file

### 2. Manual Setup (if the script doesn't work)

If the script fails, follow these steps:

a. Install Ollama from [ollama.com/download](https://ollama.com/download)

b. Start the Ollama service:
```bash
ollama serve
```

c. Pull the Llama 3 model:
```bash
ollama pull llama3:8b
```

d. Create and activate a virtual environment:
```bash
cd llama-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

e. Install dependencies:
```bash
pip install -r requirements.txt
```

f. Create a `.env` file in the `llama-service` directory with:
```
OLLAMA_HOST=http://localhost:11434
LLAMA_MODEL=llama3:8b
FALLBACK_MODEL=llama2:7b-chat
CACHE_SIZE=1000
CACHE_TTL=3600
LOG_LEVEL=INFO
```

## Running the Service

1. Ensure Ollama is running (run `ollama serve` if it's not)

2. Start the Llama service:
```bash
cd llama-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn src.main:app --reload --port 3500
```

3. The service will be available at `http://localhost:3500`

4. Test the installation:
```bash
curl http://localhost:3500/health
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and model information.

### Generate Text
```
POST /generate
```
Generate text based on a prompt.

Request body:
```json
{
  "prompt": "Write a short poem about nature",
  "max_tokens": 500,
  "temperature": 0.7
}
```

### Summarize Text
```
POST /summarize
```
Create a summary of the provided text.

Request body:
```json
{
  "text": "Long text to summarize...",
  "max_length": 200,
  "type": "detailed"
}
```

### Analyze Text
```
POST /analyze
```
Analyze the content of the provided text.

Request body:
```json
{
  "text": "Text to analyze...",
  "analysis_type": "general"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| OLLAMA_HOST | URL of the Ollama server | http://localhost:11434 |
| LLAMA_MODEL | Name of the primary Llama model | llama3:8b |
| FALLBACK_MODEL | Fallback model if primary fails | llama2:7b-chat |
| CACHE_SIZE | Maximum number of cached results | 1000 |
| CACHE_TTL | Time-to-live for cache items (seconds) | 3600 |
| LOG_LEVEL | Logging level | INFO |

## Troubleshooting

### Ollama is not running
```
curl -s http://localhost:11434/api/tags
```
If this returns an error, start Ollama with `ollama serve`.

### Out of memory errors
If you encounter out of memory errors, try:
1. Close other memory-intensive applications
2. Use a smaller model (e.g., `llama2:7b-chat`)
3. Reduce the maximum token length in requests

### Slow performance
First-time queries may be slow as the model is loaded into memory. Subsequent queries should be faster, especially if cached.

## Integration with Authentic Reader

This service is designed to work with the Authentic Reader application. The frontend will automatically communicate with this service when properly configured. 