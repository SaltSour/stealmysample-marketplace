import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPurchaseConfirmationEmail } from "@/lib/email/service";

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { orderId } = params;

    // Get the order details
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id,
        status: { in: ["PAID", "COMPLETED"] },
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
        user: {
          select: {
            email: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (!order.user?.email) {
      return new NextResponse("User email not found", { status: 400 });
    }

    // Format order items for email
    const emailItems = order.items.map((item) => ({
      title: item.sample?.title || item.samplePack?.title || "Unknown Product",
      price: item.price,
      type: item.sampleId ? ('sample' as const) : ('pack' as const),
    }));

    // Send confirmation email
    const emailSent = await sendPurchaseConfirmationEmail({
      to: order.user.email,
      userName: order.user.name || order.user.username || "Valued Customer",
      orderId: order.id,
      items: emailItems,
      totalAmount: order.totalAmount,
      downloadUrl: `${process.env.NEXTAUTH_URL}/dashboard/library`,
    });

    if (!emailSent) {
      return new NextResponse("Failed to send email", { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Purchase confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Error sending purchase confirmation email:", error);
    return new NextResponse(
      `Failed to send purchase confirmation email: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
} 