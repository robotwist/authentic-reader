# Railway Deployment Guide

## Quick Setup

1. **Install Railway CLI** (optional but recommended):
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy via Railway Dashboard**:
   - Go to [railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Railway will automatically detect it's a Node.js app

3. **Configure Environment Variables**:
   - In Railway dashboard, go to your project
   - Click on "Variables" tab
   - Add the following variables:
     ```
     NODE_ENV=production
     PORT=3000
     ```

4. **Get Your Railway URL**:
   - After deployment, Railway will provide a URL like: `https://your-app-name.railway.app`
   - Copy this URL

5. **Update Netlify Environment Variables**:
   - Go to your Netlify dashboard
   - Navigate to Site settings > Environment variables
   - Update the following variables:
     ```
     VITE_API_URL = https://your-app-name.railway.app
     VITE_BACKEND_URL = https://your-app-name.railway.app
     ```

## Manual CLI Deployment

If you prefer using the CLI:

```bash
# Login to Railway
railway login

# Initialize Railway project
railway init

# Deploy
railway up

# Get the deployment URL
railway domain
```

## Configuration Files

- `railway.json`: Railway-specific configuration
- `server/package.json`: Node.js dependencies and scripts
- `server/Procfile`: Process definition (Railway will use railway.json instead)

## Environment Variables

Railway will automatically set:
- `PORT`: The port your app should listen on
- `RAILWAY_STATIC_URL`: Static asset URL (if applicable)

You should set:
- `NODE_ENV=production`
- Any database URLs if using external databases

## Health Check

The app includes a health check endpoint at `/health` that Railway will use to verify the deployment is working.

## Troubleshooting

1. **Build Failures**: Check Railway logs for dependency issues
2. **Runtime Errors**: Check application logs in Railway dashboard
3. **API Connection Issues**: Verify environment variables are set correctly
4. **CORS Issues**: Ensure Railway URL is added to CORS configuration

## Important Notes

- The `VITE_API_URL` should NOT include `/api` at the end, as the API service automatically adds this
- Make sure to update both `VITE_API_URL` and `VITE_BACKEND_URL` in Netlify after Railway deployment
- The backend will be available at `https://your-app-name.railway.app/api/*` endpoints
