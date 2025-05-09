from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
import logging
import torch # Or import tensorflow as tf if using TensorFlow backend
import os
from fastapi.middleware.cors import CORSMiddleware # Import CORS middleware
from typing import List, Dict, Optional, Any
import time

# Import ONNX inference module
try:
    from onnx_inference import get_ner_model, get_zero_shot_model
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    logging.warning("ONNX Runtime not available. Falling back to Hugging Face Transformers.")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Model Loading (Load ONCE on startup) ---
# Choose a device (CPU or GPU if available)
# Use CUDA_VISIBLE_DEVICES environment variable if needed, otherwise auto-detect
device_num = 0 if torch.cuda.is_available() else -1 
device_name = "GPU" if device_num == 0 else "CPU"
logger.info(f"NLP Service: Using device: {device_name}")

# Allow overriding model via environment variable (optional)
DEFAULT_ZERO_SHOT_MODEL = "facebook/bart-large-mnli"
DEFAULT_NER_MODEL = "dslim/bert-base-NER"  # Good general purpose English NER model

ZERO_SHOT_MODEL = os.environ.get("ZERO_SHOT_MODEL", DEFAULT_ZERO_SHOT_MODEL)
NER_MODEL = os.environ.get("NER_MODEL", DEFAULT_NER_MODEL)

# Flag to control whether to use ONNX models (can be overridden via env var)
USE_ONNX = os.environ.get("USE_ONNX", "1" if ONNX_AVAILABLE else "0").lower() in ("1", "true", "yes")

# Model instances
zero_shot_classifier = None
ner_pipeline = None
onnx_zero_shot_model = None
onnx_ner_model = None

# Load ONNX models if enabled
if USE_ONNX and ONNX_AVAILABLE:
    try:
        logger.info("NLP Service: Loading ONNX Zero-Shot model...")
        onnx_zero_shot_model = get_zero_shot_model()
        logger.info("NLP Service: ONNX Zero-Shot model loaded successfully.")
    except Exception as e:
        logger.error(f"NLP Service: Error loading ONNX Zero-Shot model: {e}", exc_info=True)
        onnx_zero_shot_model = None
    
    try:
        logger.info("NLP Service: Loading ONNX NER model...")
        onnx_ner_model = get_ner_model()
        logger.info("NLP Service: ONNX NER model loaded successfully.")
    except Exception as e:
        logger.error(f"NLP Service: Error loading ONNX NER model: {e}", exc_info=True)
        onnx_ner_model = None

# Always load Hugging Face models as fallback
try:
    logger.info(f"NLP Service: Loading zero-shot model: {ZERO_SHOT_MODEL}...")
    zero_shot_classifier = pipeline(
        "zero-shot-classification", 
        model=ZERO_SHOT_MODEL, 
        device=device_num 
    )
    logger.info("NLP Service: Zero-shot classification pipeline loaded successfully.")

except Exception as e:
    logger.error(f"NLP Service: Critical error loading Hugging Face model '{ZERO_SHOT_MODEL}': {e}", exc_info=True)
    # Application might be non-functional without the model

# Load NER model
try:
    logger.info(f"NLP Service: Loading NER model: {NER_MODEL}...")
    
    # Use tokenizer and model objects for more control over the pipeline
    ner_tokenizer = AutoTokenizer.from_pretrained(NER_MODEL)
    ner_model = AutoModelForTokenClassification.from_pretrained(NER_MODEL)
    
    ner_pipeline = pipeline(
        "ner",
        model=ner_model,
        tokenizer=ner_tokenizer,
        device=device_num,
        aggregation_strategy="simple"  # Group entity words together
    )
    logger.info("NLP Service: NER pipeline loaded successfully.")
    
except Exception as e:
    logger.error(f"NLP Service: Error loading NER model '{NER_MODEL}': {e}", exc_info=True)
    # NER functionality will be unavailable

# --- API Definition ---
app = FastAPI(
    title="Authentic Reader NLP Analysis Service",
    description="Provides NLP capabilities like zero-shot classification using Hugging Face Transformers with ONNX Runtime optimization.",
    version="0.2.0"
)

# --- CORS Configuration ---
# Define allowed origins. Be more specific in production!
# Use environment variables for production origins.
origins = [
    "http://localhost:5173", # Your React frontend origin
    "http://127.0.0.1:5173", # Often good to include this too
    "http://localhost:5175", # Additional frontend origin
    "http://127.0.0.1:5175", # Additional frontend origin
    # Add deployed frontend URL(s) here in production, e.g., os.environ.get('FRONTEND_URL')
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # List of origins that are allowed to make requests
    allow_credentials=True, # Allow cookies to be included in requests (optional)
    allow_methods=["*"],    # Allow all methods (GET, POST, PUT, etc.)
    allow_headers=["*"],    # Allow all headers
)

