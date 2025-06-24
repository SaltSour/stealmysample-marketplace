import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SampleFormat, OrderStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Step 1: Test authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: "Authentication test failed - no session",
        step: "auth" 
      }, { status: 401 });
    }
    
    const authTest = {
      userId: session.user.id,
      email: session.user.email
    };
    
    // Step 2: Test database connection by fetching user
    let dbTest;
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true }
      });
      
      dbTest = { success: !!user, user };
    } catch (dbError) {
      return NextResponse.json({
        error: "Database connection test failed",
        details: dbError.message,
        step: "database"
      }, { status: 500 });
    }
    
    // Step 3: Test finding a sample pack
    let packTest;
    try {
      const pack = await prisma.samplePack.findFirst({
        where: { published: true },
        select: { id: true, title: true }
      });
      
      packTest = { success: !!pack, pack };
    } catch (packError) {
      return NextResponse.json({
        error: "Sample pack test failed",
        details: packError.message,
        step: "find_pack"
      }, { status: 500 });
    }
    
    // Step 4: Test creating a very simple order
    let orderTest;
    try {
      // Only create test order if parameter is provided
      const { searchParams } = new URL(request.url);
      const createOrder = searchParams.get('createOrder') === 'true';
      
      if (createOrder) {
        const order = await prisma.order.create({
          data: {
            userId: session.user.id,
            status: OrderStatus.COMPLETED,
            totalAmount: 0.01,
            paymentIntent: `test_simple_${Date.now()}`
          }
        });
        
        orderTest = { success: true, order };
      } else {
        orderTest = { success: "skipped", message: "Add ?createOrder=true to URL to test order creation" };
      }
    } catch (orderError) {
      return NextResponse.json({
        error: "Order creation test failed",
        details: orderError.message,
        step: "create_order"
      }, { status: 500 });
    }
    
    // Step 5: Test creating a simple order item (only if we created an order)
    let orderItemTest;
    try {
      if (orderTest.success === true) {
        const orderItem = await prisma.orderItem.create({
          data: {
            orderId: orderTest.order.id,
            price: 0.01,
            sampleId: null,
            // Skip samplePackId and format to see if that's the issue
          }
        });
        
        orderItemTest = { success: true, orderItem };
      } else {
        orderItemTest = { success: "skipped", message: "Order creation was skipped" };
      }
    } catch (itemError) {
      return NextResponse.json({
        error: "Order item creation test failed",
        details: itemError.message,
        step: "create_order_item"
      }, { status: 500 });
    }
    
    // Now test with a format value to see if that's the issue
    let formatTest;
    try {
      if (orderTest.success === true) {
        const formatItem = await prisma.orderItem.create({
          data: {
            orderId: orderTest.order.id,
            price: 0.01,
            sampleId: null,
            format: SampleFormat.WAV
          }
        });
        
        formatTest = { success: true, formatItem };
      } else {
        formatTest = { success: "skipped", message: "Order creation was skipped" };
      }
    } catch (formatError) {
      return NextResponse.json({
        error: "Format test failed - issue with format field",
        details: formatError.message,
        step: "format_test"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      message: "Diagnostic tests completed",
      authTest,
      dbTest,
      packTest,
      orderTest,
      orderItemTest,
      formatTest
    });
  } catch (error) {
    console.error("General error in test-simple:", error);
    return NextResponse.json({ 
      error: "General test failure", 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 