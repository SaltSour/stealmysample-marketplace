export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SampleFormat } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Return unauthorized for unauthenticated users
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const formatFilter = searchParams.get('format');
    const search = searchParams.get('search') || '';
    const packId = searchParams.get('packId');
    
    console.log(`Fetching library for user ID: ${session.user.id}`);
    console.log(`Parameters: format=${formatFilter}, search="${search}", packId=${packId}`);
    
    // Add debug session info
    const userInfo = {
      id: session.user.id,
      email: session.user.email || 'No email',
      name: session.user.name || 'No name'
    };
    console.log(`Authenticated user: ${JSON.stringify(userInfo)}`);
    
    // --- DIRECTLY GET PACKS FROM ORDERITEMS ---
    // Find all pack order items (packs only, not individual samples from packs)
    const packOrderItems = await prisma.orderItem.findMany({
      where: {
        sampleId: null, // No sample ID means it's a pack item
        samplePackId: { not: null }, // Must have a pack ID
        order: {
          userId: session.user.id,
          status: { in: ['PAID', 'COMPLETED'] }
        }
      },
      include: {
        order: true,
        samplePack: {
          include: {
            samples: {
              where: search ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } }
                ]
              } : undefined
            },
            creator: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${packOrderItems.length} pack order items directly`);
    
    // Log the actual pack order items
    if (packOrderItems.length > 0) {
      console.log('Pack order items details:');
      packOrderItems.forEach((item, index) => {
        const packTitle = item.samplePack?.title || 'Unknown';
        const orderId = item.order?.id || 'Unknown';
        console.log(`  ${index+1}. Pack: "${packTitle}" (ID: ${item.samplePackId}), Order: ${orderId}`);
      });
    } else {
      console.log('No pack order items found');
    }
    
    // Check if user has any orders at all
    const userOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`User has ${userOrders.length} orders in total`);
    if (userOrders.length > 0) {
      userOrders.forEach((order, index) => {
        console.log(`  ${index+1}. Order ${order.id}: Status=${order.status}, Created=${order.createdAt}`);
      });
    }
    
    // Map to the format needed by frontend
    const packs = packOrderItems
      .filter(item => item.samplePack) // Filter out any null packs 
      .filter(item => !packId || item.samplePackId === parseInt(packId))
      // No format filter here - we'll retain all formats
      .map(item => {
        // Convert format from DB to string if needed
        const itemFormat = item.format || SampleFormat.WAV;
        
        return {
          id: item.samplePackId,
          title: item.samplePack.title,
          creator: item.samplePack.creator?.user?.name || 'Unknown',
          coverImage: item.samplePack.coverImage,
          purchaseDate: item.order.createdAt,
          format: itemFormat,
          samples: item.samplePack.samples.map(sample => ({
            id: sample.id,
            title: sample.title,
            description: sample.description,
            format: itemFormat,
            purchaseDate: item.order.createdAt,
            fileUrl: sample.fileUrl,
            coverImage: item.samplePack.coverImage, 
            packTitle: item.samplePack.title,
            packId: item.samplePackId,
            creator: item.samplePack.creator?.user?.name || 'Unknown',
            bpm: sample.bpm,
            key: sample.key,
          }))
        };
      });
    
    console.log(`Mapped ${packs.length} packs for frontend`);
    
    // --- GET INDIVIDUAL SAMPLES ---  
    // Make a separate where clause for format filtering if needed
    const formatWhere = formatFilter ? { format: formatFilter as any } : {};
    
    const sampleOrderItems = await prisma.orderItem.findMany({
      where: {
        sampleId: { not: null },
        order: {
          userId: session.user.id,
          status: { in: ['PAID', 'COMPLETED'] }
        },
        ...formatWhere
      },
      include: {
        order: true,
        sample: {
          include: {
            samplePack: {
              include: {
                creator: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${sampleOrderItems.length} sample order items`);
    
    // Map samples to frontend format
    const samples = sampleOrderItems
      .filter(item => item.sample)
      .filter(item => 
        !search || 
        item.sample.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.sample.description && item.sample.description.toLowerCase().includes(search.toLowerCase()))
      )
      .filter(item => !packId || item.sample.samplePackId === parseInt(packId))
      .map(item => {
        // Convert format from DB to string if needed
        const itemFormat = item.format || SampleFormat.WAV;
        
        return {
          id: item.sample.id,
          title: item.sample.title,
          description: item.sample.description,
          format: itemFormat,
          purchaseDate: item.order.createdAt,
          fileUrl: item.sample.fileUrl,
          coverImage: item.sample.samplePack?.coverImage,
          packTitle: item.sample.samplePack?.title,
          packId: item.sample.samplePackId,
          creator: item.sample.samplePack?.creator?.user?.name || 'Unknown',
          orderItem: item.id,
          bpm: item.sample.bpm,
          key: item.sample.key,
        };
      });
    
    console.log(`Returning ${samples.length} samples and ${packs.length} packs`);
    
    // Sort by purchase date (newest first)
    samples.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    packs.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    return NextResponse.json({
      samples,
      packs,
      packOrderItemsCount: packOrderItems.length,
      userOrdersCount: userOrders.length,
      debug: {
        userId: session.user.id,
        email: session.user.email
      },
      total: samples.length
    });
  } catch (error) {
    console.error("Error fetching user library:", error);
    return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
  }
} 