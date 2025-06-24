export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the creator's sample packs
    const creatorPacks = await prisma.samplePack.findMany({
      where: {
        creatorId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    const packIds = creatorPacks.map(pack => pack.id);

    // Find all orders that contain the creator's sample packs
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            samplePackId: {
              in: packIds,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            samplePackId: {
              in: packIds,
            },
          },
          include: {
            samplePack: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[CREATOR_ORDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 