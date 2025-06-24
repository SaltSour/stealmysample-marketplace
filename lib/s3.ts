import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  endpoint: `https://s3.${process.env.S3_REGION || "eu-north-1"}.amazonaws.com`,
});

// S3 Bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "stealmysample";

/**
 * Generate a signed URL for secure sample access
 * 
 * @param key - The S3 object key (path to file in bucket)
 * @param fileName - Original filename for Content-Disposition
 * @param expiresIn - URL expiration in seconds (default 2 minutes)
 * @returns Signed URL with limited access time
 */
export async function getSignedSampleUrl(
  key: string,
  fileName: string,
  expiresIn: number = 120
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });

  try {
    // Embed user tracking info in key if needed
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate secure download link");
  }
}

/**
 * Utility to construct S3 keys for different file types
 */
export function getSampleS3Key(sampleId: string, format: "WAV" | "STEMS" | "MIDI", fileName: string): string {
  const extension = format.toLowerCase();
  // Ensure the filename has the correct extension, or append it
  const finalFileName = fileName.endsWith(`.${extension}`) ? fileName : `${fileName}.${extension}`;
  return `samples/${sampleId}/${finalFileName}`;
}

/**
 * Stream audio content from S3 directly to response
 * Used for secure streaming without exposing URLs
 */
export async function streamFromS3(
  key: string,
  rangeHeader?: string
) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ...(rangeHeader ? { Range: rangeHeader } : {}),
  });

  try {
    const response = await s3Client.send(command);
    
    // Return object details and readable stream
    return {
      contentType: response.ContentType || "audio/mpeg",
      contentLength: response.ContentLength,
      contentRange: response.ContentRange,
      body: response.Body,
      lastModified: response.LastModified,
    };
  } catch (error) {
    console.error("Error streaming from S3:", error);
    throw new Error("Failed to stream audio content");
  }
} 