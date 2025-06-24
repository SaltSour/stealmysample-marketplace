import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getSignedSampleUrl, getSampleS3Key } from "@/lib/s3";
import { z } from "zod";
import { apiHandler } from "@/lib/apiHandler";

// Schema for download query parameters
const downloadQuerySchema = z.object({
  format: z.enum(["WAV", "STEMS", "MIDI"]).default("WAV"),
});

/**
 * Secure download API that generates time-limited, signed URLs
 * Only authenticated users who have purchased the sample can download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  return apiHandler({
    validation: {
      schema: downloadQuerySchema,
      data: queryParams,
    },
    // Never cache download URLs as they are time-limited and per-user
    cache: { type: "no-store" },
    handler: async () => {
      const session = await getServerSession(authOptions);
      
      // Check authentication
      if (!session?.user) {
        throw new Error("Authentication required");
      }

      const { format } = downloadQuerySchema.parse(queryParams);
      const sampleId = params.id;

      // Find sample with ownership info
      const sample = await prisma.sample.findUnique({
        where: { id: sampleId },
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

      // Verify sample exists
      if (!sample) {
        throw new Error("Sample not found");
      }

      // Check if user has purchased this sample or its pack
      const hasDirectlyPurchased = sample.orderItems.length > 0;
      const hasPurchasedPack = sample.samplePack?.orderItems.length > 0;
      
      if (!hasDirectlyPurchased && !hasPurchasedPack) {
        throw new Error("Purchase required to download this sample");
      }

      // Verify format availability
      if ((format === "WAV" && !sample.hasWav) || 
          (format === "STEMS" && !sample.hasStems) || 
          (format === "MIDI" && !sample.hasMidi)) {
        throw new Error(`Sample not available in ${format} format`);
      }

      // Log download request
      console.log(
        `User ${session.user.id} downloading sample ${sampleId} in ${format} format`
      );

      // Generate safe filename
      const safeFilename = `${sample.title.replace(/[^\w\s-]/g, "")}_${format.toLowerCase()}`;
      const fileExtension = format === "MIDI" ? "mid" : "wav";
      const fileName = `${safeFilename}.${fileExtension}`;

      // Construct S3 key for this sample and format
      const s3Key = getSampleS3Key(sampleId, format);

      try {
        // Generate time-limited signed URL (2 minutes validity)
        const signedUrl = await getSignedSampleUrl(
          s3Key,
          fileName, 
          120 // 2 minutes expiration
        );

        // You could implement download counting here
        // await prisma.$transaction(async (tx) => {
        //   // Decrement remaining downloads on OrderItem if implementing limits
        // });

        return {
          url: signedUrl,
          expires: new Date(Date.now() + 120 * 1000).toISOString(),
          filename: fileName
        };
      } catch (error) {
        console.error("Error generating download URL:", error);
        throw new Error("Failed to generate download link");
      }
    }
  });
} 