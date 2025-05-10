"""
Tests for the Llama client module

This module contains tests for the LlamaClient class.
"""

import os
import sys
import unittest
import logging
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.llama_client import LlamaClient

class TestLlamaClient(unittest.TestCase):
    """Test cases for the LlamaClient class"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Configure logging for tests
        logging.basicConfig(level=logging.ERROR)
        
        # Create a test client with mock configuration
        self.client = LlamaClient(model_name="test-model", host="http://test-host:11434")
    
    @patch('requests.get')
    def test_connection_error(self, mock_get):
        """Test handling of connection errors"""
        # Mock a connection error
        mock_get.side_effect = Exception("Connection failed")
        
        # Verify that the client raises ConnectionError
        with self.assertRaises(ConnectionError):
            self.client.test_connection()
    
    @patch('requests.get')
    def test_connection_bad_status(self, mock_get):
        """Test handling of bad status codes"""
        # Mock a response with a bad status code
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response
        
        # Verify that the client raises ConnectionError
        with self.assertRaises(ConnectionError):
            self.client.test_connection()
    
    @patch('requests.get')
    @patch('requests.post')
    def test_successful_connection(self, mock_post, mock_get):
        """Test successful connection"""
        # Mock successful responses
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        # Mock models response
        mock_models_response = MagicMock()
        mock_models_response.status_code = 200
        mock_models_response.json.return_value = {
            "models": [{"name": "test-model"}]
        }
        mock_get.return_value = mock_models_response
        
        # Mock model info response
        mock_info_response = MagicMock()
        mock_info_response.status_code = 200
        mock_info_response.json.return_value = {
            "model": {
                "parameter_size": "8B",
                "context_length": 4096,
                "license": "MIT"
            }
        }
        mock_post.return_value = mock_info_response
        
        # Test connection
        result = self.client.test_connection()
        
        # Verify result
        self.assertTrue(result)
        self.assertTrue(self.client.is_ready())
    
    @patch('requests.post')
    def test_generate_not_ready(self, mock_post):
        """Test generate when client is not ready"""
        # Client should not be ready initially
        self.assertFalse(self.client.is_ready())
        
        # Verify that generate raises RuntimeError when not ready
        with self.assertRaises(RuntimeError):
            self.client.generate("Test prompt")
        
        # Verify that post was not called
        mock_post.assert_not_called()
    
    @patch('requests.post')
    def test_generate(self, mock_post):
        """Test text generation"""
        # Make client ready
        self.client._ready = True
        self.client._model_info = {"model": {"parameter_size": "8B"}}
        
        # Mock generation response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "response": "Generated text"
        }
        mock_post.return_value = mock_response
        
        # Test generation
        result = self.client.generate("Test prompt", max_tokens=100)
        
        # Verify result
        self.assertEqual(result, "Generated text")
        
        # Verify request
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], "http://test-host:11434/api/generate")
        self.assertEqual(kwargs["json"]["model"], "test-model")
        self.assertEqual(kwargs["json"]["prompt"], "Test prompt")
        self.assertEqual(kwargs["json"]["options"]["num_predict"], 100)
    
    @patch('requests.post')
    def test_generation_error(self, mock_post):
        """Test handling of generation errors"""
        # Make client ready
        self.client._ready = True
        self.client._model_info = {"model": {"parameter_size": "8B"}}
        
        # Mock error response
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal server error"
        mock_post.return_value = mock_response
        
        # Verify that generate raises RuntimeError
        with self.assertRaises(RuntimeError):
            self.client.generate("Test prompt")
    
    def test_get_model_params(self):
        """Test getting model parameters"""
        # Set mock model info
        self.client._model_info = {
            "model": {
                "parameter_size": "8B",
                "context_length": 4096,
                "license": "MIT"
            }
        }
        
        # Get params
        params = self.client.get_model_params()
        
        # Verify params
        self.assertEqual(params["parameter_size"], "8B")
        self.assertEqual(params["context_length"], 4096)
        self.assertEqual(params["license"], "MIT")
    
    def test_get_model_params_empty(self):
        """Test getting model parameters when no info is available"""
        # No model info
        self.client._model_info = None
        
        # Get params
        params = self.client.get_model_params()
        
        # Verify params
        self.assertEqual(params, {})

if __name__ == '__main__':
    unittest.main() 