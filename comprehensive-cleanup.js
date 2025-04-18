/**
 * Comprehensive Cleanup Script for Gina Collection
 *
 * This script identifies and removes all intermediate and temporary files
 * while preserving essential code, configuration, and final result files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Root directory
  rootDir: '.',

  // Directories to completely clean
  cleanDirs: [
    'html-parser-output',
    'schema-detector-output',
    'google-docs-output',
    'temp'
  ],

  // Individual files to remove
  filesToRemove: [
    'google-doc-content.txt'
  ],

  // Patterns for files to preserve (even in clean directories)
  preservePatterns: [
    '.csv',
    'google-search',
    'search-results'
  ],

  // Output directory for preserved files
  outputDir: 'results',

  // Essential directories that should not be touched
  essentialDirs: [
    'src',
    'public',
    'node_modules',
    'dist',
    '.git'
  ],

  // Essential file extensions that should not be touched
  essentialExtensions: [
    '.ts',
    '.js',
    '.json',
    '.html',
    '.css',
    '.svg',
    '.md',
    '.sh',
    '.gitignore'
  ]
};

/**
 * Check if a file should be preserved
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if file should be preserved
 */
function shouldPreserve(filePath) {
  const fileName = path.basename(filePath);

  // Check if file matches preserve patterns
  const matchesPreservePattern = config.preservePatterns.some(pattern =>
    fileName.includes(pattern)
  );

  if (matchesPreservePattern) {
    return true;
  }

  // Check if file is in essential directory
  const isInEssentialDir = config.essentialDirs.some(dir =>
    filePath.includes(`/${dir}/`) || filePath === `./${dir}`
  );

  if (isInEssentialDir) {
    return true;
  }

  // Check if file has essential extension
  const extension = path.extname(fileName);
  const hasEssentialExtension = config.essentialExtensions.includes(extension);

  return hasEssentialExtension;
}

/**
 * Ensure the output directory exists
 */
function ensureOutputDirectory() {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
    console.log(`Created output directory: ${config.outputDir}`);
  }
}

/**
 * Clean a directory
 * @param {string} directory - Directory to clean
 * @returns {number} - Number of files removed
 */
function cleanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Directory does not exist: ${directory}`);
    return 0;
  }

  console.log(`Cleaning directory: ${directory}`);
  let filesRemoved = 0;

  // Read all files in the directory
  const files = fs.readdirSync(directory);

  // Process each file
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively clean subdirectories
      filesRemoved += cleanDirectory(filePath);

      // Remove empty directories
      if (fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        console.log(`Removed empty directory: ${filePath}`);
      }
    } else {
      // Check if file should be preserved
      if (config.cleanDirs.some(dir => directory.startsWith(dir)) ||
          config.filesToRemove.includes(file)) {

        // Check if file matches preserve patterns
        if (config.preservePatterns.some(pattern => file.includes(pattern))) {
          // Move file to output directory
          const outputPath = path.join(config.outputDir, file);
          fs.copyFileSync(filePath, outputPath);
          console.log(`Preserved file: ${file} -> ${outputPath}`);
        }

        // Remove the file
        fs.unlinkSync(filePath);
        console.log(`Removed file: ${filePath}`);
        filesRemoved++;
      }
    }
  });

  return filesRemoved;
}

/**
 * Find and remove all intermediate files
 */
function findAndRemoveIntermediateFiles() {
  console.log('Finding and removing intermediate files...');

  // Get all files in the project (excluding node_modules, dist, and .git)
  const allFiles = execSync('find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*"')
    .toString()
    .split('\n')
    .filter(Boolean);

  let filesRemoved = 0;
  let filesPreserved = 0;

  // Process each file
  allFiles.forEach(filePath => {
    // Skip files in essential directories
    if (config.essentialDirs.some(dir => filePath.includes(`/${dir}/`))) {
      return;
    }

    // Skip files with essential extensions
    const extension = path.extname(filePath);
    if (config.essentialExtensions.includes(extension)) {
      return;
    }

    // Check if file is in a directory to clean
    const isInCleanDir = config.cleanDirs.some(dir => filePath.startsWith(`./${dir}`));

    // Check if file is in the list to remove
    const isInRemoveList = config.filesToRemove.some(file => filePath.endsWith(`/${file}`));

    if (isInCleanDir || isInRemoveList) {
      // Check if file should be preserved
      if (config.preservePatterns.some(pattern => filePath.includes(pattern))) {
        // Move file to output directory
        const fileName = path.basename(filePath);
        const outputPath = path.join(config.outputDir, fileName);
        fs.copyFileSync(filePath, outputPath);
        console.log(`Preserved file: ${filePath} -> ${outputPath}`);
        filesPreserved++;
      }

      // Remove the file
      fs.unlinkSync(filePath);
      console.log(`Removed file: ${filePath}`);
      filesRemoved++;
    }
  });

  return { filesRemoved, filesPreserved };
}

/**
 * Main cleanup function
 */
function cleanup() {
  console.log('Starting comprehensive cleanup process...');

  // Ensure output directory exists
  ensureOutputDirectory();

  // Clean each directory completely
  let totalFilesRemoved = 0;
  config.cleanDirs.forEach(directory => {
    if (fs.existsSync(directory)) {
      totalFilesRemoved += cleanDirectory(directory);
      // Remove the empty directory
      fs.rmdirSync(directory);
      console.log(`Removed empty directory: ${directory}`);
    }
  });

  // Remove individual files
  config.filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Removed file: ${file}`);
      totalFilesRemoved++;
    }
  });

  // Find and remove other intermediate files
  const { filesRemoved, filesPreserved } = findAndRemoveIntermediateFiles();
  totalFilesRemoved += filesRemoved;

  console.log(`Cleanup completed successfully!`);
  console.log(`Total files removed: ${totalFilesRemoved}`);
  console.log(`Files preserved: ${filesPreserved}`);

  if (filesPreserved > 0) {
    console.log(`All preserved files have been moved to the '${config.outputDir}' directory.`);
  }
}

// Run the cleanup function
cleanup();
