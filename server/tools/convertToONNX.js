#!/usr/bin/env node

/**
 * ONNX Model Conversion Tool
 * 
 * This script converts Hugging Face Transformer models to ONNX format
 * for faster inference with ONNX Runtime.
 * 
 * Usage: node convertToONNX.js [modelType]
 * Example: node convertToONNX.js ner
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const onnxConfig = require('../config/onnx.config');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Check if Python is available
function checkPythonAndDependencies() {
  try {
    // Check Python version
    const pythonVersion = execSync('python3 --version').toString();
    console.log(`Using ${pythonVersion.trim()}`);
    
    // Check for required Python packages
    try {
      execSync('pip3 show torch transformers onnx onnxruntime');
      console.log('All required Python packages are installed.');
    } catch (err) {
      console.warn('Some Python packages may be missing. Installing required packages...');
      execSync('pip3 install torch transformers onnx onnxruntime optimum');
      console.log('Python packages installed successfully.');
    }
    
    return true;
  } catch (err) {
    console.error('Python is not available. Please install Python 3.7+ and try again.');
    console.error('Error:', err.message);
    return false;
  }
}

// Create Python conversion script
function createPythonConversionScript(modelType, modelConfig) {
  const pythonScriptPath = path.join(onnxConfig.directories.tempDir, `convert_${modelType}.py`);
  
  // Create Python script content based on model type
  let scriptContent = `
import os
import torch
import onnx
import transformers
from transformers import AutoTokenizer, AutoModel, AutoModelForTokenClassification, AutoModelForSequenceClassification

print(f"Transformers version: {transformers.__version__}")
print(f"PyTorch version: {torch.__version__}")
print(f"ONNX version: {onnx.__version__}")

# Set paths
model_id = "${modelConfig.originalModelId}"
output_path = "${modelConfig.onnxPath}"
quantize = ${modelConfig.quantized}

print(f"Converting model: {model_id}")
print(f"Output path: {output_path}")

# Create output directory
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_id)

`;

  // Model-specific loading and conversion code
  switch(modelType) {
    case 'ner':
      scriptContent += `
# Load NER model
model = AutoModelForTokenClassification.from_pretrained(model_id)
model.eval()

# Create dummy input
dummy_input = tokenizer("Hello, my name is John and I live in New York", return_tensors="pt")

# Export to ONNX
print("Exporting model to ONNX format...")
torch.onnx.export(
    model,
    tuple(dummy_input.values()),
    output_path,
    input_names=['input_ids', 'attention_mask'],
    output_names=['logits'],
    dynamic_axes={
        'input_ids': {0: 'batch_size', 1: 'sequence'},
        'attention_mask': {0: 'batch_size', 1: 'sequence'},
        'logits': {0: 'batch_size', 1: 'sequence'}
    },
    opset_version=12
)
`;
      break;
    
    case 'zeroShot':
      scriptContent += `
# Load Zero-Shot Classification model
from transformers import AutoModelForSequenceClassification
model = AutoModelForSequenceClassification.from_pretrained(model_id)
model.eval()

# Create dummy input
dummy_input = tokenizer("This is a test", return_tensors="pt")

# Export to ONNX
print("Exporting model to ONNX format...")
torch.onnx.export(
    model,
    tuple(dummy_input.values()),
    output_path,
    input_names=['input_ids', 'attention_mask'],
    output_names=['logits'],
    dynamic_axes={
        'input_ids': {0: 'batch_size', 1: 'sequence'},
        'attention_mask': {0: 'batch_size', 1: 'sequence'},
        'logits': {0: 'batch_size', 2: 'sequence'}
    },
    opset_version=12
)
`;
      break;
    
    case 'sentiment':
      scriptContent += `
# Load Sentiment Analysis model
model = AutoModelForSequenceClassification.from_pretrained(model_id)
model.eval()

# Create dummy input
dummy_input = tokenizer("I love this product!", return_tensors="pt")

# Export to ONNX
print("Exporting model to ONNX format...")
torch.onnx.export(
    model,
    tuple(dummy_input.values()),
    output_path,
    input_names=['input_ids', 'attention_mask'],
    output_names=['logits'],
    dynamic_axes={
        'input_ids': {0: 'batch_size', 1: 'sequence'},
        'attention_mask': {0: 'batch_size', 1: 'sequence'},
        'logits': {0: 'batch_size'}
    },
    opset_version=12
)
`;
      break;
    
    default:
      throw new Error(`Unsupported model type: ${modelType}`);
  }

  // Add optimization and quantization if enabled
  if (modelConfig.quantized) {
    scriptContent += `
# Optimize and quantize the model if enabled
if quantize:
    print("Optimizing and quantizing the model...")
    from onnxruntime.quantization import quantize_dynamic
    
    # First optimize
    optimized_path = output_path.replace(".onnx", "_optimized.onnx")
    from onnxruntime.quantization.onnx_quantizer import ONNXQuantizer
    from onnxruntime.quantization.quant_utils import QuantizationMode
    from onnxruntime.quantization.preprocess import quant_pre_process
    
    # Load model
    onnx_model = onnx.load(output_path)
    
    # Optimize with pre-processing
    onnx_model = quant_pre_process(onnx_model)
    onnx.save(onnx_model, optimized_path)
    
    # Quantize
    quantize_dynamic(
        optimized_path,
        output_path,
        weight_type=QuantType.QInt8
    )
    
    print(f"Model optimized and quantized: {output_path}")
`;
  }

  // Add validation code
  scriptContent += `
# Validate the exported model
print("Validating the ONNX model...")
onnx_model = onnx.load(output_path)
onnx.checker.check_model(onnx_model)
print("ONNX model validation successful.")
`;

  // Write Python script to file
  fs.writeFileSync(pythonScriptPath, scriptContent);
  return pythonScriptPath;
}

// Run the conversion process
async function convertModel(modelType) {
  try {
    // Check if the model type is valid
    const modelConfig = onnxConfig.models[modelType];
    if (!modelConfig) {
      console.error(`Model type "${modelType}" not found in configuration.`);
      console.error(`Available model types: ${Object.keys(onnxConfig.models).join(', ')}`);
      return 1;
    }
    
    // Ensure directories exist
    fs.mkdirSync(onnxConfig.directories.modelsDir, { recursive: true });
    fs.mkdirSync(onnxConfig.directories.tempDir, { recursive: true });
    
    console.log(`Converting ${modelType} model to ONNX format...`);
    console.log(`Original model: ${modelConfig.originalModelId}`);
    console.log(`Output path: ${modelConfig.onnxPath}`);
    
    // Create conversion script
    const scriptPath = createPythonConversionScript(modelType, modelConfig);
    console.log(`Created conversion script: ${scriptPath}`);
    
    // Run the conversion script
    console.log('Running conversion script...');
    execSync(`python ${scriptPath}`, { stdio: 'inherit' });
    
    console.log(`\nConversion complete. ONNX model saved to: ${modelConfig.onnxPath}`);
    return 0;
  } catch (err) {
    console.error('Error during conversion:', err);
    return 1;
  }
}

// Main function
async function main() {
  // Check if Python and dependencies are available
  if (!checkPythonAndDependencies()) {
    process.exit(1);
  }
  
  // Get model type from command line
  const modelType = process.argv[2];
  if (!modelType) {
    console.log('Usage: node convertToONNX.js [modelType]');
    console.log(`Available model types: ${Object.keys(onnxConfig.models).join(', ')}`);
    process.exit(1);
  }
  
  // Run conversion
  const exitCode = await convertModel(modelType);
  process.exit(exitCode);
}

// Run the script
main(); 