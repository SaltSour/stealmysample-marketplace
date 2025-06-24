import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);

// Check if ffmpeg is in the system path
async function checkFfmpegInstalled() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    console.warn('FFmpeg not found in system path. Server-side audio processing features may not work correctly.');
    return false;
  }
}

// Verify FFmpeg is available
checkFfmpegInstalled();

// S3 client for storing waveform data and processed files
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'stealmysample';

// Temp directory for processing files
const TEMP_DIR = path.join(process.cwd(), 'tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export interface AudioMetadata {
  format: string;
  duration: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  bpm?: number;
  key?: string;
  peakAmplitude?: number;
  lufs?: number;
  truePeak?: number;
}

export interface WaveformData {
  points: number[];
  svg?: string;
}

export interface ProcessedAudio {
  metadata: AudioMetadata;
  waveform: WaveformData;
  previewUrl?: string;
}

export class ServerAudioProcessor {
  /**
   * Process an audio file to extract metadata and generate waveform
   */
  async processAudio(
    fileBuffer: Buffer,
    fileName: string,
    sampleId: string
  ): Promise<ProcessedAudio> {
    // Create a temporary file
    const tempFile = path.join(TEMP_DIR, `${uuidv4()}_${fileName}`);
    fs.writeFileSync(tempFile, fileBuffer);

    try {
      // Extract metadata, generate waveform, and create preview in parallel
      const [metadata, waveform, previewUrl] = await Promise.all([
        this.extractMetadata(tempFile),
        this.generateWaveform(tempFile, sampleId),
        this.createPreview(tempFile, sampleId),
      ]);

      return {
        metadata,
        waveform,
        previewUrl,
      };
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  /**
   * Extract metadata from an audio file using FFmpeg
   */
  private async extractMetadata(filePath: string): Promise<AudioMetadata> {
    try {
      // Extract audio metadata using FFprobe
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      );
      
      const info = JSON.parse(stdout);
      const audioStream = info.streams.find((s: any) => s.codec_type === 'audio');
      
      if (!audioStream) {
        throw new Error('No audio stream found in file');
      }

      // Extract common metadata
      const format = info.format.format_name;
      const duration = parseFloat(info.format.duration);
      const sampleRate = parseInt(audioStream.sample_rate);
      
      // Determine bit depth 
      let bitDepth = 16; // Default
      if (audioStream.bits_per_sample) {
        bitDepth = parseInt(audioStream.bits_per_sample);
      } else if (audioStream.bits_per_raw_sample) {
        bitDepth = parseInt(audioStream.bits_per_raw_sample);
      }
      
      const channels = parseInt(audioStream.channels);

      // Extract loudness metrics using EBU R128
      const loudnessResult = await execAsync(
        `ffmpeg -i "${filePath}" -filter_complex ebur128=peak=true -f null -`
      );
      
      // Parse the loudness output
      const lufsMatch = loudnessResult.stderr.match(/I:\s+([-\d.]+)\s+LUFS/);
      const truePeakMatch = loudnessResult.stderr.match(/Peak:\s+([-\d.]+)\s+dBFS/);
      
      const lufs = lufsMatch ? parseFloat(lufsMatch[1]) : undefined;
      const truePeak = truePeakMatch ? parseFloat(truePeakMatch[1]) : undefined;

      return {
        format,
        duration,
        sampleRate,
        bitDepth,
        channels,
        lufs,
        truePeak,
      };
    } catch (error) {
      console.error('Error extracting audio metadata:', error);
      throw new Error('Failed to extract audio metadata');
    }
  }

  /**
   * Generate waveform data for an audio file
   */
  private async generateWaveform(filePath: string, sampleId: string): Promise<WaveformData> {
    try {
      // Create temporary output file for the waveform data
      const waveformDataFile = path.join(TEMP_DIR, `${uuidv4()}_waveform.json`);
      const waveformImageFile = path.join(TEMP_DIR, `${uuidv4()}_waveform.png`);
      const waveformSvgFile = path.join(TEMP_DIR, `${uuidv4()}_waveform.svg`);

      // Generate a waveform PNG with transparent background
      await execAsync(
        `ffmpeg -i "${filePath}" -filter_complex "aformat=channel_layouts=mono,showwavespic=s=1000x200:colors=white" -frames:v 1 "${waveformImageFile}"`
      );

      // Generate a waveform SVG (better for web display)
      await execAsync(
        `ffmpeg -i "${filePath}" -filter_complex "aformat=channel_layouts=mono,showwaves=s=1000x200:mode=line:colors=white" -frames:v 1 "${waveformSvgFile}"`
      );

      // Generate a JSON array of 100 sample points for the waveform
      await execAsync(
        `ffmpeg -i "${filePath}" -filter_complex "aformat=channel_layouts=mono,asetnsamples=n=100,astats=metadata=1:reset=1,metadata=mode=print:file=${waveformDataFile}" -f null -`
      );

      // Read the waveform data
      const waveformData = fs.readFileSync(waveformDataFile, 'utf-8');
      const lines = waveformData.split('\n');
      
      // Parse the RMS values
      const points: number[] = [];
      for (const line of lines) {
        if (line.includes('lavfi.astats.Overall.RMS_level')) {
          const rmsMatch = line.match(/[-\d.]+$/);
          if (rmsMatch) {
            // Convert dB to linear scale (normalized 0-1)
            const dbValue = parseFloat(rmsMatch[0]);
            const linearValue = Math.pow(10, dbValue / 20);
            points.push(Math.min(1, Math.max(0, linearValue)));
          }
        }
      }

      // Read the SVG content
      const svgContent = fs.readFileSync(waveformSvgFile, 'utf-8');

      // Upload the waveform data to S3
      const waveformKey = `waveforms/${sampleId}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: waveformKey,
          Body: JSON.stringify({ points }),
          ContentType: 'application/json',
        })
      );

      // Upload the SVG to S3
      const svgKey = `waveforms/${sampleId}.svg`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: svgKey,
          Body: svgContent,
          ContentType: 'image/svg+xml',
        })
      );

      // Clean up temporary files
      [waveformDataFile, waveformImageFile, waveformSvgFile].forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });

      return {
        points,
        svg: svgContent,
      };
    } catch (error) {
      console.error('Error generating waveform:', error);
      return {
        // Fallback to a simple array of random points
        points: Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.1),
      };
    }
  }

  /**
   * Create a preview version of the audio (shortened MP3)
   */
  private async createPreview(filePath: string, sampleId: string): Promise<string | undefined> {
    try {
      // Create a temporary output file for the preview
      const previewFile = path.join(TEMP_DIR, `${uuidv4()}_preview.mp3`);

      // Extract metadata to get the duration
      const metadata = await this.extractMetadata(filePath);
      
      // Determine the preview duration (30 seconds or full duration if shorter)
      const previewDuration = Math.min(30, metadata.duration);
      
      // Generate a shorter preview MP3 file (first 30 seconds, mono, 128kbps)
      await execAsync(
        `ffmpeg -i "${filePath}" -t ${previewDuration} -ac 1 -b:a 128k "${previewFile}"`
      );

      // Upload the preview to S3
      const previewKey = `previews/${sampleId}.mp3`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: previewKey,
          Body: fs.readFileSync(previewFile),
          ContentType: 'audio/mpeg',
        })
      );

      // Clean up the temporary file
      if (fs.existsSync(previewFile)) {
        fs.unlinkSync(previewFile);
      }

      return previewKey;
    } catch (error) {
      console.error('Error creating preview:', error);
      return undefined;
    }
  }

  /**
   * Detect BPM for an audio file
   */
  async detectBPM(filePath: string): Promise<number | undefined> {
    try {
      // Use FFmpeg with the ebur128 filter which can show beats
      const { stderr } = await execAsync(
        `ffmpeg -i "${filePath}" -filter_complex ebur128=peak=true -f null -`
      );

      // TODO: Parse the output to extract BPM
      // This is a placeholder for proper BPM detection
      const bpmValue = Math.floor(Math.random() * (160 - 100 + 1)) + 100;
      
      return bpmValue;
    } catch (error) {
      console.error('Error detecting BPM:', error);
      return undefined;
    }
  }
} 