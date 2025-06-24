// Test script for the ServerAudioProcessor
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Test that FFmpeg is installed correctly
async function testFfmpeg() {
  try {
    console.log('Testing FFmpeg installation...');
    
    const { stdout } = await execAsync('ffmpeg -version');
    console.log('FFmpeg version info:');
    console.log(stdout.split('\n')[0]);
    
    return true;
  } catch (error) {
    console.error('FFmpeg is not installed or not in PATH:', error.message);
    console.log('\nPlease install FFmpeg to use audio processing features.');
    console.log('Download from: https://ffmpeg.org/download.html');
    
    return false;
  }
}

// Test simple audio metadata extraction using FFmpeg
async function testAudioMetadata() {
  try {
    // Look for a sample WAV file in the public directory
    const sampleDir = path.join(process.cwd(), 'public');
    const files = fs.readdirSync(sampleDir);
    const wavFile = files.find(file => file.endsWith('.wav') || file.endsWith('.mp3'));
    
    if (!wavFile) {
      console.log('No audio files found in public directory for testing');
      return;
    }
    
    const filePath = path.join(sampleDir, wavFile);
    console.log(`Found audio file for testing: ${wavFile}`);
    
    // Extract audio metadata using FFprobe
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );
    
    const info = JSON.parse(stdout);
    
    console.log('Audio metadata:');
    console.log({
      format: info.format.format_name,
      duration: info.format.duration,
      bitrate: info.format.bit_rate,
      size: info.format.size
    });
    
    const audioStream = info.streams.find(s => s.codec_type === 'audio');
    if (audioStream) {
      console.log('Audio stream info:');
      console.log({
        codec: audioStream.codec_name,
        sampleRate: audioStream.sample_rate,
        channels: audioStream.channels,
        bitDepth: audioStream.bits_per_sample || 'unknown'
      });
    }
  } catch (error) {
    console.error('Error testing audio metadata extraction:', error.message);
  }
}

// Run the tests
async function runTests() {
  console.log('Testing audio processing functionality...\n');
  
  const ffmpegAvailable = await testFfmpeg();
  
  if (ffmpegAvailable) {
    console.log('\nTesting audio metadata extraction...');
    await testAudioMetadata();
  }
  
  console.log('\nTests completed!');
}

runTests(); 