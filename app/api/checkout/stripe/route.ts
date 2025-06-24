import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the request body
    const { successUrl, cancelUrl } = await req.json();

    if (!successUrl || !cancelUrl) {
      return new NextResponse("Missing success or cancel URL", { status: 400 });
    }

    // Get user's cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            sample: {
              select: {
                id: true,
                title: true,
                wavPrice: true,
                stemsPrice: true,
                midiPrice: true,
              },
            },
            samplePack: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return new NextResponse("Cart is empty", { status: 400 });
    }

    // Transform cart items into Stripe line items
    const lineItems = cart.items.map((item) => {
      const productName = item.sample
        ? `${item.sample.title} (${item.format})`
        : item.samplePack?.title || "Unknown Product";

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
            metadata: {
              cartItemId: item.id,
              sampleId: item.sampleId || "",
              samplePackId: item.samplePackId?.toString() || "",
              format: item.format,
            },
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create metadata to link the checkout session to the user's cart
    const metadata = {
      userId: session.user.id,
      cartId: cart.id,
    };

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      lineItems,
      successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl,
      metadata,
    });

    // Create a pending order record
    await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        totalAmount: cart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        paymentIntent: checkoutSession.id,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new NextResponse(
      `Checkout session creation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
} 