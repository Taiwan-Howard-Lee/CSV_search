#!/bin/bash

# Check if API key is provided
if [ -z "$1" ]; then
  echo "Please provide your Gemini API key as an argument."
  echo "Usage: ./test-search-engine.sh YOUR_GEMINI_API_KEY"
  exit 1
fi

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Run the test script with the API key
echo "Running search engine test with Gemini API key..."
node dist/test-search-engine.js --api-key="$1"
