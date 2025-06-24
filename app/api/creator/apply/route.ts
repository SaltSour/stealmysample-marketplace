import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import * as z from "zod"

const creatorApplicationSchema = z.object({
  bio: z.string().min(50, "Bio must be at least 50 characters."),
  website: z.string().url("Invalid URL.").optional(),
  socials: z.object({
    instagram: z.string().optional(),
    soundcloud: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is already a creator
    const existingCreator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    if (existingCreator) {
      return NextResponse.json(
        { error: "Already a creator" },
        { status: 400 }
      )
    }

    const json = await req.json()
    const body = creatorApplicationSchema.parse(json)

    // Create creator profile and update user role
    await prisma.$transaction([
      prisma.creator.create({
        data: {
          userId: session.user.id,
          bio: body.bio,
          website: body.website,
          socials: body.socials || {},
        },
      }),
      prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          role: "CREATOR",
          isCreator: true,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 422 }
      )
    }

    console.error("Creator application error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 