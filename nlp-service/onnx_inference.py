"""
ONNX Inference Module for Authentic Reader NLP Service

This module provides optimized inference using ONNX Runtime 
for the NLP models used in Authentic Reader.
"""

import os
import logging
from pathlib import Path
import numpy as np
import torch
import onnxruntime as ort
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForTokenClassification, ORTModelForSequenceClassification

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Default ONNX model paths (relative to this file)
ONNX_MODEL_DIR = Path(os.path.dirname(os.path.abspath(__file__))) / "onnx_models"
NER_MODEL_DIR = ONNX_MODEL_DIR / "ner"
ZERO_SHOT_MODEL_DIR = ONNX_MODEL_DIR / "zero-shot"

# ONNX Runtime session options
def get_ort_session_options():
    """Get optimized ORT session options"""
    options = ort.SessionOptions()
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    options.intra_op_num_threads = os.cpu_count() // 2 if os.cpu_count() > 1 else 1
    options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    return options

class ONNXNERModel:
    """ONNX Runtime implementation of Named Entity Recognition model"""
    
    def __init__(self, model_path=None):
        """Initialize the ONNX NER model

        Args:
            model_path: Path to the ONNX model directory. If None, use default path.
        """
        self.model_path = Path(model_path) if model_path else NER_MODEL_DIR
        self.tokenizer = None
        self.model = None
        self.id2label = None
        self.ready = False
        
        try:
            self.load_model()
            self.ready = True
        except Exception as e:
            logger.error(f"Failed to load ONNX NER model: {e}", exc_info=True)
            self.ready = False
    
    def load_model(self):
        """Load the tokenizer and ONNX model"""
        logger.info(f"Loading ONNX NER model from {self.model_path}")
        
        if not self.model_path.exists():
            raise FileNotFoundError(f"ONNX NER model not found at {self.model_path}")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
        
        # Load ONNX model with optimum
        self.model = ORTModelForTokenClassification.from_pretrained(self.model_path)
        
        # Load label mapping
        self.id2label = self.model.config.id2label
        
        logger.info("ONNX NER model loaded successfully")
    
    def __call__(self, text, aggregation_strategy="simple"):
        """Run NER inference on the input text
        
        Args:
            text: Input text to analyze
            aggregation_strategy: Strategy for aggregating token predictions
                                 ("none", "simple", "first", "max", "average")
                                 
        Returns:
            List of extracted entities with type, score, and position information
        """
        if not self.ready:
            raise RuntimeError("ONNX NER model is not loaded")
        
        # Tokenize input
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        
        # Run inference
        outputs = self.model(**inputs)
        
        # Process outputs
        predictions = self._process_ner_outputs(text, inputs, outputs, aggregation_strategy)
        
        return predictions
    
    def _process_ner_outputs(self, text, inputs, outputs, aggregation_strategy="simple"):
        """Process NER model outputs to extract entities"""
        # Get token-level predictions
        token_logits = outputs.logits[0].detach().numpy()
        token_ids = inputs.input_ids[0].detach().numpy()
        token_mask = inputs.attention_mask[0].detach().numpy()
        
        # Get predictions for each token
        token_predictions = token_logits.argmax(axis=-1)
        
        # Convert to entity spans
        entities = []
        current_entity = None
        
        # Process each token
        for idx, (token_id, pred_id, mask) in enumerate(zip(token_ids, token_predictions, token_mask)):
            # Skip padding tokens
            if mask == 0:
                continue
            
            # Skip special tokens
            if token_id in self.tokenizer.all_special_ids:
                continue
            
            # Get predicted label and token text
            pred_label = self.id2label[pred_id]
            token_text = self.tokenizer.convert_ids_to_tokens([token_id])[0]
            
            # Detokenize subwords
            is_subword = token_text.startswith('##')
            if is_subword:
                token_text = token_text[2:]  # Remove ## prefix
            
            # Handle entity tracking based on BIO scheme
            if pred_label.startswith('B-'):
                # Start a new entity
                entity_type = pred_label[2:]  # Remove B- prefix
                
                # Finish previous entity if exists
                if current_entity:
                    entities.append(current_entity)
                
                # Get word offsets in original text
                word_offsets = self._get_word_offsets(text, token_text, idx, inputs)
                
                # Create new entity
                current_entity = {
                    'entity_group': entity_type,
                    'word': token_text,
                    'score': float(token_logits[idx][pred_id]),
                    'start': word_offsets[0],
                    'end': word_offsets[1]
                }
            
            elif pred_label.startswith('I-'):
                # Continue current entity
                entity_type = pred_label[2:]  # Remove I- prefix
                
                if current_entity and current_entity['entity_group'] == entity_type:
                    # Append to current entity
                    current_entity['word'] += token_text
                    
                    # Update end position and score
                    word_offsets = self._get_word_offsets(text, token_text, idx, inputs)
                    current_entity['end'] = word_offsets[1]
                    current_entity['score'] = (current_entity['score'] + 
                                             float(token_logits[idx][pred_id])) / 2
            
            elif current_entity:
                # End of an entity
                entities.append(current_entity)
                current_entity = None
        
        # Add final entity if exists
        if current_entity:
            entities.append(current_entity)
        
        # Apply aggregation strategy if needed
        if aggregation_strategy == "simple":
            entities = self._aggregate_entities(entities)
        
        return entities
    
    def _get_word_offsets(self, text, token_text, token_idx, inputs):
        """Get start and end character positions in original text"""
        # This is a simplified implementation that approximates offsets
        # In a production environment, use a more robust approach or the tokenizer's offset mapping
        start = text.lower().find(token_text.lower())
        end = start + len(token_text) if start != -1 else -1
        
        return (start, end)
    
    def _aggregate_entities(self, entities):
        """Aggregate entities with the same label that are adjacent"""
        if not entities:
            return []
        
        aggregated = []
        current = entities[0].copy()
        
        for entity in entities[1:]:
            if (entity['entity_group'] == current['entity_group'] and 
                entity['start'] - current['end'] <= 1):
                # Merge adjacent entities
                current['word'] += ' ' + entity['word']
                current['end'] = entity['end']
                current['score'] = (current['score'] + entity['score']) / 2
            else:
                # Add the current entity and start a new one
                aggregated.append(current)
                current = entity.copy()
        
        # Add the last entity
        aggregated.append(current)
        
        return aggregated


