import { FileType, FileTypes, FileMetadata } from './file-storage';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Interface for saved file result
interface SavedFile {
  url: string;
  path: string;
  metadata: FileMetadata;
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  endpoint: `https://s3.${process.env.S3_REGION || "eu-north-1"}.amazonaws.com`,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'stealmysample';

/**
 * Generate a UUID for unique filenames
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class S3StorageService {
  /**
   * Validates a file against type-specific constraints
   */
  async validateFile(metadata: FileMetadata): Promise<void> {
    const fileConfig = FileTypes[metadata.type];
    
    // Validate file size
    if (metadata.size > fileConfig.maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${fileConfig.maxSize / 1024 / 1024}MB`);
    }

    // Validate file extension
    const extension = path.extname(metadata.originalName).toLowerCase();
    if (!fileConfig.extensions.includes(extension)) {
      throw new Error(`File extension ${extension} is not allowed. Supported extensions: ${fileConfig.extensions.join(", ")}`);
    }

    // Validate MIME type if allowedMimeTypes is specified
    if (fileConfig.allowedMimeTypes && !fileConfig.allowedMimeTypes.includes(metadata.mimeType)) {
      throw new Error(`MIME type ${metadata.mimeType} is not allowed for ${metadata.type} files`);
    }
  }

  /**
   * Generates a unique S3 key while preserving the original extension
   */
  private generateS3Key(originalName: string, type: FileType, sampleId?: string): string {
    // For audio, we now use a predictable path based on the sample ID
    if (type === FileType.AUDIO && sampleId) {
      return `samples/${sampleId}/${originalName}`;
    }

    // Fallback for other file types or when no sampleId is provided
    const ext = path.extname(originalName);
    const uuid = generateUUID();
    const typeDir = FileTypes[type].directory;
    return `${typeDir}/${uuid}${ext}`;
  }

  /**
   * Saves a file to S3
   */
  async saveFile(buffer: Buffer, metadata: FileMetadata, sampleId?: string): Promise<SavedFile> {
    try {
      // Validate the file
      await this.validateFile(metadata);

      // Generate unique S3 key
      const s3Key = this.generateS3Key(metadata.originalName, metadata.type, sampleId);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: metadata.mimeType,
        Metadata: {
          originalName: metadata.originalName,
          fileType: metadata.type,
        },
      });

      await s3Client.send(command);

      // For non-audio files, we can return a public URL
      // For audio files, we should use our secure endpoints
      let url: string;
      if (metadata.type === FileType.AUDIO) {
        // Use the actual S3 URL for storage
        url = `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || 'eu-north-1'}.amazonaws.com/${s3Key}`;
      } else {
        // For non-audio files, generate a short-lived URL
        const getCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
        });
        url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      }

      return {
        url,
        path: s3Key,
        metadata,
      };
    } catch (error) {
      console.error('Error saving file to S3:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to save file to S3: ${error.message}`
          : 'Failed to save file to S3'
      );
    }
  }

  /**
   * Deletes a file from S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    try {
      // If it's a URL and not an S3 key, extract the key
      if (s3Key.startsWith('http') || s3Key.startsWith('/api/')) {
        throw new Error('Please provide S3 key, not URL, for deletion');
      }

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete file from S3'
      );
    }
  }

  async uploadAudio(buffer: Buffer, filename: string): Promise<{ filePath: string; url: string }> {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const key = `audio/${uuidv4()}-${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'audio/wav'
    });

    await s3Client.send(command);

    console.log(`Successfully uploaded ${filename} to ${BUCKET_NAME}/${key}`);

    const signedUrl = await getSignedUrl(s3Client, new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key }), { expiresIn: 3600 });
    return { filePath: key, url: signedUrl };
  }

  async uploadImage(buffer: Buffer, filename: string): Promise<{ filePath: string; url: string }> {
    // Implementation for uploading an image
    throw new Error('Uploading images is not implemented');
  }
} 