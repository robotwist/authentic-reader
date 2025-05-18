# Authentic Reader Deployment Guide

This document provides step-by-step instructions for deploying the Authentic Reader application to production environments.

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Git
- PostgreSQL database
- Heroku CLI (for backend deployment)
- Netlify CLI (for frontend deployment)
- Hugging Face API token (optional)

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd authentic-reader
   ```

2. **Install dependencies**
   ```bash
   # Install frontend and backend dependencies
   bash setup.sh
   ```

3. **Set up environment variables**
   ```bash
   # Copy the template files
   cp .env-templates/frontend.env.example .env
   cp .env-templates/server.env.example server/.env
   
   # Edit the files to add your credentials
   nano .env
   nano server/.env
   ```

   Important values to configure:
   - `JWT_SECRET`: A secure random string for authentication
   - `DB_PASSWORD`: Your PostgreSQL database password
   - `VITE_HF_API_TOKEN` & `HF_API_TOKEN`: Hugging Face API token (if using NLP features)

4. **Verify your setup**
   ```bash
   node scripts/test-setup.js
   ```

## Backend Deployment (Heroku)

1. **Install Heroku CLI** (if not already installed)
   ```bash
   npm install -g heroku
   ```

2. **Deploy to Heroku**
   ```bash
   node scripts/deploy-heroku.js
   ```

   This script will:
   - Create a Heroku app (if it doesn't exist)
   - Set up environment variables
   - Add a PostgreSQL database
   - Deploy the backend code
   - Run database migrations

3. **After deployment**
   - Note the API URL provided at the end of deployment
   - Test the API endpoints to ensure they're working

## Frontend Deployment (Netlify)

1. **Install Netlify CLI** (if not already installed)
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy to Netlify**
   ```bash
   node scripts/deploy-netlify.js
   ```

   This script will:
   - Create a production environment file
   - Build the frontend for production
   - Deploy to Netlify
   - Set up SPA routing

3. **After deployment**
   - Configure environment variables in the Netlify dashboard
   - Ensure the API URL points to your Heroku backend

## Security Considerations

1. **API Tokens**
   - Never commit API tokens to your repository
   - Rotate tokens regularly using `node scripts/rotate-token.js`
   - Use fine-grained access tokens with minimal permissions

2. **Environment Variables**
   - Use the hosting platform's environment variable management
   - Don't expose sensitive information in client-side code

3. **Database**
   - Use a strong password for your database
   - Enable SSL for database connections in production
   - Regularly back up your database

## Monitoring & Maintenance

1. **Server Monitoring**
   - Use the built-in monitoring: `npm run monitor`
   - Set up PM2 for process management: `npm run server:pm2`

2. **Logs**
   - View server logs: `heroku logs --tail --app your-app-name`
   - View monitor logs: `npm run monitor:logs`

3. **Updates**
   - Regularly update dependencies for security patches
   - Test thoroughly before deploying updates

## Troubleshooting

- If the build fails, check the error logs and ensure all dependencies are installed
- If API connections fail, verify the API URL and CORS configuration
- For database issues, check the connection parameters and ensure PostgreSQL is running
- For authentication issues, verify the JWT_SECRET is properly set

## Documentation

For more detailed information, refer to:
- [README.md](README.md) - General project information
- [SECURITY.md](SECURITY.md) - Security guidelines
- [MONITORING.md](MONITORING.md) - Monitoring setup 