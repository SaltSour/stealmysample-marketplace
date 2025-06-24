import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Delete cart item
export async function DELETE(
  req: Request,
  { params }: { params: { itemId: string } }
) {
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

    // Delete cart item (only if it belongs to user's cart)
    await prisma.cartItem.delete({
      where: {
        id: params.itemId,
        cartId: cart.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting cart item:", error)
    return new NextResponse(null, { status: 500 })
  }
}

// Update cart item quantity
export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const { quantity } = json

    if (typeof quantity !== "number" || quantity < 1) {
      return new NextResponse("Invalid quantity", { status: 400 })
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

    // Update cart item quantity (only if it belongs to user's cart)
    const cartItem = await prisma.cartItem.update({
      where: {
        id: params.itemId,
        cartId: cart.id,
      },
      data: {
        quantity,
      },
    })

    return NextResponse.json(cartItem)
  } catch (error) {
    console.error("Error updating cart item:", error)
    return new NextResponse(null, { status: 500 })
  }
} 