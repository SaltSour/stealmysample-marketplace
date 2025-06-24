import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sampleId = params.id;
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "WAV") as 'WAV' | 'STEMS' | 'MIDI';

    // Verify that the user owns this sample
    const ownership = await checkSampleOwnership(session.user.id, sampleId);
    if (!ownership) {
      return NextResponse.json(
        { error: "You don't own this sample" },
        { status: 403 }
      );
    }

    // Get the sample details
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      select: {
        title: true,
        fileUrl: true,
      },
    });

    if (!sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Get file path from the fileUrl
    // The fileUrl typically contains a relative path like "/uploads/audio/file.wav"
    // We need to map this to the actual file path on the server
    const filePath = path.join(process.cwd(), "public", sample.fileUrl);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      // Determine the content type based on the file extension
      let contentType = "audio/wav"; // Default to WAV
      if (filePath.endsWith(".mid")) {
        contentType = "audio/midi";
      } else if (filePath.endsWith(".mp3")) {
        contentType = "audio/mpeg";
      } else if (filePath.endsWith(".zip")) {
        contentType = "application/zip";
      }
      
      // Create a clean filename
      const fileName = `${sample.title.replace(/[^\w\s-]/g, "_")}_${format.toLowerCase()}.${getFileExtension(format)}`;
      
      // Return file as response
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    } catch (fileError) {
      console.error("File not found:", filePath, fileError);
      return NextResponse.json({ error: "Sample file not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error downloading sample:", error);
    return NextResponse.json(
      { error: "Failed to download sample" },
      { status: 500 }
    );
  }
}

// Helper function to get file extension based on format
function getFileExtension(format: string): string {
  switch (format) {
    case 'STEMS':
      return 'zip';
    case 'MIDI':
      return 'mid';
    case 'WAV':
    default:
      return 'wav';
  }
}

// Helper function to check if the user owns the sample
async function checkSampleOwnership(
  userId: string,
  sampleId: string
): Promise<boolean> {
  // Find any order that has this sample
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      sampleId,
      order: {
        userId,
        status: { in: ["PAID", "COMPLETED"] },
      },
    },
  });

  // If we found a direct sample purchase, the user owns this sample
  if (orderItem) {
    return true;
  }

  // Check if the sample is part of a pack the user has purchased
  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    select: { samplePackId: true },
  });

  if (sample?.samplePackId) {
    const packOrder = await prisma.orderItem.findFirst({
      where: {
        samplePackId: sample.samplePackId,
        order: {
          userId,
          status: { in: ["PAID", "COMPLETED"] },
        },
      },
    });

    return !!packOrder;
  }

  return false;
} 