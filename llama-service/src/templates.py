"""
Templates for Llama 3 analysis tasks

This module contains structured templates for various text analysis tasks,
including bias detection, sentiment analysis, entity extraction, and more.
"""

import json
from typing import Dict, Any, Optional

# Base templates for different analysis types
TEMPLATES = {
    # Bias analysis template
    "analyze_bias": """Analyze the following text for bias and provide your analysis in JSON format.

TEXT TO ANALYZE:
{text}

ANALYSIS DEPTH: {depth}

Please analyze the text for bias and provide your response in JSON format with bias_scores, detected_bias_phrases, and overall_bias_assessment.

Focus on political bias, ideological bias, partisan bias, and emotional bias.""",

    # Sentiment analysis template
    "analyze_sentiment": """Analyze the sentiment and emotional tone of the following text. Provide your analysis in JSON format.

TEXT TO ANALYZE:
{text}

ANALYSIS DEPTH: {depth}

Please analyze the text for sentiment and provide your response in JSON format with overall_sentiment, sentiment_score, emotional_intensity, and tone_analysis.""",

    # Entity analysis template
    "analyze_entities": """Extract and analyze entities from the following text. Provide your analysis in JSON format.

TEXT TO ANALYZE:
{text}

ANALYSIS DEPTH: {depth}

Please analyze the text for entities and provide your response in JSON format with entities list and key_themes.""",

    # Topic analysis template
    "analyze_topics": """Identify and analyze the main topics and themes in the following text. Provide your analysis in JSON format.

TEXT TO ANALYZE:
{text}

ANALYSIS DEPTH: {depth}

Please analyze the text for topics and provide your response in JSON format with primary_topics, subtopics, and topic_relationships.""",

    # General analysis template
    "analyze_general": """Provide a comprehensive analysis of the following text. Include key themes, arguments, structure, and insights. Provide your analysis in JSON format.

TEXT TO ANALYZE:
{text}

ANALYSIS DEPTH: {depth}

Please analyze the text comprehensively and provide your response in JSON format with main_themes, key_arguments, structure_analysis, and credibility_indicators.""",

    # Summarization template
    "summarize": """Create a {length} summary of the following text. Focus on {focus}.

TEXT TO SUMMARIZE:
{text}

SUMMARY:"""
}

def load_template(template_name: str) -> str:
    """Load a template by name
    
    Args:
        template_name: Name of the template to load
        
    Returns:
        str: The template string
    """
    if template_name not in TEMPLATES:
        raise ValueError(f"Template '{template_name}' not found. Available templates: {list(TEMPLATES.keys())}")
    
    return TEMPLATES[template_name]

def render_template(template: str, **kwargs) -> str:
    """Render a template with the provided variables
    
    Args:
        template: Template string to render
        **kwargs: Variables to substitute in the template
        
    Returns:
        str: Rendered template
    """
    try:
        # Use safe_format to handle missing variables gracefully
        return template.format(**kwargs)
    except KeyError as e:
        # Log the error and provide a fallback
        print(f"Warning: Missing template variable {e}, using default value")
        # Provide default values for missing variables
        defaults = {
            'text': kwargs.get('text', ''),
            'depth': kwargs.get('depth', 'medium'),
            'length': kwargs.get('length', 'medium'),
            'focus': kwargs.get('focus', 'general content')
        }
        return template.format(**defaults)
    except Exception as e:
        raise ValueError(f"Error rendering template: {e}")

def get_available_templates() -> list:
    """Get list of available template names
    
    Returns:
        list: Available template names
    """
    return list(TEMPLATES.keys())

def validate_template_variables(template_name: str, **kwargs) -> bool:
    """Validate that all required variables are provided for a template
    
    Args:
        template_name: Name of the template to validate
        **kwargs: Variables to validate
        
    Returns:
        bool: True if all required variables are provided
    """
    try:
        template = load_template(template_name)
        # Try to render with the provided variables
        render_template(template, **kwargs)
        return True
    except (ValueError, KeyError):
        return False
