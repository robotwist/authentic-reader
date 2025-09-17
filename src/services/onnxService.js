/**
 * ONNX Service
 *
 * Client-side service for interacting with the ONNX backend API
 */
import { logger } from '../utils/logger';
import { API_BASE_URL } from '../config/api.config';
class ONNXService {
    constructor() {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        this.baseUrl = `${API_BASE_URL}/onnx`;
        logger.debug('ONNX Service initialized with base URL:', this.baseUrl);
    }
    /**
     * Get status of all ONNX models
     */
    async getModelStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/status`);
            if (!response.ok) {
                throw new Error(`Failed to fetch model status: ${response.statusText}`);
            }
            const data = await response.json();
            this.modelStatus = data.status;
            return this.modelStatus;
        }
        catch (error) {
            logger.error('Error getting ONNX model status:', error);
            throw error;
        }
    }
    /**
     * Get information about a specific ONNX model
     */
    async getModelInfo(modelName) {
        try {
            const response = await fetch(`${this.baseUrl}/model/${modelName}/info`);
            if (!response.ok) {
                throw new Error(`Failed to fetch model info: ${response.statusText}`);
            }
            const data = await response.json();
            return data.modelInfo;
        }
        catch (error) {
            logger.error(`Error getting ONNX model info for ${modelName}:`, error);
            throw error;
        }
    }
    /**
     * Check if a model is available (either loaded or exists on disk)
     */
    async isModelAvailable(modelName) {
        if (!this.modelStatus[modelName]) {
            await this.getModelStatus();
        }
        return this.modelStatus[modelName]?.exists === true;
    }
    /**
     * Run Named Entity Recognition on a text
     */
    async recognizeEntities(text) {
        try {
            const available = await this.isModelAvailable('ner');
            if (!available) {
                logger.warn('NER model is not available, falling back to non-ONNX implementation');
                // In a real implementation, you would call a fallback service here
                return [];
            }
            const response = await fetch(`${this.baseUrl}/ner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) {
                throw new Error(`Failed to run NER: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.entities) {
                return data.entities;
            }
            // If we don't have results yet (implementation incomplete), return empty array
            logger.info('NER implementation may be incomplete. Response:', data);
            return [];
        }
        catch (error) {
            logger.error('Error running NER:', error);
            throw error;
        }
    }
    /**
     * Run Zero-Shot Classification on a text with provided labels
     */
    async classifyText(text, labels) {
        try {
            const available = await this.isModelAvailable('zeroShot');
            if (!available) {
                logger.warn('Zero-Shot model is not available, falling back to non-ONNX implementation');
                // In a real implementation, you would call a fallback service here
                return [];
            }
            const response = await fetch(`${this.baseUrl}/zero-shot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, labels }),
            });
            if (!response.ok) {
                throw new Error(`Failed to run Zero-Shot Classification: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.results) {
                return data.results;
            }
            // If we don't have results yet (implementation incomplete), return empty array
            logger.info('Zero-Shot Classification implementation may be incomplete. Response:', data);
            return [];
        }
        catch (error) {
            logger.error('Error running Zero-Shot Classification:', error);
            throw error;
        }
    }
    /**
     * Run Sentiment Analysis on a text
     */
    async analyzeSentiment(text) {
        try {
            const available = await this.isModelAvailable('sentiment');
            if (!available) {
                logger.warn('Sentiment model is not available, falling back to non-ONNX implementation');
                // In a real implementation, you would call a fallback service here
                return {
                    label: 'NEUTRAL',
                    score: 0.5,
                };
            }
            const response = await fetch(`${this.baseUrl}/sentiment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) {
                throw new Error(`Failed to run Sentiment Analysis: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.sentiment) {
                return data.sentiment;
            }
            // If we don't have results yet (implementation incomplete), return neutral
            logger.info('Sentiment Analysis implementation may be incomplete. Response:', data);
            return {
                label: 'NEUTRAL',
                score: 0.5,
            };
        }
        catch (error) {
            logger.error('Error running Sentiment Analysis:', error);
            throw error;
        }
    }
}
// Export singleton instance
export const onnxService = new ONNXService();
