// Placeholder ONNX service for development
const onnxService = {
  async initialize() {
    console.log('ONNX service initialized (placeholder)');
    return true;
  },

  async analyzeText(text) {
    console.log('Text analysis requested (placeholder)');
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      isPlaceholder: true
    };
  }
};

export default onnxService; 