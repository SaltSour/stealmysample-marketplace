import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiErrors } from "@/lib/utils/api-error"
import { FileStorageService, FileType } from "@/lib/services/file-storage"
import { samplePackSchema } from "@/lib/validations/sample-pack"

// Route Segment Config
export const runtime = 'nodejs'

// Initialize services
const fileStorage = new FileStorageService()

export async function POST(request: Request) {
  try {
    // Check authentication and creator status
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return apiErrors.unauthorized("You must be logged in to create a pack")
    }

    if (!session.user.isCreator) {
      return apiErrors.forbidden("Only creators can create packs")
    }

    // Parse the form data
    const formData = await request.formData()

    // Validate required fields
    const title = formData.get("title")
    const description = formData.get("description")
    const coverImage = formData.get("coverImage") as File | null

    if (!title || typeof title !== "string") {
      return apiErrors.validationError({ title: ["Title is required"] })
    }
    if (!description || typeof description !== "string") {
      return apiErrors.validationError({ description: ["Description is required"] })
    }
    if (!coverImage) {
      return apiErrors.validationError({ coverImage: ["Cover image is required"] })
    }

    // Save the cover image
    try {
      const imageBuffer = Buffer.from(await coverImage.arrayBuffer())
      
      // Validate file size
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (coverImage.size > maxSize) {
        return apiErrors.validationError({
          coverImage: [`File size must be less than ${maxSize / 1024 / 1024}MB`]
        })
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(coverImage.type)) {
        return apiErrors.validationError({
          coverImage: ['File must be JPEG, PNG, or WebP']
        })
      }

      const savedImage = await fileStorage.saveFile(imageBuffer, {
        originalName: coverImage.name,
        size: coverImage.size,
        type: FileType.IMAGE,
        mimeType: coverImage.type
      })

      // Get the creator profile
      const creator = await prisma.creator.findUnique({
        where: { userId: session.user.id }
      })

      if (!creator) {
        return apiErrors.notFound("Creator profile not found")
      }

      // Generate a unique slug
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      let slug = baseSlug
      let counter = 1

      // Create the pack with minimal required fields
      while (true) {
        try {
          const pack = await prisma.samplePack.create({
            data: {
              title,
              description,
              coverImage: savedImage.url,
              price: 0, // Default price
              category: "sample-pack", // Simple category instead of kind
              creatorId: creator.id,
              published: false,
              slug,
            },
          })

          return NextResponse.json({
            id: pack.id,
            uuid: pack.uuid,
            title: pack.title,
            description: pack.description,
            coverImage: pack.coverImage,
            published: pack.published,
            editUrl: `/dashboard/packs/${pack.id}/edit`,
            slug
          })
        } catch (error) {
          // If error is due to duplicate slug, try next counter
          if ((error as { code?: string }).code === 'P2002') {
            slug = `${baseSlug}-${counter}`
            counter++
            continue
          }
          // If error is not due to duplicate slug, throw it
          throw error
        }
      }
    } catch (error) {
      console.error("Error saving cover image:", error)
      return apiErrors.internal(
        new Error(
          error instanceof Error 
            ? `Failed to save cover image: ${error.message}`
            : "Failed to save cover image"
        )
      )
    }
  } catch (error) {
    console.error("Error in pack creation:", error)
    return apiErrors.internal(error as Error)
  }
}

// Helper function to generate unique slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await prisma.samplePack.findUnique({
      where: { slug }
    })
    
    if (!existing) break
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
} 