/**
 * Configuration for Hugging Face API integration
 */
export const HF_CONFIG = {
  // API token from environment variables
  API_TOKEN: (() => {
    const token = import.meta.env?.VITE_HF_API_TOKEN || window.env?.REACT_APP_HF_API_TOKEN || '';
    if (!token) {
      console.warn('⚠️ No Hugging Face API token found in environment variables. Using local fallbacks for NLP features.');
    }
    return token;
  })(),
  
  // Base URL for Hugging Face Inference API
  INFERENCE_API_URL: 'https://api-inference.huggingface.co/models',
  
  // Model IDs for different analysis types - updated with more reliable and current models
  MODELS: {
    // Emotion analysis model - detects joy, sadness, fear, anger, etc.
    EMOTION: 'j-hartmann/emotion-english-distilroberta-base',
    
    // Sentiment analysis model - positive/negative classification
    SENTIMENT: 'distilbert-base-uncased-finetuned-sst-2-english',
    
    // Toxicity detection model
    TOXICITY: 'michellejieli/albert_toxicity_classifier',
    
    // Political bias detection model
    POLITICAL_BIAS: 'bucketresearch/politicalBiasBERT',
    
    // Entity recognition model - updated to a more current model
    ENTITY: 'dbmdz/bert-large-cased-finetuned-conll03-english',
    
    // Text summarization model for better metadata extraction - updated to current model
    SUMMARIZATION: 'facebook/bart-large-cnn',
    
    // Zero-shot classification model
    ZERO_SHOT: 'facebook/bart-large-mnli',
    
    // Text embeddings model
    EMBEDDINGS: 'sentence-transformers/all-MiniLM-L6-v2',
    
    // Question answering model
    QA: 'deepset/roberta-base-squad2',
    
    // Text generation model
    TEXT_GENERATION: 'gpt2'
  },
  
  // Request settings - Updated with more generous timeout
  REQUEST: {
    // Maximum number of retries for failed requests
    MAX_RETRIES: 3,
    
    // Delay between retries (in milliseconds)
    RETRY_DELAY_MS: 1000,
    
    // Request timeout (in milliseconds) - increased from 10,000
    TIMEOUT_MS: 20000,
    
    // Maximum length of text to send in a single request
    MAX_INPUT_LENGTH: 512
  },

  // Helper function to check if API token is available
  isConfigured: function() {
    return !!this.API_TOKEN;
  },
  
  // New helper function to use local fallbacks when needed
  useLocalFallbacks: function() {
    return !this.isConfigured() || window.localStorage.getItem('use_local_fallbacks') === 'true';
  }
}; 