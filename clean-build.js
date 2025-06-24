const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to recursively remove a directory
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  console.log(`Removing directory: ${dirPath}`);
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      if (fs.statSync(filePath).isDirectory()) {
        removeDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
        console.log(`Removed file: ${filePath}`);
      }
    }
    
    fs.rmdirSync(dirPath);
    console.log(`Removed directory: ${dirPath}`);
  } catch (error) {
    console.error(`Error removing directory ${dirPath}:`, error);
  }
}

// Main function
async function main() {
  try {
    // Step 1: Clean the .next directory
    console.log('Starting clean build process...');
    
    if (fs.existsSync('.next')) {
      console.log('Cleaning .next directory...');
      removeDirectory('.next');
    }
    
    // Step 2: Install dependencies if needed
    console.log('Checking dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Step 3: Run the build
    console.log('Building project...');
    execSync('npx next build', { stdio: 'inherit' });
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error); 