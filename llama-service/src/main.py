"""
Llama 3 Service API for Authentic Reader

This service provides LLM capabilities using Ollama-hosted Llama 3 models
for advanced text processing and analysis.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import time

# Import Llama 3 service modules
from .llama_client import LlamaClient
from .result_cache import ResultCache
from .templates import load_template, render_template
from .local_models import analyze_bias_local, analyze_sentiment_local
from .comparative_analysis import analyze_articles_comparatively
from .comprehensive_analysis import analyze_article_comprehensive

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

class ComparativeAnalysisRequest(BaseModel):
    articles: List[Dict[str, Any]]
    min_articles: int = Field(default=2, ge=2, le=10)
    max_articles: int = Field(default=7, ge=2, le=10)

class ComprehensiveAnalysisRequest(BaseModel):
    text: str
    bias_result: Optional[Dict[str, Any]] = None

class LlamaResponse(BaseModel):
    result: Any  # Changed from str to Any to allow both strings and dictionaries
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
    use_local_fallback = False
    
    if llama_client is None or not llama_client.is_ready():
        logger.warning("Llama 3 service is not available, using local fallback")
        use_local_fallback = True
    
    # Check cache for identical request
    cache_key = f"ana:{request.text}:{request.analysis_type}:{request.depth}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    start_time = time.time()
    
    # Use local fallback if Llama service is unavailable
    if use_local_fallback:
        logger.info(f"Using local fallback for {request.analysis_type} analysis")
        
        if request.analysis_type == "bias":
            local_result = analyze_bias_local(request.text)
            result = {
                "raw_response": "Local bias analysis performed",
                "parsed_analysis": local_result,
                "analysis_method": "local_fallback",
                "fallback_reason": "Llama service unavailable"
            }
        elif request.analysis_type == "sentiment":
            local_result = analyze_sentiment_local(request.text)
            result = {
                "raw_response": "Local sentiment analysis performed",
                "parsed_analysis": local_result,
                "analysis_method": "local_fallback",
                "fallback_reason": "Llama service unavailable"
            }
        else:
            # For other analysis types, return error
            result = {
                "raw_response": "Analysis not available",
                "parsed_analysis": None,
                "analysis_method": "failed",
                "error": f"Local fallback not available for {request.analysis_type} analysis"
            }
        
        processing_time = time.time() - start_time
        
        response = LlamaResponse(
            result=result,
            metadata={
                "model": "local_fallback",
                "text_length": len(request.text),
                "analysis_type": request.analysis_type,
                "depth": request.depth,
            },
            processing_time=processing_time
        )
        
        # Cache the result
        cache.set(cache_key, response)
        
        return response
    
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
            "general": "You are an expert content analyst providing objective insights. Always respond with valid JSON format as specified in the prompt.",
            "bias": "You are an expert media analyst specializing in detecting bias and framing. Always respond with valid JSON format as specified in the prompt.",
            "sentiment": "You are an expert sentiment analyst detecting emotional tones and subtext. Always respond with valid JSON format as specified in the prompt.",
            "entities": "You are an expert entity analyst identifying key people, organizations, and connections. Always respond with valid JSON format as specified in the prompt.",
            "topics": "You are an expert topic analyst identifying key themes and subject matter. Always respond with valid JSON format as specified in the prompt."
        }
        
        system_prompt = system_prompts.get(request.analysis_type, system_prompts["general"])
        
        # Generate the analysis
        result = llama_client.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=min(len(request.text) // 2, 4000),  # Increased token limit for longer responses
            temperature=0.2,  # Lower temperature for more consistent analysis
        )
        
        # Try to parse JSON from the result
        try:
            # Extract JSON from the response (handle cases where there might be extra text)
            import re
            
            # First try to extract JSON from markdown code blocks
            code_block_match = re.search(r'```(?:json)?\s*\n(.*?)\n```', result, re.DOTALL)
            if code_block_match:
                json_text = code_block_match.group(1)
                parsed_json = json.loads(json_text)
                result = {
                    "raw_response": result,
                    "parsed_analysis": parsed_json,
                    "analysis_method": "llama_ai"
                }
            else:
                # Fallback: try to extract JSON directly
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    parsed_json = json.loads(json_match.group())
                    result = {
                        "raw_response": result,
                        "parsed_analysis": parsed_json,
                        "analysis_method": "llama_ai"
                    }
                else:
                    raise json.JSONDecodeError("No JSON found in response", "", 0)
        except json.JSONDecodeError as e:
            # If JSON parsing fails, use local fallback analysis
            logger.warning(f"Failed to parse JSON from Llama analysis, using local fallback: {e}")
            
            if request.analysis_type == "bias":
                local_result = analyze_bias_local(request.text)
                result = {
                    "raw_response": result,
                    "parsed_analysis": local_result,
                    "analysis_method": "local_fallback",
                    "fallback_reason": "JSON parsing failed"
                }
            elif request.analysis_type == "sentiment":
                local_result = analyze_sentiment_local(request.text)
                result = {
                    "raw_response": result,
                    "parsed_analysis": local_result,
                    "analysis_method": "local_fallback",
                    "fallback_reason": "JSON parsing failed"
                }
            else:
                # For other analysis types, return error
                result = {
                    "raw_response": result,
                    "parsed_analysis": None,
                    "analysis_method": "failed",
                    "error": "Failed to parse structured analysis and no local fallback available"
                }
        
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
        import traceback
        logger.error(f"Error analyzing text: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/compare-articles", response_model=LlamaResponse, tags=["Comparative Analysis"])
async def compare_articles(request: ComparativeAnalysisRequest):
    """Compare multiple articles on the same topic to identify similarities, differences, and potential misinformation"""
    start_time = time.time()
    
    try:
        # Validate number of articles
        if len(request.articles) < request.min_articles:
            raise HTTPException(
                status_code=400, 
                detail=f"Need at least {request.min_articles} articles for comparative analysis"
            )
        
        if len(request.articles) > request.max_articles:
            raise HTTPException(
                status_code=400, 
                detail=f"Maximum {request.max_articles} articles allowed for comparative analysis"
            )
        
        # Perform comparative analysis
        logger.info(f"Starting comparative analysis of {len(request.articles)} articles")
        analysis_result = analyze_articles_comparatively(request.articles)
        
        processing_time = time.time() - start_time
        
        response = LlamaResponse(
            result=analysis_result,
            metadata={
                "analysis_type": "comparative",
                "articles_analyzed": len(request.articles),
                "topic": analysis_result.get("topic", "unknown"),
                "confidence_score": analysis_result.get("confidence_score", 0.0),
                "fact_checks_performed": len(analysis_result.get("fact_checks", [])),
                "misinformation_detected": len(analysis_result.get("potential_misinformation", []))
            },
            processing_time=processing_time
        )
        
        logger.info(f"Comparative analysis completed in {processing_time:.2f}s")
        return response
        
    except Exception as e:
        logger.error(f"Comparative analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Comparative analysis failed: {str(e)}")

@app.post("/comprehensive-analysis", response_model=LlamaResponse, tags=["Analysis"])
async def comprehensive_analysis(request: ComprehensiveAnalysisRequest):
    """Perform comprehensive analysis including bias, logical fallacies, and rhetorical devices"""
    start_time = time.time()
    
    try:
        # If no bias result provided, perform bias analysis first
        bias_result = request.bias_result
        if not bias_result:
            logger.info("No bias result provided, performing bias analysis first")
            bias_response = await analyze_bias(request.text)
            bias_result = bias_response.result
        
        # Perform comprehensive analysis
        logger.info("Starting comprehensive analysis")
        analysis_result = analyze_article_comprehensive(request.text, bias_result)
        
        processing_time = time.time() - start_time
        
        response = LlamaResponse(
            result=analysis_result,
            metadata={
                "analysis_type": "comprehensive",
                "text_length": len(request.text),
                "fallacies_detected": len(analysis_result.get("logical_fallacies", [])),
                "rhetorical_devices": len(analysis_result.get("rhetorical_devices", [])),
                "credibility_score": analysis_result.get("credibility", {}).get("score", 0),
                "confidence": analysis_result.get("confidence", 0.0)
            },
            processing_time=processing_time
        )
        
        logger.info(f"Comprehensive analysis completed in {processing_time:.2f}s")
        return response
        
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Comprehensive analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # For local development
    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True) 