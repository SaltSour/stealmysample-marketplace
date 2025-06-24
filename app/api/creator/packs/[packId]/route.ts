import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import { deletePackFiles } from "@/lib/services/sample-pack"

const updatePackSchema = z.object({
  published: z.boolean(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { packId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isCreator && session?.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = updatePackSchema.parse(json)

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (!creator) {
      return new NextResponse("Creator profile not found", { status: 404 })
    }

    // Update sample pack
    const pack = await prisma.samplePack.update({
      where: {
        id: params.packId,
        creatorId: creator.id, // Ensure the pack belongs to the creator
      },
      data: {
        published: body.published,
      },
    })

    return NextResponse.json(pack)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    console.error("Error updating sample pack:", error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { packId: string } }
) {
  try {
    const packId = parseInt(params.packId)
    
    if (isNaN(packId)) {
      return new NextResponse("Invalid pack ID", { status: 400 })
    }
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Find the creator profile
    const creator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (!creator) {
      return new NextResponse("Creator profile not found", { status: 404 })
    }

    // Verify pack exists and belongs to the creator
    const pack = await prisma.samplePack.findUnique({
      where: {
        id: packId,
        creatorId: creator.id,
      },
    });
    
    if (!pack) {
      return new NextResponse("Sample pack not found or not owned by this creator", { status: 404 });
    }

    // Delete all associated files first
    await deletePackFiles(packId);
    
    // Safely delete sample pack and related records using a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related cart items first
      await tx.cartItem.deleteMany({
        where: { samplePackId: packId }
      });
      
      // Delete related order items
      await tx.orderItem.deleteMany({
        where: { samplePackId: packId }
      });
      
      // Now it's safe to delete the pack itself (samples will be deleted via cascade)
      await tx.samplePack.delete({
        where: {
          id: packId,
          creatorId: creator.id,
        },
      });
    });

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting sample pack:", error)
    if (error instanceof Error && error.message === "Sample pack not found or not owned by this creator") {
      return new NextResponse("Sample pack not found", { status: 404 })
    }
    return new NextResponse(null, { status: 500 })
  }
} 