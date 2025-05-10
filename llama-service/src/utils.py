"""
Utilities for text processing and analysis

This module provides utilities for text processing, tokenization, and related tasks.
"""

import logging
import re
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

def truncate_text(text: str, max_length: int = 4000) -> str:
    """Truncate text to a maximum length while preserving sentence boundaries
    
    Args:
        text: Text to truncate
        max_length: Maximum length in characters
        
    Returns:
        str: Truncated text
    """
    if len(text) <= max_length:
        return text
    
    # Try to truncate at a sentence boundary
    truncated = text[:max_length]
    
    # Look for the last sentence boundary
    sentence_endings = [match.start() for match in re.finditer(r'[.!?]\s+', truncated)]
    
    if sentence_endings:
        # Truncate at the last complete sentence
        last_sentence_end = sentence_endings[-1] + 2  # Include the period and space
        return text[:last_sentence_end].rstrip()
    else:
        # Fall back to truncating at a word boundary
        last_space = truncated.rfind(' ')
        if last_space > max_length * 0.8:  # Only use word boundary if it's not too short
            return text[:last_space].rstrip()
        else:
            return truncated.rstrip()

def estimate_token_count(text: str) -> int:
    """Estimate the number of tokens in a text
    
    This is a simple estimation based on the average ratio of tokens to characters.
    For English text, there are roughly 4 characters per token on average.
    
    Args:
        text: Text to estimate token count for
        
    Returns:
        int: Estimated token count
    """
    # Simple estimation: average of 4 characters per token for English text
    return len(text) // 4 + 1

def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
    """Split text into chunks of specified size with overlap
    
    Args:
        text: Text to split into chunks
        chunk_size: Maximum chunk size in characters
        overlap: Overlap between chunks in characters
        
    Returns:
        List[str]: List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        # Get a chunk that may be larger than chunk_size
        end = min(start + chunk_size, len(text))
        
        # If not at the end of text, try to end at a sentence boundary
        if end < len(text):
            # Look for the last sentence boundary within the chunk
            # Search for period, exclamation mark, or question mark followed by space or newline
            sentence_endings = [match.start() for match in re.finditer(r'[.!?][\s\n]', text[start:end])]
            
            if sentence_endings:
                # End at the last complete sentence
                last_sentence_end = sentence_endings[-1] + 2  # Include the period and space
                end = start + last_sentence_end
            else:
                # Fall back to the last space if no sentence boundary found
                last_space = text[start:end].rfind(' ')
                if last_space > 0:
                    end = start + last_space + 1  # Include the space
        
        chunks.append(text[start:end].strip())
        
        # Move the start position, including overlap
        start = max(start, end - overlap)
        
        # Make sure we're making progress
        if start >= len(text):
            break
    
    return chunks

def extract_key_sentences(text: str, max_sentences: int = 5) -> str:
    """Extract key sentences from text using a simple heuristic approach
    
    Args:
        text: Text to extract key sentences from
        max_sentences: Maximum number of sentences to extract
        
    Returns:
        str: Extracted key sentences
    """
    # Split into sentences using regex (handles multiple punctuation cases)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    if len(sentences) <= max_sentences:
        return text
    
    # Simple heuristics for importance (this could be improved with ML)
    # For now, we'll use sentence length and position as proxies for importance
    
    # Score sentences based on position (first and last sentences often important)
    # and length (very short sentences are often less important)
    scored_sentences = []
    for i, sentence in enumerate(sentences):
        # Skip very short sentences (likely fragments or headers)
        if len(sentence) < 10:
            continue
            
        # Position score - first and last sentences get higher scores
        position_score = 1.0
        if i == 0:
            position_score = 2.0  # First sentence
        elif i == len(sentences) - 1:
            position_score = 1.5  # Last sentence
        elif i < len(sentences) // 3:
            position_score = 1.2  # First third
            
        # Length score - preference for medium-length sentences
        length = len(sentence)
        if 20 <= length <= 200:
            length_score = 1.0
        elif length > 200:
            length_score = 0.8  # Very long sentences less preferred
        else:
            length_score = 0.6  # Very short sentences less preferred
            
        # Keyword score - look for indicator words that suggest important content
        keyword_score = 1.0
        important_keywords = ["important", "significant", "crucial", "essential",
                             "key", "critical", "main", "primary", "fundamental"]
        
        for keyword in important_keywords:
            if keyword in sentence.lower():
                keyword_score = 1.5
                break
                
        # Compute final score
        final_score = position_score * length_score * keyword_score
        
        scored_sentences.append((sentence, final_score, i))
    
    # Sort by score (descending) and then by original position (ascending)
    scored_sentences.sort(key=lambda x: (-x[1], x[2]))
    
    # Take top sentences and sort them back in document order
    top_sentences = sorted(scored_sentences[:max_sentences], key=lambda x: x[2])
    
    # Combine sentences
    return " ".join([s[0] for s in top_sentences])

def clean_text(text: str) -> str:
    """Clean text by removing extra whitespace, fixing common issues
    
    Args:
        text: Text to clean
        
    Returns:
        str: Cleaned text
    """
    # Replace multiple newlines with single newline
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Replace multiple spaces with single space
    text = re.sub(r' {2,}', ' ', text)
    
    # Fix spacing around punctuation
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)
    
    # Remove spaces at beginning and end of lines
    text = re.sub(r'^\s+|\s+$', '', text, flags=re.MULTILINE)
    
    return text.strip()

def format_response(text: str) -> str:
    """Format the response for better readability
    
    Args:
        text: Text to format
        
    Returns:
        str: Formatted text
    """
    # Remove any repeated newlines (more than 2)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Ensure proper spacing around section headings (capitalized words followed by colon)
    text = re.sub(r'([A-Z][A-Z ]+):', r'\n\1:', text)
    
    # Make sure bullet points and numbered lists have proper spacing
    text = re.sub(r'(\n[•\-*])', r'\n\1', text)
    text = re.sub(r'(\n\d+\.)', r'\n\1', text)
    
    return text.strip() 