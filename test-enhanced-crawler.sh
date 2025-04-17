#!/bin/bash

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Run the test script
echo "Running enhanced crawler test..."
node dist/test-enhanced-crawler.js
