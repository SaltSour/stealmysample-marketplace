export const dynamic = 'force-dynamic';

import { z } from "zod";
import { apiHandler, createPaginationSchema } from "@/lib/apiHandler";
import { prisma } from "@/lib/prisma";
import { sampleWithPackSelect } from "@/lib/prismaHelpers";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Schema for validating query parameters
const samplesQuerySchema = createPaginationSchema(100).extend({
  query: z.string().optional(),
  category: z.string().optional(),
  creatorId: z.string().optional(),
  tag: z.string().optional(),
});

// Sample creation schema
const createSampleSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  samplePackId: z.number().int().positive(),
  bpm: z.number().int().positive().optional(),
  key: z.string().optional(),
  genre: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(), // For creating new tags
  fileUrl: z.string().optional(),  // will be populated after file upload
});

// Sample update schema
const updateSampleSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  samplePackId: z.number().int().positive().optional(),
  bpm: z.number().int().positive().optional(),
  key: z.string().optional(),
  genre: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(),
});

// GET - List samples
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is a creator
    const creatorProfile = await prisma.creator.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!creatorProfile) {
      return NextResponse.json(
        { error: "Only creators can access samples" },
        { status: 403 }
      );
    }
    
    // Get samples belonging to the creator's sample packs
    const samples = await prisma.sample.findMany({
      where: {
        samplePack: {
          creatorId: creatorProfile.id
        }
      },
      include: {
        samplePack: true,
        tags: true as any
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(samples);
  } catch (error) {
    console.error("Error fetching samples:", error);
    return NextResponse.json(
      { error: "Failed to fetch samples" },
      { status: 500 }
    );
  }
}

// POST - Create a new sample
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is a creator
    const creatorProfile = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      include: {
        samplePacks: {
          select: { id: true }
        }
      }
    });
    
    if (!creatorProfile) {
      return NextResponse.json(
        { error: "Only creators can create samples" },
        { status: 403 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = createSampleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { title, description, samplePackId, bpm, key, genre, tagIds, tagNames, fileUrl } = validationResult.data;
    
    // Verify the sample pack belongs to the creator
    const isOwner = creatorProfile.samplePacks.some(pack => pack.id === samplePackId);
    
    if (!isOwner) {
      return NextResponse.json(
        { error: "You don't have permission to add samples to this pack" },
        { status: 403 }
      );
    }
    
    // Generate a slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-') + '-' + Date.now().toString().slice(-6);
    
    // Process tags: both existing tags and new ones
    const connectTags = tagIds && tagIds.length > 0 
      ? { connect: tagIds.map(id => ({ id })) } 
      : undefined;
    
    // For new tag names, create them first
    let newTags: { id: string }[] = [];
    if (tagNames && tagNames.length > 0) {
      for (const name of tagNames) {
        const existingTag = await (prisma as any).tag.findUnique({
          where: { name }
        });
        
        if (existingTag) {
          newTags.push({ id: existingTag.id });
        } else {
          const newTag = await (prisma as any).tag.create({
            data: { name }
          });
          newTags.push({ id: newTag.id });
        }
      }
    }
    
    // Create the sample with tags
    const sample = await prisma.sample.create({
      data: {
        title,
        description,
        slug,
        samplePackId,
        bpm,
        key,
        fileUrl: fileUrl || '',
        tags: {
          connect: [...(connectTags?.connect || []), ...newTags]
        } as any
      },
      include: {
        samplePack: true,
        tags: true as any
      }
    });
    
    return NextResponse.json(sample);
  } catch (error) {
    console.error("Error creating sample:", error);
    return NextResponse.json(
      { error: "Failed to create sample" },
      { status: 500 }
    );
  }
}

// PATCH - Update a sample
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = updateSampleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { id, title, description, samplePackId, bpm, key, genre, tagIds, tagNames } = validationResult.data;
    
    // Verify that the user is allowed to update this sample
    const sample = await prisma.sample.findUnique({
      where: { id },
      include: {
        samplePack: {
          include: {
            creator: true
          }
        }
      }
    });
    
    if (!sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }
    
    // Verify the user is the creator of the sample pack
    if (sample.samplePack.creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this sample" },
        { status: 403 }
      );
    }
    
    // Process tags: both existing tags and new ones
    const connectTags = tagIds && tagIds.length > 0 
      ? { connect: tagIds.map(id => ({ id })) } 
      : undefined;
    
    // For new tag names, create them first
    let newTags: { id: string }[] = [];
    if (tagNames && tagNames.length > 0) {
      for (const name of tagNames) {
        const existingTag = await (prisma as any).tag.findUnique({
          where: { name }
        });
        
        if (existingTag) {
          newTags.push({ id: existingTag.id });
        } else {
          const newTag = await (prisma as any).tag.create({
            data: { name }
          });
          newTags.push({ id: newTag.id });
        }
      }
    }
    
    // Update the sample
    const updatedSample = await prisma.sample.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(samplePackId ? { samplePackId } : {}),
        ...(bpm !== undefined ? { bpm } : {}),
        ...(key !== undefined ? { key } : {}),
        ...(genre !== undefined ? { genre } as any : {}),
        ...(tagIds || tagNames ? {
          tags: {
            ...(tagIds ? { set: [] } : {}), // Clear existing tags if specified
            ...(connectTags || { connect: newTags })
          } as any
        } : {})
      },
      include: {
        samplePack: true,
        tags: true as any
      }
    });
    
    return NextResponse.json(updatedSample);
  } catch (error) {
    console.error("Error updating sample:", error);
    return NextResponse.json(
      { error: "Failed to update sample" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a sample
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify that the user is allowed to delete this sample
    const sample = await prisma.sample.findUnique({
      where: { id },
      include: {
        samplePack: {
          include: {
            creator: true
          }
        }
      }
    });
    
    if (!sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }
    
    // Verify the user is the creator of the sample pack
    if (sample.samplePack.creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this sample" },
        { status: 403 }
      );
    }
    
    // Delete the sample
    await prisma.sample.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Sample deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting sample:", error);
    return NextResponse.json(
      { error: "Failed to delete sample" },
      { status: 500 }
    );
  }
} 