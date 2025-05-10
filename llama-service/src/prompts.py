"""
Prompts and templates for Llama 3 tasks

This module contains system prompts and templates for various text generation,
summarization, and analysis tasks.
"""

# System prompts for different tasks
SYSTEM_PROMPTS = {
    # General text generation
    "default": """You are a helpful, harmless, and honest AI assistant. Always provide accurate, 
factual information and admit when you don't know something rather than making up information.
Respond directly to user questions with clear, concise, and helpful answers.""",
    
    # Summarization
    "summarize": """You are a specialized AI assistant for text summarization. Your job is to 
create concise, accurate summaries that capture the key points and main ideas of the 
provided text. Follow these guidelines:
1. Identify and include the most important information, main arguments, and key conclusions
2. Maintain the original meaning and intent of the text
3. Do not add your own opinions or information not present in the original text
4. Use clear, direct language and maintain a neutral tone
5. Create summaries that are approximately 1/4 to 1/5 the length of the original text 
   (unless specified otherwise)""",
    
    # Text analysis
    "analyze": """You are a specialized AI assistant for text analysis. Your job is to 
analyze the provided text and extract meaningful insights. Follow these guidelines:
1. Identify the main themes, arguments, and key points in the text
2. Analyze the structure, style, tone, and rhetorical devices used
3. Recognize any bias, assumptions, or logical fallacies present
4. Consider the context and intended audience of the text
5. Provide substantive analysis that goes beyond surface observations
6. Organize your analysis into clearly labeled sections for readability
7. Maintain objectivity and do not introduce your own opinions or biases""",
    
    # Content classification
    "classify": """You are a specialized AI assistant for content classification. Your job is to 
classify the provided text into appropriate categories and explain your reasoning. Follow these guidelines:
1. Identify the most relevant content categories for the text
2. Explain the key characteristics that justify each classification
3. Consider both the subject matter and the style/format of the content
4. Be specific with your category assignments rather than using vague labels
5. If the content has multiple themes or purposes, rank them by prominence
6. Do not make assumptions beyond what is evident in the text itself""",
}

# Template for summarization with adjustable parameters
SUMMARIZE_TEMPLATE = """Please provide a {summary_type} summary of the following text. 
The summary should be approximately {length} in length.

TEXT TO SUMMARIZE:
{text}

SUMMARY:"""

# Templates for different summary types
SUMMARY_TYPES = {
    "brief": "very concise and short",
    "detailed": "comprehensive but focused",
    "bullet": "bullet-point style with key points",
    "executive": "business-oriented executive summary"
}

# Template for text analysis
ANALYZE_TEMPLATE = """Please analyze the following text, focusing on {analysis_focus}.
Provide your analysis in a structured format.

TEXT TO ANALYZE:
{text}

ANALYSIS:"""

# Different analysis focus options
ANALYSIS_FOCUS = {
    "general": "the main themes, arguments, structure, and tone",
    "bias": "potential biases, assumptions, and perspective",
    "style": "writing style, rhetoric, and language use",
    "argument": "the logical structure of arguments and supporting evidence",
    "context": "historical, cultural, or social context and implications"
}

def get_system_prompt(task_type: str) -> str:
    """Get a system prompt for a specific task type
    
    Args:
        task_type: Type of task (default, summarize, analyze, etc.)
        
    Returns:
        str: System prompt for the specified task
    """
    return SYSTEM_PROMPTS.get(task_type, SYSTEM_PROMPTS["default"])

def build_summarize_prompt(text: str, summary_type: str = "detailed", length: str = "1/4 of the original text") -> str:
    """Build a summarization prompt
    
    Args:
        text: Text to summarize
        summary_type: Type of summary (brief, detailed, bullet, executive)
        length: Desired length of the summary
        
    Returns:
        str: Formatted summarization prompt
    """
    summary_type_desc = SUMMARY_TYPES.get(summary_type, SUMMARY_TYPES["detailed"])
    return SUMMARIZE_TEMPLATE.format(
        summary_type=summary_type_desc,
        length=length,
        text=text
    )

def build_analyze_prompt(text: str, analysis_focus: str = "general") -> str:
    """Build an analysis prompt
    
    Args:
        text: Text to analyze
        analysis_focus: Focus of the analysis
        
    Returns:
        str: Formatted analysis prompt
    """
    focus_desc = ANALYSIS_FOCUS.get(analysis_focus, ANALYSIS_FOCUS["general"])
    return ANALYZE_TEMPLATE.format(
        analysis_focus=focus_desc,
        text=text
    ) 