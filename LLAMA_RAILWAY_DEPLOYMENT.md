# 🚂 Llama Service Railway Deployment Guide

## 🎯 **Why This Matters for Your Job**

Having AI/LLM functionality working in production is **crucial** for your job prospects because:
- **Demonstrates real-world AI implementation**
- **Shows cloud deployment expertise**
- **Proves you can build production-ready AI systems**
- **Differentiates you from other candidates**

## 🚀 **Step 1: Deploy Llama Service to Railway**

### Option A: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**:
   - Visit [railway.app](https://railway.app)
   - Sign in with your GitHub account
   - Click "New Project"

2. **Deploy from GitHub**:
   - Select "Deploy from GitHub repo"
   - Choose your `authentic-reader` repository
   - Railway will detect it's a Python app

3. **Configure the Service**:
   - Railway will create a new service
   - Set the **Root Directory** to `llama-service`
   - This tells Railway to deploy only the Llama service

### Option B: Deploy via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to llama-service directory
cd llama-service

# Initialize Railway project
railway init

# Deploy
railway up
```

## ⚙️ **Step 2: Configure Environment Variables**

In your Railway dashboard, add these environment variables:

```bash
# Required for Railway
PORT=8105

# Llama Service Configuration
OLLAMA_HOST=https://your-ollama-service.railway.app
LLAMA_MODEL=llama3.2:latest
FALLBACK_MODEL=llama2:7b-chat

# Optional: Performance tuning
CACHE_SIZE=1000
CACHE_TTL=3600
LOG_LEVEL=INFO
```

## 🤖 **Step 3: Deploy Ollama Service (Alternative)**

Since Railway doesn't support running Ollama directly, you have two options:

### Option A: Use Railway's Ollama Service
Railway has a built-in Ollama service you can use:

1. In Railway dashboard, click "New Service"
2. Select "Ollama" from the template gallery
3. This will give you a URL like: `https://your-ollama.railway.app`
4. Update your Llama service's `OLLAMA_HOST` to this URL

### Option B: Use External Ollama Service
- **Ollama Cloud**: [ollama.com/cloud](https://ollama.com/cloud)
- **RunPod**: [runpod.io](https://runpod.io) (GPU instances)
- **Vast.ai**: [vast.ai](https://vast.ai) (cheap GPU rentals)

## 🔗 **Step 4: Update Frontend Configuration**

Once your Llama service is deployed, update your Netlify environment variables:

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add/update:
   ```
   VITE_LLAMA_SERVICE_URL=https://your-llama-service.railway.app
   ```

## 🧪 **Step 5: Test Your Deployment**

1. **Test Llama Service Health**:
   ```bash
   curl https://your-llama-service.railway.app/health
   ```

2. **Test from Frontend**:
   - Go to your deployed app
   - Try analyzing an article
   - Check browser console for any errors

## 🎯 **Step 6: Update AI Analysis Service**

Update your `aiAnalysisService.ts` to use the Railway URL in production:

```typescript
// In src/services/aiAnalysisService.ts
const LLAMA_SERVICE_URL = import.meta.env.VITE_LLAMA_SERVICE_URL || 
  (isLocalDevelopment() ? 'http://localhost:8105' : 'https://your-llama-service.railway.app');
```

## 🚨 **Important Notes for Production**

### **Cost Considerations**:
- **Railway**: Pay-per-use, starts at ~$5/month
- **Ollama Cloud**: Pay-per-use, starts at ~$10/month
- **GPU instances**: Can be $20-100/month depending on usage

### **Performance Tips**:
- Use caching to reduce API calls
- Implement rate limiting
- Monitor usage and costs
- Consider using smaller models for faster responses

### **Security**:
- Never commit API keys to git
- Use environment variables for all secrets
- Implement proper CORS settings
- Add authentication if needed

## 🎉 **Success Metrics**

Your deployment is successful when:
- ✅ Llama service responds to health checks
- ✅ Frontend can analyze articles
- ✅ Analysis provides comprehensive insights
- ✅ No CORS or connection errors
- ✅ Reasonable response times (< 10 seconds)

## 🔧 **Troubleshooting**

### **Common Issues**:

1. **CORS Errors**:
   - Add Railway URL to CORS configuration
   - Check environment variables

2. **Connection Timeouts**:
   - Increase healthcheck timeout
   - Check Ollama service availability

3. **Memory Issues**:
   - Use smaller models
   - Implement proper caching
   - Monitor Railway logs

4. **Build Failures**:
   - Check Python version compatibility
   - Verify all dependencies in requirements.txt

## 🎯 **For Your Job Application**

When showcasing this project:

1. **Highlight the AI Integration**: "Built a production-ready AI analysis system using Llama 3.2"
2. **Emphasize Cloud Deployment**: "Deployed AI services to Railway with proper scaling and monitoring"
3. **Show Real-World Impact**: "Users can analyze articles for bias, credibility, and logical fallacies"
4. **Demonstrate Technical Skills**: "Implemented comprehensive AI prompts, caching, and error handling"

This will make you stand out as someone who can build **real, production-ready AI systems**! 🚀
