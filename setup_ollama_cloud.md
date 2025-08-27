# 🚀 Ollama Cloud Setup Guide

## Step 1: Get Your Ollama Cloud API Key

1. **Go to Ollama Cloud**: Visit [ollama.com/cloud](https://ollama.com/cloud)
2. **Sign Up/Login**: Create an account or log in
3. **Get API Key**: 
   - Go to your dashboard
   - Find the "API Keys" section
   - Create a new API key
   - Copy the key (it looks like: `ollama_xxxxxxxxxxxxxxxxxxxxxxxx`)

## Step 2: Update Railway Environment Variables

Once you have your API key, run these commands (replace `your_api_key_here` with your actual key):

```bash
# Set the correct Ollama Cloud API endpoint
railway variables --set "OLLAMA_HOST=https://api.ollama.ai"

# Set your API key
railway variables --set "OLLAMA_API_KEY=your_actual_api_key_here"
```

## Step 3: Redeploy the Service

```bash
railway up
```

## Step 4: Test the Integration

After deployment, test the health endpoint:

```bash
curl -s https://web-production-2e12d.up.railway.app/health | jq .
```

You should see:
```json
{
  "status": "healthy",
  "model": "llama3.2:latest",
  "ready": true
}
```

## Step 5: Test AI Analysis

Go to your deployed app and try analyzing an article. You should now get full AI-powered analysis!

## Alternative: Free Ollama Cloud Trial

Ollama Cloud offers a free tier that includes:
- 100 requests per month
- Access to Llama 3.2 and other models
- No credit card required for signup

## Troubleshooting

If you see "degraded" status:
1. Check that your API key is correct
2. Verify the API key has proper permissions
3. Check Railway logs: `railway logs`

## Cost Information

- **Free Tier**: 100 requests/month
- **Paid Plans**: Start at $5/month for more requests
- **Pay-as-you-go**: Available for high usage

Perfect for job applications and demonstrations!
