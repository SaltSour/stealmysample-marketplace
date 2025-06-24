import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { generateSlug } from "@/lib/utils"
import * as z from "zod"

const samplePackSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  kind: z.enum(["LOOP", "ONESHOT", "DRUMKIT", "PRESET", "MIDI", "STEM", "TEMPLATE", "SOUNDKIT"]),
  coverImage: z.string(),
  samples: z.array(
    z.object({
      url: z.string(),
      name: z.string()
    })
  ).min(1, "At least one sample is required"),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isCreator && session?.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get("status")

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (!creator) {
      return new NextResponse("Creator profile not found", { status: 404 })
    }

    // Fetch sample packs
    const packs = await prisma.samplePack.findMany({
      where: {
        creatorId: creator.id,
        published: status === "published",
      },
      include: {
        samples: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(packs)
  } catch (error) {
    console.error("Error fetching packs:", error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isCreator && session?.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    console.log("Received data:", JSON.stringify(json, null, 2)) // Pretty print the received data

    let parsedBody
    try {
      // Convert price to number if it's a string
      const data = {
        ...json,
        price: typeof json.price === 'string' ? parseFloat(json.price) : json.price
      }
      parsedBody = samplePackSchema.parse(data)
      console.log("Parsed data:", JSON.stringify(parsedBody, null, 2)) // Pretty print the parsed data
    } catch (validationError) {
      console.error("Validation error details:", validationError)
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(err => ({
          path: err.path,
          message: err.message,
          code: err.code
        }))
        console.error("Formatted validation errors:", JSON.stringify(formattedErrors, null, 2))
        return new NextResponse(
          JSON.stringify({
            message: "Validation failed",
            errors: formattedErrors
          }), 
          { 
            status: 422,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
      throw validationError
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    if (!creator) {
      return new NextResponse("Creator profile not found", { status: 404 })
    }

    // Generate base slug from title
    let slug = generateSlug(parsedBody.title)
    let slugExists = true
    let slugCounter = 0

    // Keep trying until we find a unique slug
    while (slugExists) {
      const finalSlug = slugCounter === 0 ? slug : `${slug}-${slugCounter}`
      const existing = await prisma.samplePack.findUnique({
        where: { slug: finalSlug },
      })
      
      if (!existing) {
        slug = finalSlug
        slugExists = false
      } else {
        slugCounter++
      }
    }

    // Create sample pack with unique slug
    const samplePack = await prisma.samplePack.create({
      data: {
        title: parsedBody.title,
        slug,
        description: parsedBody.description,
        price: parsedBody.price,
        coverImage: parsedBody.coverImage,
        creatorId: creator.id,
        published: false, // Start as draft
        kind: parsedBody.kind,  // Add the kind field
        samples: {
          create: parsedBody.samples.map((sample: { name: string; url: string }) => ({
            title: sample.name, // Use the original file name
            fileUrl: sample.url,
          })),
        },
      },
      include: {
        samples: true,
      },
    })

    return NextResponse.json(samplePack)
  } catch (error) {
    console.error("Error creating sample pack:", error)
    return new NextResponse(null, { status: 500 })
  }
} 