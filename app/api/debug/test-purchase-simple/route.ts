import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Return unauthorized for unauthenticated users
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Log user info for debugging
    console.log(`Creating simplified test purchase for user: ${JSON.stringify({
      id: session.user.id,
      email: session.user.email
    })}`);
    
    // Get a sample pack to use for the test
    const samplePack = await prisma.samplePack.findFirst({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        samples: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    if (!samplePack) {
      return NextResponse.json({ error: "No sample packs found for testing" }, { status: 404 });
    }
    
    console.log(`Using sample pack: ${samplePack.title} (ID: ${samplePack.id}) with ${samplePack.samples.length} samples`);
    
    // Create a test order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "COMPLETED", // Set directly to completed
        totalAmount: samplePack.price,
        paymentIntent: `test_payment_${Date.now()}`
      }
    });
    
    console.log(`Created test order with ID: ${order.id}`);
    
    // Create an order item for the pack itself - WITHOUT using the format field
    const packOrderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        sampleId: null,
        samplePackId: samplePack.id,
        price: samplePack.price
        // No format field here
      }
    });
    
    console.log(`Created pack order item with ID: ${packOrderItem.id}`);
    
    // Create order items for each sample in the pack
    const sampleOrderItems = [];
    
    for (const sample of samplePack.samples) {
      const sampleItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          sampleId: sample.id,
          samplePackId: samplePack.id, // Link back to the parent pack
          price: 0 // These are included in the pack price
          // No format field here
        }
      });
      
      sampleOrderItems.push(sampleItem);
    }
    
    console.log(`Created ${sampleOrderItems.length} sample order items`);
    
    // Verify the order items were created
    const verifyOrderItems = await prisma.orderItem.findMany({
      where: {
        orderId: order.id
      }
    });
    
    return NextResponse.json({
      success: true,
      order,
      packOrderItem,
      sampleOrderItemsCount: sampleOrderItems.length,
      verifyOrderItemsCount: verifyOrderItems.length,
      message: "Created test purchase data. Go to your library to check if it appears."
    });
  } catch (error) {
    console.error("Error creating test purchase:", error);
    return NextResponse.json({ 
      error: "Failed to create test purchase", 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 