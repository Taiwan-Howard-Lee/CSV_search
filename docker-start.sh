#!/bin/bash

# SBC Gina Search Engine Docker Start Script
# This script starts the search engine using Docker

echo "=== Starting SBC Gina Search Engine with Docker ==="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker before continuing."
    echo "Visit https://docs.docker.com/get-docker/ to download and install Docker."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install docker-compose before continuing."
    echo "Visit https://docs.docker.com/compose/install/ to download and install docker-compose."
    exit 1
fi

# Create necessary directories
mkdir -p results logs

# Start the containers
echo "Starting Docker containers..."
docker-compose up -d

echo ""
echo "SBC Gina Search Engine is now running in Docker!"
echo "Access the web interface at: http://localhost:3000"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop the containers:"
echo "  docker-compose down"
echo ""
