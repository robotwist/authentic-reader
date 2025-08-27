# 🚀 Complete Ollama Cloud Setup Guide

## 🎯 **Why This Matters for Your Job**

Having AI/LLM functionality working in production is **crucial** for your job prospects because:
- **Demonstrates real-world AI implementation**
- **Shows cloud deployment expertise** 
- **Proves you can build production-ready AI systems**
- **Differentiates you from other candidates**

## 📋 **Current Status**

✅ **Llama Service**: Deployed to Railway at `web-production-2e12d.up.railway.app`
✅ **Frontend**: Deployed to Netlify at `authentic-reader.netlify.app`
❌ **Ollama Cloud**: Needs API key setup

## 🔑 **Step 1: Get Your Ollama Cloud API Key**

### Option A: Ollama Cloud (Recommended)
1. **Go to Ollama Cloud**: Visit [ollama.com/cloud](https://ollama.com/cloud)
2. **Sign Up/Login**: Create an account or log in
3. **Get API Key**: 
   - Go to your dashboard
   - Find the "API Keys" section
   - Create a new API key
   - Copy the key (it looks like: `ollama_xxxxxxxxxxxxxxxxxxxxxxxx`)

### Option B: Ollama AI (Alternative)
1. **Go to Ollama AI**: Visit [ollama.ai](https://ollama.ai)
2. **Sign Up/Login**: Create an account or log in
3. **Get API Key**: 
   - Go to your dashboard
   - Find the "API Keys" section
   - Create a new API key

### Option C: Local Ollama (For Development)
If you want to use local Ollama for development:
1. **Install Ollama**: Follow instructions at [ollama.com](https://ollama.com)
2. **Run locally**: `ollama serve`
3. **Use localhost**: Set `OLLAMA_HOST=http://localhost:11434`

## ⚙️ **Step 2: Update Railway Environment Variables**

Once you have your API key, run these commands (replace `your_actual_api_key_here` with your actual key):

```bash
# For Ollama Cloud (production)
railway variables --set "OLLAMA_HOST=https://api.ollama.com"
railway variables --set "OLLAMA_API_KEY=your_actual_api_key_here"

# OR for local development
railway variables --set "OLLAMA_HOST=http://localhost:11434"
railway variables --set "OLLAMA_API_KEY="
```

## 🚀 **Step 3: Redeploy the Service**

```bash
railway up
```

## 🧪 **Step 4: Test the Integration**

After deployment, test the health endpoint:

```bash
curl -s https://web-production-2e12d.up.railway.app/health | jq .
```

You should see:
```json
{
  "status": "healthy",
  "llama_client": "connected",
  "model": "llama3.2:latest",
  "timestamp": "2025-08-27T18:45:21.131Z"
}
```

## 🌐 **Step 5: Test Your Frontend**

1. **Visit your app**: Go to [authentic-reader.netlify.app](https://authentic-reader.netlify.app)
2. **Add an article**: Upload or paste an article
3. **Run analysis**: Click "Analyze Article"
4. **Verify AI responses**: You should see detailed AI analysis

## 💰 **Cost Considerations**

### Ollama Cloud Pricing:
- **Free Tier**: 100 requests/month
- **Pro Plan**: $20/month for 10,000 requests
- **Enterprise**: Custom pricing

### Railway Pricing:
- **Free Tier**: $5/month credit
- **Pro Plan**: Pay-as-you-use

## 🔧 **Troubleshooting**

### If you get DNS resolution errors:
```bash
# Check if the URL is correct
curl -I https://api.ollama.ai
```

### If you get authentication errors:
```bash
# Verify your API key is set correctly
railway variables
```

### If the service won't start:
```bash
# Check the logs
railway logs
```

## 🎉 **Success Indicators**

You'll know it's working when:
1. ✅ Health endpoint returns `"llama_client": "connected"`
2. ✅ Frontend can analyze articles with AI
3. ✅ You get detailed bias, sentiment, and credibility analysis
4. ✅ No more CORS or connection errors

## 📞 **Need Help?**

If you're still having issues:
1. Check the Railway logs: `railway logs`
2. Verify your API key is correct
3. Make sure you're using the right Ollama Cloud URL
4. Test the API key locally first

---

**Your AI-powered article analysis system will be production-ready and job-worthy! 🚀**
