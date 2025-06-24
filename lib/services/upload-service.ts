import { FileStorageService, FileType } from "./file-storage"
import { S3StorageService } from "./s3-storage"
import { validateSample } from "@/lib/validations/sample-pack"

export class UploadService {
  private localStorage: FileStorageService
  private s3Storage: S3StorageService
  private useS3ForAudio: boolean

  constructor() {
    this.localStorage = new FileStorageService()
    this.s3Storage = new S3StorageService()
    
    // Use S3 for audio if configured
    this.useS3ForAudio = !!process.env.S3_BUCKET_NAME && 
                        !!process.env.S3_ACCESS_KEY &&
                        !!process.env.S3_SECRET_KEY
  }

  async uploadFile({ file, type, sampleId }: { file: File; type: FileType; sampleId?: string }) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const metadata = {
      originalName: file.name,
      size: file.size,
      type,
      mimeType: file.type
    }

    // Use S3 for audio files if configured, local storage for everything else
    const storage = (this.useS3ForAudio && type === FileType.AUDIO) 
      ? this.s3Storage 
      : this.localStorage
    
    console.log(`Uploading ${file.name} using ${this.useS3ForAudio && type === FileType.AUDIO ? 'S3' : 'local'} storage`)
    
    const result = await storage.saveFile(buffer, metadata, sampleId)
    return {
      url: result.url,
      path: result.path,
      metadata: result.metadata,
      storageType: (this.useS3ForAudio && type === FileType.AUDIO) ? 's3' : 'local'
    }
  }

  async deleteFile(url: string, storageType?: 's3' | 'local') {
    if (storageType === 's3' || (this.useS3ForAudio && url.includes('audio/'))) {
      await this.s3Storage.deleteFile(url)
    } else {
      await this.localStorage.deleteFile(url)
    }
  }
} 