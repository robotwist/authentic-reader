#!/bin/bash
# Script to generate ONNX models for Authentic Reader NLP service

set -e  # Exit on any error

echo "Authentic Reader: ONNX Model Generator"
echo "====================================="

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install or update requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Create output directory
mkdir -p onnx_models

# Run the conversion script
echo "Converting NER model to ONNX format..."
python convert_models.py --output-dir onnx_models

# Print success message
echo "====================================="
echo "ONNX models generated successfully!"
echo "Models saved in: $(pwd)/onnx_models"
echo ""
echo "To use these models, start the NLP service with:"
echo "USE_ONNX=1 uvicorn main:app --reload"
echo "=====================================" 