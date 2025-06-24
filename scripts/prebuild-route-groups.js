/**
 * This script helps Next.js handle route groups with parentheses during the build process.
 * It copies contents from route group directories to their non-parenthesized equivalents.
 */

const fs = require('fs');
const path = require('path');

console.log('Starting pre-build route group handling...');

const APP_DIR = path.join(process.cwd(), 'app');

// Create a map of route groups to equivalent directories without parentheses
const routeGroupMappings = {
  '(main)': 'main',
  '(legal)': 'legal',
  '(auth)': 'auth'
};

// Function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Function to copy a file
function copyFile(source, destination) {
  try {
    const content = fs.readFileSync(source);
    fs.writeFileSync(destination, content);
    console.log(`Copied ${source} to ${destination}`);
  } catch (err) {
    console.error(`Error copying file ${source} to ${destination}: ${err.message}`);
  }
}

// Function to copy directory recursively
function copyDirectoryRecursive(sourceDir, targetDir) {
  ensureDirectoryExists(targetDir);
  
  const items = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  for (const item of items) {
    const sourcePath = path.join(sourceDir, item.name);
    const targetPath = path.join(targetDir, item.name);
    
    if (item.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  }
}

// Process each route group
for (const [routeGroup, regularDir] of Object.entries(routeGroupMappings)) {
  const sourceDir = path.join(APP_DIR, routeGroup);
  const targetDir = path.join(APP_DIR, regularDir);
  
  if (fs.existsSync(sourceDir)) {
    console.log(`Processing route group: ${routeGroup} -> ${regularDir}`);
    ensureDirectoryExists(targetDir);
    copyDirectoryRecursive(sourceDir, targetDir);
  } else {
    console.log(`Route group directory not found: ${sourceDir}`);
  }
}

console.log('Pre-build route group handling completed.'); 