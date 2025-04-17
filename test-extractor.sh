#!/bin/bash

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Run the test script
echo "Running data extractor test..."
node dist/test-extractor.js
