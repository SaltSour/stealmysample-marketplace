import { prisma } from "@/lib/prisma"
import { saveFile } from "@/lib/local-storage"
import { Prisma, SamplePack as PrismaSamplePack, SampleKind, Sample } from "@prisma/client"
import { AudioProcessor } from "./audio-processor"
import { toast } from "react-hot-toast"
import { SAMPLE_PRICES } from "@/lib/validations/sample-pack"
import path from "path"
import fs from "fs"
import { FileType, FileStorageService } from "./file-storage"

// Add Prisma sort order type
type SortOrder = Prisma.SortOrder

// Extend PrismaSamplePack with additional fields we need
interface ExtendedSamplePack extends PrismaSamplePack {
  samples?: Sample[];
  creator?: any;
  _count?: {
    samples?: number;
    cartItems?: number;
    orderItems?: number;
  };
}

// Helper function to calculate minimum pack price
function calculateMinimumPackPrice(samples: any[]) {
  return samples.length * SAMPLE_PRICES.PACK_MIN_PRICE;
}

const fileStorage = new FileStorageService()

// Delete all files associated with a sample pack
export async function deletePackFiles(packId: number | string): Promise<void> {
  try {
    const id = typeof packId === 'string' ? parseInt(packId) : packId;
    
    // Fetch the pack with all its samples to get file URLs
    const pack = await prisma.samplePack.findUnique({
      where: { id },
      include: {
        samples: true
      }
    })
    
    if (!pack) {
      console.warn(`Attempted to delete files for non-existent pack with ID ${id}`)
      return
    }
    
    // Delete cover image
    if (pack.coverImage) {
      try {
        await fileStorage.deleteFile(pack.coverImage)
        console.log(`Deleted pack cover image: ${pack.coverImage}`)
      } catch (error) {
        console.error(`Failed to delete pack cover image: ${pack.coverImage}`, error)
      }
    }
    
    // Delete all sample files
    for (const sample of pack.samples) {
      if (sample.fileUrl) {
        try {
          await fileStorage.deleteFile(sample.fileUrl)
          console.log(`Deleted sample file: ${sample.fileUrl}`)
        } catch (error) {
          console.error(`Failed to delete sample file: ${sample.fileUrl}`, error)
        }
      }
      
      if (sample.stemsUrl) {
        try {
          await fileStorage.deleteFile(sample.stemsUrl)
          console.log(`Deleted sample stems: ${sample.stemsUrl}`)
        } catch (error) {
          console.error(`Failed to delete sample stems: ${sample.stemsUrl}`, error)
        }
      }
      
      if (sample.midiUrl) {
        try {
          await fileStorage.deleteFile(sample.midiUrl)
          console.log(`Deleted sample MIDI: ${sample.midiUrl}`)
        } catch (error) {
          console.error(`Failed to delete sample MIDI: ${sample.midiUrl}`, error)
        }
      }
      
      // Note: waveformData is stored as a string, not a file URL
    }
    
    console.log(`Successfully cleaned up all files for pack ID ${packId}`)
  } catch (error) {
    console.error(`Error deleting files for pack ID ${packId}:`, error)
    throw new Error(`Failed to delete files for pack: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const samplePackService = {
  // Create a new sample pack
  async create(data: {
    title: string
    description?: string
    coverImage: string
    price?: number
    creatorId: string
    samples?: any[]
  }) {
    // Create URL-friendly slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Calculate minimum price based on samples if provided
    const samples = data.samples || [];
    const minPrice = calculateMinimumPackPrice(samples);
    const initialPrice = Math.max(data.price || minPrice, minPrice);

    return prisma.samplePack.create({
      data: {
        title: data.title,
        description: data.description || "",
        coverImage: data.coverImage,
        price: initialPrice,
        creatorId: data.creatorId,
        slug,
        published: false,
        category: "sample-pack",
      },
      include: {
        samples: true,
        creator: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
  },

  // Get a sample pack by ID
  async getById(id: number) {
    const pack = await prisma.samplePack.findUnique({
      where: { id },
      include: {
        samples: true,
        creator: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!pack) return null

    // Add computed stats
    return {
      ...pack,
      stats: await this.getStats(id),
    }
  },

  // Update a sample pack
  async update(id: number, data: Prisma.SamplePackUpdateInput) {
    return prisma.samplePack.update({
      where: { id },
      data,
      include: {
        samples: true,
      },
    })
  },

  // Delete a sample pack
  async delete(id: number) {
    // Use transaction to ensure all operations are atomic
    await prisma.$transaction(async (tx) => {
      // First delete related cart items
      await tx.cartItem.deleteMany({
        where: { samplePackId: id }
      })

      // Then delete related order items
      await tx.orderItem.deleteMany({
        where: { samplePackId: id }
      })

      // Finally delete the sample pack (samples will be deleted via cascade)
      await tx.samplePack.delete({
        where: { id }
      })
    })
  },

  // Upload a sample to a pack with audio analysis
  async uploadSample(
    packId: number,
    file: File,
    metadata: {
      title: string
      description?: string
      bpm?: number
      key?: string
      tags?: string[]
    }
  ) {
    // Initialize audio processor
    const processor = new AudioProcessor()

    try {
      // Validate the audio file
      const validation = await processor.validateFormat(file)
      if (!validation.valid) {
        throw new Error(validation.message || "Invalid audio file")
      }

      // Extract audio metadata
      const audioMetadata = await processor.extractMetadata(file)
      
      // Generate waveform data
      const waveform = await processor.generateWaveform(file)
      
      // Attempt to detect BPM if not provided
      const detectedBpm = metadata.bpm || await processor.detectBPM(file)

      // Convert File to Buffer for storage
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Save file and get URL
      const savedFile = await saveFile(buffer, file.name, "audio")

      // Generate a unique slug for the sample
      const { generateUniqueSlug } = await import("@/lib/utils");
      const slug = await generateUniqueSlug(metadata.title);

      // Create sample record with extracted metadata
      const sample = await prisma.sample.create({
        data: {
          title: metadata.title,
          slug, // Add the unique slug
          description: metadata.description || "",
          fileUrl: savedFile.url,
          waveformData: JSON.stringify(waveform.points),
          duration: audioMetadata.duration,
          bpm: detectedBpm || null,
          key: metadata.key || null,
          tags: metadata.tags || [],
          samplePackId: packId,
          hasWav: true,
          wavPrice: 0.99, // Default price
        },
      })

      return {
        url: savedFile.url,
        fileId: sample.id,
        metadata: {
          ...audioMetadata,
          bpm: detectedBpm || undefined,
          waveform: waveform.points,
        },
      }
    } catch (error) {
      console.error("Error processing audio file:", error)
      throw error
    } finally {
      // Clean up audio processor resources
      await processor.cleanup()
    }
  },

  // Get all packs for a creator
  async getCreatorPacks(creatorId: string) {
    const packs = await prisma.samplePack.findMany({
      where: {
        creatorId,
      },
      include: {
        samples: true,
        _count: {
          select: {
            samples: true,
            cartItems: true,
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Add stats to each pack
    return Promise.all(
      packs.map(async (pack) => ({
        ...pack,
        stats: await this.getStats(pack.id),
      }))
    )
  },

  // Toggle pack publication status
  async togglePublish(id: number): Promise<ExtendedSamplePack> {
    try {
      const pack = await prisma.samplePack.findUnique({
        where: { id },
        include: { 
          samples: true,
          creator: true,
          _count: {
            select: {
              samples: true,
              cartItems: true,
              orderItems: true,
            }
          }
        }
      });

      if (!pack) {
        throw new Error('Sample pack not found');
      }

      // Validate pack is ready for publication
      if (!pack.published) {
        if (!pack.title || !pack.description) {
          throw new Error('Title and description are required for publication');
        }
        if (!pack.coverImage) {
          throw new Error('Cover image is required for publication');
        }
        if (!pack.samples || pack.samples.length === 0) {
          throw new Error('At least one sample is required for publication');
        }
        if (pack.price <= 0) {
          throw new Error('Price must be set for publication');
        }
      }

      // Toggle published status
      const updatedPack = await prisma.samplePack.update({
        where: { id },
        data: {
          published: !pack.published,
        },
        include: {
          samples: true,
          creator: true,
          _count: {
            select: {
              samples: true,
              cartItems: true,
              orderItems: true,
            }
          }
        }
      });

      return updatedPack;
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle pack publication');
      throw error;
    }
  },

  // Get pack statistics
  async getStats(id: number) {
    // TODO: Implement real statistics from orders/downloads
    return {
      plays: 0,
      downloads: 0,
      revenue: 0,
      conversionRate: 0,
    }
  },

  // Get published packs for the marketplace
  async getPublishedPacks(options: {
    page?: number;
    limit?: number;
    sort?: 'latest' | 'popular' | 'price';
  } = {}): Promise<{ packs: ExtendedSamplePack[]; total: number }> {
    try {
      const { page = 1, limit = 12, sort = 'latest' } = options;
      const skip = (page - 1) * limit;

      let orderBy: Prisma.SamplePackOrderByWithRelationInput | Prisma.SamplePackOrderByWithRelationInput[];
      
      if (sort === 'latest') {
        orderBy = { createdAt: 'desc' as SortOrder };
      } else if (sort === 'popular') {
        orderBy = [
          { samples: { _count: 'desc' as SortOrder } },
          { orderItems: { _count: 'desc' as SortOrder } },
          { createdAt: 'desc' as SortOrder }
        ];
      } else {
        orderBy = { price: 'asc' as SortOrder };
      }

      const [packs, total] = await Promise.all([
        prisma.samplePack.findMany({
          where: { published: true },
          orderBy,
          skip,
          take: limit,
          include: {
            samples: true,
            creator: true,
            _count: {
              select: {
                samples: true,
                cartItems: true,
                orderItems: true
              }
            }
          }
        }),
        prisma.samplePack.count({ where: { published: true } })
      ]);

      return { packs, total };
    } catch (error: any) {
      toast.error('Failed to fetch packs');
      throw error;
    }
  },

  // Get featured packs for homepage
  async getFeaturedPacks(): Promise<ExtendedSamplePack[]> {
    try {
      return await prisma.samplePack.findMany({
        where: {
          published: true,
        },
        orderBy: [
          { samples: { _count: 'desc' as SortOrder } },
          { orderItems: { _count: 'desc' as SortOrder } },
          { createdAt: 'desc' as SortOrder }
        ],
        take: 6,
        include: {
          samples: true,
          creator: true,
          _count: {
            select: {
              samples: true,
              cartItems: true,
              orderItems: true
            }
          }
        }
      });
    } catch (error: any) {
      toast.error('Failed to fetch featured packs');
      throw error;
    }
  },

  // Add samples to a pack
  async addSamples(packId: number, samples: Array<{
    title: string
    url: string
    bpm: number | null
    key: string | null
    tags: string[]
    metadata?: {
      format: string
      sampleRate: number
      bitDepth: number
      channels: number
      duration: number
      peakAmplitude?: number
    }
    hasWav?: boolean
    hasStems?: boolean
    hasMidi?: boolean
  }>) {
    // First, get the current pack
    const currentPack = await prisma.samplePack.findUnique({
      where: { id: packId },
      include: { samples: true }
    });

    if (!currentPack) {
      throw new Error("Pack not found");
    }

    // Create the samples with fixed pricing
    const pack = await prisma.samplePack.update({
      where: { id: packId },
      data: {
        samples: {
          create: samples.map(sample => ({
            title: sample.title,
            fileUrl: sample.url,
            bpm: sample.bpm,
            key: sample.key,
            tags: sample.tags,
            hasWav: sample.hasWav ?? true,
            hasStems: sample.hasStems ?? false,
            hasMidi: sample.hasMidi ?? false,
            wavPrice: SAMPLE_PRICES.WAV,
            stemsPrice: SAMPLE_PRICES.STEMS,
            midiPrice: SAMPLE_PRICES.MIDI,
            duration: sample.metadata?.duration || 0,
            description: "",
            waveformData: "[]",
            format: sample.metadata?.format || 'wav',
            sampleRate: sample.metadata?.sampleRate || 44100,
            bitDepth: sample.metadata?.bitDepth || 16,
            channels: sample.metadata?.channels || 2
          }))
        }
      },
      include: {
        samples: true,
        creator: true,
        _count: {
          select: {
            samples: true,
            cartItems: true,
            orderItems: true
          }
        }
      }
    });

    // Calculate new minimum price
    const minPrice = calculateMinimumPackPrice(pack.samples);
    
    // If current pack price is below minimum, update it
    if (pack.price < minPrice) {
      await prisma.samplePack.update({
        where: { id: packId },
        data: { price: minPrice }
      });
    }

    return pack;
  },

  // Update sample formats (but not prices)
  async updateSampleFormats(packId: number, sampleId: string, formats: {
    hasWav?: boolean;
    hasStems?: boolean;
    hasMidi?: boolean;
  }) {
    // Update the sample formats
    await prisma.sample.update({
      where: { id: sampleId },
      data: formats
    });

    // Get all samples in the pack
    const pack = await prisma.samplePack.findUnique({
      where: { id: packId },
      include: { samples: true }
    });

    if (!pack) throw new Error("Pack not found");

    // Recalculate pack price based on minimum
    const minPrice = calculateMinimumPackPrice(pack.samples);

    // Update pack price if it's below minimum
    if (pack.price < minPrice) {
      return prisma.samplePack.update({
        where: { id: packId },
        data: { price: minPrice }
      });
    }

    return pack;
  },

  // Update pack price
  async updatePrice(id: number, newPrice: number) {
    const pack = await prisma.samplePack.findUnique({
      where: { id },
      include: { samples: true }
    });

    if (!pack) {
      throw new Error("Pack not found");
    }

    // Calculate minimum allowed price
    const minPrice = calculateMinimumPackPrice(pack.samples);
    
    // Validate new price
    if (newPrice < minPrice) {
      throw new Error(`Price must be at least $${minPrice.toFixed(2)} for ${pack.samples.length} samples`);
    }

    // Update pack with new price
    return prisma.samplePack.update({
      where: { id },
      data: { price: newPrice }
    });
  },
} 