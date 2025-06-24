#!/usr/bin/env node

/**
 * Setup script for fixing audio sample durations
 * 
 * This script installs the required dependencies for the duration fix script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to check if a package is installed
function isPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (error) {
    return false;
  }
}

// Install required packages
function installDependencies() {
  console.log('Setting up dependencies for duration fix script...');
  
  const packagesToInstall = [];
  
  if (!isPackageInstalled('node-fetch')) {
    packagesToInstall.push('node-fetch');
  }
  
  if (!isPackageInstalled('ts-node')) {
    packagesToInstall.push('ts-node');
  }
  
  if (packagesToInstall.length > 0) {
    try {
      console.log(`Installing required packages: ${packagesToInstall.join(', ')}`);
      execSync(`npm install --save-dev ${packagesToInstall.join(' ')}`, { stdio: 'inherit' });
      console.log('Packages installed successfully!');
    } catch (error) {
      console.error('Failed to install packages:', error.message);
      process.exit(1);
    }
  } else {
    console.log('All required packages are already installed.');
  }
}

// Run the duration fix script
function runDurationFix(args) {
  try {
    console.log('Running duration fix script...');
    execSync(`npx ts-node scripts/fix-durations.ts ${args.join(' ')}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to run duration fix script:', error.message);
    process.exit(1);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  // Install dependencies
  installDependencies();
  
  // Check if the user wants to run the fix script
  if (args.includes('--run') || args.includes('-r')) {
    // Remove the run flag from args
    const scriptArgs = args.filter(arg => arg !== '--run' && arg !== '-r');
    runDurationFix(scriptArgs);
  } else {
    console.log('\nSetup complete! To fix sample durations, run:');
    console.log('  npm run fix-durations');
    console.log('  or');
    console.log('  npm run fix-durations:all');
  }
}

main(); 