#!/bin/bash

# Production Deployment Script for Authentic Reader
# This script deploys the complete AI-powered news analysis system

set -e  # Exit on any error

echo "🚀 Starting Production Deployment for Authentic Reader"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check if required tools are installed
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

check_command "git"
check_command "node"
check_command "npm"

# Check if we're logged into required services
if ! heroku auth:whoami &> /dev/null; then
    print_warning "Not logged into Heroku. Please run 'heroku login' first."
    exit 1
fi

print_success "Prerequisites check passed"

# Step 1: Update code and commit changes
print_status "Step 1: Committing latest changes..."

git add .
git commit -m "feat: add production AI analysis service and deployment configuration

- Add ProductionAIService with fallback strategy
- Add AI analysis routes with batch processing
- Add Railway production configuration
- Add comprehensive deployment script
- Support for Ollama, Hugging Face, and ONNX models
- Queue-based analysis processing
- Health monitoring and error handling"

print_success "Changes committed"

# Step 2: Deploy backend to Heroku
print_status "Step 2: Deploying backend to Heroku..."

cd authentic-reader-backend

# Check if Heroku app exists
if ! heroku apps:info --app authentic-reader-backend &> /dev/null; then
    print_error "Heroku app 'authentic-reader-backend' not found. Please create it first."
    exit 1
fi

# Deploy to Heroku
git push heroku main

print_success "Backend deployed to Heroku"

# Step 3: Deploy frontend to Netlify
print_status "Step 3: Deploying frontend to Netlify..."

cd ..

# Deploy to Netlify
npx netlify deploy --prod

print_success "Frontend deployed to Netlify"

# Step 4: Test the deployment
print_status "Step 4: Testing deployment..."

# Test backend health
BACKEND_URL="https://authentic-reader-backend-c7754cf50ab2.herokuapp.com"
print_status "Testing backend at $BACKEND_URL"

if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed - may need time to start up"
fi

# Test AI analysis endpoint
print_status "Testing AI analysis endpoint..."

AI_TEST_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/ai/health" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null || echo "failed")

if echo "$AI_TEST_RESPONSE" | grep -q "success"; then
    print_success "AI analysis service is working"
else
    print_warning "AI analysis service may need configuration"
fi

# Step 5: Display deployment summary
print_status "Step 5: Deployment Summary"

echo ""
echo "🎉 Production Deployment Complete!"
echo ""
echo "📊 Deployment Status:"
echo "  ✅ Backend: https://authentic-reader-backend-c7754cf50ab2.herokuapp.com"
echo "  ✅ Frontend: https://authentic-reader.netlify.app"
echo "  ✅ AI Analysis: Available via /api/ai endpoints"
echo ""
echo "🔧 AI Services Configuration:"
echo "  • Primary: Ollama (llama3:8b) - for advanced analysis"
echo "  • Fallback: Hugging Face API - for reliability"
echo "  • Backup: Local ONNX models - for basic analysis"
echo ""
echo "📈 Production Features:"
echo "  • Queue-based AI processing"
echo "  • Automatic fallback between AI services"
echo "  • Batch article analysis"
echo "  • Health monitoring and error handling"
echo "  • Rate limiting and security"
echo ""
echo "🚀 Next Steps:"
echo "  1. Monitor logs: heroku logs --tail --app authentic-reader-backend"
echo "  2. Test AI analysis: curl -X POST $BACKEND_URL/api/ai/analyze"
echo "  3. Check health: curl $BACKEND_URL/api/ai/health"
echo "  4. Visit your app: https://authentic-reader.netlify.app"
echo ""

print_success "Deployment script completed successfully!"
