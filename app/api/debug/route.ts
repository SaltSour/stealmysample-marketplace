import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get database info using introspection
    const samples = await prisma.sample.findMany({
      take: 1
    });
    
    const sampleColumns = Object.keys(samples[0] || {});
    
    // Query actual database to see tables and columns
    const samplePacks = await prisma.samplePack.findMany({
      take: 1
    });
    
    const samplePackColumns = Object.keys(samplePacks[0] || {});
    
    return NextResponse.json({
      dbInfo: {
        sampleColumns,
        samplePackColumns,
        hasSamples: samples.length > 0,
        hasSamplePacks: samplePacks.length > 0
      }
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 