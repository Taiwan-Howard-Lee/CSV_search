#!/bin/bash

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Run the improved test script
echo "Running improved data extractor test..."
node dist/test-extractor-improved.js
