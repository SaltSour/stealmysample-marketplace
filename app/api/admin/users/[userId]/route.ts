import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import * as z from "zod"

const updateUserSchema = z.object({
  role: z.enum(["USER", "CREATOR", "ADMIN"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const json = await req.json()
    const body = updateUserSchema.parse(json)

    // Update user role and creator status
    const user = await prisma.user.update({
      where: {
        id: params.userId,
      },
      data: {
        role: body.role,
        isCreator: body.role === "CREATOR",
      },
    })

    // If making user a creator, ensure they have a creator profile
    if (body.role === "CREATOR") {
      await prisma.creator.upsert({
        where: {
          userId: params.userId,
        },
        update: {},
        create: {
          userId: params.userId,
          bio: "Creator profile pending update",
        },
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 