# --- Request/Response Models ---
class TextRequest(BaseModel):
    text: str

class AnalysisRequest(BaseModel):
    text: str
    candidate_labels: list[str]

class ZeroShotResult(BaseModel):
    sequence: str
    labels: list[str]
    scores: list[float]

class Entity(BaseModel):
    entity: str
    type: str
    score: float
    start: int
    end: int

class GroupedEntity(BaseModel):
    entity: str
    type: str
    count: int
    mentions: List[Entity]

class EntityResponse(BaseModel):
    entities: List[Entity]
    grouped_entities: Dict[str, List[GroupedEntity]]
    runtime_info: Optional[Dict[str, Any]] = None

# --- API Endpoints ---
@app.get("/health", tags=["Health"])
async def health_check():
    """Checks if the service is running and the NLP models are loaded."""
    zero_shot_ready = zero_shot_classifier is not None
    ner_ready = ner_pipeline is not None
    onnx_zero_shot_ready = onnx_zero_shot_model is not None if USE_ONNX else False
    onnx_ner_ready = onnx_ner_model is not None if USE_ONNX else False
    
    status = "healthy"
    if not (zero_shot_ready or onnx_zero_shot_ready) and not (ner_ready or onnx_ner_ready):
        status = "critical"
    elif not (zero_shot_ready or onnx_zero_shot_ready) or not (ner_ready or onnx_ner_ready):
        status = "degraded"
        
    return {
        "status": status, 
        "zero_shot_model": {
            "name": ZERO_SHOT_MODEL,
            "ready": zero_shot_ready,
            "onnx_ready": onnx_zero_shot_ready,
            "using_onnx": USE_ONNX and onnx_zero_shot_ready
        },
        "ner_model": {
            "name": NER_MODEL,
            "ready": ner_ready,
            "onnx_ready": onnx_ner_ready,
            "using_onnx": USE_ONNX and onnx_ner_ready
        },
        "device": device_name
    }

@app.post("/analyze/zero-shot", response_model=ZeroShotResult, tags=["Analysis"])
async def analyze_zero_shot(request: AnalysisRequest):
    """
    Performs zero-shot classification on the provided text using the configured model.
    Requires text and a list of candidate_labels.
    """
    # Choose ONNX or fallback to Hugging Face
    use_onnx = USE_ONNX and onnx_zero_shot_model is not None and onnx_zero_shot_model.ready
    
    if (not use_onnx and zero_shot_classifier is None) or (use_onnx and onnx_zero_shot_model is None):
        logger.error("Zero-shot endpoint called but no model is available.")
        raise HTTPException(status_code=503, detail=f"Zero-shot model not available.")
    
    if not request.candidate_labels:
        raise HTTPException(status_code=400, detail="candidate_labels list cannot be empty.")
    if not request.text or not request.text.strip():
         raise HTTPException(status_code=400, detail="text cannot be empty.")

    logger.info(f"Received zero-shot request for text length {len(request.text)}, labels: {request.candidate_labels}")
    
    # Consider adding truncation or chunking here for very long texts if needed
    # max_length = 512 # Example limit for many models
    # text_to_analyze = request.text[:max_length] 

    try:
        start_time = time.time()
        
        # Perform the classification using the appropriate model
        if use_onnx:
            results = onnx_zero_shot_model(request.text, candidate_labels=request.candidate_labels, multi_label=False)
        else:
            results = zero_shot_classifier(request.text, candidate_labels=request.candidate_labels, multi_label=False)
        
        elapsed_time = time.time() - start_time
        logger.info(f"Zero-shot analysis successful in {elapsed_time:.3f}s using {'ONNX' if use_onnx else 'HuggingFace'}.")
        
        return ZeroShotResult(**results) # Ensure structure matches Pydantic model
    
    except Exception as e:
        logger.error(f"NLP Service: Error during zero-shot analysis: {e}", exc_info=True)
        
        # Try fallback if ONNX failed
        if use_onnx and zero_shot_classifier is not None:
            logger.warning("Falling back to Hugging Face pipeline for zero-shot classification")
            try:
                results = zero_shot_classifier(
                    request.text, 
                    candidate_labels=request.candidate_labels, 
                    multi_label=False
                )
                logger.info("Zero-shot analysis successful using fallback.")
                return ZeroShotResult(**results)
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}", exc_info=True)
        
        # Provide a generic error to the client
        raise HTTPException(status_code=500, detail="An internal error occurred during analysis.")

