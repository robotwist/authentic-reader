#!/bin/bash
# Setup script for Ollama and Llama 3 models

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Authentic Reader - Llama 3 Setup ===${NC}\n"
echo -e "This script will set up Ollama and download Llama 3 models.\n"

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama is already installed${NC}"
else
    echo -e "${YELLOW}Installing Ollama...${NC}"
    
    # Check if we're on Linux or macOS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "Detected Linux system. Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to install Ollama. Please check https://ollama.com/download for manual installation instructions.${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "Detected macOS. Please download and install Ollama from https://ollama.com/download"
        echo -e "After installation, run this script again."
        exit 1
    else
        echo -e "${RED}Unsupported operating system. Please download and install Ollama manually from https://ollama.com/download${NC}"
        echo -e "After installation, run this script again."
        exit 1
    fi
    
    echo -e "${GREEN}✓ Ollama installation complete${NC}"
fi

# Check if Ollama service is running
echo -e "${YELLOW}Checking if Ollama service is running...${NC}"
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo -e "${GREEN}✓ Ollama service is running${NC}"
else
    echo -e "${YELLOW}Starting Ollama service...${NC}"
    ollama serve &
    
    # Wait for service to start
    echo -e "Waiting for Ollama service to start..."
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            echo -e "${GREEN}✓ Ollama service is now running${NC}"
            break
        fi
        
        if [ $i -eq 30 ]; then
            echo -e "${RED}Failed to start Ollama service. Please start it manually with 'ollama serve'${NC}"
            exit 1
        fi
        
        sleep 1
    done
fi

# Pull Llama 3 models
echo -e "\n${YELLOW}Setting up Llama 3 models...${NC}"
echo -e "This may take some time (1-2GB download for 8B model)\n"

# Check if model already exists
if ollama list | grep -q "llama3:8b"; then
    echo -e "${GREEN}✓ Llama 3 8B model is already downloaded${NC}"
else
    echo -e "${YELLOW}Pulling Llama 3 8B model...${NC}"
    ollama pull llama3:8b
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to pull Llama 3 8B model. Please check your network connection and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Successfully pulled Llama 3 8B model${NC}"
fi

# Optionally pull the smaller version as a fallback
echo -e "\n${YELLOW}Would you like to download the smaller Llama 3 model (1.3GB) as a fallback? [y/N]${NC}"
read -r download_small

if [[ "$download_small" =~ ^[Yy]$ ]]; then
    if ollama list | grep -q "llama2:7b-chat"; then
        echo -e "${GREEN}✓ Llama 2 7B Chat model is already downloaded${NC}"
    else
        echo -e "${YELLOW}Pulling Llama 2 7B Chat model...${NC}"
        ollama pull llama2:7b-chat
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to pull Llama 2 7B Chat model, but we can continue with Llama 3.${NC}"
        else
            echo -e "${GREEN}✓ Successfully pulled Llama 2 7B Chat model${NC}"
        fi
    fi
fi

# Create virtual environment for the Llama service if it doesn't exist
echo -e "\n${YELLOW}Setting up Python environment...${NC}"

if [ -d "../venv" ]; then
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
else
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv ../venv
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment. Please make sure python3-venv is installed.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Created virtual environment${NC}"
fi

# Activate virtual environment and install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
source ../venv/bin/activate
pip install -q --upgrade pip
pip install -q -r ../requirements.txt

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed successfully${NC}"

# Create .env file if it doesn't exist
if [ ! -f "../.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > ../.env << EOL
# Llama Service Configuration
OLLAMA_HOST=http://localhost:11434
LLAMA_MODEL=llama3:8b
FALLBACK_MODEL=llama2:7b-chat
CACHE_SIZE=1000
CACHE_TTL=3600
LOG_LEVEL=INFO
EOL
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo -e "\nTo start the Llama service, run:"
echo -e "  cd .. && source venv/bin/activate && uvicorn src.main:app --reload --port 3500"
echo -e "\nThe service will be available at: http://localhost:3500"
echo -e "\nTest the installation with:"
echo -e "  curl http://localhost:3500/health" 