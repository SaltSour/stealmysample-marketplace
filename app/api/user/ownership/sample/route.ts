export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// This endpoint checks if the current user has purchased a specific sample or sample pack
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    
    // Return false for unauthenticated users
    if (!session?.user) {
      return NextResponse.json({ owned: false }, { status: 401 })
    }
    
    // Parse the sampleIds from the URL
    const { searchParams } = new URL(request.url);
    const sampleIds = searchParams.getAll('sampleId');
    
    if (!sampleIds || sampleIds.length === 0) {
      return NextResponse.json(
        { error: "sampleId parameter is required" },
        { status: 400 }
      );
    }
    
    // Find all samples to get their samplePackIds
    const samples = await prisma.sample.findMany({
      where: { id: { in: sampleIds } },
      select: { id: true, samplePackId: true }
    });

    if (samples.length === 0) {
      return NextResponse.json({ ownership: {} });
    }

    const samplePackIds = samples.map(s => s.samplePackId).filter(id => id !== null) as number[];
    
    // Check for any completed orders containing these samples or packs
    const purchasedItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: session.user.id,
          status: { in: ['PAID', 'COMPLETED'] }
        },
        OR: [
          { sampleId: { in: sampleIds } },
          { samplePackId: { in: samplePackIds } }
        ]
      },
      select: { sampleId: true, samplePackId: true }
    });

    const purchasedSampleIds = new Set(purchasedItems.map(item => item.sampleId).filter(id => id));
    const purchasedPackIds = new Set(purchasedItems.map(item => item.samplePackId).filter(id => id));

    const ownership: Record<string, boolean> = {};
    for (const sample of samples) {
      const isOwned = purchasedSampleIds.has(sample.id) || (sample.samplePackId && purchasedPackIds.has(sample.samplePackId));
      ownership[sample.id] = isOwned;
    }
    
    // Return the ownership map
    return NextResponse.json({ ownership });
    
  } catch (error) {
    console.error("Error checking sample ownership:", error)
    return NextResponse.json(
      { error: "Failed to check sample ownership" },
      { status: 500 }
    )
  }
} 