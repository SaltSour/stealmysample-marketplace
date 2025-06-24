import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    console.log(`[API] Fetching sample with parameter: ${slugOrId}`);
    
    // IMPORTANT: First try direct ID lookup regardless of format
    // This is essential because the IDs in your system have custom formats
    let sample = await prisma.sample.findUnique({
      where: { id: slugOrId },
      include: {
        samplePack: {
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (sample) {
      console.log(`[API] Found sample by ID: ${sample.title} (ID: ${sample.id})`);
      return NextResponse.json(sample);
    }
    
    console.log(`[API] Direct ID lookup failed, checking raw database entries for debugging...`);
    
    // Get a list of sample IDs for debugging
    const allSampleIds = await prisma.sample.findMany({
      select: { id: true },
      take: 10
    });
    
    console.log(`[API] Sample IDs in database (first 10): ${JSON.stringify(allSampleIds.map(s => s.id))}`);
    
    // If not found by direct ID, try slug matching
    const hyphenatedSlug = slugOrId.replace(/_/g, '-');
    const underscoredSlug = slugOrId.replace(/-/g, '_');
    
    console.log(`[API] Trying slug variants: 
      - Original: ${slugOrId}
      - Hyphenated: ${hyphenatedSlug}
      - Underscored: ${underscoredSlug}`);
    
    // Try to find the sample by slug match
    sample = await prisma.sample.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { slug: hyphenatedSlug },
          { slug: underscoredSlug },
          // Also try exact match with title
          { title: slugOrId.replace(/[-_]/g, ' ') }
        ]
      },
      include: {
        samplePack: {
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      }
    });
    
    // If found by slug match, return immediately
    if (sample) {
      console.log(`[API] Found sample by slug match: ${sample.title} (ID: ${sample.id})`);
      console.log(`[API] Sample duration: ${sample.duration}, type: ${typeof sample.duration}`);
      
      // Ensure duration is a valid number
      if (sample.duration === null || sample.duration === undefined || !isFinite(sample.duration)) {
        console.log(`[API] Invalid duration detected for sample ${sample.id}, attempting to fix`);
        
        // Try to calculate duration or set a default
        try {
          // If we can't determine the duration, we can set a default or fetch it
          // For now, we'll set it to null and let the client handle it
          sample.duration = null;
        } catch (durationError) {
          console.error(`[API] Error fixing duration:`, durationError);
        }
      }
      
      return NextResponse.json(sample);
    }
    
    // Last resort: try to find any partial match
    console.log(`[API] Trying a more comprehensive search...`);
    
    // Query samples collection with a more inclusive approach
    const allSamples = await prisma.sample.findMany({
      take: 20,
      include: {
        samplePack: {
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      }
    });
    
    // Log what we found
    console.log(`[API] Found ${allSamples.length} total samples in database`);
    console.log(`[API] Looking for match with: ${slugOrId}`);
    
    // Try to find a match by ID (case insensitive) or any other property
    sample = allSamples.find(s => 
      s.id.toLowerCase() === slugOrId.toLowerCase() ||
      (s.slug && s.slug.toLowerCase() === slugOrId.toLowerCase()) ||
      s.title.toLowerCase().includes(slugOrId.toLowerCase())
    );
    
    if (sample) {
      console.log(`[API] Found sample by comprehensive search: ${sample.title} (ID: ${sample.id})`);
      return NextResponse.json(sample);
    }
    
    console.log(`[API] Sample not found with any method for: ${slugOrId}`);
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  } catch (error) {
    console.error("[API] Error fetching sample:", error);
    return NextResponse.json(
      { error: "Failed to fetch sample" },
      { status: 500 }
    );
  }
} 