import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Return unauthorized for unauthenticated users
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Find all completed/paid orders
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['PAID', 'COMPLETED'] }
      },
      include: {
        items: {
          include: {
            samplePack: true,
            sample: true
          }
        }
      }
    });
    
    // Find all distinct sample packs that were purchased
    const packItems = await prisma.orderItem.findMany({
      where: {
        sampleId: null,
        samplePackId: { not: null },
        order: {
          userId: session.user.id,
          status: { in: ['PAID', 'COMPLETED'] }
        }
      },
      include: {
        samplePack: true,
        order: true
      }
    });
    
    // Get all order items (for debugging)
    const allOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: session.user.id
        }
      },
      include: {
        order: {
          select: {
            status: true
          }
        },
        samplePack: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    return NextResponse.json({
      orders,
      packItems,
      allOrderItems,
      message: "This is debug information to help diagnose library issues"
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
} 