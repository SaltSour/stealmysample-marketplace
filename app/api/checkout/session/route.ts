export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 });
    }

    // Get the checkout session from Stripe
    const checkoutSession = await getCheckoutSession(sessionId);

    // Get the related order
    const order = await prisma.order.findFirst({
      where: {
        paymentIntent: sessionId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            sample: {
              select: {
                id: true,
                title: true,
              },
            },
            samplePack: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Transform order items for the response
    const items = order.items.map((item) => ({
      id: item.id,
      title: item.sample?.title || item.samplePack?.title || "Unknown Product",
      price: item.price,
      type: item.sampleId ? "sample" : "pack",
    }));

    return NextResponse.json({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items,
      paymentStatus: checkoutSession.payment_status,
    });
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    return new NextResponse(
      `Failed to retrieve checkout session: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
} 