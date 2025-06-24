import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Mark route as dynamic to avoid static generation errors
export const dynamic = 'force-dynamic'

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface CartSummaryItem {
  id: string
  title: string
  price: number
  quantity: number
  format: string
  coverImage?: string | null
  samplePackId?: string
  sampleId?: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as SessionUser | undefined

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // First, get the user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true }
    });

    if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json({
        subtotal: 0,
        total: 0,
        items: [],
      });
    }

    // Manually fetch associated samples and sample packs
    const cartItems = [];
    
    for (const item of cart.items) {
      let title = "Unknown Item";
      let coverImage = null;
      let samplePackId;
      let sampleId;
      
      if (item.samplePackId) {
        // Use a generic query without specifying fields to avoid TypeScript issues
        const samplePack = await prisma.samplePack.findUnique({
          where: { id: item.samplePackId }
        });
        
        if (samplePack) {
          // Manually extract needed properties
          title = samplePack.title;
          // Use type assertion for properties that cause TypeScript issues
          coverImage = samplePack.coverImage as string;
          samplePackId = samplePack.slug || samplePack.id.toString();
        }
      }
      
      if (item.sampleId) {
        // Use a generic query without specifying fields
        const sample = await prisma.sample.findUnique({
          where: { id: item.sampleId }
        });
        
        if (sample) {
          title = sample.title;
          // Use type assertion for properties that cause TypeScript issues
          coverImage = (sample as any).coverImage || null;
          sampleId = sample.id;
        }
      }
      
      cartItems.push({
        id: item.id,
        title,
        price: item.price,
        quantity: item.quantity,
        format: item.format,
        coverImage,
        samplePackId,
        sampleId
      });
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const total = subtotal // Add tax, discounts, etc. here if needed

    return NextResponse.json({
      subtotal,
      total,
      items: cartItems,
    });
  } catch (error) {
    console.error("Error fetching checkout summary:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to fetch checkout summary",
      { status: 500 }
    )
  }
} 