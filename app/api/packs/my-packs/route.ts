export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    console.log("Fetching packs for user:", session.user.id)

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true
      }
    })

    if (!creator) {
      console.log("Creator profile not found for user:", session.user.id)
      return new NextResponse("Creator profile not found", { status: 404 })
    }

    console.log("Found creator:", creator)

    // Get all packs for the creator
    const packs = await prisma.samplePack.findMany({
      where: {
        creatorId: creator.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        _count: {
          select: {
            samples: true
          }
        }
      }
    })

    console.log(`Found ${packs.length} packs for creator`)

    return NextResponse.json(packs)
  } catch (error) {
    console.error("Error fetching creator packs:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    )
  }
} 