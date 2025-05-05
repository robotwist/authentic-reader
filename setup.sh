#!/bin/bash

echo "Setting up Authentic Reader..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Navigate to server directory and install backend dependencies
echo "Installing backend dependencies..."
cd server && npm install

echo "Setup complete! You can now run './dev.sh' to start the application." 