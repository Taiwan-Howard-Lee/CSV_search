#!/bin/bash

# SBC Gina Search Engine Test Script
# This script tests the search engine functionality

echo "=== Testing SBC Gina Search Engine ==="

# Check if the server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Error: The server is not running. Please start the server first."
    echo "Run './start.sh' or './start-frontend.sh' to start the server."
    exit 1
fi

echo "Server is running. ✓"
echo ""

# Test the search API
echo "Testing search API..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"AI startups","headers":["name","description"],"maxResults":2}' \
  -o test-search-results.csv \
  http://localhost:3000/api/search

if [ -f "test-search-results.csv" ] && [ -s "test-search-results.csv" ]; then
    echo "Search API test passed. ✓"
    echo "Sample CSV output:"
    cat test-search-results.csv
else
    echo "Search API test failed. ✗"
fi

echo ""

# Test the search results API
echo "Testing search results API..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"AI startups","fileType":"all","schemaType":"all"}' \
  -o test-search-results.json \
  http://localhost:3000/api/search-results

if [ -f "test-search-results.json" ] && [ -s "test-search-results.json" ]; then
    echo "Search results API test passed. ✓"
    echo "Sample JSON output:"
    cat test-search-results.json | head -n 20
    echo "..."
else
    echo "Search results API test failed. ✗"
fi

echo ""

# Test the cleanup API
echo "Testing cleanup API..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/api/cleanup

echo "Cleanup API test completed."
echo ""

# Clean up test files
echo "Cleaning up test files..."
rm -f test-search-results.csv test-search-results.json

echo ""
echo "=== All tests completed! ==="
