/**
 * Cleanup script for SBC Gina Search Engine
 * 
 * This script removes intermediate output files while preserving
 * final CSV results and Google search logs.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Directories to clean
  directories: [
    'html-parser-output',
    'schema-detector-output',
    'google-docs-output',
    'temp'
  ],
  
  // Files to preserve (using glob patterns)
  preservePatterns: [
    '*.csv',                   // CSV result files
    '*google*search*.log',     // Google search logs
    '*google*search*.json'     // Google search JSON results
  ],
  
  // Output directory for preserved files
  outputDirectory: 'results'
};

/**
 * Check if a file matches any of the preserve patterns
 * @param {string} filename - File name to check
 * @returns {boolean} - True if file should be preserved
 */
function shouldPreserve(filename) {
  return config.preservePatterns.some(pattern => {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    
    return new RegExp(`^${regexPattern}$`).test(filename);
  });
}

/**
 * Ensure the output directory exists
 */
function ensureOutputDirectory() {
  if (!fs.existsSync(config.outputDirectory)) {
    fs.mkdirSync(config.outputDirectory, { recursive: true });
    console.log(`Created output directory: ${config.outputDirectory}`);
  }
}

/**
 * Clean a directory
 * @param {string} directory - Directory to clean
 */
function cleanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Directory does not exist: ${directory}`);
    return;
  }
  
  console.log(`Cleaning directory: ${directory}`);
  
  // Read all files in the directory
  const files = fs.readdirSync(directory);
  
  // Process each file
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively clean subdirectories
      cleanDirectory(filePath);
      
      // Remove empty directories
      if (fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        console.log(`Removed empty directory: ${filePath}`);
      }
    } else {
      // Check if file should be preserved
      if (shouldPreserve(file)) {
        // Move file to output directory
        const outputPath = path.join(config.outputDirectory, file);
        fs.copyFileSync(filePath, outputPath);
        console.log(`Preserved file: ${file} -> ${outputPath}`);
      }
      
      // Remove the file
      fs.unlinkSync(filePath);
      console.log(`Removed file: ${filePath}`);
    }
  });
}

/**
 * Main cleanup function
 */
function cleanup() {
  console.log('Starting cleanup process...');
  
  // Ensure output directory exists
  ensureOutputDirectory();
  
  // Clean each directory
  config.directories.forEach(directory => {
    cleanDirectory(directory);
  });
  
  console.log('Cleanup completed successfully!');
}

// Run the cleanup function
cleanup();
