#!/bin/bash

# Build the TypeScript code
echo "Building TypeScript code..."
npx tsc

# Run the test script
echo "Running schema detector test..."
node dist/test-schema-detector.js
