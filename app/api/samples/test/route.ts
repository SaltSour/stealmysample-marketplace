import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Test API endpoint called");
    
    // Simplest possible query - just fetch the first 5 samples with minimal includes
    const samples = await prisma.sample.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        bpm: true,
        key: true,
        tags: true,
        samplePackId: true
      }
    });
    
    console.log(`Found ${samples.length} samples`);
    
    return NextResponse.json({
      success: true,
      count: samples.length,
      samples
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 