import { AudioProcessor } from "./audio-processor"
import { FileType } from "./file-storage"
import { validateSample } from "@/lib/validations/sample-pack"
import type { Sample } from "@/lib/validations/sample-pack"

interface ValidationResult {
  valid: boolean
  message?: string
}

interface ProcessedSample {
  title: string
  url: string
  bpm: number | null
  key: string | null
  tags: string[]
  metadata: {
    format: string
    sampleRate: number
    bitDepth: number
    channels: number
    duration: number
    peakAmplitude?: number
  }
}

interface BatchProcessingResult {
  successful: ProcessedSample[]
  failed: Array<{
    filename: string
    error: string
  }>
}

interface UploadHandlers {
  uploadFile: (file: File) => Promise<{ url: string }>
  deleteFile: (url: string) => Promise<void>
}

export class BatchProcessor {
  private audioProcessor: AudioProcessor
  private handlers: UploadHandlers

  constructor(handlers: UploadHandlers) {
    this.audioProcessor = new AudioProcessor()
    this.handlers = handlers
  }

  async processBatch(files: File[]): Promise<BatchProcessingResult> {
    const result: BatchProcessingResult = {
      successful: [],
      failed: []
    }

    // Process files in parallel with a concurrency limit
    const concurrencyLimit = 3
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit)
      const promises = batch.map(file => this.processSingle(file))
      const batchResults = await Promise.allSettled(promises)

      batchResults.forEach((batchResult, index) => {
        if (batchResult.status === "fulfilled") {
          result.successful.push(batchResult.value)
        } else {
          result.failed.push({
            filename: batch[index].name,
            error: batchResult.reason?.message || "Unknown error"
          })
        }
      })
    }

    return result
  }

  private async processSingle(file: File): Promise<ProcessedSample> {
    // 1. Validate file format and size
    const validation = await this.audioProcessor.validateFormat(file)
    if (!validation.valid) {
      throw new Error(validation.message || "Invalid file format")
    }

    // 2. Extract metadata
    const metadata = await this.audioProcessor.extractMetadata(file)

    // 3. Generate waveform data
    const waveform = await this.audioProcessor.generateWaveform(file)

    // 4. Detect BPM
    const bpm = await this.audioProcessor.detectBPM(file)

    // 5. Upload file
    const { url } = await this.handlers.uploadFile(file)

    // 6. Create processed sample object
    const sample: ProcessedSample = {
      title: file.name.replace(/\.[^/.]+$/, ""),
      url,
      bpm,
      key: null,
      tags: [],
      metadata: {
        format: metadata.format,
        sampleRate: metadata.sampleRate,
        bitDepth: metadata.bitDepth,
        channels: metadata.channels,
        duration: metadata.duration,
        peakAmplitude: metadata.peakAmplitude
      }
    }

    // 7. Validate the processed sample
    const validationResult = validateSample(sample)

    if (!validationResult.success) {
      // Clean up uploaded file if validation fails
      await this.handlers.deleteFile(url).catch(error => {
        console.error(`Failed to clean up file: ${url}`, error)
      })
      throw new Error(validationResult.error || "Sample validation failed")
    }

    return sample
  }

  async cleanup(samples: ProcessedSample[]): Promise<void> {
    // Clean up any temporary files or resources
    await Promise.all(
      samples.map(sample => 
        this.handlers.deleteFile(sample.url)
          .catch((error: Error) => {
            console.error(`Failed to cleanup file: ${sample.url}`, error)
          })
      )
    )
  }
} 