#!/bin/bash

# SBC Gina Search Engine Start Script
# This script starts both the backend and frontend servers

echo "=== Starting SBC Gina Search Engine ==="

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "Warning: config.json not found. Using default configuration."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the TypeScript code if needed
if [ ! -d "dist" ] || [ -n "$(find src -newer dist -name "*.ts" 2>/dev/null)" ]; then
  echo "Building TypeScript code..."
  npm run build
fi

# Create logs and results directories if they don't exist
mkdir -p logs
mkdir -p results

# Load configuration if available
PORT=3000
if [ -f "config.json" ]; then
  PORT=$(node -e "try { console.log(require('./config.json').server.port || 3000) } catch(e) { console.log(3000) }")
fi

# Start the server
echo "Starting SBC Gina Search Engine on http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node server.js

# Note: In a production environment, you might want to use a process manager like PM2
# Example: pm2 start server.js --name "sbc-gina"
