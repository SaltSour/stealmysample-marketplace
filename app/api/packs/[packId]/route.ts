import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { deletePackFiles } from "@/lib/services/sample-pack"
import { validateForPublishing } from "@/lib/validations/sample-pack"

export async function GET(
  req: Request,
  { params }: { params: { packId: string } }
) {
  try {
    // Try to parse the pack ID as a number first
    const id = parseInt(params.packId)
    let pack

    if (!isNaN(id)) {
      // If it's a valid number, search by ID
      pack = await prisma.samplePack.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          samples: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              waveformData: true,
              duration: true,
              bpm: true,
              key: true,
              hasWav: true,
              hasStems: true,
              hasMidi: true,
              wavPrice: true,
              stemsPrice: true,
              midiPrice: true
            }
          }
        }
      })
    } else {
      // If it's not a number, try to find by slug
      pack = await prisma.samplePack.findUnique({
        where: { slug: params.packId },
        include: {
          creator: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          samples: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              waveformData: true,
              duration: true,
              bpm: true,
              key: true,
              hasWav: true,
              hasStems: true,
              hasMidi: true,
              wavPrice: true,
              stemsPrice: true,
              midiPrice: true
            }
          }
        }
      })
    }

    if (!pack) {
      return new NextResponse("Pack not found", { status: 404 })
    }

    return NextResponse.json(pack)
  } catch (error) {
    console.error("Error fetching pack:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to fetch pack",
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { packId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const id = parseInt(params.packId)
    if (isNaN(id)) {
      return new NextResponse("Invalid pack ID", { status: 400 })
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id }
    })

    if (!creator) {
      return new NextResponse("Creator profile not found", { status: 404 })
    }

    // First get the pack to verify ownership
    const pack = await prisma.samplePack.findUnique({
      where: { id }
    })

    if (!pack) {
      return new NextResponse("Pack not found", { status: 404 })
    }

    if (pack.creatorId !== creator.id) {
      return new NextResponse("Not authorized to delete this pack", { status: 403 })
    }

    // Delete all associated files before deleting the database records
    await deletePackFiles(id)

    // Use a transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // First delete related cart items
      await tx.cartItem.deleteMany({
        where: { samplePackId: id }
      })

      // Then delete related order items
      await tx.orderItem.deleteMany({
        where: { samplePackId: id }
      })

      // Now it's safe to delete the pack which will cascade delete samples
      await tx.samplePack.delete({
        where: { id }
      })
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting pack:", error)
    if (error instanceof Error && error.message === "Pack not found") {
      return new NextResponse("Pack not found", { status: 404 })
    }
    if (error instanceof Error && error.message === "Not authorized to delete this pack") {
      return new NextResponse("Not authorized to delete this pack", { status: 403 })
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to delete pack",
      { status: 500 }
    )
  }
}

// Add PATCH endpoint to toggle publish status
export async function PATCH(
  req: Request,
  { params }: { params: { packId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const id = parseInt(params.packId)
    if (isNaN(id)) {
      return new NextResponse("Invalid pack ID", { status: 400 })
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id }
    })

    if (!creator) {
      return new NextResponse("Creator profile not found", { status: 404 })
    }

    // Get the pack and verify ownership
    const pack = await prisma.samplePack.findUnique({
      where: { id },
      include: {
        samples: true
      }
    })

    if (!pack) {
      return new NextResponse("Pack not found", { status: 404 })
    }

    if (pack.creatorId !== creator.id) {
      return new NextResponse("Not authorized to modify this pack", { status: 403 })
    }

    const body = await req.json()
    
    // Handle publishing status change
    if (typeof body.published === "boolean" && body.published !== pack.published) {
      if (body.published) {
        // Validate pack before publishing
        if (!pack.title || !pack.description) {
          return new NextResponse("Title and description are required for publication", { status: 400 })
        }
        if (!pack.coverImage) {
          return new NextResponse("Cover image is required for publication", { status: 400 })
        }
        if (!pack.samples || pack.samples.length === 0) {
          return new NextResponse("At least one sample is required for publication", { status: 400 })
        }
        if (pack.price <= 0) {
          return new NextResponse("Price must be set for publication", { status: 400 })
        }
        
        // Use validateForPublishing to check for missing BPM values
        const validationResult = validateForPublishing(pack);
        if (!validationResult.success) {
          return new NextResponse(validationResult.error, { status: 400 })
        }
      }
    }

    // Prepare update data
    const updateData = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.published !== undefined && { 
        published: body.published,
        publishedAt: body.published ? new Date() : null 
      }),
      ...(body.kind !== undefined && { kind: body.kind }),
      ...(body.archived !== undefined && {
        archived: body.archived,
        archivedAt: body.archived ? new Date() : null
      })
    } as const

    // Update the pack
    const updatedPack = await prisma.samplePack.update({
      where: { id },
      data: updateData,
      include: {
        samples: true,
        creator: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedPack)
  } catch (error) {
    console.error("Error updating pack:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to update pack",
      { status: 500 }
    )
  }
} 