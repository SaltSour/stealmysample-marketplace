import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import * as z from "zod"

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
})

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = profileSchema.parse(json)

    // Check if email is already taken by another user
    if (body.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: body.email,
        },
      })

      if (existingUser) {
        return new NextResponse("Email already taken", { status: 400 })
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: body.name,
        email: body.email,
      },
    })

    // Update or create creator profile if bio or website is provided
    if (body.bio || body.website) {
      await prisma.creator.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          bio: body.bio,
          website: body.website,
        },
        create: {
          userId: session.user.id,
          bio: body.bio,
          website: body.website,
        },
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
} 