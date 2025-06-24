import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

type SamplePackWithRelations = {
  id: string
  title: string
  price: number
  published: boolean
  orders: any[]
  samples: any[]
}

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isCreator && session?.user?.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        samplePacks: {
          include: {
            samples: true,
            orders: true,
          },
        },
      },
    })

    if (!creator) {
      return new NextResponse(
        JSON.stringify({ error: "Creator profile not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Calculate statistics
    const stats = {
      totalSales: creator.samplePacks.reduce(
        (acc: number, pack: SamplePackWithRelations) => acc + pack.orders.length,
        0
      ),
      totalRevenue: creator.samplePacks.reduce(
        (acc: number, pack: SamplePackWithRelations) => acc + pack.orders.length * pack.price,
        0
      ),
      activePacks: creator.samplePacks.filter((pack: SamplePackWithRelations) => pack.published).length,
      totalDownloads: creator.samplePacks.reduce(
        (acc: number, pack: SamplePackWithRelations) => acc + pack.orders.length,
        0
      ),
    }

    return new NextResponse(
      JSON.stringify(stats),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Error fetching creator stats:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 