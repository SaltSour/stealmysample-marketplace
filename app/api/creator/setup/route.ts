import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is marked as creator
    if (!session.user.isCreator) {
      return new NextResponse("User is not a creator", { status: 403 })
    }

    // Check if creator profile already exists
    const existingProfile = await prisma.creator.findUnique({
      where: { userId: session.user.id }
    })

    if (existingProfile) {
      return NextResponse.json(existingProfile)
    }

    // Create creator profile
    const creator = await prisma.creator.create({
      data: {
        userId: session.user.id,
        bio: "",
        isVerified: false,
        payoutEnabled: false,
      }
    })

    return NextResponse.json(creator)
  } catch (error) {
    console.error("Error setting up creator profile:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    )
  }
} 