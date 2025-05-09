#!/usr/bin/env python3
"""
ONNX Model Conversion Utility for Authentic Reader NLP Service

This script converts HuggingFace Transformer models to ONNX format
for faster inference with ONNX Runtime.
"""

import os
import argparse
import logging
from pathlib import Path
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForTokenClassification,
    AutoModelForSequenceClassification
)
from optimum.onnxruntime import ORTModelForTokenClassification, ORTModelForSequenceClassification
from optimum.onnxruntime.configuration import OptimizationConfig

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Default model paths
DEFAULT_MODELS = {
    "ner": "dslim/bert-base-NER",
    "zero-shot": "facebook/bart-large-mnli"
}

# Output directory for ONNX models
DEFAULT_OUTPUT_DIR = Path("./onnx_models")

def convert_ner_model(model_name, output_dir):
    """Convert NER model to ONNX format"""
    logger.info(f"Converting NER model: {model_name}")
    
    # Create output directory
    ner_output_dir = output_dir / "ner"
    ner_output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForTokenClassification.from_pretrained(model_name)
    
    # Define optimization configuration
    optimization_config = OptimizationConfig(
        optimization_level=99,  # Maximum optimization
        enable_transformers_specific_optimizations=True,
        enable_gelu_approximation=True
    )
    
    # Convert to ONNX
    ort_model = ORTModelForTokenClassification.from_pretrained(
        model,
        export=True,
        optimization_config=optimization_config
    )
    
    # Save the model and tokenizer
    ort_model.save_pretrained(ner_output_dir)
    tokenizer.save_pretrained(ner_output_dir)
    
    logger.info(f"NER model converted and saved to {ner_output_dir}")
    return ner_output_dir

def convert_zero_shot_model(model_name, output_dir):
    """Convert Zero-shot classification model to ONNX format"""
    logger.info(f"Converting Zero-shot model: {model_name}")
    
    # Create output directory
    zs_output_dir = output_dir / "zero-shot"
    zs_output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    
    # Define optimization configuration
    optimization_config = OptimizationConfig(
        optimization_level=99,  # Maximum optimization
        enable_transformers_specific_optimizations=True,
        enable_gelu_approximation=True
    )
    
    # Convert to ONNX
    ort_model = ORTModelForSequenceClassification.from_pretrained(
        model,
        export=True,
        optimization_config=optimization_config
    )
    
    # Save the model and tokenizer
    ort_model.save_pretrained(zs_output_dir)
    tokenizer.save_pretrained(zs_output_dir)
    
    logger.info(f"Zero-shot model converted and saved to {zs_output_dir}")
    return zs_output_dir

def main():
    parser = argparse.ArgumentParser(description="Convert HuggingFace models to ONNX format")
    parser.add_argument("--ner-model", type=str, default=DEFAULT_MODELS["ner"],
                        help=f"NER model to convert (default: {DEFAULT_MODELS['ner']})")
    parser.add_argument("--zero-shot-model", type=str, default=DEFAULT_MODELS["zero-shot"],
                        help=f"Zero-shot model to convert (default: {DEFAULT_MODELS['zero-shot']})")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR,
                        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})")
    parser.add_argument("--skip-ner", action="store_true", help="Skip NER model conversion")
    parser.add_argument("--skip-zero-shot", action="store_true", help="Skip Zero-shot model conversion")
    
    args = parser.parse_args()
    
    # Create output directory
    args.output_dir.mkdir(parents=True, exist_ok=True)
    
    if not args.skip_ner:
        convert_ner_model(args.ner_model, args.output_dir)
    
    if not args.skip_zero_shot:
        convert_zero_shot_model(args.zero_shot_model, args.output_dir)
    
    logger.info("Model conversion complete!")

if __name__ == "__main__":
    main() 