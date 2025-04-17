#!/bin/bash

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Run the test script
echo "Running Google Docs crawler test..."
node dist/test-google-docs-crawler.js
