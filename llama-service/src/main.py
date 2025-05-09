"""
Llama 3 Service API for Authentic Reader

This service provides LLM capabilities using Ollama-hosted Llama 3 models
for advanced text processing and analysis.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import time

# Import Llama 3 service modules
from .llama_client import LlamaClient
from .caching import ResultCache
from .templates import load_template, render_template

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Authentic Reader Llama 3 Service",
    description="Advanced LLM capabilities using local Llama 3 models via Ollama",
    version="0.1.0",
)

# Add CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Llama 3 client
# Get model name from environment variable, default to 8B version
MODEL_NAME = os.environ.get("LLAMA_MODEL", "llama3:8b")
llama_client = None

# Initialize result cache (optional)
cache = ResultCache()

# Define request and response models
class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    max_tokens: int = Field(default=1000, gt=0, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)

class SummarizeRequest(BaseModel):
    text: str
    length: str = Field(default="medium", pattern="^(short|medium|long)$")
    focus: Optional[str] = None

class AnalyzeRequest(BaseModel):
    text: str
    analysis_type: str = Field(
        default="general", pattern="^(general|bias|sentiment|entities|topics)$"
    )
    depth: str = Field(default="medium", pattern="^(surface|medium|deep)$")

class LlamaResponse(BaseModel):
    result: str
    metadata: Dict[str, Any]
    processing_time: float

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global llama_client
    try:
        logger.info(f"Initializing Llama 3 client with model: {MODEL_NAME}")
        llama_client = LlamaClient(model_name=MODEL_NAME)
        # Test connection to Ollama
        llama_client.test_connection()
        logger.info("Llama 3 client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Llama 3 client: {e}")
        # Continue startup but mark service as degraded

@app.get("/health", tags=["Health"])
async def health_check():
    """Check if the Llama 3 service is healthy and operational"""
    status = "healthy"
    if llama_client is None or not llama_client.is_ready():
        status = "degraded"
    
    return {
        "status": status,
        "model": MODEL_NAME,
        "ready": llama_client is not None and llama_client.is_ready(),
    }

@app.post("/generate", response_model=LlamaResponse, tags=["Generation"])
async def generate_text(request: GenerateRequest):
    """Generate text based on a prompt"""
    if llama_client is None or not llama_client.is_ready():
        raise HTTPException(status_code=503, detail="Llama 3 service is not available")
    
    # Check cache for identical request
    cache_key = f"gen:{request.prompt}:{request.max_tokens}:{request.temperature}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    start_time = time.time()
    try:
        result = llama_client.generate(
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )
        
        processing_time = time.time() - start_time
        
        response = LlamaResponse(
            result=result,
            metadata={
                "model": MODEL_NAME,
                "prompt_length": len(request.prompt),
                "max_tokens": request.max_tokens,
                "temperature": request.temperature,
            },
            processing_time=processing_time
        )
        
        # Cache the result
        cache.set(cache_key, response)
        
        return response
    except Exception as e:
        logger.error(f"Error generating text: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/summarize", response_model=LlamaResponse, tags=["Analysis"])
async def summarize_text(request: SummarizeRequest):
    """Summarize text to different lengths with optional focus areas"""
    if llama_client is None or not llama_client.is_ready():
        raise HTTPException(status_code=503, detail="Llama 3 service is not available")
    
    # Check cache for identical request
    cache_key = f"sum:{request.text}:{request.length}:{request.focus or 'general'}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    start_time = time.time()
    try:
        # Load and render summarization template
        template = load_template("summarize")
        prompt = render_template(
            template,
            text=request.text,
            length=request.length,
            focus=request.focus or "general content",
        )
        
        # Generate the summary
        result = llama_client.generate(
            prompt=prompt,
            system_prompt="You are an expert summarizer. Create accurate, concise summaries that capture the key points.",
            max_tokens=min(len(request.text) // 3, 1000),  # Dynamic token limit based on text length
            temperature=0.3,  # Lower temperature for more consistent summaries
        )
        
        processing_time = time.time() - start_time
        
        response = LlamaResponse(
            result=result,
            metadata={
                "model": MODEL_NAME,
                "text_length": len(request.text),
                "summary_type": request.length,
                "focus": request.focus,
            },
            processing_time=processing_time
        )
        
        # Cache the result
        cache.set(cache_key, response)
        
        return response
    except Exception as e:
        logger.error(f"Error summarizing text: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/analyze", response_model=LlamaResponse, tags=["Analysis"])
async def analyze_text(request: AnalyzeRequest):
    """Analyze text for bias, sentiment, entities, or topics"""
    if llama_client is None or not llama_client.is_ready():
        raise HTTPException(status_code=503, detail="Llama 3 service is not available")
    
    # Check cache for identical request
    cache_key = f"ana:{request.text}:{request.analysis_type}:{request.depth}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    start_time = time.time()
    try:
        # Load and render analysis template
        template = load_template(f"analyze_{request.analysis_type}")
        prompt = render_template(
            template,
            text=request.text,
            depth=request.depth,
        )
        
        # Set appropriate system prompt based on analysis type
        system_prompts = {
            "general": "You are an expert content analyst providing objective insights.",
            "bias": "You are an expert media analyst specializing in detecting bias and framing.",
            "sentiment": "You are an expert sentiment analyst detecting emotional tones and subtext.",
            "entities": "You are an expert entity analyst identifying key people, organizations, and connections.",
            "topics": "You are an expert topic analyst identifying key themes and subject matter."
        }
        
        system_prompt = system_prompts.get(request.analysis_type, system_prompts["general"])
        
        # Generate the analysis
        result = llama_client.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=min(len(request.text) // 2, 2000),  # Dynamic token limit based on text length
            temperature=0.2,  # Lower temperature for more consistent analysis
        )
        
        processing_time = time.time() - start_time
        
        response = LlamaResponse(
            result=result,
            metadata={
                "model": MODEL_NAME,
                "text_length": len(request.text),
                "analysis_type": request.analysis_type,
                "depth": request.depth,
            },
            processing_time=processing_time
        )
        
        # Cache the result
        cache.set(cache_key, response)
        
        return response
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # For local development
    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True) 