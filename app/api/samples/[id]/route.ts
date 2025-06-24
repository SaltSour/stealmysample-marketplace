import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Fetching sample with ID: ${params.id}`);
    
    const sample = await prisma.sample.findUnique({
      where: {
        id: params.id,
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
        // coverImage is a field on the sample model, not a relation
        // so it will be included automatically
      },
    })

    if (!sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      )
    }

    console.log(`Successfully fetched sample: ${sample.title}`);
    return NextResponse.json(sample)
  } catch (error) {
    console.error("[SAMPLE_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 