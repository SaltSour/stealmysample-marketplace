import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

interface ExtendedSession {
  user: {
    id: string
    name?: string
    email?: string
    image?: string
    role: string
    isCreator: boolean
  }
}

// Get cart items
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Return empty cart for unauthenticated users
    if (!session?.user) {
      return NextResponse.json({ items: [] })
    }

    // Get user's cart with items - include price and format
    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          select: {
            id: true,
            price: true,
            format: true,
            quantity: true,
            sampleId: true,
            samplePackId: true,
            samplePack: {
              select: {
                id: true,
                title: true,
                price: true,
                coverImage: true,
              },
            },
            sample: {
              select: {
                id: true,
                title: true,
                wavPrice: true,
                stemsPrice: true,
                midiPrice: true,
                samplePack: {
                  select: {
                    coverImage: true
                  }
                }
              },
            },
          },
        },
      },
    })

    if (!cart) {
      // Create cart if it doesn't exist
      const newCart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: {
          items: true,
        },
      })
      return NextResponse.json(newCart)
    }

    return NextResponse.json(cart)
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json({ items: [] })
  }
}

// Add item to cart
export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null

    // Return error for unauthenticated users
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to add items to cart" },
        { status: 401 }
      )
    }

    console.log("User session:", {
      id: session.user.id,
      role: session.user.role,
      isCreator: session.user.isCreator
    })

    const json = await req.json()
    const { sampleId, samplePackId, format = "WAV", price } = json

    console.log("Request payload:", { sampleId, samplePackId, format, price })

    if (!sampleId && !samplePackId) {
      return NextResponse.json(
        { error: "Either sampleId or samplePackId is required" },
        { status: 400 }
      )
    }

    if (!price || typeof price !== "number") {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      )
    }

    // Get or create user's cart
    let cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    console.log("Existing cart:", cart)

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
      })
      console.log("Created new cart:", cart)
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        samplePackId: samplePackId ? parseInt(samplePackId) : null,
        sampleId: sampleId || null,
        format,
      },
    })

    console.log("Existing cart item:", existingItem)

    if (existingItem) {
      // Update quantity if item exists
      const updatedItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + 1,
        },
      })
      console.log("Updated cart item:", updatedItem)
      return NextResponse.json(updatedItem)
    }

    // Create new cart item
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        samplePackId: samplePackId ? parseInt(samplePackId) : null,
        sampleId: sampleId || null,
        format,
        price,
        quantity: 1,
      },
    })

    console.log("Created new cart item:", cartItem)
    return NextResponse.json(cartItem)
  } catch (error) {
    console.error("Error adding item to cart:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add item to cart" },
      { status: 500 }
    )
  }
}

// Clear cart
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    if (!cart) {
      return new NextResponse("Cart not found", { status: 404 })
    }

    // Delete all items in cart
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error clearing cart:", error)
    return new NextResponse(null, { status: 500 })
  }
} 