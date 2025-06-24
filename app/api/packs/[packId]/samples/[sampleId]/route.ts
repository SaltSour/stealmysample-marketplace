import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiErrors } from "@/lib/utils/api-error"
import { sampleSchema } from "@/lib/validations/sample-pack"
import { Session } from "next-auth"
import { samplePackService } from "@/lib/services/sample-pack"
import { Prisma } from "@prisma/client"

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

export async function PATCH(
  request: Request,
  { params }: { params: { packId: string; sampleId: string } }
) {
  try {
    const { packId, sampleId } = params
    const body = await request.json()

    // Validate the request body
    if (!body) {
      return new NextResponse("Request body is required", { status: 400 })
    }

    // Check if sample exists and belongs to the pack
    const existingSample = await prisma.sample.findFirst({
      where: {
        id: sampleId,
        samplePackId: parseInt(packId)
      }
    })

    if (!existingSample) {
      return apiErrors.notFound("Sample not found in this pack")
    }

    // Check if formats are being updated
    const formatUpdate = {
      ...(body.hasWav !== undefined && { hasWav: body.hasWav }),
      ...(body.hasStems !== undefined && { hasStems: body.hasStems }),
      ...(body.hasMidi !== undefined && { hasMidi: body.hasMidi })
    }

    // If formats are being updated, use the service method to handle format updates
    if (Object.keys(formatUpdate).length > 0) {
      await samplePackService.updateSampleFormats(parseInt(packId), sampleId, formatUpdate)
    }

    const { tags, ...sampleData } = body
    const updateData: Prisma.SampleUpdateInput = {
      ...sampleData,
    }

    if (Array.isArray(tags)) {
      updateData.tags = {
        set: [], // Disconnect all existing tags first
        connectOrCreate: tags.map((tagName: string) => ({
          where: { name: tagName },
          create: { name: tagName },
        })),
      }
    }

    // Update other sample properties
    const updatedSample = await prisma.sample.update({
      where: { id: sampleId },
      data: updateData,
    })

    return NextResponse.json(updatedSample)
  } catch (error) {
    console.error("Error updating sample:", error)
    return apiErrors.internal(error instanceof Error ? error : new Error("Failed to update sample"))
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { packId: string; sampleId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession | null
    if (!session?.user) {
      return apiErrors.unauthorized("You must be logged in to delete samples")
    }

    // Parse the pack ID to number
    const packId = parseInt(params.packId)
    if (isNaN(packId)) {
      return apiErrors.validationError({ id: ["Invalid pack ID"] })
    }

    // Get the sample ID
    const sampleId = params.sampleId

    // Verify pack ownership
    const pack = await prisma.samplePack.findUnique({
      where: { id: packId },
      include: { 
        creator: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!pack) {
      return apiErrors.notFound("Sample pack not found")
    }

    if (pack.creator.userId !== session.user.id) {
      return apiErrors.forbidden("You don't have permission to delete samples from this pack")
    }

    // Delete the sample
    await prisma.sample.delete({
      where: { id: sampleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sample:", error)
    return apiErrors.internal(error instanceof Error ? error : new Error("Failed to delete sample"))
  }
} 