"""
Llama Client for communicating with Ollama API

This module provides a client to interact with Llama 3 models hosted with Ollama.
"""

import os
import json
import logging
import requests
from typing import Optional, Dict, Any, List

# Configure logging
logger = logging.getLogger(__name__)

class LlamaClient:
    """Client for interacting with Ollama-hosted Llama 3 models"""
    
    def __init__(self, model_name: str = "llama3:8b", host: str = "http://localhost:11434"):
        """Initialize the Llama 3 client
        
        Args:
            model_name: Name of the Llama 3 model to use (default: "llama3:8b")
            host: Ollama host URL (default: "http://localhost:11434")
        """
        self.model_name = model_name
        self.host = host.rstrip("/")  # Remove trailing slash if present
        self.api_base = f"{self.host}/api"
        self._ready = False
        self._model_info = None
    
    def is_ready(self) -> bool:
        """Check if the client is ready to process requests"""
        return self._ready
    
    def test_connection(self) -> bool:
        """Test connection to Ollama and model availability
        
        Returns:
            bool: True if connection and model are available
        
        Raises:
            ConnectionError: If Ollama server is not reachable
            ValueError: If the specified model is not available
        """
        try:
            # Check if Ollama is running
            response = requests.get(f"{self.host}/", timeout=5)
            if response.status_code != 200:
                raise ConnectionError(f"Ollama server returned status code {response.status_code}")
            
            # Check if model is available
            models_response = requests.get(f"{self.api_base}/tags", timeout=5)
            if models_response.status_code != 200:
                raise ConnectionError("Failed to retrieve model list from Ollama")
            
            models_data = models_response.json()
            available_models = [model["name"] for model in models_data.get("models", [])]
            
            if self.model_name not in available_models:
                logger.warning(f"Model {self.model_name} not found. Available models: {available_models}")
                # Try to pull the model
                return self._pull_model()
            
            # Get model details
            self._model_info = self._get_model_info()
            self._ready = True
            return True
            
        except requests.RequestException as e:
            logger.error(f"Connection error to Ollama: {e}")
            raise ConnectionError(f"Failed to connect to Ollama server at {self.host}: {e}")
    
    def _pull_model(self) -> bool:
        """Pull the model from Ollama library
        
        Returns:
            bool: True if model was successfully pulled
            
        Raises:
            ValueError: If model pull fails
        """
        logger.info(f"Pulling model {self.model_name} from Ollama library...")
        
        try:
            # Pull model (this operation can take a long time for large models)
            pull_url = f"{self.api_base}/pull"
            response = requests.post(
                pull_url, 
                json={"name": self.model_name},
                timeout=600  # Allow up to 10 minutes for model pull
            )
            
            if response.status_code != 200:
                error_msg = f"Failed to pull model {self.model_name}: {response.text}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Get model details
            self._model_info = self._get_model_info()
            self._ready = True
            return True
            
        except requests.RequestException as e:
            logger.error(f"Error pulling model {self.model_name}: {e}")
            raise ValueError(f"Failed to pull model {self.model_name}: {e}")
    
    def _get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model
        
        Returns:
            Dict[str, Any]: Model information
        """
        try:
            response = requests.post(
                f"{self.api_base}/show",
                json={"name": self.model_name},
                timeout=10
            )
            
            if response.status_code != 200:
                logger.warning(f"Failed to get model info: {response.text}")
                return {}
            
            return response.json()
            
        except requests.RequestException as e:
            logger.warning(f"Error getting model info: {e}")
            return {}
    
    def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        top_p: float = 0.9,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        stop: Optional[List[str]] = None
    ) -> str:
        """Generate text using the Llama 3 model
        
        Args:
            prompt: The prompt to generate from
            system_prompt: Optional system prompt to guide the model's behavior
            max_tokens: Maximum number of tokens to generate
            temperature: Temperature parameter (higher = more random)
            top_p: Top-p sampling parameter
            frequency_penalty: Penalty for repeated tokens
            presence_penalty: Penalty for tokens that have appeared at all
            stop: Optional list of strings to stop generation at
            
        Returns:
            str: Generated text
            
        Raises:
            RuntimeError: If generation fails
        """
        if not self._ready:
            raise RuntimeError("Llama client is not ready. Call test_connection() first.")
        
        try:
            # Prepare request payload
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": temperature,
                    "top_p": top_p,
                    "frequency_penalty": frequency_penalty,
                    "presence_penalty": presence_penalty,
                }
            }
            
            # Add system prompt if provided
            if system_prompt:
                payload["system"] = system_prompt
                
            # Add stop sequences if provided
            if stop:
                payload["options"]["stop"] = stop
            
            # Send generation request
            response = requests.post(
                f"{self.api_base}/generate",
                json=payload,
                timeout=300  # Allow up to 5 minutes for generation
            )
            
            if response.status_code != 200:
                error_msg = f"Generation failed with status {response.status_code}: {response.text}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)
            
            # Parse response
            response_data = response.json()
            
            return response_data.get("response", "")
            
        except requests.RequestException as e:
            logger.error(f"Error during generation: {e}")
            raise RuntimeError(f"Generation failed: {e}")

    def generate_streaming(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ):
        """Generate text with streaming response
        
        This method returns a generator that yields chunks of text as they are generated.
        
        Args:
            prompt: The prompt to generate from
            system_prompt: Optional system prompt to guide the model's behavior
            max_tokens: Maximum number of tokens to generate
            temperature: Temperature parameter (higher = more random)
            
        Yields:
            str: Chunks of generated text
            
        Raises:
            RuntimeError: If generation fails
        """
        if not self._ready:
            raise RuntimeError("Llama client is not ready. Call test_connection() first.")
        
        try:
            # Prepare request payload
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": temperature,
                },
                "stream": True  # Enable streaming
            }
            
            # Add system prompt if provided
            if system_prompt:
                payload["system"] = system_prompt
            
            # Send streaming generation request
            with requests.post(
                f"{self.api_base}/generate",
                json=payload,
                stream=True,
                timeout=300  # Allow up to 5 minutes for generation
            ) as response:
                if response.status_code != 200:
                    error_msg = f"Streaming generation failed with status {response.status_code}"
                    logger.error(error_msg)
                    raise RuntimeError(error_msg)
                
                # Process streaming response
                for line in response.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            if "response" in chunk:
                                yield chunk["response"]
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to parse response chunk: {line}")
            
        except requests.RequestException as e:
            logger.error(f"Error during streaming generation: {e}")
            raise RuntimeError(f"Streaming generation failed: {e}")
            
    def get_model_params(self) -> Dict[str, Any]:
        """Get information about the model parameters
        
        Returns:
            Dict[str, Any]: Model parameters including context size
        """
        if not self._model_info:
            return {}
        
        params = {}
        model_info = self._model_info.get("model", {})
        
        # Extract relevant parameters
        if "parameter_size" in model_info:
            params["parameter_size"] = model_info["parameter_size"]
        
        if "context_length" in model_info:
            params["context_length"] = model_info["context_length"]
            
        if "license" in model_info:
            params["license"] = model_info["license"]
        
        return params 