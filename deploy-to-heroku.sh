#!/bin/bash
# Deploy authentic-reader-backend to Heroku

set -e

echo "🚀 Deploying to Heroku..."

# Create temporary directory
TMP_DIR=$(mktemp -d)
echo "📁 Using temporary directory: $TMP_DIR"

# Extract backend directory
cd /home/robwistrand/code/ga/projects/authentic-reader
git archive HEAD:authentic-reader-backend --prefix=./ | (cd "$TMP_DIR" && tar xf -)

# Initialize git repo in temp directory
cd "$TMP_DIR"
git init
git add -A
git commit -m "Deploy backend $(date +%Y%m%d-%H%M%S)"

# Add Heroku remote
git remote add heroku https://git.heroku.com/authentic-reader-backend.git || git remote set-url heroku https://git.heroku.com/authentic-reader-backend.git

# Push to Heroku
echo "📤 Pushing to Heroku..."
git push --force heroku HEAD:main

# Cleanup
cd /home/robwistrand/code/ga/projects/authentic-reader
rm -rf "$TMP_DIR"

echo "✅ Deployment complete!"


