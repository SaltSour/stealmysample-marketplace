import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from both ends
    .replace(/[^\w\s-]/g, '') // Remove special characters except alphanumeric, whitespace and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

// Helper to generate a unique slug for samples, with suffix if needed
export async function generateUniqueSlug(title: string, existingId?: string): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  let baseSlug = generateSlug(title);
  
  // Ensure slug is not empty
  if (!baseSlug) {
    baseSlug = "sample"; // Default slug if title produces an empty slug
  }
  
  let slug = baseSlug;
  let counter = 0;
  let isUnique = false;
  
  // Keep checking until we find a unique slug
  while (!isUnique) {
    // Check if the slug exists (excluding the current sample if it's an update)
    const existing = await prisma.sample.findFirst({
      where: {
        AND: [
          { slug: { equals: slug } },
          ...(existingId ? [{ NOT: { id: existingId } }] : [])
        ]
      }
    });
    
    if (!existing) {
      isUnique = true;
    } else {
      // If it exists, increment counter and try again
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }
  
  return slug;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

// Get standardized price based on sample format
// DEPRECATED: We should use the sample's actual prices instead of these hardcoded values
export function getSamplePrice(format: 'WAV' | 'STEMS' | 'MIDI') {
  console.warn('WARNING: getSamplePrice is deprecated - use the sample\'s actual price fields instead');
  const prices = {
    WAV: 0.99,
    STEMS: 1.49,
    MIDI: 1.99
  }
  return prices[format]
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Helper function to download a sample
export async function downloadSample(
  sampleId: string,
  fileName: string,
  format: string = 'WAV'
): Promise<boolean> {
  try {
    const response = await fetch(`/api/samples/download/${sampleId}?format=${format}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to download sample')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = fileName
    
    document.body.appendChild(a)
    a.click()
    
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    return true
  } catch (error) {
    console.error('Error downloading sample:', error)
    return false
  }
}
