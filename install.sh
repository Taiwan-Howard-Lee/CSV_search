#!/bin/bash

# SBC Gina Search Engine Installation Script
# This script sets up the SBC Gina Search Engine with all required dependencies

echo "=== SBC Gina Search Engine Installation ==="
echo "This script will install all required dependencies and set up the search engine."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js (version 14 or higher) before continuing."
    echo "Visit https://nodejs.org/ to download and install Node.js."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "Node.js version $NODE_VERSION detected. SBC Gina requires Node.js version 14 or higher."
    echo "Please upgrade Node.js before continuing."
    exit 1
fi

echo "Node.js version $(node -v) detected. ✓"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo ""
echo "Building the project..."
npm run build

# Make scripts executable
echo ""
echo "Making scripts executable..."
chmod +x start.sh
chmod +x start-frontend.sh
chmod +x cleanup.sh
chmod +x comprehensive-cleanup.sh
chmod +x test-*.sh

# Create results directory
echo ""
echo "Creating results directory..."
mkdir -p results

echo ""
echo "=== Installation Complete! ==="
echo ""
echo "To start the search engine, run:"
echo "  ./start.sh"
echo ""
echo "To start the frontend server for testing, run:"
echo "  ./start-frontend.sh"
echo ""
echo "Access the web interface at: http://localhost:3000"
echo ""
echo "For more information, see the README.md file."
echo ""