class ONNXZeroShotModel:
    """ONNX Runtime implementation of Zero-Shot Classification model"""
    
    def __init__(self, model_path=None):
        """Initialize the ONNX Zero-Shot Classification model

        Args:
            model_path: Path to the ONNX model directory. If None, use default path.
        """
        self.model_path = Path(model_path) if model_path else ZERO_SHOT_MODEL_DIR
        self.tokenizer = None
        self.model = None
        self.ready = False
        
        try:
            self.load_model()
            self.ready = True
        except Exception as e:
            logger.error(f"Failed to load ONNX Zero-Shot model: {e}", exc_info=True)
            self.ready = False
    
    def load_model(self):
        """Load the tokenizer and ONNX model"""
        logger.info(f"Loading ONNX Zero-Shot model from {self.model_path}")
        
        if not self.model_path.exists():
            raise FileNotFoundError(f"ONNX Zero-Shot model not found at {self.model_path}")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
        
        # Load ONNX model with optimum
        self.model = ORTModelForSequenceClassification.from_pretrained(self.model_path)
        
        logger.info("ONNX Zero-Shot model loaded successfully")
    
    def __call__(self, text, candidate_labels, multi_label=False):
        """Run Zero-Shot Classification inference on the input text
        
        Args:
            text: Input text to classify
            candidate_labels: List of candidate labels
            multi_label: Whether multiple labels can be assigned
                         
        Returns:
            Classification results with scores for each label
        """
        if not self.ready:
            raise RuntimeError("ONNX Zero-Shot model is not loaded")
        
        if isinstance(candidate_labels, str):
            candidate_labels = [candidate_labels]
        
        # Format the inputs for the model
        results = []
        scores = []
        
        # Process each label hypothesis
        for label in candidate_labels:
            # Format hypothesis
            hypothesis = f"This text is about {label}."
            
            # Tokenize premise and hypothesis
            encoding = self.tokenizer(text, hypothesis, return_tensors="pt", truncation=True, max_length=512)
            
            # Run inference
            outputs = self.model(**encoding)
            logits = outputs.logits.detach().numpy()
            
            # Convert logits to probabilities
            if logits.shape[1] == 2:  # For binary classification (entailment vs. not_entailment)
                # Apply softmax to get probabilities
                probs = self._softmax(logits)
                # Get the probability of entailment (label 1)
                entail_prob = probs[0, 1]
                scores.append(float(entail_prob))
            else:
                # For multi-class models with different output format
                scores.append(float(logits.max()))
        
        # Organize the results
        if multi_label:
            # Keep all labels above threshold
            threshold = 0.5
            results = [label for i, label in enumerate(candidate_labels) if scores[i] > threshold]
        else:
            # Find the label with the highest score
            max_idx = np.argmax(scores)
            results = [candidate_labels[max_idx]]
        
        # Create output structure matching original pipeline
        response = {
            "sequence": text,
            "labels": candidate_labels,
            "scores": scores
        }
        
        return response
    
    def _softmax(self, x):
        """Compute softmax values for a matrix"""
        exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        return exp_x / exp_x.sum(axis=1, keepdims=True)


# Singleton instances
_ner_model = None
_zero_shot_model = None

def get_ner_model(model_path=None):
    """Get the singleton instance of the NER model"""
    global _ner_model
    if _ner_model is None:
        _ner_model = ONNXNERModel(model_path)
    return _ner_model

def get_zero_shot_model(model_path=None):
    """Get the singleton instance of the Zero-Shot model"""
    global _zero_shot_model
    if _zero_shot_model is None:
        _zero_shot_model = ONNXZeroShotModel(model_path)
    return _zero_shot_model 