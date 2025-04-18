#!/bin/bash

# Cleanup script for SBC Gina Search Engine
# This script removes intermediate output files while preserving final CSV results and Google search logs

echo "Starting cleanup process..."

# Run the cleanup script
node cleanup.js

echo "Cleanup completed!"
