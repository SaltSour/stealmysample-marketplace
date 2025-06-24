import { apiHandler } from "@/lib/apiHandler";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { cartItemSelect } from "@/lib/prismaHelpers";
import { NextResponse } from "next/server";

// Validation schema for cart items
const cartItemSchema = z.object({
  samplePackId: z.number().optional(),
  sampleId: z.string(),
  format: z.enum(['WAV', 'STEMS', 'MIDI']),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log('Received request body:', body);

    const validatedData = cartItemSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Verify the sample exists and get its details
    const sample = await prisma.sample.findUnique({
      where: { id: validatedData.sampleId },
      include: {
        samplePack: true,
      },
    });

    if (!sample) {
      return new NextResponse(
        JSON.stringify({ error: "Sample not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the sample has the requested format and price
    let isValidFormat = false;
    switch (validatedData.format) {
      case 'WAV':
        isValidFormat = sample.hasWav && sample.wavPrice === validatedData.price;
        break;
      case 'STEMS':
        isValidFormat = sample.hasStems && sample.stemsPrice === validatedData.price;
        break;
      case 'MIDI':
        isValidFormat = sample.hasMidi && sample.midiPrice === validatedData.price;
        break;
    }

    if (!isValidFormat) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid format or price for this sample" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use a transaction to ensure database consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get or create user's cart
      let cart = await tx.cart.findUnique({
        where: { userId: session.user.id },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { userId: session.user.id },
        });
      }

      // Check if item already exists in cart
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          sampleId: validatedData.sampleId,
          format: validatedData.format,
        },
      });

      if (existingItem) {
        // Update quantity if item exists
        return await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + 1 },
          select: cartItemSelect,
        });
      }

      // Create cart item
      return await tx.cartItem.create({
        data: {
          cartId: cart.id,
          sampleId: validatedData.sampleId,
          samplePackId: sample.samplePackId,
          format: validatedData.format,
          price: validatedData.price,
        },
        select: cartItemSelect,
      });
    });

    console.log('Cart operation result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding to cart:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new NextResponse(
      JSON.stringify({ error: "Failed to add item to cart" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(req: Request) {
  return apiHandler({
    cache: {
      // Private, auth-required data should not be cached
      type: "no-store"
    },
    handler: async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      // Get user's cart with items
      const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            select: cartItemSelect,
          },
        },
      });

      if (!cart) {
        return { items: [] };
      }

      return cart;
    }
  });
} 