import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Utility function to estimate duration from file size
function estimateDuration(fileUrl: string, size: number): number {
  // Estimate based on typical WAV format (44.1kHz, 16-bit, stereo)
  // ~176,400 bytes per second
  const bytesPerSecond = 176400;
  const estimatedDuration = size / bytesPerSecond;
  
  // If it's an MP3, adjust the estimation (MP3s are more compressed)
  if (fileUrl.toLowerCase().endsWith('.mp3')) {
    // Assuming ~128kbps bitrate
    return size / 16000;
  }
  
  return Math.max(estimatedDuration, 1); // At least 1 second
}

export async function GET(request: Request) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const updateAll = searchParams.get("updateAll") === "true";
    
    // Query samples with missing or invalid durations
    const samplesQuery = updateAll 
      ? prisma.sample.findMany({ take: limit })
      : prisma.sample.findMany({
          where: {
            OR: [
              { duration: null },
              { duration: { equals: 0 } },
              { duration: { lt: 0 } }
            ]
          },
          take: limit
        });
    
    const samples = await samplesQuery;
    
    console.log(`Found ${samples.length} samples to update`);
    
    // Process each sample
    const updates = await Promise.all(
      samples.map(async (sample) => {
        try {
          // Get the file size by making a HEAD request
          let fileSize = 0;
          const fileUrl = sample.fileUrl;
          
          try {
            const response = await fetch(fileUrl, { method: 'HEAD' });
            if (response.ok) {
              const contentLength = response.headers.get('content-length');
              if (contentLength) {
                fileSize = parseInt(contentLength);
              }
            }
          } catch (error) {
            console.error(`Error fetching file size for ${sample.id}:`, error);
          }
          
          // Estimate duration from file size if available
          const estimatedDuration = fileSize > 0 
            ? estimateDuration(fileUrl, fileSize)
            : 30; // Default fallback
          
          // Update the sample with the new duration
          const updatedSample = await prisma.sample.update({
            where: { id: sample.id },
            data: { 
              duration: estimatedDuration
            }
          });
          
          return {
            id: sample.id,
            title: sample.title,
            oldDuration: sample.duration,
            newDuration: updatedSample.duration
          };
        } catch (error) {
          console.error(`Error updating sample ${sample.id}:`, error);
          return {
            id: sample.id,
            title: sample.title,
            error: true,
            message: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })
    );
    
    // Count successful updates
    const successCount = updates.filter(u => !('error' in u)).length;
    
    return NextResponse.json({
      totalSamples: samples.length,
      updatedSamples: successCount,
      updates
    });
  } catch (error) {
    console.error("Error in sample duration update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also allow POST requests for more control
export async function POST(request: Request) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { sampleId, duration, method = "set" } = body;
    
    if (!sampleId) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }
    
    // Get the sample
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId }
    });
    
    if (!sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }
    
    let newDuration: number;
    
    if (method === "set" && (duration === undefined || duration === null)) {
      return NextResponse.json(
        { error: "Duration is required when method is 'set'" },
        { status: 400 }
      );
    }
    
    // Calculate the new duration based on the method
    switch(method) {
      case "set":
        newDuration = parseFloat(duration);
        break;
        
      case "auto":
        // Get the file size by making a HEAD request
        let fileSize = 0;
        try {
          const response = await fetch(sample.fileUrl, { method: 'HEAD' });
          if (response.ok) {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              fileSize = parseInt(contentLength);
            }
          }
        } catch (error) {
          console.error(`Error fetching file size for ${sampleId}:`, error);
        }
        
        // Estimate duration from file size
        newDuration = fileSize > 0 
          ? estimateDuration(sample.fileUrl, fileSize)
          : 30; // Default fallback
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid method. Use 'set' or 'auto'" },
          { status: 400 }
        );
    }
    
    // Validate the new duration
    if (!isFinite(newDuration) || newDuration <= 0) {
      return NextResponse.json(
        { error: "Invalid duration value" },
        { status: 400 }
      );
    }
    
    // Update the sample
    const updatedSample = await prisma.sample.update({
      where: { id: sampleId },
      data: { duration: newDuration }
    });
    
    return NextResponse.json({
      id: updatedSample.id,
      title: updatedSample.title,
      oldDuration: sample.duration,
      newDuration: updatedSample.duration
    });
  } catch (error) {
    console.error("Error in sample duration update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 