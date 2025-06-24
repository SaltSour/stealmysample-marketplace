import { NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
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
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Secure streaming request for sample ID: ${params.id}`);
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Parse request parameters
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get("preview") === "true";
    const rangeHeader = request.headers.get("range") || undefined;
    
    // Default to WAV format for streaming
    const format = (searchParams.get("format") || "WAV") as "WAV" | "STEMS" | "MIDI";
    
    // For previews, allow authenticated users without purchase check
    // For full streaming, verify ownership
    if (!isPreview) {
      // Require authentication for all secure content
      if (!session?.user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Find sample and check ownership
      const sample = await prisma.sample.findUnique({
        where: { id: params.id },
        include: {
          samplePack: {
            include: {
              orderItems: {
                where: {
                  order: {
                    userId: session.user.id,
                    status: { in: ["PAID", "COMPLETED"] }
                  }
                }
              }
            }
          },
          orderItems: {
            where: {
              order: {
                userId: session.user.id,
                status: { in: ["PAID", "COMPLETED"] }
              }
            }
          }
        }
      });

      // Check if sample exists
      if (!sample) {
        return NextResponse.json(
          { error: "Sample not found" },
          { status: 404 }
        );
      }

      // Check if this format is available
      if ((format === "WAV" && !sample.hasWav) ||
          (format === "STEMS" && !sample.hasStems) ||
          (format === "MIDI" && !sample.hasMidi)) {
        return NextResponse.json(
          { error: `Sample not available in ${format} format` },
          { status: 400 }
        );
      }

      // Check user ownership - either direct sample purchase or pack purchase
      const hasDirectlyPurchased = sample.orderItems.length > 0;
      const hasPurchasedPack = sample.samplePack?.orderItems.length > 0;
      
      if (!hasDirectlyPurchased && !hasPurchasedPack) {
        return NextResponse.json(
          { error: "Purchase required to access this content" },
          { status: 403 }
        );
      }

      console.log(`User ${session.user.id} authorized to stream sample ${params.id}`);
    } else {
      // Preview mode - still needs basic auth
      if (!session?.user) {
        return NextResponse.json(
          { error: "Authentication required even for preview" },
          { status: 401 }
        );
      }
      
      // Verify sample exists for preview
      const sample = await prisma.sample.findUnique({
        where: { id: params.id },
        select: { id: true }
      });
      
      if (!sample) {
        return NextResponse.json(
          { error: "Sample not found" },
          { status: 404 }
        );
      }
      
      console.log(`User ${session.user.id} accessing preview for sample ${params.id}`);
    }

    // Construct S3 key based on format and preview mode
    let s3Key: string;
    
    if (isPreview) {
      // Use low-quality preview file 
      s3Key = `samples/${params.id}/previews/preview.mp3`;
    } else {
      // Use full quality file in requested format
      s3Key = getSampleS3Key(params.id, format);
    }
    
    try {
      // Stream audio from S3 directly
      const streamResult = await streamFromS3(s3Key, rangeHeader);
      
      // Determine content type based on format
      let contentType = streamResult.contentType;
      if (format === "WAV") contentType = "audio/wav";
      else if (format === "STEMS") contentType = "audio/wav"; // typically WAV format
      else if (format === "MIDI") contentType = "audio/midi";
      
      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": isPreview ? "public, max-age=3600" : "no-store, private",
        "X-Content-Type-Options": "nosniff"
      };
      
      // Add Content-Length if available
      if (streamResult.contentLength !== undefined) {
        headers["Content-Length"] = streamResult.contentLength.toString();
      }
      
      // If range request, return 206 Partial Content
      const status = rangeHeader ? 206 : 200;
      
      // Create response with the stream body
      return new NextResponse(streamResult.body as ReadableStream, {
        status,
        headers
      });
    } catch (error) {
      console.error("Error streaming audio:", error);
      return NextResponse.json(
        { error: "Error streaming audio content" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Streaming error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
} 