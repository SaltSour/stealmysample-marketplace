import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { apiErrors } from "@/lib/utils/api-error"
import { prisma } from "@/lib/prisma"
import { SAMPLE_PRICES } from "@/lib/validations/sample-pack"
import { Session } from "next-auth"

interface ExtendedSession extends Session {
  user: {
    id: string
    name?: string
    email?: string
    image?: string
    role: string
    isCreator: boolean
  }
}

export async function POST(
  request: Request,
  { params }: { params: { packId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession | null
    if (!session?.user) {
      return apiErrors.unauthorized("You must be logged in to upload samples")
    }

    // Parse the pack ID to number
    const packId = parseInt(params.packId)
    if (isNaN(packId)) {
      return apiErrors.validationError({ id: ["Invalid pack ID"] })
    }

    // Check if the pack exists and user owns it
    const pack = await prisma.samplePack.findUnique({
      where: { id: packId },
      include: {
        creator: true
      }
    })

    if (!pack) {
      return apiErrors.notFound("Sample pack not found")
    }

    if (pack.creator.userId !== session.user.id) {
      return apiErrors.forbidden("You don't have permission to upload to this pack")
    }

    // Parse request body
    const body = await request.json()

    // Validate samples array
    if (!body.samples || !Array.isArray(body.samples)) {
      return apiErrors.validationError({
        samples: ["Samples array is required"]
      })
    }

    // Create samples in the database
    const createdSamples = await Promise.all(
      body.samples.map(async (sample: any) => {
        // Extract necessary fields
        const { url, metadata, ...sampleData } = sample
        
        // Extract relevant fields from metadata
        const duration = metadata?.duration ? parseFloat(metadata.duration) : 0
        const format = metadata?.format || null
        const sampleRate = metadata?.sampleRate || null
        const bitDepth = metadata?.bitDepth || null
        const channels = metadata?.channels || null
        const peakAmplitude = metadata?.peakAmplitude || null

        // Set fixed prices based on format availability
        const hasWav = sampleData.hasWav !== undefined ? sampleData.hasWav : true
        const hasStems = sampleData.hasStems !== undefined ? sampleData.hasStems : false
        const hasMidi = sampleData.hasMidi !== undefined ? sampleData.hasMidi : false

        // Prepare the sample data without the metadata object
        const createData = {
          ...sampleData,
          fileUrl: url,
          duration,
          samplePackId: packId,
          // Add the metadata fields directly
          format,
          sampleRate,
          bitDepth,
          channels,
          peakAmplitude,
          // Ensure other required fields are present
          tags: {
            connectOrCreate: (sampleData.tags || []).map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
          bpm: sampleData.bpm || null,
          key: sampleData.key || null,
          hasWav,
          hasStems,
          hasMidi,
          // Set fixed prices based on the SAMPLE_PRICES constant
          wavPrice: hasWav ? SAMPLE_PRICES.WAV : null,
          stemsPrice: hasStems ? SAMPLE_PRICES.STEMS : null,
          midiPrice: hasMidi ? SAMPLE_PRICES.MIDI : null,
        }

        return await prisma.sample.create({
          data: createData
        })
      })
    )

    // Calculate and update pack price if needed
    const allPackSamples = await prisma.sample.findMany({
      where: { samplePackId: packId }
    })
    
    // Calculate minimum pack price
    const minPackPrice = allPackSamples.length * SAMPLE_PRICES.PACK_MIN_PRICE
    
    // If current pack price is below minimum, update it
    if (pack.price < minPackPrice) {
      await prisma.samplePack.update({
        where: { id: packId },
        data: { price: minPackPrice }
      })
    }

    // Return the newly created samples
    return NextResponse.json({ samples: createdSamples })
  } catch (error) {
    console.error("Error uploading samples:", error)
    return apiErrors.internal(error instanceof Error ? error : new Error("Failed to upload samples"))
  }
} 