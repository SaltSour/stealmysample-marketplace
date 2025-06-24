#!/usr/bin/env ts-node
import { spawn } from 'child_process';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createWriteStream, createReadStream, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { prisma } from '../lib/prisma';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const PREVIEW_DURATION = 15; // seconds
const PREVIEW_BITRATE = '128k';
const WATERMARK_INTERVAL = 5; // seconds between watermarks

/**
 * Generate a preview version of a sample
 * - Cuts to 15 seconds
 * - Converts to 128kbps MP3
 * - Optionally adds watermark
 */
async function generatePreview(sampleId: string, addWatermark = false) {
  console.log(`Generating preview for sample ${sampleId}...`);
  
  try {
    // Get sample info from database
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId }
    });

    if (!sample) {
      throw new Error(`Sample ${sampleId} not found`);
    }
    
    console.log(`Processing ${sample.title}...`);
    
    // Create temp directory
    const tempDir = mkdtempSync(join(tmpdir(), 'preview-'));
    const inputPath = join(tempDir, 'input.wav');
    const outputPath = join(tempDir, 'preview.mp3');
    const watermarkPath = join(tempDir, 'watermark.wav');
    
    // Download original file from S3
    console.log('Downloading original file...');
    const s3Key = `samples/${sampleId}/wav`;
    
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    
    const response = await s3Client.send(getCommand);
    
    if (!response.Body) {
      throw new Error('Failed to download file from S3');
    }
    
    // Save to temp file
    const writeStream = createWriteStream(inputPath);
    await pipeline(response.Body as Readable, writeStream);
    
    // Generate preview using FFmpeg
    console.log('Generating preview...');
    
    let ffmpegArgs: string[];
    
    if (addWatermark) {
      // Create a watermark tone (short beep)
      const watermarkCmd = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', 'sine=frequency=1000:duration=0.3',
        '-c:a', 'pcm_s16le',
        watermarkPath
      ]);
      
      await new Promise((resolve, reject) => {
        watermarkCmd.on('close', (code) => {
          if (code === 0) resolve(code);
          else reject(new Error(`FFmpeg watermark process exited with code ${code}`));
        });
      });
      
      // Generate preview with watermark
      ffmpegArgs = [
        '-i', inputPath,
        '-i', watermarkPath,
        '-filter_complex', `[0:a]afade=t=out:st=${PREVIEW_DURATION-1}:d=1,atrim=0:${PREVIEW_DURATION}[main];[1:a]volume=0.3[beep];` +
          `[main][beep]amix=inputs=2:duration=first:dropout_transition=0`,
        '-b:a', PREVIEW_BITRATE,
        '-y', outputPath
      ];
    } else {
      // Generate preview without watermark
      ffmpegArgs = [
        '-i', inputPath,
        '-t', PREVIEW_DURATION.toString(),
        '-b:a', PREVIEW_BITRATE,
        '-y', outputPath
      ];
    }
    
    const ffmpegCmd = spawn('ffmpeg', ffmpegArgs);
    
    await new Promise((resolve, reject) => {
      ffmpegCmd.on('close', (code) => {
        if (code === 0) resolve(code);
        else reject(new Error(`FFmpeg process exited with code ${code}`));
      });
    });
    
    console.log('Preview generated successfully');
    
    // Upload to S3
    console.log('Uploading preview to S3...');
    const previewS3Key = `samples/${sampleId}/previews/preview.mp3`;
    
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: previewS3Key,
      Body: createReadStream(outputPath),
      ContentType: 'audio/mpeg',
    });
    
    await s3Client.send(putCommand);
    
    console.log('Preview uploaded successfully');
    
    // Clean up temp files
    try {
      unlinkSync(inputPath);
      unlinkSync(outputPath);
      if (addWatermark) unlinkSync(watermarkPath);
    } catch (err) {
      console.warn('Error cleaning up temp files:', err);
    }
    
    return previewS3Key;
  } catch (error) {
    console.error('Error generating preview:', error);
    throw error;
  }
}

/**
 * Generate previews for all samples that don't have one yet
 */
async function generateAllPreviews(limit = 0) {
  try {
    console.log('Finding samples without previews...');
    
    // Query samples without previews
    const samples = await prisma.sample.findMany({
      where: {
        hasWav: true,
        // Add criteria to identify samples without previews
        // e.g. previewUrl: null (if you add such a field to your schema)
      },
      select: {
        id: true,
        title: true,
      },
      ...(limit > 0 ? { take: limit } : {}),
    });
    
    console.log(`Found ${samples.length} samples without previews`);
    
    // Process samples sequentially
    for (const sample of samples) {
      try {
        await generatePreview(sample.id);
        console.log(`Generated preview for ${sample.title}`);
      } catch (err) {
        console.error(`Error generating preview for ${sample.title}:`, err);
      }
    }
    
    console.log('All previews generated successfully');
  } catch (error) {
    console.error('Error generating previews:', error);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'all') {
    // Generate previews for all samples
    const limit = args[1] ? parseInt(args[1], 10) : 0;
    await generateAllPreviews(limit);
  } else if (command === 'sample') {
    // Generate preview for a specific sample
    const sampleId = args[1];
    if (!sampleId) {
      console.error('Sample ID is required');
      process.exit(1);
    }
    await generatePreview(sampleId, args[2] === '--watermark');
  } else {
    console.log(`
Usage:
  ts-node generate-preview.ts all [limit]
  ts-node generate-preview.ts sample <sampleId> [--watermark]
    `);
  }
}

// Run script if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { generatePreview }; 