@app.post("/analyze/entities", response_model=EntityResponse, tags=["Analysis"])
async def analyze_entities(request: TextRequest):
    """
    Performs Named Entity Recognition (NER) on the provided text to extract entities 
    like people, organizations, locations, etc.
    """
    # Choose ONNX or fallback to Hugging Face
    use_onnx = USE_ONNX and onnx_ner_model is not None and onnx_ner_model.ready
    
    if (not use_onnx and ner_pipeline is None) or (use_onnx and onnx_ner_model is None):
        logger.error("NER endpoint called but no model is available.")
        raise HTTPException(status_code=503, detail=f"NER model not available.")
    
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty.")

    logger.info(f"Received NER request for text length {len(request.text)}")
    
    try:
        # Process text based on selected model
        start_time = time.time()
        
        if use_onnx:
            text = request.text
            results = []
            
            # Chunk the text if it's very long (NER models typically have limitations)
            if len(text) > 5000:
                # Simple chunk by paragraph
                chunks = text.split("\n\n")
                offset = 0
                
                for chunk in chunks:
                    if not chunk.strip():
                        offset += len(chunk) + 2  # +2 for the newlines
                        continue
                        
                    # Process each chunk
                    chunk_results = onnx_ner_model(chunk)
                    
                    # Adjust the start and end positions based on the offset
                    for entity in chunk_results:
                        entity["start"] += offset
                        entity["end"] += offset
                    
                    results.extend(chunk_results)
                    offset += len(chunk) + 2  # +2 for the newlines
            else:
                # Process the entire text at once
                results = onnx_ner_model(text)
        else:
            text = request.text
            results = []
            
            # Chunk the text if it's very long (NER models typically have limitations)
            if len(text) > 5000:
                # Simple chunk by paragraph
                chunks = text.split("\n\n")
                offset = 0
                
                for chunk in chunks:
                    if not chunk.strip():
                        offset += len(chunk) + 2  # +2 for the newlines
                        continue
                        
                    # Process each chunk
                    chunk_results = ner_pipeline(chunk)
                    
                    # Adjust the start and end positions based on the offset
                    for entity in chunk_results:
                        entity["start"] += offset
                        entity["end"] += offset
                    
                    results.extend(chunk_results)
                    offset += len(chunk) + 2  # +2 for the newlines
            else:
                # Process the entire text at once
                results = ner_pipeline(text)
        
        elapsed_time = time.time() - start_time
        inference_engine = "ONNX" if use_onnx else "HuggingFace"
        logger.info(f"NER analysis successful in {elapsed_time:.3f}s using {inference_engine}.")
        
        # Convert to our Entity model
        entities = []
        for item in results:
            entity = Entity(
                entity=item["word"],
                type=item["entity_group"],
                score=item["score"],
                start=item["start"],
                end=item["end"]
            )
            entities.append(entity)
        
        # Group entities by type
        grouped = {}
        entity_texts = {}  # To track unique entity texts
        
        for entity in entities:
            entity_type = entity.type
            entity_text = entity.entity.lower()
            
            # Initialize the type group if it doesn't exist
            if entity_type not in grouped:
                grouped[entity_type] = []
                entity_texts[entity_type] = {}
            
            # Check if we've seen this entity text before
            if entity_text in entity_texts[entity_type]:
                # Add this mention to the existing entity
                idx = entity_texts[entity_type][entity_text]
                grouped[entity_type][idx].count += 1
                grouped[entity_type][idx].mentions.append(entity)
            else:
                # First time seeing this entity
                idx = len(grouped[entity_type])
                entity_texts[entity_type][entity_text] = idx
                
                grouped_entity = GroupedEntity(
                    entity=entity.entity,
                    type=entity_type,
                    count=1,
                    mentions=[entity]
                )
                grouped[entity_type].append(grouped_entity)
        
        # Return the response with runtime information
        return EntityResponse(
            entities=entities,
            grouped_entities=grouped,
            runtime_info={
                "engine": inference_engine,
                "processing_time": elapsed_time,
                "text_length": len(text),
                "entity_count": len(entities)
            }
        )
        
    except Exception as e:
        logger.error(f"NLP Service: Error during NER analysis: {e}", exc_info=True)
        
        # Try fallback if ONNX failed and Hugging Face pipeline is available
        if use_onnx and ner_pipeline is not None:
            logger.warning("Falling back to Hugging Face pipeline for NER")
            try:
                # Process using HuggingFace pipeline (reusing the chunking code from above)
                text = request.text
                results = []
                
                if len(text) > 5000:
                    chunks = text.split("\n\n")
                    offset = 0
                    
                    for chunk in chunks:
                        if not chunk.strip():
                            offset += len(chunk) + 2
                            continue
                            
                        chunk_results = ner_pipeline(chunk)
                        
                        for entity in chunk_results:
                            entity["start"] += offset
                            entity["end"] += offset
                        
                        results.extend(chunk_results)
                        offset += len(chunk) + 2
                else:
                    results = ner_pipeline(text)
                
                # Process results (same as above)
                entities = []
                for item in results:
                    entity = Entity(
                        entity=item["word"],
                        type=item["entity_group"],
                        score=item["score"],
                        start=item["start"],
                        end=item["end"]
                    )
                    entities.append(entity)
                
                # Group entities (same as above)
                grouped = {}
                entity_texts = {}
                
                for entity in entities:
                    entity_type = entity.type
                    entity_text = entity.entity.lower()
                    
                    if entity_type not in grouped:
                        grouped[entity_type] = []
                        entity_texts[entity_type] = {}
                    
                    if entity_text in entity_texts[entity_type]:
                        idx = entity_texts[entity_type][entity_text]
                        grouped[entity_type][idx].count += 1
                        grouped[entity_type][idx].mentions.append(entity)
                    else:
                        idx = len(grouped[entity_type])
                        entity_texts[entity_type][entity_text] = idx
                        
                        grouped_entity = GroupedEntity(
                            entity=entity.entity,
                            type=entity_type,
                            count=1,
                            mentions=[entity]
                        )
                        grouped[entity_type].append(grouped_entity)
                
                logger.info("NER analysis successful using fallback.")
                return EntityResponse(
                    entities=entities,
                    grouped_entities=grouped,
                    runtime_info={
                        "engine": "HuggingFace (fallback)",
                        "entity_count": len(entities)
                    }
                )
            
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}", exc_info=True)
        
        # Provide a generic error to the client
        raise HTTPException(status_code=500, detail="An internal error occurred during entity extraction.")

