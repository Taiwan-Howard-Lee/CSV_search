#!/bin/bash

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Run the test script
echo "Running content processor test..."
node dist/test-content-processor.js
