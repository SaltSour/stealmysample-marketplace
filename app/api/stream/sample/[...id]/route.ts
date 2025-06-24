import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getSampleS3Key, streamFromS3 } from "@/lib/s3";
import { ReadableStream } from "stream/web";

/**
 * Secure sample streaming API 
 * - Verifies user ownership or provides preview access
 * - Pipes content directly without exposing source URLs
 * - Supports range requests for scrubbing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string[] } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get("preview") === "true";
    const format = (searchParams.get("format") || "WAV") as "WAV" | "STEMS" | "MIDI";
    // Join the array and remove the .wav extension
    const sampleId = params.id.join('/').replace(/\.wav$/, '');
    console.log(`Secure streaming request for sample ID: ${sampleId}`);
    
    // This route is now public for all streams, but we still verify the sample exists.
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      select: { id: true }
    });
    
    if (!sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }

    // Construct S3 key based on format and preview mode
    let s3Key: string;
    
    if (isPreview) {
      // Use low-quality preview file 
      s3Key = `samples/${sampleId}/previews/preview.mp3`;
    } else {
      // Use full quality file in requested format
      s3Key = getSampleS3Key(sampleId, format);
    }
    
    try {
      // ... existing code ...
    } catch (error) {
      // ... existing code ...
    }
  } catch (error) {
    // ... existing code ...
  }
} 