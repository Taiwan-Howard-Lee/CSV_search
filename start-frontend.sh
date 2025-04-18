#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules/express" ]; then
  echo "Installing required dependencies..."
  npm install express body-parser
fi

# Start the server
echo "Starting SBC Gina Search Engine frontend server..."
node server.js
