const fs = require('fs');
const path = require('path');

// This script helps ensure route group manifests are properly copied
// Run this after the build process

console.log('Starting route manifest fix script...');

const nextDir = path.join(process.cwd(), '.next');
const serverDir = path.join(nextDir, 'server');
const appDir = path.join(serverDir, 'app');

// Check if build directory exists
if (!fs.existsSync(nextDir)) {
  console.error('Error: .next directory not found');
  process.exit(1);
}

// Process all directories in the app folder
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dirPath, entry.name);
      
      // If this is a route group (directory name with parentheses)
      if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
        console.log(`Processing route group: ${entry.name}`);
        
        // Find manifest files in this directory
        const manifestFiles = fs.readdirSync(fullPath).filter(file => 
          file.includes('_client-reference-manifest.js')
        );
        
        // For each manifest file, copy it to both parent and route group directories
        for (const manifestFile of manifestFiles) {
          const sourceFile = path.join(fullPath, manifestFile);
          
          // Create a similarly named file in the parent directory
          const targetName = manifestFile.replace('page_', `${entry.name}_page_`);
          const targetFile = path.join(dirPath, targetName);
          
          try {
            console.log(`Copying ${sourceFile} to ${targetFile}`);
            fs.copyFileSync(sourceFile, targetFile);
          } catch (err) {
            console.error(`Error copying manifest: ${err.message}`);
          }
        }
      }
      
      // Process nested directories
      processDirectory(fullPath);
    }
  }
}

try {
  processDirectory(appDir);
  console.log('Route manifest fix completed successfully');
} catch (error) {
  console.error(`Error fixing route manifests: ${error.message}`);
  process.exit(1);
} 