# Add a benchmark endpoint for comparing performance
@app.post("/benchmark", tags=["Utility"])
async def benchmark_models(request: AnalysisRequest):
    """Benchmark both ONNX and Hugging Face models for performance comparison"""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty.")
    if not request.candidate_labels:
        raise HTTPException(status_code=400, detail="candidate_labels list cannot be empty.")

    results = {
        "zero_shot": {
            "huggingface": {"available": zero_shot_classifier is not None},
            "onnx": {"available": onnx_zero_shot_model is not None and onnx_zero_shot_model.ready}
        },
        "ner": {
            "huggingface": {"available": ner_pipeline is not None},
            "onnx": {"available": onnx_ner_model is not None and onnx_ner_model.ready}
        }
    }
    
    # Benchmark zero-shot classification
    if zero_shot_classifier is not None:
        start_time = time.time()
        _ = zero_shot_classifier(request.text, candidate_labels=request.candidate_labels)
        hf_time = time.time() - start_time
        results["zero_shot"]["huggingface"]["time"] = hf_time
    
    if onnx_zero_shot_model is not None and onnx_zero_shot_model.ready:
        start_time = time.time()
        _ = onnx_zero_shot_model(request.text, candidate_labels=request.candidate_labels)
        onnx_time = time.time() - start_time
        results["zero_shot"]["onnx"]["time"] = onnx_time
        
        if zero_shot_classifier is not None:
            results["zero_shot"]["speedup"] = hf_time / onnx_time
    
    # Benchmark NER
    if ner_pipeline is not None:
        start_time = time.time()
        _ = ner_pipeline(request.text)
        hf_time = time.time() - start_time
        results["ner"]["huggingface"]["time"] = hf_time
    
    if onnx_ner_model is not None and onnx_ner_model.ready:
        start_time = time.time()
        _ = onnx_ner_model(request.text)
        onnx_time = time.time() - start_time
        results["ner"]["onnx"]["time"] = onnx_time
        
        if ner_pipeline is not None:
            results["ner"]["speedup"] = hf_time / onnx_time
    
    return results

# Example of how to run locally (add to README later):
# 1. cd nlp-service
# 2. python -m venv venv
# 3. source venv/bin/activate  # or .\venv\Scripts\activate on Windows
# 4. pip install -r requirements.txt
# 5. uvicorn main:app --reload --port 8001 