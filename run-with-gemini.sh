#!/bin/bash

# Check if API key is provided
if [ -z "$1" ]; then
  echo "Please provide your Gemini API key as an argument."
  echo "Usage: ./run-with-gemini.sh YOUR_GEMINI_API_KEY"
  exit 1
fi

# Set the Gemini API key as an environment variable
export GEMINI_API_KEY="$1"

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Start the server
echo "Starting SBC GINA server with Gemini API key..."
node dist/index.js
