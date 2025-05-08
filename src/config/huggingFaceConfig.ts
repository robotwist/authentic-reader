/**
 * Configuration for Hugging Face API integration
 */
export const HF_CONFIG = {
  // API token from environment variables
  API_TOKEN: import.meta.env?.VITE_HF_API_TOKEN || 
             window.env?.REACT_APP_HF_API_TOKEN ||
             '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', // Fallback to the token provided in .env
  
  // Base URL for Hugging Face Inference API
  INFERENCE_API_URL: 'https://api-inference.huggingface.co/models',
  
  // Model IDs for different analysis types
  MODELS: {
    // Emotion analysis model - detects joy, sadness, fear, anger, etc.
    EMOTION: 'j-hartmann/emotion-english-distilroberta-base',
    
    // Sentiment analysis model - positive/negative classification
    SENTIMENT: 'distilbert-base-uncased-finetuned-sst-2-english',
    
    // Toxicity detection model
    TOXICITY: 'michellejieli/albert_toxicity_classifier'
  },
  
  // Request settings
  REQUEST: {
    // Maximum number of retries for failed requests
    MAX_RETRIES: 3,
    
    // Delay between retries (in milliseconds)
    RETRY_DELAY_MS: 1000,
    
    // Request timeout (in milliseconds)
    TIMEOUT_MS: 10000,
    
    // Maximum length of text to send in a single request
    MAX_INPUT_LENGTH: 512
  }
}; 