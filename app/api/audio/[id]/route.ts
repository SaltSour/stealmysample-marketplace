import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { streamFromS3 } from "@/lib/s3"
import { ReadableStream } from "stream/web"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Audio API request received for sample ID: ${params.id}`);
    
    // Parse the URL to get search params
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';

    // Get the session, but only require it for downloads
    const session = await getServerSession(authOptions)
    if (isDownload && !session?.user) {
      return new NextResponse("Unauthorized for download", { status: 401 })
    }

    // Get the sample
    const sample = await prisma.sample.findUnique({
      where: { id: params.id },
      include: {
        samplePack: {
          include: {
            creator: true,
            ...(session?.user && { // Only include orderItems if user is logged in
              orderItems: {
                where: {
                  order: {
                    userId: session.user.id,
                    status: { in: ["PAID", "COMPLETED"] }
                  }
                }
              }
            })
          }
        },
        ...(session?.user && { // Only include orderItems if user is logged in
          orderItems: {
            where: {
              order: {
                userId: session.user.id,
                status: { in: ["PAID", "COMPLETED"] }
              }
            }
          }
        })
      }
    })

    if (!sample) {
      return new NextResponse("Sample not found", { status: 404 })
    }

    // For downloads, check ownership
    if (isDownload) {
      const hasDirectlyPurchased = (sample.orderItems?.length || 0) > 0;
      const hasPurchasedPack = (sample.samplePack?.orderItems?.length || 0) > 0;
      const isCreator = sample.samplePack?.creator?.userId === session.user?.id;
      const hasAccess = hasDirectlyPurchased || hasPurchasedPack || isCreator;
      
      if (!hasAccess) {
        return new NextResponse("Access denied - you must purchase this sample to download it", { status: 403 })
      }
    }

    if (!sample.fileUrl) {
      return new NextResponse("Sample file not found", { status: 404 });
    }

    // Extract the S3 key from the full URL
    let s3Key: string;
    try {
      const url = new URL(sample.fileUrl);
      s3Key = url.pathname.substring(1); // Remove the leading '/'
    } catch (error) {
      console.error("Invalid fileUrl for sample:", sample.id, sample.fileUrl);
      return new NextResponse("Invalid sample file URL", { status: 500 });
    }

    const range = request.headers.get("range");
    const streamData = await streamFromS3(s3Key, range);

    const headers = new Headers({
      "Content-Type": streamData.contentType,
      "Accept-Ranges": "bytes",
    });

    if (range && streamData.contentRange) {
      headers.set("Content-Range", streamData.contentRange);
      headers.set("Content-Length", (streamData.contentLength || 0).toString());
    } else {
      headers.set("Content-Length", (streamData.contentLength || 0).toString());
    }
    
    if (isDownload) {
      const fileName = (sample.title || 'sample').replace(/[^\w\s-]/g, "");
      headers.set("Content-Disposition", `attachment; filename="${fileName}.wav"`);
    }

    return new NextResponse(streamData.body as any, { 
      status: range ? 206 : 200, 
      headers 
    });

  } catch (error) {
    console.error("Error in audio route:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    )
  }
} 