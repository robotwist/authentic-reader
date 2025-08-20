#!/bin/bash

# Script to set up a dedicated backend repository for Railway deployment

echo "🚀 Setting up Railway Backend Repository..."

# Create a temporary directory for the backend
BACKEND_DIR="authentic-reader-backend"
mkdir -p $BACKEND_DIR

# Copy server files
echo "📁 Copying server files..."
cp -r server/* $BACKEND_DIR/
cp railway.json $BACKEND_DIR/
cp RAILWAY_DEPLOYMENT.md $BACKEND_DIR/

# Create a new package.json for the backend
cat > $BACKEND_DIR/package.json << 'EOF'
{
  "name": "authentic-reader-backend",
  "version": "1.0.0",
  "description": "Backend server for Authentic Reader",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "cross-env NODE_ENV=test jest --runInBand",
    "migrate": "NODE_OPTIONS='--experimental-vm-modules' sequelize-cli db:migrate",
    "migrate:direct": "node scripts/run-migrations.js",
    "seed": "NODE_OPTIONS='--experimental-vm-modules' sequelize-cli db:seed:all",
    "migrate:undo": "NODE_OPTIONS='--experimental-vm-modules' sequelize-cli db:migrate:undo",
    "setup-db": "npm run migrate && npm run seed",
    "setup": "node setup.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:routes": "eslint ./routes/ --fix",
    "lint:controllers": "eslint ./controllers/ --fix",
    "lint:report": "eslint . --format html --output-file ./eslint-report.html",
    "check:routes": "node tools/check-controller-routes.js",
    "heroku-postbuild": "mkdir -p models/onnx && node scripts/create-placeholder-models.js"
  },
  "dependencies": {
    "@mozilla/readability": "^0.6.0",
    "axios": "^1.9.0",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.21.2",
    "express-validator": "^7.0.1",
    "helmet": "^7.2.0",
    "jsdom": "^26.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "node-fetch": "^3.3.2",
    "onnxruntime-node": "^1.18.0",
    "perf_hooks": "^0.0.1",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.37.1",
    "sequelize-cli": "^6.6.2",
    "uuid": "^9.0.1",
    "winston": "^3.8.2",
    "xml2js": "^0.6.2"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/supertest": "^6.0.3",
    "cross-env": "^7.0.3",
    "eslint": "^9.26.0",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-node": "^11.1.0",
    "jest": "^29.7.0",
    "nodemon": "^3.1.10",
    "supertest": "^7.1.0"
  },
  "engines": {
    "node": "20.x"
  }
}
EOF

# Create a simple Railway config
cat > $BACKEND_DIR/railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create README for the backend
cat > $BACKEND_DIR/README.md << 'EOF'
# Authentic Reader Backend

Backend API server for the Authentic Reader application.

## Features

- Article analysis and bias detection
- RSS feed processing
- User authentication
- Content credibility assessment
- Logical fallacy detection
- Network analysis

## Deployment

This repository is configured for Railway deployment.

### Environment Variables

- `NODE_ENV=production`
- `PORT=3000` (Railway will set this automatically)

### Health Check

The application provides a health check endpoint at `/health`.

## API Endpoints

- `GET /health` - Health check
- `GET /api/sources/public` - Public sources
- `GET /api/balanced-feed` - Balanced news feed
- `POST /api/analyze-article` - Article analysis
EOF

echo "✅ Backend repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new GitHub repository for the backend"
echo "2. Push the $BACKEND_DIR contents to the new repository"
echo "3. Deploy the new repository to Railway"
echo ""
echo "Commands:"
echo "cd $BACKEND_DIR"
echo "git init"
echo "git add ."
echo "git commit -m 'Initial backend setup'"
echo "git remote add origin <your-new-backend-repo-url>"
echo "git push -u origin main"
echo ""
echo "Then deploy to Railway using the new repository URL."
