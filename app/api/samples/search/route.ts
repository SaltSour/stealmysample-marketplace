export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get("q") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "20")
    
    // Extract tag filter parameters
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) || []
    const instruments = searchParams.get("instruments")?.split(",").filter(Boolean) || []
    const moods = searchParams.get("moods")?.split(",").filter(Boolean) || []
    const qualities = searchParams.get("qualities")?.split(",").filter(Boolean) || []
    
    // Build the where condition based on filters
    let whereCondition: any = {
      // Only return samples from published packs
      samplePack: {
        published: true
      }
    }
    
    // Add search query
    if (query) {
      whereCondition = {
        ...whereCondition,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } }
        ]
      }
    }
    
    // Add tag filters (genre: tags)
    const tagFilters = []
    
    if (genres.length > 0) {
      genres.forEach(genre => {
        tagFilters.push({ tags: { has: `genre:${genre}` } })
        // Also try without the prefix for backward compatibility
        tagFilters.push({ tags: { has: genre } })
      })
    }
    
    if (instruments.length > 0) {
      instruments.forEach(instrument => {
        tagFilters.push({ tags: { has: `instrument:${instrument}` } })
        // Also try without the prefix for backward compatibility
        tagFilters.push({ tags: { has: instrument } })
      })
    }
    
    if (moods.length > 0) {
      moods.forEach(mood => {
        tagFilters.push({ tags: { has: `mood:${mood}` } })
        // Also try without the prefix for backward compatibility
        tagFilters.push({ tags: { has: mood } })
      })
    }
    
    if (qualities.length > 0) {
      qualities.forEach(quality => {
        tagFilters.push({ tags: { has: `quality:${quality}` } })
        // Also try without the prefix for backward compatibility
        tagFilters.push({ tags: { has: quality } })
      })
    }
    
    // Add tag filters to the where condition if there are any
    if (tagFilters.length > 0) {
      whereCondition = {
        ...whereCondition,
        OR: [...(whereCondition.OR || []), ...tagFilters]
      }
    }
    
    // Get total count for pagination
    const totalSamples = await prisma.sample.count({
      where: whereCondition
    })
    
    // Fetch the samples with relations
    const samples = await prisma.sample.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: {
        createdAt: 'desc',
      },
      where: whereCondition,
      include: {
        samplePack: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            creator: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    // Process and validate samples before returning
    const processedSamples = samples.map(sample => {
      // Check for missing or invalid duration values
      if (sample.duration === null || 
          sample.duration === undefined || 
          !isFinite(sample.duration) || 
          sample.duration <= 0) {
        
        console.log(`[SAMPLES_SEARCH] Invalid duration (${sample.duration}) detected for ${sample.id}: ${sample.title}`);
        
        // Estimate duration based on some heuristics
        let estimatedDuration = 0;
        
        // Use filename pattern recognition to guess duration
        const lowerTitle = sample.title.toLowerCase();
        if (lowerTitle.includes('one-shot') || lowerTitle.includes('oneshot') || lowerTitle.includes('fx')) {
          estimatedDuration = 1; // 1 second for one-shots and FX
        } else if (lowerTitle.includes('loop') || lowerTitle.includes('drum')) {
          estimatedDuration = 8; // 8 seconds for loops
        } else if (lowerTitle.includes('vocal') || lowerTitle.includes('vox')) {
          estimatedDuration = 12; // 12 seconds for vocals
        } else {
          estimatedDuration = 5; // 5 seconds default
        }
        
        console.log(`[SAMPLES_SEARCH] Using estimated duration of ${estimatedDuration}s for ${sample.id}`);
        sample.duration = estimatedDuration;
        
        // Also add a task to fix the duration permanently (in the background)
        try {
          // This could be an async queue or background job in a production app
          // For now, we'll just log that we should run the fix-durations script
          console.log(`[SAMPLES_SEARCH] Sample ${sample.id} needs duration fix. Run scripts/fix-durations.ts`);
        } catch (error) {
          console.error(`[SAMPLES_SEARCH] Failed to schedule duration fix for ${sample.id}:`, error);
        }
      }
      
      return sample;
    });
    
    return NextResponse.json({
      samples: processedSamples,
      totalPages: Math.ceil(totalSamples / perPage),
      currentPage: page
    })
  } catch (error) {
    console.error("[SAMPLES_SEARCH]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 