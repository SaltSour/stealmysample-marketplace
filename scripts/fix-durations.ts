#!/usr/bin/env ts-node
/**
 * Sample Duration Fixer Script
 * 
 * This script updates the duration of audio samples in the database
 * by estimating duration from file size for different audio formats.
 * 
 * Usage:
 *   npx ts-node scripts/fix-durations.ts [limit] [mode]
 *   
 *   - limit: (Optional) Maximum number of samples to process (default: all)
 *   - mode: (Optional) "all" to process all samples, or any other value 
 *     to only process samples with missing/invalid durations
 * 
 * Examples:
 *   npx ts-node scripts/fix-durations.ts        - Fix all samples with missing durations
 *   npx ts-node scripts/fix-durations.ts 10     - Fix up to 10 samples with missing durations
 *   npx ts-node scripts/fix-durations.ts 50 all - Fix up to 50 samples, including those with durations
 */

const { PrismaClient } = require('@prisma/client');
const nodeFetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const util = require('util');

const stat = util.promisify(fs.stat);
const prisma = new PrismaClient();

// Calculate duration from file size for different audio formats
function estimateDuration(fileUrl, size) {
  const fileExt = path.extname(fileUrl).toLowerCase();
  
  // Different byte rates for different formats
  switch (fileExt) {
    case '.wav':
      // Typical WAV (16-bit, stereo, 44.1kHz) = ~176,400 bytes per second
      return size / 176400;
    case '.mp3':
      // MP3 at 128kbps = ~16,000 bytes per second
      return size / 16000;
    case '.ogg':
    case '.oga':
      // OGG Vorbis at ~128kbps = ~16,000 bytes per second
      return size / 16000;
    case '.flac':
      // FLAC has varying bitrates but often around 70% of WAV
      return size / 120000;
    default:
      // Default to WAV estimation
      return size / 176400;
  }
}

async function getFileSize(url) {
  try {
    // If it's a local file path
    if (url.startsWith('/') || url.startsWith('./')) {
      const filePath = url.startsWith('/') ? url : path.join(process.cwd(), url);
      const stats = await stat(filePath);
      return stats.size;
    }
    
    // If it's a remote URL, use fetch to get headers
    const response = await nodeFetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    
    throw new Error('Could not determine file size');
  } catch (error) {
    console.error(`Error getting file size for ${url}:`, error);
    // Return a fallback size for typical audio samples (5MB WAV file)
    return 5 * 1024 * 1024;
  }
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0], 10) : undefined;
  const processAll = args[1] === 'all';
  
  // Build query conditions
  const whereCondition = processAll 
    ? {} 
    : { 
        OR: [
          { duration: null },
          { duration: { lte: 0 } }
        ]
      };
  
  console.log(`Finding samples ${processAll ? '(all)' : 'with missing durations'}${limit ? ` (limit: ${limit})` : ''}...`);
  
  // Get samples that need duration updates
  const samples = await prisma.sample.findMany({
    where: whereCondition,
    ...(limit ? { take: limit } : {}),
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Found ${samples.length} samples to process`);
  
  // Process each sample
  let updated = 0;
  
  for (const sample of samples) {
    try {
      console.log(`Processing sample: ${sample.id} (${sample.title})`);
      
      if (!sample.fileUrl) {
        console.warn(`  No file URL for sample ${sample.id}, skipping`);
        continue;
      }
      
      console.log(`  Current duration: ${sample.duration || 'null'}`);
      
      // Get file size
      const fileSize = await getFileSize(sample.fileUrl);
      console.log(`  File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Estimate duration from file size
      const estimatedDuration = estimateDuration(sample.fileUrl, fileSize);
      const finalDuration = Math.max(0.5, estimatedDuration); // Ensure at least 0.5 seconds
      
      console.log(`  Estimated duration: ${finalDuration.toFixed(2)} seconds`);
      
      // Update sample duration in database
      await prisma.sample.update({
        where: { id: sample.id },
        data: { duration: finalDuration },
      });
      
      updated++;
      console.log(`  ✅ Updated successfully`);
    } catch (error) {
      console.error(`  ❌ Error processing sample ${sample.id}:`, error);
    }
  }
  
  console.log(`\nSummary: Updated ${updated} of ${samples.length} samples`);
}

// Run the script
main()
  .catch(error => {
    console.error('Error running script:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 