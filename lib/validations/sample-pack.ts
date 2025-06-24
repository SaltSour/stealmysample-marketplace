import { z } from "zod"

// Sample metadata schema
export const sampleMetadataSchema = z.object({
  format: z.string(),
  sampleRate: z.number(),
  bitDepth: z.number(),
  channels: z.number(),
  duration: z.number(),
  peakAmplitude: z.number().optional(),
})

// Explicitly export the metadata type
export type SampleMetadata = {
  format: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  duration: number;
  peakAmplitude?: number;
}

export interface Sample {
  id?: string
  title: string
  url: string
  bpm?: number
  key?: string
  tags: string[]
  metadata?: {
    format?: string
    sampleRate?: number
    bitDepth?: number
    channels?: number
    duration?: number
    peakAmplitude?: number
  }
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice: number | null
  stemsPrice: number | null
  midiPrice: number | null
}

// Sample validation schema
export const sampleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string()
    .min(1, "File path or URL is required")
    .refine(
      (url) => url.startsWith('/uploads/') || url.startsWith('http://') || url.startsWith('https://'),
      "URL must be a valid path starting with /uploads/ or a full URL"
    ),
  bpm: z.number().nullable().optional()
    .refine(
      (bpm) => bpm !== null && bpm !== undefined,
      "BPM is required for all samples"
    )
    .refine(
      (bpm) => bpm === null || bpm === undefined || (typeof bpm === 'number' && !isNaN(bpm) && isFinite(bpm)),
      "BPM must be a valid number"
    ),
  key: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.object({
    format: z.string().optional(),
    sampleRate: z.number().optional(),
    bitDepth: z.number().optional(),
    channels: z.number().optional(),
    duration: z.number().optional(),
    peakAmplitude: z.number().optional()
  }).optional(),
  hasWav: z.boolean().default(true),
  hasStems: z.boolean().default(false),
  hasMidi: z.boolean().default(false),
  stemsUrl: z.string().nullable().optional(),
  midiUrl: z.string().nullable().optional()
})

// Sample pack validation schema
export const samplePackSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  coverImage: z.string()
    .url("Invalid cover image URL"),
  price: z.number()
    .min(0, "Price must be greater than or equal to 0")
    .superRefine((price, ctx) => {
      const samples = (ctx.parent as { samples?: any[] }).samples || [];
      const minPrice = samples.length * SAMPLE_PRICES.PACK_MIN_PRICE;
      if (price < minPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Price must be at least $${minPrice.toFixed(2)} for ${samples.length} samples`,
          path: ['price']
        });
      }
    }),
  published: z.boolean().optional().default(false),
  archived: z.boolean().optional().default(false),
  samples: z.array(sampleSchema)
    .optional()
    .default([])
})

// Fixed prices for different formats
export const SAMPLE_PRICES = {
  WAV: 2.95,
  WAV_EUR: 2.50,
  STEMS: 4.95,
  STEMS_EUR: 4.45,
  MIDI: 1.00,
  MIDI_EUR: 1.00,
  PACK_MIN_PRICE: 1.99 // Minimum price per sample in a pack
} as const

// Helper function to calculate minimum pack price
export function calculateMinimumPackPrice(sampleCount: number): number {
  return sampleCount * SAMPLE_PRICES.PACK_MIN_PRICE;
}

// Helper functions
export function validateSample(data: unknown) {
  const result = sampleSchema.safeParse(data)
  return {
    success: result.success,
    error: result.success ? null : result.error.errors[0]?.message
  }
}

export function validateSamplePack(data: unknown) {
  const result = samplePackSchema.safeParse(data)
  return {
    success: result.success,
    error: result.success ? null : result.error.errors[0]?.message
  }
}

// Type exports
export type SamplePack = z.infer<typeof samplePackSchema>

// Publishing validation
export function validateForPublishing(pack: any): { success: boolean; error?: string } {
  if (!pack.title || pack.title.trim().length === 0) {
    return { success: false, error: "Title is required" }
  }
  if (!pack.description || pack.description.trim().length === 0) {
    return { success: false, error: "Description is required" }
  }
  if (!pack.coverImage) {
    return { success: false, error: "Cover image is required" }
  }
  if (!pack.samples || pack.samples.length === 0) {
    return { success: false, error: "At least one sample is required" }
  }
  
  // Check for missing BPM values
  const samplesWithMissingBpm = pack.samples.filter(
    (sample: any) => sample.bpm === null || sample.bpm === undefined
  );
  
  if (samplesWithMissingBpm.length > 0) {
    const sampleTitles = samplesWithMissingBpm.map((s: any) => s.title).join(", ");
    return { 
      success: false, 
      error: `BPM is required for all samples. Missing for: ${sampleTitles}` 
    }
  }
  
  // Check for invalid BPM values (non-numeric)
  const samplesWithInvalidBpm = pack.samples.filter(
    (sample: any) => sample.bpm !== null && 
                     (typeof sample.bpm !== 'number' || 
                      isNaN(sample.bpm) || 
                      !isFinite(sample.bpm))
  );
  
  if (samplesWithInvalidBpm.length > 0) {
    const sampleTitles = samplesWithInvalidBpm.map((s: any) => s.title).join(", ");
    return {
      success: false,
      error: `BPM must be a valid number. Invalid for: ${sampleTitles}`
    }
  }
  
  // Check minimum price requirement
  const minPrice = calculateMinimumPackPrice(pack.samples.length);
  if (pack.price < minPrice) {
    return { success: false, error: `Price must be at least $${minPrice.toFixed(2)} for ${pack.samples.length} samples` }
  }
  
  return { success: true }
} 