export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiErrors } from "@/lib/utils/api-error"
import { Prisma } from "@prisma/client"

type SamplePackWithIncludes = Prisma.SamplePackGetPayload<{
  include: {
    samples: {
      select: {
        id: true;
      };
    };
    cartItems: {
      select: {
        id: true;
      };
    };
  };
}>;

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return apiErrors.unauthorized("You must be logged in to view your packs")
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!creator) {
      // If user is not a creator yet, return empty array
      return NextResponse.json([])
    }

    // Get all packs for the creator
    const packs = await prisma.samplePack.findMany({
      where: {
        creatorId: creator.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        samples: {
          select: {
            id: true
          }
        },
        cartItems: {
          select: {
            id: true
          }
        }
      }
    })

    // Transform the data to include computed fields
    const packsWithStats = packs.map(pack => ({
      id: pack.id,
      title: pack.title,
      description: pack.description,
      coverImage: pack.coverImage,
      published: pack.published,
      samples: pack.samples.map(s => ({ id: s.id })),
      stats: {
        downloads: pack.cartItems.length,
        plays: 0, // TODO: Implement play count tracking
        revenue: 0, // TODO: Implement revenue calculation
        conversionRate: pack.cartItems.length > 0 ? 
          (pack.cartItems.length / pack.samples.length) * 100 : 0
      }
    }))

    return NextResponse.json(packsWithStats)
  } catch (error) {
    console.error("Error fetching creator packs:", error)
    return apiErrors.internal(error as Error)
  }
} 