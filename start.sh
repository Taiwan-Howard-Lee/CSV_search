#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Start the server
echo "Starting SBC GINA server..."
npm start
