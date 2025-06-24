import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: params.username
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: false, // Don't expose email
        image: true,
        createdAt: true,
        isCreator: true,
        creatorProfile: {
          select: {
            bio: true,
            website: true,
            isVerified: true,
            samplePacks: {
              where: {
                published: true,
                archived: false,
              },
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                coverImage: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[PROFILE_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 