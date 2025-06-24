import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all sample IDs
    const samples = await prisma.sample.findMany({
      select: { id: true },
      take: 50 // Limit to 50 samples for performance
    });
    
    const ids = samples.map(sample => sample.id);
    
    console.log(`[DEBUG] Retrieved ${ids.length} sample IDs`);
    
    return NextResponse.json({ ids });
  } catch (error) {
    console.error("[DEBUG] Error fetching sample IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sample IDs" },
      { status: 500 }
    );
  }
} 