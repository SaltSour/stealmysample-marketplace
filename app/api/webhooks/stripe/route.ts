import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { SampleFormat } from "@prisma/client";
import { sendPurchaseConfirmationEmail } from "@/lib/email/service";

export const dynamic = 'force-dynamic';

// Verify that the request is from Stripe
async function verifyStripeSignature(
  payload: string,
  signature: string | null
) {
  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    throw new Error("Stripe webhook secret not configured");
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    throw new Error("Invalid signature");
  }
}

export async function POST(req: Request) {
  try {
    // Get the request body and signature
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await verifyStripeSignature(body, signature);
    } catch (error) {
      return new NextResponse(`Webhook error: ${error.message}`, { status: 400 });
    }

    // Handle different types of events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse(`Webhook error: ${error.message}`, {
      status: 500,
    });
  }
}

// Handle the checkout.session.completed event
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  try {
    // Extract the metadata
    const { userId, cartId } = session.metadata || {};

    if (!userId || !cartId) {
      throw new Error("Missing metadata in checkout session");
    }

    // Update the order status if it exists
    await prisma.order.updateMany({
      where: {
        paymentIntent: session.id,
        status: "PENDING",
      },
      data: {
        status: "PAID",
        updatedAt: new Date(),
      },
    });

    // Update sample ownership records
    await createOwnershipRecords(userId, cartId);

    // Clear the cart after successful payment
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          id: cartId,
        },
      },
    });

    // Get the order details and user information to send email confirmation
    const order = await prisma.order.findFirst({
      where: { 
        paymentIntent: session.id,
        userId
      },
      include: {
        items: {
          include: {
            sample: {
              select: {
                id: true,
                title: true,
              }
            },
            samplePack: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        },
        user: {
          select: {
            email: true,
            name: true,
            username: true
          }
        }
      }
    });

    if (order && order.user?.email) {
      // Format order items for email
      const emailItems = order.items.map(item => ({
        title: item.sample?.title || item.samplePack?.title || "Unknown Product",
        price: item.price,
        type: item.sampleId ? 'sample' as const : 'pack' as const
      }));

      // Send confirmation email
      await sendPurchaseConfirmationEmail({
        to: order.user.email,
        userName: order.user.name || order.user.username || "Valued Customer",
        orderId: order.id,
        items: emailItems,
        totalAmount: order.totalAmount,
        downloadUrl: `${process.env.NEXTAUTH_URL}/dashboard/library`
      });

      console.log(`Purchase confirmation email sent to ${order.user.email}`);
    }
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    throw error;
  }
}

// Handle the payment_intent.succeeded event
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  // You can add additional logic here if needed
}

// Handle the payment_intent.payment_failed event
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    // Get the related order
    const order = await prisma.order.findFirst({
      where: {
        paymentIntent: paymentIntent.id,
      },
    });

    if (order) {
      // Update the order status to cancelled
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
    throw error;
  }
}

// Create ownership records for the purchased samples
async function createOwnershipRecords(userId: string, cartId: string) {
  try {
    // Get the cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        cartId,
      },
      include: {
        sample: true,
        samplePack: {
          include: {
            samples: true,
          },
        },
      },
    });

    console.log(`Processing ${cartItems.length} cart items for user ${userId}`);
    
    // Find the order that corresponds to this checkout session
    const order = await prisma.order.findFirst({
      where: { 
        userId,
        status: "PAID"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!order) {
      throw new Error("Could not find paid order for this checkout session");
    }

    console.log(`Found order ${order.id} for processing`);
    
    // Create OrderItem entries for all purchased samples
    const orderItems = [];

    for (const item of cartItems) {
      // Convert string format to enum
      const formatEnum = getFormatEnum(item.format);
      
      if (item.sampleId) {
        // For individual samples
        console.log(`Processing individual sample ${item.sampleId}`);
        orderItems.push({
          orderId: order.id,
          sampleId: item.sampleId,
          price: item.price,
          samplePackId: null,
          format: formatEnum
        });
      } else if (item.samplePackId && item.samplePack?.samples) {
        // For sample packs - create one order item for the pack itself
        // IMPORTANT: This is the main pack purchase record
        console.log(`Processing sample pack ${item.samplePackId} with ${item.samplePack.samples.length} samples`);
        
        // DIRECT CREATION: Create the pack order item immediately to ensure it exists
        try {
          const packOrderItem = await prisma.orderItem.create({
            data: {
              orderId: order.id,
              sampleId: null,
              price: item.price,
              samplePackId: item.samplePackId,
              format: formatEnum
            }
          });
          console.log(`Successfully created pack order item: ${packOrderItem.id}`);
        } catch (packError) {
          console.error(`Failed to create pack order item: ${packError.message}`);
        }
        
        // Also create separate order items for each sample in the pack
        for (const sample of item.samplePack.samples) {
          orderItems.push({
            orderId: order.id,
            sampleId: sample.id,
            price: 0, // These are included in the pack price
            samplePackId: item.samplePackId, // Link back to the parent pack
            format: formatEnum
          });
        }
      }
    }

    // Log what's being created for debugging
    console.log(`Creating ${orderItems.length} sample order items`);
    
    // Create all remaining sample order items
    if (orderItems.length > 0) {
      for (const item of orderItems) {
        try {
          await prisma.orderItem.create({
            data: item
          });
        } catch (error) {
          console.error(`Failed to create order item: ${error.message}`, item);
        }
      }
    }

    // Update the order to COMPLETED status to ensure it shows in the library
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED" }
    });

    console.log(`Updated order ${order.id} status to COMPLETED`);

    // Clear the cart after successful purchase
    const deletedItems = await prisma.cartItem.deleteMany({
      where: {
        cartId
      }
    });

    console.log(`Successfully cleared ${deletedItems.count} cart items`);
    console.log("Order processing completed successfully");
    
    // Double-check if the pack order items were created
    const packItems = await prisma.orderItem.findMany({
      where: {
        orderId: order.id,
        sampleId: null,
        samplePackId: { not: null }
      }
    });
    
    console.log(`Verified ${packItems.length} pack order items after processing`);
  } catch (error) {
    console.error("Error creating ownership records:", error);
    throw error;
  }
}

// Helper function to convert string format to enum
function getFormatEnum(format: string): SampleFormat {
  switch (format?.toUpperCase()) {
    case 'STEMS':
      return SampleFormat.STEMS;
    case 'MIDI':
      return SampleFormat.MIDI;
    case 'WAV':
    default:
      return SampleFormat.WAV;
  }
} 