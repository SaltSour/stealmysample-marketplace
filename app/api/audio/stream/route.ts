import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// S3 client for getting presigned URLs
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'stealmysample';

// GET - Stream audio or generate presigned URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sampleId = searchParams.get('sampleId');
    const isDownload = searchParams.get('download') === 'true';
    const format = searchParams.get('format') || 'wav'; // wav, mp3 (preview), etc.
    
    if (!sampleId) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }
    
    // Get the session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get the sample
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        samplePack: {
          include: {
            creator: {
              include: {
                user: true
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
    
    if (!sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }
    
    // Check access permissions
    const isCreator = sample.samplePack.creator.user.id === session.user.id;
    const hasPurchasedSample = sample.orderItems.length > 0;
    const hasPurchasedPack = sample.samplePack.orderItems.length > 0;
    
    // For previews, allow authenticated users to access
    // For full downloads, require ownership or creator status
    if (format !== 'preview' && isDownload && !isCreator && !hasPurchasedSample && !hasPurchasedPack) {
      return NextResponse.json(
        { error: "You must purchase this sample to download it" },
        { status: 403 }
      );
    }
    
    // Determine which URL to use based on format
    let s3Key;
    if (format === 'preview' && sample.previewUrl) {
      s3Key = sample.previewUrl;
    } else {
      // Extract S3 key from the file URL
      // This assumes the fileUrl stored is the S3 key and not a full URL
      s3Key = sample.fileUrl.startsWith('http')
        ? new URL(sample.fileUrl).pathname.substring(1) // Remove leading slash
        : sample.fileUrl;
    }
    
    // If this is a download, log it for analytics
    if (isDownload && !isCreator) {
      await prisma.sampleDownload.create({
        data: {
          sampleId: sample.id,
          userId: session.user.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
          format: format === 'preview' ? 'WAV' : format.toUpperCase() as any,
        }
      });
    }
    
    // Generate a presigned URL for S3 access
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    
    // Set expiration time (shorter for previews, longer for downloads)
    const expiresIn = isDownload ? 300 : 3600; // 5 minutes for downloads, 1 hour for streaming
    
    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    // If it's a download, provide a direct download link
    if (isDownload) {
      // Set filename for download
      const fileName = `${sample.title.replace(/[^\w\s-]/g, '')}-${sample.id.slice(-6)}.${
        format === 'preview' ? 'mp3' : 'wav'
      }`;
      
      return NextResponse.json({
        url: presignedUrl,
        fileName,
        metadata: {
          title: sample.title,
          duration: sample.duration,
          format: format === 'preview' ? 'mp3' : sample.format || 'wav',
          sampleRate: sample.sampleRate,
          bitDepth: sample.bitDepth,
          channels: sample.channels,
        }
      });
    }
    
    // For streaming, return the URL and audio metadata
    return NextResponse.json({
      url: presignedUrl,
      metadata: {
        title: sample.title,
        duration: sample.duration,
        format: format === 'preview' ? 'mp3' : sample.format || 'wav',
        sampleRate: sample.sampleRate,
        bitDepth: sample.bitDepth,
        channels: sample.channels,
        waveformUrl: sample.waveformUrl,
        waveformData: sample.waveformData,
      }
    });
  } catch (error) {
    console.error("Error streaming audio:", error);
    return NextResponse.json(
      { error: "Failed to stream audio" },
      { status: 500 }
    );
  }
} 